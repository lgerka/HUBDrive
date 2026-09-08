/**
 * Настройки калькулятора: то, что менеджер правит один раз — и это действует
 * для всех.
 *
 * Раньше правки жили только во вкладке и пропадали при перезагрузке: подняли
 * цену доставки в Астану — и через час другой менеджер снова считает
 * по старой. Теперь настройки лежат в базе.
 *
 * В базе хранится ПАТЧ — только то, что руками меняли, а не весь объект.
 * Это не экономия места, а совместимость: новое поле, добавленное в код,
 * появляется у всех сразу, а старая запись про него просто не знает.
 * И «сбросить к заводскому» — это удалить ключ, а не хранить отдельный признак.
 */

export interface City {
    key: string;
    city: string;
    country: 'KZ' | 'KG' | 'RU';
}

/**
 * Города. Список намеренно живёт в коде, а не в настройках: ключ города —
 * это ссылка, на которую завязан выбор в калькуляторе. Если бы город можно
 * было удалить из настроек, выбранный «almaty» указывал бы в пустоту,
 * и логистика молча стала бы нулём. Правятся только числа по городу.
 */
export const CITIES: City[] = [
    { key: 'almaty', city: 'Алматы', country: 'KZ' },
    { key: 'astana', city: 'Астана', country: 'KZ' },
    { key: 'shymkent', city: 'Шымкент', country: 'KZ' },
    { key: 'karaganda', city: 'Караганда', country: 'KZ' },
    { key: 'aktobe', city: 'Актобе', country: 'KZ' },
    { key: 'atyrau', city: 'Атырау', country: 'KZ' },
    { key: 'bishkek', city: 'Бишкек', country: 'KG' },
    { key: 'moscow', city: 'Москва', country: 'RU' },
];

/** Ступень утильсбора. У последней maxCc = null — «всё, что выше». */
export interface UtilBracket {
    maxCc: number | null;
    coefficient: number;
}

/** Расходы и сроки по одному городу. */
export interface CityCosts {
    /** Доставка от границы до города, доллары. */
    deliveryUsd: number;
    /** Свой срок доставки в этот город. null — берём общий. */
    weeksMin: number | null;
    weeksMax: number | null;
}

/** Договорные расходы: государственных ставок здесь нет. */
export interface FixedCosts {
    /** Склад временного хранения, тенге. */
    svh: number;
    /** СБКТС, ЭПТС и подача утильсбора одним пакетом, тенге. */
    certification: number;
    /** Кнопка ЭРА-ГЛОНАСС, тенге, если считается отдельно от пакета. */
    eraGlonass: number;
    /** Сверка агрегатов, тенге. */
    inspection: number;
    /** Эвакуатор с СВХ, тенге. */
    towing: number;
    /** Услуги брокера, доллары. */
    brokerUsd: number;
}

/** Ставки, установленные законом. Доли хранятся долями: 0.16 — это 16%. */
export interface LegalRates {
    /** Месячный расчётный показатель, тенге. */
    mrp: number;
    /** НДС на импорт. */
    vat: number;
    /** Таможенный сбор за декларирование, в МРП. */
    customsFeeMrp: number;
    /** Ввозная пошлина по единому тарифу ЕАЭС. */
    dutyEaeu: number;
    /** Акциз на дорогие машины и порог в МРП, с которого он берётся. */
    exciseLuxury: number;
    exciseLuxuryThresholdMrp: number;
    /**
     * Акциз по объёму двигателя: тенге за см³ и порог в см³.
     * Ноль — выключен. Включать, только когда брокер подтвердит ставку.
     */
    exciseVolumeKztPerCc: number;
    exciseVolumeThresholdCc: number;
    /** База утилизационного платежа, в МРП, и коэффициенты по объёму. */
    utilBaseMrp: number;
    utilBrackets: UtilBracket[];
    /** Свидетельство о регистрации, в МРП. */
    srtsMrp: number;
    /** Государственные номера, в МРП. */
    platesMrp: number;
}

export interface CalcSettings {
    /** Комиссия HUBDrive, доллары. */
    commissionUsd: number;
    fixed: FixedCosts;
    /** Надбавка за перевод денег в Китай, доля от цены машины. */
    chinaPaymentFeePct: number;
    /** Проход границы, юани — так его выставляет китайская сторона. */
    borderCrossingCny: number;
    /** Транзит до страны назначения, доллары. */
    transitUsd: { KZ: number; KG: number; RU: number };
    /** Срок доставки по умолчанию, недели. */
    deliveryWeeks: { min: number; max: number };
    /** Расходы и сроки по каждому городу. */
    byCity: Record<string, CityCosts>;
    rates: LegalRates;
}

