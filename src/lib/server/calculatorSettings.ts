import { prisma } from '@/lib/server/prisma';
import { applyCalcPatch, type CalcSettings } from '@/lib/calculatorSettings';

/**
 * Настройки калькулятора в базе.
 *
 * Лежат одной строкой в SystemSettings. Внутри — номер версии, кто и когда
 * менял, и сам патч. Версия нужна не для истории, а чтобы поймать случай,
 * когда двое менеджеров открыли страницу и сохраняют по очереди: второй
 * иначе молча затёр бы правку первого, и никто бы не заметил.
 */

const SETTINGS_KEY = 'calculatorSettings';

export interface StoredCalcSettings {
    version: number;
    updatedBy: string | null;
    updatedAt: string | null;
    settings: CalcSettings;
}

export async function getCalcSettings(): Promise<StoredCalcSettings> {
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY } });
        const value = (row?.value ?? {}) as Record<string, unknown>;
        return {
            version: typeof value.version === 'number' ? value.version : 0,
            updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : null,
            updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
            settings: applyCalcPatch(value.patch),
        };
    } catch (error) {
        console.error('[калькулятор] настройки не прочитались:', error);
        // Заводские значения лучше пятисотки: калькулятор продолжит считать
        return { version: 0, updatedBy: null, updatedAt: null, settings: applyCalcPatch(null) };
    }
}

export type SaveResult =
    | { ok: true; stored: StoredCalcSettings }
    | { ok: false; reason: 'conflict'; stored: StoredCalcSettings };

/**
 * Сохранение патча.
 *
 * Если с момента загрузки страницы кто-то уже сохранил свою правку, версия
 * разойдётся — тогда мы ничего не пишем и возвращаем то, что лежит сейчас,
 * чтобы менеджер увидел чужие значения, а не потерял их.
 */
export async function saveCalcSettings(
    patch: Record<string, unknown>,
    expectedVersion: number,
    author: string | null
): Promise<SaveResult> {
    const current = await getCalcSettings();
    if (current.version !== expectedVersion) {
        return { ok: false, reason: 'conflict', stored: current };
    }

    const value = {
        version: current.version + 1,
        updatedBy: author,
        updatedAt: new Date().toISOString(),
        patch,
    };

    await prisma.systemSettings.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, value: value as never },
        update: { value: value as never },
    });

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
