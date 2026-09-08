import { prisma } from '@/lib/server/prisma';
import { applyCalcPatch, type CalcSettings } from '@/lib/calculatorSettings';

/**
 * Настройки калькулятора в базе.
 *
 * Лежат одной строкой в SystemSettings. Внутри — номер версии, кто и когда
 * менял, и сам патч.
 *
 * Ошибку чтения здесь НЕ глушим. Заводские значения, выданные под видом
 * сохранённых, — это не мягкий отказ, а правдоподобная неверная цена:
 * менеджер увидит рабочий калькулятор с комиссией 2000 вместо 3500 и назовёт
 * её клиенту, ничего не заподозрив. Пусть лучше страница честно скажет,
 * что настройки не прочитались.
 */

const SETTINGS_KEY = 'calculatorSettings';

export interface StoredCalcSettings {
    version: number;
    updatedBy: string | null;
    updatedAt: string | null;
    settings: CalcSettings;
}

/**
 * Читает настройки. Бросает, если база недоступна.
 *
 * Отсутствие строки — это не ошибка: настройки просто ни разу не меняли,
 * и заводские значения тут единственно верный ответ.
 */
export async function getCalcSettings(): Promise<StoredCalcSettings> {
    const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY } });
    const value = (row?.value ?? {}) as Record<string, unknown>;
    return {
        version: typeof value.version === 'number' ? value.version : 0,
        updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : null,
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
        settings: applyCalcPatch(value.patch),
    };
}

export type SaveResult =
    | { ok: true; stored: StoredCalcSettings }
    | { ok: false; reason: 'conflict'; stored: StoredCalcSettings };

/**
 * Сохранение патча.
 *
 * Версия сверяется прямо в UPDATE, а не в JavaScript между двумя запросами:
 * два менеджера успевают прочитать одну и ту же версию за те миллисекунды,
 * что идёт round-trip к базе, и тогда оба проходят проверку, а правка первого
 * исчезает без всякого признака. Условие в самом запросе делает проверку
 * и запись одним неделимым действием.
 */
export async function saveCalcSettings(
    patch: Record<string, unknown>,
    expectedVersion: number,
    author: string | null
): Promise<SaveResult> {
    const value = {
        version: expectedVersion + 1,
        updatedBy: author,
        updatedAt: new Date().toISOString(),
        patch,
    };
    const json = JSON.stringify(value);

    const written = expectedVersion === 0
        // Строки ещё нет. Если её успели создать между нашей проверкой
        // и этой вставкой, ON CONFLICT ничего не сделает — это и есть конфликт
        ? await prisma.$executeRaw`
            INSERT INTO "SystemSettings" ("key", "value", "updatedAt")
            VALUES (${SETTINGS_KEY}, ${json}::jsonb, now())
            ON CONFLICT ("key") DO NOTHING
        `
        : await prisma.$executeRaw`
            UPDATE "SystemSettings"
            SET "value" = ${json}::jsonb, "updatedAt" = now()
            WHERE "key" = ${SETTINGS_KEY}
              AND ("value"->>'version')::int = ${expectedVersion}
        `;

    if (written === 0) {
        // Ни одной строки не тронуто — значит версия разошлась. Возвращаем
        // то, что лежит сейчас, чтобы менеджер увидел чужие значения,
        // а не потерял их молча
        return { ok: false, reason: 'conflict', stored: await getCalcSettings() };
    }

    return {
        ok: true,
        stored: {
            version: value.version,
            updatedBy: value.updatedBy,
            updatedAt: value.updatedAt,
            settings: applyCalcPatch(patch),
        },
    };
}