export const DEFAULT_CALC_SETTINGS: CalcSettings = {
    commissionUsd: 2000,
    fixed: {
        svh: 25_000,
        certification: 250_000,
        // Ноль намеренно: кнопка входит в пакет оформления. Отдельной строкой
        // её включают, только уменьшив пакет на ту же сумму, иначе двойной счёт
        eraGlonass: 0,
        inspection: 25_000,
        towing: 25_000,
        brokerUsd: 200,
    },
    // Ноль намеренно: включённая надбавка молча подняла бы каждую цену
    chinaPaymentFeePct: 0,
    borderCrossingCny: 3500,
    transitUsd: { KZ: 200, KG: 400, RU: 400 },
    deliveryWeeks: { min: 3, max: 6 },
    byCity: {
        almaty: { deliveryUsd: 200, weeksMin: null, weeksMax: null },
        astana: { deliveryUsd: 400, weeksMin: null, weeksMax: null },
        shymkent: { deliveryUsd: 350, weeksMin: null, weeksMax: null },
        karaganda: { deliveryUsd: 350, weeksMin: null, weeksMax: null },
        aktobe: { deliveryUsd: 600, weeksMin: null, weeksMax: null },
        atyrau: { deliveryUsd: 650, weeksMin: null, weeksMax: null },
        bishkek: { deliveryUsd: 500, weeksMin: null, weeksMax: null },
        moscow: { deliveryUsd: 1500, weeksMin: null, weeksMax: null },
    },
    rates: {
        mrp: 4325,
        vat: 0.16,
        customsFeeMrp: 6,
        dutyEaeu: 0.15,
        exciseLuxury: 0.10,
        exciseLuxuryThresholdMrp: 18_000,
        exciseVolumeKztPerCc: 0,
        exciseVolumeThresholdCc: 3000,
        utilBaseMrp: 50,
        utilBrackets: [
            { maxCc: 1000, coefficient: 1.5 },
            { maxCc: 2000, coefficient: 3.5 },
            { maxCc: 3000, coefficient: 5 },
            { maxCc: null, coefficient: 11.5 },
        ],
        srtsMrp: 1.25,
        platesMrp: 2.8,
    },
};

/* ------------------------------------------------------------------ */
/* Описание полей — один список, из которого строится всё остальное     */
/* ------------------------------------------------------------------ */

export type FieldGroup = 'common' | 'legal';

export interface FieldDef {
    /** Путь внутри CalcSettings: 'fixed.svh', 'rates.vat'. */
    path: string;
    label: string;
    unit: string;
    group: FieldGroup;
    hint?: string;
    min?: number;
    max?: number;
    /** Хранится долей, вводится процентом. */
    percent?: boolean;
    /** Ноль сделал бы расчёт бессмысленным. */
    nonZero?: boolean;
    /** Целое число. */
    integer?: boolean;
}

/**
 * Все настраиваемые поля в одном месте.
 *
 * Из этого списка строится и форма, и проверка ввода, и список изменений
 * в окне подтверждения. Иначе одно и то же поле пришлось бы описывать
 * трижды, и однажды описания разошлись бы.
 */
