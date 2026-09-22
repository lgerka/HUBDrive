import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/prisma';
import { getNbkRates, type NbkRates } from '@/lib/server/nbk';
import { getCalcSettings } from '@/lib/server/calculatorSettings';
import {
    computeTurnkey,
    isPriceFrozen,
    isPriceCurrency,
    type TurnkeyInput,
    type TurnkeySnapshot,
} from '@/lib/turnkey';
import type { Powertrain } from '@/lib/calculator';

/**
 * Цена под ключ в каталоге: при сохранении машины и пересчёт всех разом.
 *
 * Цена хранится в колонках, а не считается на лету: по ней сортирует
 * каталог, с ней сверяются бюджеты подборов, её пишут уведомления и бот.
 * Поэтому её надо пересчитывать, когда меняется то, от чего она зависит:
 * курс Нацбанка (раз в сутки), настройки калькулятора (комиссия, логистика)
 * и сама машина.
 */

const STAMP_KEY = 'turnkeyRecalc';
/** Номер блокировки пересчёта. Любое число — лишь бы не совпало с другими. */
const RECALC_LOCK = 724_101;

export class TurnkeyInputError extends Error {}

/** Банк не ответил ни разу — посчитано по запасному курсу из кода. */
export const FALLBACK_WARNING =
    'Нацбанк не ответил — цена посчитана по запасному курсу. Пересчитается при следующем пересчёте каталога или при повторном сохранении машины';

/** То же, но машина в сделке: цена теперь зафиксирована и сама не пересчитается. */
export const FALLBACK_WARNING_FROZEN =
    'Нацбанк не ответил — цена посчитана по запасному курсу и зафиксирована сделкой. Чтобы пересчитать, верните статус «В наличии», сохраните, а потом снова поставьте нужный';

export function fallbackWarning(status: string): string {
    return isPriceFrozen(status) ? FALLBACK_WARNING_FROZEN : FALLBACK_WARNING;
}

export interface PriceForSave {
    priceKeyTurnKZT: number;
    priceUSD: number;
    priceCalc: TurnkeySnapshot;
    powertrain: Powertrain;
    /** Банк не ответил, посчитано по запасному курсу. */
    fallbackRate: boolean;
}

/**
 * Цена одной машины перед записью.
 *
 * Считается до сохранения, а не после: сразу после создания машины подборы
 * сверяются с её ценой и людям уходят уведомления — там должна быть уже цена
 * под ключ. Ошибку чтения настроек не глушим: машина с ценой по заводским
 * значениям хуже несохранённой.
 */
export async function priceForSave(input: TurnkeyInput, knownRates?: NbkRates): Promise<PriceForSave> {
    const [rates, stored] = await Promise.all([knownRates ?? getNbkRates(), getCalcSettings()]);
    const outcome = computeTurnkey(input, rates, stored.settings, stored.version);
    if (!outcome.ok) throw new TurnkeyInputError(outcome.message);
    return {
        priceKeyTurnKZT: outcome.kzt,
        priceUSD: outcome.usd,
        priceCalc: outcome.snapshot,
        powertrain: outcome.powertrain,
        fallbackRate: rates.source === 'fallback',
    };
}

/**
 * Записать машину под той же блокировкой, что и массовый пересчёт.
 *
 * Иначе пересчёт, прочитавший машины до сохранения, записал бы поверх новой
 * цены расчёт по старым юаням, а сохранение, прочитавшее настройки до их
 * смены, — цену по старой комиссии. Курс лучше получить до вызова: банк
 * может отвечать секундами, а блокировку столько держать незачем.
 */