export const FIELDS: FieldDef[] = [
    { path: 'commissionUsd', label: 'Комиссия HUBDrive', unit: '$', group: 'common' },
    { path: 'fixed.brokerUsd', label: 'Брокер', unit: '$', group: 'common' },
    { path: 'fixed.certification', label: 'СБКТС и оформление', unit: '₸', group: 'common' },
    {
        path: 'fixed.eraGlonass', label: 'Кнопка ЭРА-ГЛОНАСС', unit: '₸', group: 'common',
        hint: 'Пока входит в СБКТС и оформление. Считаете отдельно — уменьшите ту сумму на столько же',
    },
    { path: 'fixed.svh', label: 'СВХ', unit: '₸', group: 'common' },
    { path: 'fixed.inspection', label: 'Сверка агрегатов', unit: '₸', group: 'common' },
    { path: 'fixed.towing', label: 'Эвакуатор', unit: '₸', group: 'common' },
    {
        path: 'chinaPaymentFeePct', label: 'Перевод денег в Китай', unit: '%', group: 'common',
        percent: true, max: 0.2,
        hint: 'Банк или платёжный агент берёт около 1,5%. На пошлину и НДС не влияет — они считаются по курсу Нацбанка',
    },
    { path: 'borderCrossingCny', label: 'Проход границы', unit: '¥', group: 'common' },
    { path: 'transitUsd.KZ', label: 'Транзит до Казахстана', unit: '$', group: 'common' },
    { path: 'transitUsd.KG', label: 'Транзит до Киргизии', unit: '$', group: 'common' },
    { path: 'transitUsd.RU', label: 'Транзит до России', unit: '$', group: 'common' },
    {
        path: 'deliveryWeeks.min', label: 'Срок доставки, от', unit: 'нед.', group: 'common',
        integer: true, nonZero: true, min: 1, max: 52,
    },
    {
        path: 'deliveryWeeks.max', label: 'Срок доставки, до', unit: 'нед.', group: 'common',
        integer: true, nonZero: true, min: 1, max: 52,
    },

    { path: 'rates.mrp', label: 'МРП', unit: '₸', group: 'legal', nonZero: true },
    { path: 'rates.vat', label: 'НДС на импорт', unit: '%', group: 'legal', percent: true, nonZero: true, max: 0.5 },
    { path: 'rates.dutyEaeu', label: 'Ввозная пошлина ЕАЭС', unit: '%', group: 'legal', percent: true, max: 0.5 },
    { path: 'rates.customsFeeMrp', label: 'Таможенный сбор', unit: 'МРП', group: 'legal' },
    { path: 'rates.exciseLuxury', label: 'Акциз на дорогие авто', unit: '%', group: 'legal', percent: true, max: 0.5 },
    {
        path: 'rates.exciseLuxuryThresholdMrp', label: 'Порог акциза на дорогие авто',
        unit: 'МРП', group: 'legal', nonZero: true,
    },
    {
        path: 'rates.exciseVolumeKztPerCc', label: 'Акциз по объёму', unit: '₸ за см³', group: 'legal',
        hint: 'Ноль — выключен. Включайте, только когда брокер подтвердит ставку',
    },
    {
        path: 'rates.exciseVolumeThresholdCc', label: 'Порог акциза по объёму',
        unit: 'см³', group: 'legal', nonZero: true,
    },
    { path: 'rates.utilBaseMrp', label: 'База утильсбора', unit: 'МРП', group: 'legal', nonZero: true },
    { path: 'rates.utilBrackets.0.coefficient', label: 'Утиль: до 1000 см³', unit: '×', group: 'legal' },
    { path: 'rates.utilBrackets.1.coefficient', label: 'Утиль: 1001–2000 см³', unit: '×', group: 'legal' },
    { path: 'rates.utilBrackets.2.coefficient', label: 'Утиль: 2001–3000 см³', unit: '×', group: 'legal' },
    { path: 'rates.utilBrackets.3.coefficient', label: 'Утиль: свыше 3000 см³', unit: '×', group: 'legal' },
    { path: 'rates.srtsMrp', label: 'СРТС', unit: 'МРП', group: 'legal' },
    { path: 'rates.platesMrp', label: 'Государственные номера', unit: 'МРП', group: 'legal' },
];

/** Поля, которые настраиваются отдельно для каждого города. */
export const CITY_FIELDS: FieldDef[] = [
    { path: 'deliveryUsd', label: 'Доставка до города', unit: '$', group: 'common' },
    { path: 'weeksMin', label: 'Срок, от', unit: 'нед.', group: 'common', integer: true, min: 1, max: 52 },
    { path: 'weeksMax', label: 'Срок, до', unit: 'нед.', group: 'common', integer: true, min: 1, max: 52 },
];

/* ------------------------------------------------------------------ */
/* Чтение и запись по пути                                             */
/* ------------------------------------------------------------------ */

export function readPath(obj: unknown, path: string): unknown {
    let cur: unknown = obj;
    for (const part of path.split('.')) {
        if (cur === null || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
}

export function writePath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let cur: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const next = cur[parts[i]];
        if (next === null || typeof next !== 'object') {
            // Числовой следующий сегмент означает массив: '...utilBrackets.0.coefficient'
            cur[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
        }
        cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value;
}

/* ------------------------------------------------------------------ */
/* Разбор сохранённого патча                                           */
/* ------------------------------------------------------------------ */

/**
 * Число из ненадёжного источника.
 *
 * Читаем именно так, а не через `||`: сохранённый ноль — это осознанное
 * решение менеджера, а `0 || 2000` вернуло бы 2000, и он увидел бы,
 * что кнопка не работает.
 */
function num(v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
    if (v < min || v > max) return fallback;
    return v;
}

function nullableWeeks(v: unknown, fallback: number | null): number | null {
    if (v === null) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 52) return fallback;
    return v;
}

/**
 * Из сохранённого патча — рабочие настройки.
 *
 * Не бросает исключений и не возвращает половину объекта: что не прочиталось,
 * берётся из заводского. Испорченная строка в базе не должна ни ронять
 * страницу, ни, что хуже, давать правдоподобную неверную цену.
 */
export function applyCalcPatch(patch: unknown): CalcSettings {
    const d = DEFAULT_CALC_SETTINGS;
    const p = (patch && typeof patch === 'object' ? patch : {}) as Record<string, unknown>;
    const get = (path: string) => readPath(p, path);

    const pf = (p.fixed ?? {}) as Record<string, unknown>;
    const pt = (p.transitUsd ?? {}) as Record<string, unknown>;
    const pw = (p.deliveryWeeks ?? {}) as Record<string, unknown>;
    const pr = (p.rates ?? {}) as Record<string, unknown>;

    const out: CalcSettings = {
        commissionUsd: num(p.commissionUsd, d.commissionUsd),
        fixed: {
            svh: num(pf.svh, d.fixed.svh),
            certification: num(pf.certification, d.fixed.certification),
            eraGlonass: num(pf.eraGlonass, d.fixed.eraGlonass),
            inspection: num(pf.inspection, d.fixed.inspection),
            towing: num(pf.towing, d.fixed.towing),
            brokerUsd: num(pf.brokerUsd, d.fixed.brokerUsd),
        },
        chinaPaymentFeePct: num(p.chinaPaymentFeePct, d.chinaPaymentFeePct, 0, 0.2),
        borderCrossingCny: num(p.borderCrossingCny, d.borderCrossingCny),
        transitUsd: {
            KZ: num(pt.KZ, d.transitUsd.KZ),
            KG: num(pt.KG, d.transitUsd.KG),
            RU: num(pt.RU, d.transitUsd.RU),
        },
        deliveryWeeks: {
            min: num(pw.min, d.deliveryWeeks.min, 1, 52),
            max: num(pw.max, d.deliveryWeeks.max, 1, 52),
        },
        byCity: {},
        rates: {
            mrp: num(pr.mrp, d.rates.mrp, 1),
            vat: num(pr.vat, d.rates.vat, 0, 0.5),
            customsFeeMrp: num(pr.customsFeeMrp, d.rates.customsFeeMrp),
            dutyEaeu: num(pr.dutyEaeu, d.rates.dutyEaeu, 0, 0.5),
            exciseLuxury: num(pr.exciseLuxury, d.rates.exciseLuxury, 0, 0.5),
            exciseLuxuryThresholdMrp: num(pr.exciseLuxuryThresholdMrp, d.rates.exciseLuxuryThresholdMrp, 1),
            exciseVolumeKztPerCc: num(pr.exciseVolumeKztPerCc, d.rates.exciseVolumeKztPerCc),
            exciseVolumeThresholdCc: num(pr.exciseVolumeThresholdCc, d.rates.exciseVolumeThresholdCc, 1),
            utilBaseMrp: num(pr.utilBaseMrp, d.rates.utilBaseMrp, 1),
            utilBrackets: readBrackets(pr.utilBrackets),
            srtsMrp: num(pr.srtsMrp, d.rates.srtsMrp),
            platesMrp: num(pr.platesMrp, d.rates.platesMrp),
        },
    };

    // Идём по списку городов из кода, а не по ключам патча: город, которого
    // в коде нет, в результат не попадёт, а новый появится с заводскими
    for (const c of CITIES) {
        const dc = d.byCity[c.key] ?? { deliveryUsd: 0, weeksMin: null, weeksMax: null };
        const pc = (get(`byCity.${c.key}`) ?? {}) as Record<string, unknown>;
        out.byCity[c.key] = {
            deliveryUsd: num(pc.deliveryUsd, dc.deliveryUsd),
            weeksMin: nullableWeeks(pc.weeksMin, dc.weeksMin),
            weeksMax: nullableWeeks(pc.weeksMax, dc.weeksMax),
        };
    }

    return out;
}

/**
 * Таблица утильсбора берётся целиком или не берётся вовсе: полуправка
 * «третья ступень из четырёх» смысла не имеет.
 */
function readBrackets(v: unknown): UtilBracket[] {
    if (!Array.isArray(v) || v.length === 0) return DEFAULT_CALC_SETTINGS.rates.utilBrackets;
    const parsed: UtilBracket[] = [];
    for (const item of v) {
        if (!item || typeof item !== 'object') return DEFAULT_CALC_SETTINGS.rates.utilBrackets;
        const row = item as Record<string, unknown>;
        const coefficient = row.coefficient;
        const maxCc = row.maxCc;
        if (typeof coefficient !== 'number' || !Number.isFinite(coefficient) || coefficient < 0) {
            return DEFAULT_CALC_SETTINGS.rates.utilBrackets;
        }
        if (maxCc !== null && (typeof maxCc !== 'number' || !Number.isInteger(maxCc) || maxCc <= 0)) {
            return DEFAULT_CALC_SETTINGS.rates.utilBrackets;
        }
        parsed.push({ maxCc: maxCc as number | null, coefficient });
    }
    // Порядок важен: коэффициент ищется по первому совпадению
    return parsed.sort((a, b) => (a.maxCc ?? Infinity) - (b.maxCc ?? Infinity));
}

/* ------------------------------------------------------------------ */
/* Сборка патча и список изменений                                     */
/* ------------------------------------------------------------------ */

export interface Change {
    label: string;
    unit: string;
    before: number | null;
    after: number | null;
    /** Название города, если правка касается только его. */
    city?: string;
}

/** Что изменилось между сохранённым и черновиком. */
export function diffSettings(saved: CalcSettings, draft: CalcSettings): Change[] {
    const changes: Change[] = [];

    for (const f of FIELDS) {
        const before = readPath(saved, f.path) as number;
        const after = readPath(draft, f.path) as number;
        if (before !== after) {
            changes.push({
                label: f.label,
                unit: f.unit,
                before: f.percent ? before * 100 : before,
                after: f.percent ? after * 100 : after,
            });
        }
    }

    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            const before = (readPath(saved.byCity[c.key], f.path) ?? null) as number | null;
            const after = (readPath(draft.byCity[c.key], f.path) ?? null) as number | null;
            if (before !== after) {
                changes.push({ label: f.label, unit: f.unit, before, after, city: c.city });
            }
        }
    }

    return changes;
}