export async function withRecalcLock<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RECALC_LOCK})`;
        return fn(tx);
    }, { timeout: 30_000, maxWait: 15_000 });
}

/**
 * Цена машины зафиксирована: машина в сделке и цена под ключ у неё уже
 * посчитана. Если не посчитана ни разу, в полях цены лежит цена в Китае —
 * её фиксировать нечего, такую машину считаем один раз, как все.
 */
export function isFrozenForRecalc(status: string, priceCalc: unknown): boolean {
    return isPriceFrozen(status) && priceCalc !== null && priceCalc !== undefined;
}

export type RecalcReason = 'cron' | 'settings' | 'rate' | 'manual';

export interface RecalcRow {
    id: string;
    name: string;
    status: string;
    year: number;
    powertrain: Powertrain;
    before: { kzt: number; usd: number | null };
    after: { kzt: number; usd: number };
    /** «4,3 МРП · новый» или «504,05 МРП · 4 года» — главный рост у подержанных. */
    registration: string;
}

export interface RecalcSummary {
    reason: RecalcReason;
    dryRun: boolean;
    /**
     * false — каталог ещё ни разу не переводили на цены под ключ вручную,
     * и автоматический пересчёт ничего не сделал.
     */
    enabled: boolean;
    at: string;
    rateDate: string;
    kztPerUsd: number;
    kztPerCny: number;
    settingsVersion: number;
    total: number;
    changed: number;
    frozen: number;
    /** Машины в сделке, чью цену не трогали, — чтобы менеджер видел, какие именно. */
    frozenList: { id: string; name: string; status: string }[];
    skipped: { id: string; name: string; reason: string }[];
    rows: RecalcRow[];
}

/**
 * Пересчитать цены всех машин, кроме тех, что уже в сделке с посчитанной ценой.
 *
 * Идёт под блокировкой: ночной пересчёт, сохранение настроек и сохранение
 * машины в админке могут совпасть, и тогда расчёт по старым данным записался
 * бы последним. Настройки и машины читаются уже под блокировкой, курс — до
 * неё: банк может отвечать секундами. Пересчёт идемпотентен — повторный
 * запуск с теми же данными ничего не меняет, поэтому пропущенный или
 * повторный ночной запуск безопасен.
 *
 * По запасному курсу не пишем ничего: цена по курсу месячной давности хуже
 * вчерашней.
 */
export async function recalcAllTurnkeyPrices(
    reason: RecalcReason,
    { dryRun = false }: { dryRun?: boolean } = {}
): Promise<RecalcSummary> {
    // Впервые весь каталог переходит на цены под ключ только по явной кнопке
    // «Применить», после того как владелец посмотрел «было / станет»: цены
    // у всех клиентов разом вырастают в полтора раза, и фильтры по бюджету
    // начинают находить в разы меньше машин. Утренний пересчёт, сохранение
    // настроек и кнопка курса до этого момента ничего не трогают — так даже
    // деплой раньше решения не меняет цены у клиентов
    if (reason !== 'manual' && !dryRun && !(await readRecalcStamp())) {
        return {
            reason, dryRun, enabled: false, at: new Date().toISOString(),
            rateDate: '', kztPerUsd: 0, kztPerCny: 0, settingsVersion: 0,
            total: 0, changed: 0, frozen: 0, frozenList: [], skipped: [], rows: [],
        };
    }

    const rates = await getNbkRates(reason === 'cron' || reason === 'rate');
    if (rates.source === 'fallback') {
        throw new Error('Нацбанк не ответил — цены не пересчитаны, чтобы не считать по устаревшему курсу');
    }

    const summary = await prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RECALC_LOCK})`;
        const stored = await getCalcSettings();

        const vehicles = await tx.vehicle.findMany({
            select: {
                id: true, brand: true, model: true, year: true, status: true,
                engineType: true, engineVolume: true, powertrain: true,
                priceChina: true, priceChinaCurrency: true, priceKeyTurnKZT: true, priceUSD: true, priceCalc: true,
            },
            orderBy: { priceKeyTurnKZT: 'asc' },
        });

        const now = new Date();
        const rows: (RecalcRow & { snapshot: TurnkeySnapshot })[] = [];
        const skipped: RecalcSummary['skipped'] = [];
        const frozenList: RecalcSummary['frozenList'] = [];

        for (const v of vehicles) {
            const name = `${v.brand.trim()} ${v.model.trim()}`.trim();
            if (isFrozenForRecalc(v.status, v.priceCalc)) {
                frozenList.push({ id: v.id, name, status: v.status });
                continue;
            }
            const outcome = computeTurnkey(
                { ...v, priceCurrency: isPriceCurrency(v.priceChinaCurrency) ? v.priceChinaCurrency : 'CNY' },
                rates, stored.settings, stored.version, now
            );
            if (!outcome.ok) {
                skipped.push({ id: v.id, name, reason: outcome.message });
                continue;
            }
            rows.push({
                id: v.id,
                name,
                status: v.status,
                year: v.year,
                powertrain: outcome.powertrain,
                before: { kzt: v.priceKeyTurnKZT, usd: v.priceUSD },
                after: { kzt: outcome.kzt, usd: outcome.usd },
                registration: outcome.result.lines.find(l => l.label === 'Регистрация и номера')?.hint ?? '',
                snapshot: outcome.snapshot,
            });
        }

        const changed = rows.filter(r => r.before.kzt !== r.after.kzt || r.before.usd !== r.after.usd).length;
        const result: RecalcSummary = {
            reason,
            dryRun,
            enabled: true,
            at: now.toISOString(),
            rateDate: rates.rateDate,
            kztPerUsd: rates.usd,
            kztPerCny: rates.cny,
            settingsVersion: stored.version,
            total: vehicles.length,
            changed,
            frozen: frozenList.length,
            frozenList,
            skipped,
            rows: rows.map(({ snapshot: _snapshot, ...r }) => r),
        };

        if (!dryRun && rows.length > 0) {
            // Одним запросом, а не пятьюдесятью: либо пересчитаны все, либо никто.
            // updatedAt сдвигаем только тем, у кого цена правда сменилась: по нему
            // sitemap говорит поисковику, что страницу пора перечитать
            await tx.$executeRaw`
                UPDATE "Vehicle" AS v
                SET "priceKeyTurnKZT" = x.kzt, "priceUSD" = x.usd, "priceCalc" = x.calc,
                    "updatedAt" = CASE
                        WHEN v."priceKeyTurnKZT" IS DISTINCT FROM x.kzt OR v."priceUSD" IS DISTINCT FROM x.usd
                        THEN now() ELSE v."updatedAt" END
                FROM (VALUES ${Prisma.join(rows.map(r =>
                    Prisma.sql`(${r.id}, ${r.after.kzt}::int, ${r.after.usd}::int, ${JSON.stringify(r.snapshot)}::jsonb)`
                ))}) AS x(id, kzt, usd, calc)
                WHERE v.id = x.id
            `;
        }

        if (!dryRun) {
            const stamp = {
                at: result.at, reason, rateDate: result.rateDate,
                kztPerUsd: result.kztPerUsd, kztPerCny: result.kztPerCny,
                settingsVersion: result.settingsVersion,
                total: result.total, changed, frozen: frozenList.length, frozenList, skipped,
            };
            await tx.systemSettings.upsert({
                where: { key: STAMP_KEY },
                create: { key: STAMP_KEY, value: stamp as never },
                update: { value: stamp as never },
            });
        }

        return result;
    }, { timeout: 30_000, maxWait: 10_000 });

    if (!dryRun && summary.changed > 0) {
        // Главная и страницы машин собраны заранее — пусть пересоберутся с новой ценой
        try { revalidatePath('/', 'layout'); } catch { /* вне запроса Next — например, из скрипта */ }
    }
    return summary;
}

export interface RecalcStamp {
    at: string;
    reason: RecalcReason;
    rateDate: string;
    kztPerUsd: number;
    kztPerCny: number;
    settingsVersion: number;
    total: number;
    changed: number;
    frozen: number;
    frozenList?: RecalcSummary['frozenList'];
    skipped: RecalcSummary['skipped'];
}

export async function readRecalcStamp(): Promise<RecalcStamp | null> {
    const row = await prisma.systemSettings.findUnique({ where: { key: STAMP_KEY } });
    const v = row?.value as Partial<RecalcStamp> | undefined;
    return v && typeof v.at === 'string' ? (v as RecalcStamp) : null;
}