/**
 * Всё, что отличается от заводского, — это и есть патч.
 *
 * База сравнения обязана быть DEFAULT_CALC_SETTINGS, а не текущие сохранённые
 * настройки. Патч заменяет в базе прежний целиком, поэтому он должен описывать
 * все отклонения от заводских разом. Если считать разницу с сохранённым,
 * второе сохранение подряд молча откатит первое: поле, которое менеджер
 * в этот раз не трогал, совпадёт с сохранённым, не попадёт в патч — и исчезнет
 * из базы вместе со старым патчем. Так терялись бы комиссия, МРП, ставки
 * и цены доставки, накопленные за месяцы.
 *
 * Отсюда же берётся сброс к заводскому: вернул значение как было — поле просто
 * пропало из патча, отдельного признака не нужно.
 */
export function buildPatch(base: CalcSettings, draft: CalcSettings): Record<string, unknown> {
    const patch: Record<string, unknown> = {};

    for (const f of FIELDS) {
        // Ступени утиля кладутся одним куском ниже
        if (f.path.startsWith('rates.utilBrackets')) continue;
        const before = readPath(base, f.path);
        const after = readPath(draft, f.path);
        if (before !== after) writePath(patch, f.path, after);
    }

    const bracketsChanged =
        draft.rates.utilBrackets.length !== base.rates.utilBrackets.length
        || draft.rates.utilBrackets.some((b, i) => {
            const from = base.rates.utilBrackets[i];
            return !from || b.coefficient !== from.coefficient || b.maxCc !== from.maxCc;
        });
    if (bracketsChanged) writePath(patch, 'rates.utilBrackets', draft.rates.utilBrackets);

    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            const before = readPath(base.byCity[c.key], f.path) ?? null;
            const after = readPath(draft.byCity[c.key], f.path) ?? null;
            if (before !== after) writePath(patch, `byCity.${c.key}.${f.path}`, after);
        }
    }

    return patch;
}

/**
 * Проверка перед сохранением.
 *
 * Окно подтверждения, открытое поверх заведомо неверных данных, обесценивает
 * само себя — поэтому сначала проверка, потом окно.
 */
export function validateSettings(s: CalcSettings): Record<string, string> {
    const errors: Record<string, string> = {};

    const checkOne = (path: string, raw: unknown, f: FieldDef, nullable: boolean) => {
        if (raw === null && nullable) return;
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
            errors[path] = 'Введите число';
            return;
        }
        if (raw < 0) errors[path] = 'Не может быть отрицательным';
        else if (f.nonZero && raw === 0) errors[path] = 'Не может быть нулём';
        else if (f.integer && !Number.isInteger(raw)) errors[path] = 'Только целое число';
        else if (f.min !== undefined && raw < f.min) errors[path] = `Не меньше ${f.min}`;
        else if (f.max !== undefined && raw > f.max) {
            errors[path] = f.percent ? `Не больше ${f.max * 100}%` : `Не больше ${f.max}`;
        }
    };

    for (const f of FIELDS) {
        checkOne(f.path, readPath(s, f.path), f, false);
    }

    if (s.deliveryWeeks.min > s.deliveryWeeks.max) {
        errors['deliveryWeeks.min'] = 'Начало срока позже конца';
    }

    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            // Пустой срок по городу законен — он означает «взять общий».
            // Пустая доставка не законна: нулевой цены доставки не бывает
            const nullable = f.path !== 'deliveryUsd';
            checkOne(`byCity.${c.key}.${f.path}`, readPath(s.byCity[c.key], f.path), f, nullable);
        }

        // Сравнивать надо действующие сроки, а не пару заполненных полей.
        // Иначе «от» = 8 при пустом «до» молча возьмёт общий конец 6 недель,
        // и клиенту уйдёт «Срок доставки: 8–6 недель»
        const weeks = deliveryWeeksFor(s, c.key);
        const weekPath = s.byCity[c.key].weeksMin !== null
            ? `byCity.${c.key}.weeksMin`
            : `byCity.${c.key}.weeksMax`;
        // Не затираем более точную ошибку: «не больше 52» полезнее, чем
        // «выходит 60–6» — она говорит, что именно исправить
        if (weeks.min > weeks.max && !errors[weekPath]) {
            errors[weekPath] = `Выходит «${weeks.min}–${weeks.max}»: начало срока позже конца`;
        }
    }

    return errors;
}

/**
 * Значения, которые не переживут сохранения.
 *
 * applyCalcPatch намеренно подменяет негодное значение заводским — так
 * испорченная строка в базе не роняет страницу. Но из-за этого проверять
 * результат слияния бесполезно: он исправен всегда, по построению.
 * Поэтому сравниваем то, что просили сохранить, с тем, что получится:
 * разошлось — значит значение отвергнуто, и об этом надо сказать, а не
 * молча записать в базу мусор, который потом никто не найдёт.
 */
export function rejectedPaths(patch: unknown): Record<string, string> {
    const rejected: Record<string, string> = {};
    if (!patch || typeof patch !== 'object') return rejected;
    const merged = applyCalcPatch(patch);

    const check = (path: string, asked: unknown, got: unknown, label: string) => {
        if (asked === undefined) return;
        if (asked !== got) rejected[path] = `Значение «${String(asked)}» недопустимо для «${label}»`;
    };

    for (const f of FIELDS) {
        if (f.path.startsWith('rates.utilBrackets')) continue;
        check(f.path, readPath(patch, f.path), readPath(merged, f.path), f.label);
    }

    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            const path = `byCity.${c.key}.${f.path}`;
            check(path, readPath(patch, path), readPath(merged, path), `${f.label} (${c.city})`);
        }
    }

    const askedBrackets = readPath(patch, 'rates.utilBrackets');
    if (askedBrackets !== undefined
        && JSON.stringify(askedBrackets) !== JSON.stringify(merged.rates.utilBrackets)) {
        rejected['rates.utilBrackets'] = 'Ступени утильсбора заданы неверно';
    }

    return rejected;
}

/** Срок доставки в конкретный город: свой, если задан, иначе общий. */
export function deliveryWeeksFor(s: CalcSettings, cityKey: string): { min: number; max: number } {
    const city = s.byCity[cityKey];
    return {
        min: city?.weeksMin ?? s.deliveryWeeks.min,
        max: city?.weeksMax ?? s.deliveryWeeks.max,
    };
}
