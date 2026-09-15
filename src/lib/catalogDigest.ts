/**
 * Вечерний список на пополнение каталога.
 *
 * Весь день в чат «Пополнение каталога» падают заявки по одной: «Просят: byd —
 * в наличии нет» и текст, который менеджер набрал с телефона. Закупать по такой
 * ленте нельзя — одну модель спрашивают трижды разными словами, комплектации
 * и цвета разбросаны по разным сообщениям, а китайскому поставщику нужен
 * внятный список на английском.
 *
 * Здесь заявки разбираются на поля, сводятся по моделям и собираются в два
 * сообщения. Русское — для своих: сколько раз спрашивали, бюджеты, куда везти.
 * Английское — чтобы переслать поставщику как запрос цены, и в нём намеренно
 * нет трёх вещей. Нет имён и телефонов. Нет бюджетов: узнав, за сколько машина
 * уходит в Казахстане, поставщик перестанет торговаться. И нет числа запросов:
 * «пятеро клиентов спрашивают Qin L» для него сигнал поднять цену.
 *
 * Разбор сделан словарём, а не языковой моделью. Список должен прийти каждый
 * вечер, и внешний сервис, который ночью не ответил, — это день без закупки.
 * Словарь предсказуем: то, чего он не узнал, честно остаётся неразобранным,
 * а не превращается в правдоподобную выдумку.
 */

import {
    CATALOG_MODELS, CATALOG_BRANDS,
    type CatalogModel, type Powertrain,
} from './catalogModels';

export type { Powertrain };

/* ------------------------------------------------------------------ */
/* Границы слов для кириллицы                                          */
/* ------------------------------------------------------------------ */

/**
 * В JavaScript `\b` и `\w` знают только латиницу: для них кириллическая буква —
 * не часть слова. Шаблон `\bбелый\b` поэтому не срабатывает никогда, а в
 * «мокр\w*» звёздочка не съедает «ый» — и «мокрый асфальт» не находится.
 * Молча: ни ошибки, ни совпадения. Здесь оба заменяются на варианты,
 * которые понимают буквы любого алфавита.
 */
const BOUNDARY = '(?:(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}])|(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}]))';
const WORD_CHAR = '[\\p{L}\\p{N}_]';

function u(re: RegExp): RegExp {
    const flags = re.flags.includes('u') ? re.flags : `${re.flags}u`;
    const source = re.source.replace(/\\b/g, BOUNDARY).replace(/\\w/g, WORD_CHAR);
    return new RegExp(source, flags);
}

/* ------------------------------------------------------------------ */
/* Нормализация                                                        */
/* ------------------------------------------------------------------ */

export function normalize(text: string): string {
    return (text || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        // «qin-I» и «qin I» — латинская I вместо l, частая опечатка с телефона
        .replace(/\bqin[\s-]*i\b/g, 'qin l')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Служебная приписка формы ручной заявки: «Обращение: WhatsApp. BYD Qin L…».
 * К запросу клиента отношения не имеет.
 */
export function stripChannelPrefix(text: string): string {
    return (text || '').replace(/^\s*обращение:\s*[^.]*\.\s*/i, '').trim();
}

function tokenize(text: string): string[] {
    return normalize(text).split(/[^\p{L}\p{N}+]+/u).filter(Boolean);
}

/** «qin l», «qin-l», «qinl» — одно и то же. */
function compact(text: string): string {
    return normalize(text).replace(/[^\p{L}\p{N}+]+/gu, '');
}

/* ------------------------------------------------------------------ */
/* Марки и модели                                                      */
/* ------------------------------------------------------------------ */

/**
 * Суббренды и их владельцы. «BYD Leopard 5» — это Fangchengbao, и называть
 * BYD отдельной «маркой без модели» было бы ошибкой.
 */
const PARENT: Record<string, string> = {
    Fangchengbao: 'BYD',
    Denza: 'BYD',
    Voyah: 'Dongfeng',
    'Geely Galaxy': 'Geely',
    Deepal: 'Changan',
    Baojun: 'Wuling',
};

function sameFamily(a: string, b: string): boolean {
    return a === b || PARENT[a] === b || PARENT[b] === a || (PARENT[a] !== undefined && PARENT[a] === PARENT[b]);
}

interface AliasEntry { compact: string; model: CatalogModel; brandless: boolean }

const ALIAS_BY_COMPACT = new Map<string, AliasEntry[]>();
for (const model of CATALOG_MODELS) {
    const brandCompact = CATALOG_BRANDS.find(b => b.name === model.brand)?.aliases.map(compact) ?? [];
    for (const alias of [model.name, ...model.aliases]) {
        const c = compact(alias);
        if (c.length < 2) continue;
        const brandless = !brandCompact.some(bc => c.startsWith(bc)) && !c.startsWith(compact(model.brand));
        const list = ALIAS_BY_COMPACT.get(c) ?? [];
        if (!list.some(e => e.model.id === model.id)) list.push({ compact: c, model, brandless });
        ALIAS_BY_COMPACT.set(c, list);
    }
}

const BRAND_BY_COMPACT = new Map<string, string>();
for (const b of CATALOG_BRANDS) {
    for (const alias of [b.name, ...b.aliases]) {
        const c = compact(alias);
        if (c.length >= 2) BRAND_BY_COMPACT.set(c, b.name);
    }
}

/**
 * Латинские слова, которые идут после марки, но моделью не являются:
 * комплектации, тип двигателя, привод.
 */
const NOT_MODEL_WORDS = new Set([
    'edition', 'flagship', 'ultra', 'max', 'lux', 'luxury', 'tech', 'premium', 'elite', 'smart',
    'dm', 'dmi', 'dmp', 'ev', 'phev', 'erev', 'hev', 'bev', 'hybrid', 'awd', '4wd', '2wd', 'fwd',
    'rwd', 'full', 'option', 'new', 'used', 'suv', 'color', 'colour', 'turbo',
]);

function looksLikeModelToken(token: string): boolean {
    if (!/^[a-z0-9+]+$/.test(token)) return false;         // кириллица — это уже описание
    if (NOT_MODEL_WORDS.has(token)) return false;
    if (/^20[12]\d$/.test(token)) return false;              // год
    if (/^\d{5,}$/.test(token)) return false;                // телефон или пробег
    if (/^\d+(km|км|l|t)$/.test(token)) return false;        // «120km», «2l»
    return true;
}

function titleToken(token: string): string {
    if (/\d/.test(token) || token.length <= 3) return token.toUpperCase();
    return token.charAt(0).toUpperCase() + token.slice(1);
}

export interface ModelMatch { model: CatalogModel; start: number; end: number }

export interface FindResult {
    matches: ModelMatch[];
    /** Марка названа, модель — нет. */
    brandsOnly: string[];
    /** Написание подходит нескольким моделям, и выбрать не из чего. */
    ambiguous: { text: string; options: string[] }[];
}

/**
 * Модели, названные в тексте.
 *
 * Ищем по границам слов, склеивая до четырёх соседних: так «qin», «l»
 * совпадает с «qinl», «g», «318» — с «g318», а «han» не находится внутри
 * «changan». Подстрочный поиск давал именно такие ложные совпадения.
 *
 * Спорное написание — «L6» у Li Auto и у Geely Galaxy — решает марка, названная
 * рядом. Не названа — не угадываем, строка уйдёт на уточнение. И наоборот:
 * если прямо перед написанием стоит другая марка, побеждает она. «Volkswagen
 * Atlas» — это не Geely Atlas.
 */
export function findModels(text: string): FindResult {
    const tokens = tokenize(text);
    const matches: ModelMatch[] = [];
    const ambiguous: FindResult['ambiguous'] = [];
    const ambiguousSpans: { start: number; end: number }[] = [];

    // Марки: одно слово или склейка до трёх («lynk co», «fang cheng bao»)
    const brandAt: { brand: string; start: number; end: number }[] = [];
    for (let i = 0; i < tokens.length; i++) {
        for (let span = Math.min(3, tokens.length - i); span >= 1; span--) {
            const b = BRAND_BY_COMPACT.get(tokens.slice(i, i + span).join(''));
            if (b) { brandAt.push({ brand: b, start: i, end: i + span }); i += span - 1; break; }
        }
    }
    const brandBefore = (pos: number, maxGap = 2) =>
        [...brandAt].reverse().find(b => b.end <= pos && pos - b.end <= maxGap)?.brand
        ?? [...brandAt].reverse().find(b => b.start <= pos && b.end > pos)?.brand;

    let i = 0;
    while (i < tokens.length) {
        let best: { entries: AliasEntry[]; span: number; length: number } | null = null;
        for (let span = Math.min(4, tokens.length - i); span >= 1; span--) {
            const joined = tokens.slice(i, i + span).join('');
            const entries = ALIAS_BY_COMPACT.get(joined);
            if (entries && (!best || joined.length > best.length)) best = { entries, span, length: joined.length };
        }
        if (!best) { i++; continue; }

        const near = brandBefore(i);
        const candidates = best.entries.map(e => e.model);
        let chosen: CatalogModel | undefined;

        if (near) {
            const ofBrand = candidates.filter(m => sameFamily(m.brand, near));
            if (ofBrand.length === 1) chosen = ofBrand[0];
            else if (ofBrand.length === 0 && best.entries.every(e => e.brandless)) {
                // Прямо перед написанием стоит чужая марка — модель не наша,
                // оставляем её разбору «марка + следующие слова»
                i += best.span;
                continue;
            }
        } else if (candidates.length === 1) {
            chosen = candidates[0];
        }

        const spanText = tokens.slice(i, i + best.span).join(' ');
        if (!chosen) {
            ambiguous.push({ text: spanText, options: candidates.map(m => m.ruName ?? m.name) });
            ambiguousSpans.push({ start: i, end: i + best.span });
        } else if (!matches.some(m => m.model.id === chosen!.id)) {
            matches.push({ model: chosen, start: i, end: i + best.span });
        }

        // «Seal 05 или 06», «Tank 300 и 500» — вторая модель названа одним числом
        let next = i + best.span;
        const lastToken = tokens[i + best.span - 1];
        while (chosen && /^\d+$/.test(lastToken) && /^(или|и|or|and)$/.test(tokens[next] ?? '') && /^\d+$/.test(tokens[next + 1] ?? '')) {
            const prefix = tokens.slice(i, i + best.span - 1).join('');
            const sibling = ALIAS_BY_COMPACT.get(prefix + tokens[next + 1])?.find(e => sameFamily(e.model.brand, chosen!.brand));
            if (!sibling) break;
            if (!matches.some(m => m.model.id === sibling.model.id)) {
                matches.push({ model: sibling.model, start: next + 1, end: next + 2 });
            }
            next += 2;
        }
        i = next;
    }

    // Марка названа, а модели из справочника рядом нет. Если за маркой идут
    // латинские слова — это и есть модель, просто её нет в справочнике:
    // «Mercedes GLE350», «Toyota Corolla». Если описание по-русски
    // («BYD гибрид») — модели нет, строку надо уточнять
    const brandsOnly: string[] = [];
    for (const b of brandAt) {
        const covered = matches.some(m =>
            sameFamily(m.model.brand, b.brand) && (m.start >= b.end - 1 && m.start - b.end <= 3 || m.start <= b.start && m.end >= b.end)
        );
        if (covered) continue;
        if (matches.some(m => sameFamily(m.model.brand, b.brand))) continue;
        // Сразу за маркой спорное написание («BYD Sealion 8») — оно уже уйдёт
        // на уточнение. Собирать из тех же слов модель «BYD Sealion 8» значило бы
        // сообщить об одной машине дважды, и один раз — выдуманным именем
        if (ambiguousSpans.some(a => a.start >= b.end && a.start - b.end <= 1)) continue;
        // Родитель, у которого названа дочерняя марка («Dongfeng Voyah»), —
        // не отдельный запрос
        if (brandAt.some(o => o !== b && PARENT[o.brand] === b.brand)) continue;

        const words: string[] = [];
        for (let k = b.end; k < tokens.length && words.length < 3; k++) {
            if (BRAND_BY_COMPACT.has(tokens[k])) break;
            if (!looksLikeModelToken(tokens[k])) break;
            words.push(tokens[k]);
        }

        if (words.length > 0) {
            const name = `${b.brand} ${words.map(titleToken).join(' ')}`;
            const id = `adhoc-${compact(name)}`;
            if (!matches.some(m => m.model.id === id)) {
                matches.push({
                    model: { id, brand: b.brand, name, aliases: [], adhoc: true },
                    start: b.start, end: b.end + words.length,
                });
            }
        } else if (!brandsOnly.includes(b.brand)) {
            brandsOnly.push(b.brand);
        }
    }

    return { matches, brandsOnly, ambiguous };
}

/* ------------------------------------------------------------------ */
/* Словарь признаков                                                   */
/* ------------------------------------------------------------------ */

interface Term { key: string; ru: string; en: string; match: RegExp; ruWithout?: string }

/**
 * Уровни комплектации. «Средняя» и «полная» — не заводские названия, в китайском
 * прайсе их нет. Переводим в то, чем реально пользуются китайские экспортёры,
 * и рядом пишем иероглифы.
 */
const TRIMS: Term[] = [
    { key: 'any', ru: 'любая', en: 'all available trims — please quote every version (请报所有配置)',
        match: u(/(все\s+(возможные\s+)?комплектац|любая\s+комплектац|любые\s+комплектац|комплектация\s+не\s+важна)/) },
    { key: 'top', ru: 'максимальная', en: 'top-spec / flagship (顶配)',
        match: u(/(максимал|топов|\bтоп\b|самая\s+полная)/) },
    { key: 'full', ru: 'полная', en: 'high-spec / full option (高配)',
        match: u(/\bполн(ая|ой|ую|ые|ых|ом)\b(?!\s+привод)/) },
    { key: 'mid', ru: 'средняя', en: 'mid-spec (中配)',
        match: u(/\bсредн(яя|ей|юю|ие|их|ем)\b|продвинут/) },
    { key: 'base', ru: 'базовая', en: 'base / standard (标准版)',
        match: u(/\bбазов|начальн/) },
];

const COLORS: Term[] = [
    { key: 'wet_asphalt', ru: 'мокрый асфальт', en: 'dark grey metallic “wet asphalt” shade (深灰色), please send paint options',
        match: u(/мокр\w*\s+асфальт\w*/) },
    { key: 'dark_grey', ru: 'тёмно-серый', en: 'dark grey (深灰色)', match: u(/темно[\s-]*сер\w*/) },
    { key: 'dark_green', ru: 'тёмно-зелёный', en: 'dark green (墨绿色)', match: u(/темно[\s-]*зелен\w*/) },
    { key: 'dark_blue', ru: 'тёмно-синий', en: 'dark blue (深蓝色)', match: u(/темно[\s-]*син\w*/) },
    { key: 'dark_tone', ru: 'тёмный', en: 'dark tone (深色)', match: u(/темн\w*\s+тон\w*|\bтемн(ый|ая|ое|ые|ом|ых)\b/) },
    { key: 'light_tone', ru: 'светлый', en: 'light tone (浅色)', match: u(/светл\w*\s+тон\w*|\bсветл(ый|ая|ое|ые|ом|ых)\b/) },
    { key: 'white', ru: 'белый', en: 'white (白色)', match: u(/\bбел(ый|ая|ое|ые|ом|ого|ой|ую)\b/) },
    { key: 'black', ru: 'чёрный', en: 'black (黑色)', match: u(/\bчерн(ый|ая|ое|ые|ом|ого|ой|ую)\b/) },
    { key: 'silver', ru: 'серебристый', en: 'silver (银色)', match: u(/серебр\w*/) },
    { key: 'grey', ru: 'серый', en: 'grey (灰色)', match: u(/\bсер(ый|ая|ое|ые|ом|ого|ой|ую)\b|графит\w*/) },
    { key: 'burgundy', ru: 'бордовый', en: 'burgundy (酒红色)', match: u(/бордо\w*/) },
    { key: 'green', ru: 'зелёный', en: 'green (绿色)', match: u(/\bзелен(ый|ая|ое|ые|ом|ого|ой|ую)\b/) },
    { key: 'blue', ru: 'синий', en: 'blue (蓝色)', match: u(/\bсин(ий|яя|ее|ие|ем|его|ей|юю)\b/) },
    { key: 'light_blue', ru: 'голубой', en: 'light blue (浅蓝色)', match: u(/голуб\w*/) },
    { key: 'red', ru: 'красный', en: 'red (红色)', match: u(/\bкрасн\w*/) },
    { key: 'yellow', ru: 'жёлтый', en: 'yellow (黄色)', match: u(/\bжелт\w*/) },
    { key: 'beige', ru: 'бежевый', en: 'beige (米色)', match: u(/\bбеж\w*/) },
    { key: 'tan', ru: 'рыжий', en: 'tan / caramel (浅棕色)', match: u(/\bрыж\w*|карамел\w*/) },
    { key: 'brown', ru: 'коричневый', en: 'brown (棕色)', match: u(/коричнев\w*|mocha\s+brown|шоколад\w*/) },
    { key: 'orange', ru: 'оранжевый', en: 'orange (橙色)', match: u(/оранжев\w*/) },
];
const ANY_COLOR: Term = { key: 'any', ru: 'любой', en: 'any colour (颜色不限)', match: /$^/ };

const FEATURES: Term[] = [
    { key: 'ventilated', ruWithout: 'без вентиляции сидений', ru: 'вентиляция сидений', en: 'ventilated seats (座椅通风)', match: u(/обдув\w*|вентиляц\w*/) },
    { key: 'massage', ruWithout: 'без массажа сидений', ru: 'массаж сидений', en: 'massage seats (座椅按摩)', match: u(/массаж\w*/) },
    { key: 'heated', ruWithout: 'без подогревов', ru: 'подогревы', en: 'heated seats / steering wheel (座椅加热)', match: u(/подогрев\w*/) },
    { key: 'hud', ruWithout: 'без проекции', ru: 'проекция на стекло', en: 'head-up display (HUD)', match: u(/проекци\w*|\bhud\b/) },
    { key: 'panorama', ruWithout: 'без панорамной крыши', ru: 'панорамная крыша', en: 'panoramic roof (全景天窗)', match: u(/панорам\w*/) },
    { key: 'air_suspension', ruWithout: 'без пневмоподвески', ru: 'пневмоподвеска', en: 'air suspension (空气悬架)', match: u(/пневмо[\s-]*подвес\w*/) },
    { key: 'classic_handles', ruWithout: 'без обычных ручек', ru: 'обычные дверные ручки', en: 'conventional door handles (not retractable)', match: u(/обычн\w*\s+ручк\w*/) },
];

/**
 * Заводские названия комплектаций. Не переводим: поставщик ищет ровно это слово
 * в прайсе. Только выправляем регистр и опечатки.
 */
const OFFICIAL_TRIM_WORDS: Record<string, string> = {
    flagship: 'Flagship', ultra: 'Ultra', max: 'Max', pro: 'Pro', lux: 'Lux', luxury: 'Luxury',
    tech: 'Tech', premium: 'Premium', comfort: 'Comfort', elite: 'Elite', sport: 'Sport',
    mountain: 'Mountain', pilot: 'Pilot', pilor: 'Pilot', ares: 'Ares', flash: 'Flash',
    charge: 'Charge', plus: 'Plus', smart: 'Smart', leading: 'Leading', excellence: 'Excellence',
    honor: 'Honor', glory: 'Glory', dm: 'DM', dmi: 'DM-i', dmp: 'DM-p',
};

/* ------------------------------------------------------------------ */
/* Разбор                                                              */
/* ------------------------------------------------------------------ */

export interface RequestFacts {
    trims: Set<string>;
    officialTrims: Set<string>;
    exterior: Set<string>;
    interior: Set<string>;
    excludedColors: Set<string>;
    powertrain: Set<Powertrain>;
    drive: Set<'AWD' | 'FWD'>;
    engineLiters: Set<string>;
    condition: Set<'new' | 'used'>;
    maxMileageKm: number | null;
    years: Set<number>;
    features: Set<string>;
    withoutFeatures: Set<string>;
    evRangeKm: Set<number>;
    /** Только для своих — наружу не уходит. */
    budget: string[];
    destination: string[];
    notes: Set<string>;
}

function emptyFacts(): RequestFacts {
    return {
        trims: new Set(), officialTrims: new Set(), exterior: new Set(), interior: new Set(),
        excludedColors: new Set(), powertrain: new Set(), drive: new Set(), engineLiters: new Set(),
        condition: new Set(), maxMileageKm: null, years: new Set(), features: new Set(),
        withoutFeatures: new Set(), evRangeKm: new Set(), budget: [], destination: [], notes: new Set(),
    };
}

function cloneFacts(f: RequestFacts): RequestFacts {
    const c = emptyFacts();
    mergeFacts(c, f);
    return c;
}

export interface ParsedItem { model: CatalogModel; facts: RequestFacts }

export interface Unresolved {
    brands: string[];
    ambiguous: FindResult['ambiguous'];
    facts: RequestFacts;
    /** Выдержка из заявки: без неё «BYD — модель не названа» не понять. */
    excerpt: string;
}

/**
 * Короткая выдержка из заявки для своих.
 *
 * Номера телефонов вырезаем: в ручной заявке они лежат отдельным полем,
 * но в форме на сайте человек мог вписать номер прямо в комментарий.
 */
export function excerpt(text: string, max = 110): string {
    const clean = stripChannelPrefix(text)
        .replace(/(\+?\d[\d\s()-]{8,}\d)/g, '…')
        .replace(/\s+/g, ' ')
        .trim();
    return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export interface ParsedRequest { items: ParsedItem[]; unresolved: Unresolved[] }

const CITIES_RU: [string, string][] = [
    ['алмат', 'Алматы'], ['астан', 'Астана'], ['шымкент', 'Шымкент'], ['караганд', 'Караганда'],
    ['актоб', 'Актобе'], ['атыра', 'Атырау'], ['актау', 'Актау'], ['бишкек', 'Бишкек'],
    ['москв', 'Москва'], ['павлодар', 'Павлодар'], ['костанай', 'Костанай'], ['уральск', 'Уральск'],
    ['тараз', 'Тараз'], ['кызылорд', 'Кызылорда'], ['семе', 'Семей'], ['петропавл', 'Петропавловск'],
];

/**
 * Разбор заявки.
 *
 * Заявка может описывать сразу несколько машин с разными пожеланиями: «Sealion 8,
 * Voyah — серебро, бордо» и отдельной строкой «Hongqi E-QM5 в серебре, чёрный
 * салон». Поэтому режем по строкам, и признаки каждой строки достаются только
 * её моделям.
 */
export function parseRequest(raw: string): ParsedRequest {
    const text = stripChannelPrefix(raw);
    const result: ParsedRequest = { items: [], unresolved: [] };

    for (const segment of text.split(/\n+/).map(s => s.trim()).filter(Boolean)) {
        const facts = extractFacts(segment);
        const { matches, brandsOnly, ambiguous } = findModels(segment);

        const rangeAt = evRangePositions(segment);

        for (const [idx, m] of matches.entries()) {
            const itemFacts = cloneFacts(facts);

            // «Гибрид» без уточнения: смотрим, какие гибриды у модели бывают
            if (itemFacts.powertrain.delete('HYBRID')) {
                const known = m.model.powertrains ?? [];
                const hybrid = known.filter(p => p === 'PHEV' || p === 'EREV' || p === 'HEV');
                itemFacts.powertrain.add(hybrid.length === 1 ? hybrid[0] : 'HYBRID');
            }
            // Тип двигателя, заложенный в саму модель, — не догадка:
            // Li Auto L6 бывает только EREV
            if (itemFacts.powertrain.size === 0 && m.model.powertrains?.length === 1) {
                itemFacts.powertrain.add(m.model.powertrains[0]);
            }

            // Запас хода — часть названия версии конкретной модели. В «qin I 120km,
            // Song plus» 120 км относятся к Qin L, а у Song Plus такой версии нет.
            // Отдаём его модели, названной перед ним ближе всех
            itemFacts.evRangeKm.clear();
            const nextStart = matches[idx + 1]?.start ?? Infinity;
            for (const r of rangeAt) {
                if (r.at >= m.start && r.at < nextStart) itemFacts.evRangeKm.add(r.km);
            }

            result.items.push({ model: m.model, facts: itemFacts });
        }

        if (brandsOnly.length > 0 || ambiguous.length > 0) {
            result.unresolved.push({ brands: brandsOnly, ambiguous, facts, excerpt: excerpt(segment) });
        } else if (matches.length === 0 && hasSourcingSignals(facts)) {
            // Ни марки, ни модели, но человек явно ищет машину:
            // бюджет, пробег, годы. Это тоже спрос — его надо уточнить
            result.unresolved.push({ brands: [], ambiguous: [], facts, excerpt: excerpt(segment) });
        }
    }

    return result;
}

/** Где в строке упомянут запас хода на электричестве — в номерах слов. */
function evRangePositions(segment: string): { km: number; at: number }[] {
    const tokens = tokenize(segment);
    const found: { km: number; at: number }[] = [];
    tokens.forEach((t, i) => {
        const glued = t.match(/^(\d{2,3})(km|км)$/);
        const split = /^\d{2,3}$/.test(t) && /^(km|км)$/.test(tokens[i + 1] ?? '') ? t : null;
        const km = Number(glued?.[1] ?? split);
        const nearMileage = tokens.slice(Math.max(0, i - 4), i).some(w => w.startsWith('пробег'));
        if (km >= 40 && km <= 400 && !nearMileage) found.push({ km, at: i });
    });
    return found;
}

function hasSourcingSignals(f: RequestFacts): boolean {
    return f.budget.length > 0 || f.condition.size > 0 || f.years.size > 0;
}

export function extractFacts(segment: string): RequestFacts {
    const f = emptyFacts();
    const s = normalize(segment);

    for (const t of TRIMS) if (t.match.test(s)) f.trims.add(t.key);
    if (f.trims.has('any')) for (const k of [...f.trims]) if (k !== 'any') f.trims.delete(k);
    for (const trim of officialTrims(segment)) f.officialTrims.add(trim);
    // «Flagship (продвинутая) и Flagship+ (топовая)» — это пояснения менеджера
    // к заводским названиям, а не ещё две комплектации. Поставщику нужно
    // заводское. «Все комплектации» остаётся: это отдельное пожелание
    if (f.officialTrims.size > 0) for (const k of [...f.trims]) if (k !== 'any') f.trims.delete(k);

    extractColors(s, f);

    if (u(/\berev\b|последовательн/).test(s)) f.powertrain.add('EREV');
    if (u(/\bdm[\s-]*[ip]\b|\bphev\b|\bem[\s-]*[ip]\b|подзаряж/).test(s)) f.powertrain.add('PHEV');
    // Просто «гибрид» уточняется по модели: у BYD это DM-i, у Toyota —
    // обычный гибрид без розетки. Здесь только отмечаем, решает parseRequest
    if (u(/гибрид|hybrid/).test(s) && f.powertrain.size === 0) f.powertrain.add('HYBRID');
    // «Flash Charge» (闪充版) у BYD бывает только у электрических версий
    if (u(/электро|электрическ|\bbev\b|\bev\b|flash\s*charge|闪充/).test(s)) f.powertrain.add('BEV');
    if (u(/бензин|дизел/).test(s)) f.powertrain.add('ICE');

    if (u(/\b4\s*wd\b|\bawd\b|полн\w*\s+привод|\b4х4\b|\b4x4\b/).test(s)) f.drive.add('AWD');
    if (u(/\b2\s*wd\b|передн\w*\s+привод|\bfwd\b/).test(s)) f.drive.add('FWD');

    const liters = s.match(u(/\b(\d(?:[.,]\d)?)\s*(литр\w*|л)\b/));
    if (liters) f.engineLiters.add(liters[1].replace(',', '.'));

    // Запас хода на электричестве: «120km». Пробег («пробег до 80 000 км»)
    // сюда попадать не должен — отсекаем по размеру и по слову рядом
    for (const m of s.matchAll(u(/\b(\d{2,3})\s*(km|км)\b/g))) {
        const km = Number(m[1]);
        const before = s.slice(Math.max(0, (m.index ?? 0) - 25), m.index);
        if (km >= 40 && km <= 400 && !/пробег/.test(before)) f.evRangeKm.add(km);
    }

    if (u(/без\s+пробег|\bнов(ый|ая|ое|ую|ые)\b|нулев\w*|\b0\s*км\b/).test(s)) f.condition.add('new');
    if (u(/с\s+(\S+\s+)?пробег|пробег\w*\s+(до|не\s+более|не\s+больше)|\bб\/у\b|\bбу\b|подержан/).test(s)) f.condition.add('used');

    for (const m of s.matchAll(u(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})(?:\s*[-–]\s*(\d{1,3}(?:[.\s]\d{3})+|\d{4,6}))?\s*(км|km)\b/g))) {
        const nums = [m[1], m[2]].filter(Boolean).map(n => Number(n!.replace(/[.\s]/g, '')));
        const max = Math.max(...nums);
        if (max >= 1000 && max <= 500_000) f.maxMileageKm = Math.max(f.maxMileageKm ?? 0, max);
    }

    for (const m of s.matchAll(u(/\b(20[12]\d)\s*[-–]\s*(20[12]\d|[12]\d)\b/g))) {
        const from = Number(m[1]);
        const to = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
        for (let y = from; y <= to && y - from < 6; y++) f.years.add(y);
    }
    for (const m of s.matchAll(u(/\b(20[12]\d)\b/g))) f.years.add(Number(m[1]));

    for (const feat of FEATURES) {
        const without = new RegExp(`без\\s+(\\S+\\s+)?(?:${feat.match.source})`, 'u');
        if (without.test(s)) f.withoutFeatures.add(feat.key);
        else if (feat.match.test(s)) f.features.add(feat.key);
    }

    const budget = s.match(u(/(бюджет\s*)?(до\s*)?(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*(млн|тыс\w*)?\s*(тг|тенге|₸|\$|usd|долл\w*)/));
    if (budget && (budget[1] || budget[2] || budget[4] || /\$|usd|долл/.test(budget[5]))) {
        f.budget.push(budget[0].trim().replace(/^бюджет\s*/, ''));
    }

    const turnkey = s.match(/под\s+ключ(?:\s+(?:до|в)\s+([\p{L}-]+))?/u);
    if (turnkey) {
        const city = turnkey[1] ? (CITIES_RU.find(([root]) => turnkey[1].startsWith(root))?.[1] ?? null) : null;
        f.destination.push(city ? `под ключ до ${city}` : 'под ключ');
    }

    if (/без\s+растамож/.test(s)) f.notes.add('без растаможки');
    if (/(хоргос|харгос)/.test(s)) f.notes.add('на Хоргосе');
    if (/посмотреть\s+цен|уточнить\s+цен|узнать\s+цен/.test(s)) f.notes.add('только узнать цену');

    return f;
}

/**
 * Заводские названия комплектаций: «Flagship+», «Ultra», «Mountain Edition».
 * Берём латинские слова из белого списка и всё, что стоит перед «Edition».
 */
function officialTrims(segment: string): string[] {
    const found: string[] = [];
    // Слово комплектации начинается только с начала слова: иначе из «4WD
    // Mountain Edition» получалось «Wd Mountain Edition». Привод и тип
    // двигателя в название комплектации не входят
    const editionRe = /(?<![A-Za-z0-9-])((?:[A-Za-z][A-Za-z0-9-]*\+?\s+){1,3})edition/gi;
    const notTrim = /^(4?wd|awd|2wd|fwd|rwd|ev|phev|erev|hev|bev)$/i;

    for (const m of segment.matchAll(editionRe)) {
        const words = m[1].trim().split(/\s+/).filter(w => !notTrim.test(w));
        if (words.length > 0) found.push(`${words.map(fixTrimWord).join(' ')} Edition`);
    }
    const rest = segment.replace(editionRe, ' ');
    for (const m of rest.matchAll(/(?<![A-Za-z0-9-])(flagship|ultra|max|lux|luxury|tech|premium|elite|leading|excellence|honor|glory)(\+?)(?![A-Za-z0-9])/gi)) {
        found.push(`${fixTrimWord(m[1])}${m[2]}`);
    }
    return [...new Set(found)];
}

function fixTrimWord(word: string): string {
    const plus = word.endsWith('+') ? '+' : '';
    const bare = word.replace(/\+$/, '').toLowerCase();
    const known = OFFICIAL_TRIM_WORDS[bare.replace(/-/g, '')];
    return (known ?? bare.charAt(0).toUpperCase() + bare.slice(1)) + plus;
}

/**
 * Цвета кузова и салона.
 *
 * Строку режем на части по запятым. Пометка («кузов», «салон», «кожа») забирает
 * ближайший к ней цвет. Остальные цвета части достаются той пометке, что в ней
 * одна, а если пометки нет — продолжают список из предыдущей части, но только
 * если тот список был «открыт»: «цвет кузова серебро, бордо» — бордо тоже кузов.
 * После «чёрный салон» список закрыт, и следующее «белый» — уже цвет машины.
 */
function extractColors(text: string, f: RequestFacts): void {
    let s = text;

    // «Любой кроме жёлтого и чёрного» — исключения, а не пожелания
    const except = s.match(/любо[йго]\s+кроме\s+([^,.;]+)/u);
    if (except) {
        for (const c of COLORS) if (c.match.test(except[1])) f.excludedColors.add(c.key);
        f.exterior.add(ANY_COLOR.key);
        s = s.replace(except[0], ' ');
    }
    if (u(/любой\s+цвет|цвет\s+любой|цвет\s+не\s+важен/).test(s)) f.exterior.add(ANY_COLOR.key);

    // «Серый на чёрной коже» — кузов и салон в одной короткой фразе
    const onLeather = s.match(u(/(\S+)\s+на\s+(\S+)\s+кож\w*/));
    if (onLeather) {
        addColors(onLeather[1], f.exterior);
        addColors(onLeather[2], f.interior);
        s = s.replace(onLeather[0], ' ');
    }

    // «Не белый» — это не пожелание белого
    const negated = [...s.matchAll(u(/\bне\s+(\S+)/g))];
    for (const n of negated) {
        for (const c of COLORS) if (c.match.test(n[1])) f.excludedColors.add(c.key);
        s = s.replace(n[0], ' ');
    }

    let open: 'exterior' | 'interior' | null = null;

    for (const part of s.split(/[,;.]/)) {
        const markers = [...part.matchAll(u(/салон\w*|кож\w*|интерьер\w*|кузов\w*/g))]
            .map(m => ({ at: m.index ?? 0, kind: /кузов/.test(m[0]) ? 'exterior' as const : 'interior' as const }));
        const colors = findColors(part);
        if (colors.length === 0) {
            if (markers.length > 0) open = markers[markers.length - 1].kind;
            continue;
        }

        const kinds = new Set(markers.map(m => m.kind));
        const fallback: 'exterior' | 'interior' =
            kinds.size === 1 ? [...kinds][0] : (open ?? 'exterior');

        const claimed = new Map<number, 'exterior' | 'interior'>();
        for (const mk of markers) {
            let bestIdx = -1;
            let bestDist = Infinity;
            colors.forEach((c, idx) => {
                const dist = Math.abs(c.at - mk.at);
                if (!claimed.has(idx) && dist < bestDist) { bestDist = dist; bestIdx = idx; }
            });
            if (bestIdx >= 0) claimed.set(bestIdx, mk.kind);
        }

        colors.forEach((c, idx) => {
            const kind = claimed.get(idx) ?? fallback;
            (kind === 'interior' ? f.interior : f.exterior).add(c.key);
        });

        // Список открыт, только если пометка стоит перед цветом: «цвет кузова белый»
        const lastMarker = markers[markers.length - 1];
        const lastColor = colors[colors.length - 1];
        open = markers.length === 0
            ? open
            : lastMarker.at < lastColor.at ? lastMarker.kind : null;
    }
}

function findColors(text: string): { key: string; at: number }[] {
    const found: { key: string; at: number }[] = [];
    let rest = text;
    for (const c of COLORS) {
        const re = new RegExp(c.match.source, `${c.match.flags.replace('g', '')}g`);
        for (const m of rest.matchAll(re)) {
            found.push({ key: c.key, at: m.index ?? 0 });
        }
        // Вырезаем найденное той же длиной, чтобы «тёмно-серый» не дал ещё
        // и «серый», а позиции остальных цветов не сдвинулись
        rest = rest.replace(re, match => ' '.repeat(match.length));
    }
    return found.sort((a, b) => a.at - b.at);
}

function addColors(text: string, target: Set<string>): void {
    for (const c of findColors(text)) target.add(c.key);
}

/* ------------------------------------------------------------------ */
/* Сведение по моделям                                                 */
/* ------------------------------------------------------------------ */

export interface DigestSource {
    text: string;
    /** Кто спрашивал — чтобы один человек, написавший дважды, считался одним. */
    who: string;
}

export interface DigestRow {
    model: CatalogModel;
    /** Сколько разных людей спросили. Только для своих. */
    requests: number;
    facts: RequestFacts;
    inStock: boolean;
}

export interface Digest {
    rows: DigestRow[];
    unresolved: Unresolved[];
    requestsTotal: number;
}

export function buildDigest(sources: DigestSource[], isInStock: (m: CatalogModel) => boolean): Digest {
    const byModel = new Map<string, { model: CatalogModel; who: Set<string>; facts: RequestFacts }>();
    const unresolved: Unresolved[] = [];
    let counted = 0;

    for (const src of sources) {
        const parsed = parseRequest(src.text);
        if (parsed.items.length === 0 && parsed.unresolved.length === 0) continue;
        counted++;

        for (const item of parsed.items) {
            const row = byModel.get(item.model.id) ?? { model: item.model, who: new Set<string>(), facts: emptyFacts() };
            row.who.add(src.who);
            mergeFacts(row.facts, item.facts);
            byModel.set(item.model.id, row);
        }
        unresolved.push(...parsed.unresolved);
    }

    const rows = [...byModel.values()]
        .map(r => ({ model: r.model, requests: r.who.size, facts: r.facts, inStock: isInStock(r.model) }))
        .sort((a, b) => b.requests - a.requests
            || a.model.brand.localeCompare(b.model.brand)
            || a.model.name.localeCompare(b.model.name));

    return { rows, unresolved, requestsTotal: counted };
}

function mergeFacts(into: RequestFacts, from: RequestFacts): void {
    const sets = [
        'trims', 'officialTrims', 'exterior', 'interior', 'excludedColors', 'powertrain', 'drive',
        'engineLiters', 'condition', 'years', 'features', 'withoutFeatures', 'evRangeKm', 'notes',
    ] as const;
    for (const key of sets) {
        const target = into[key] as Set<unknown>;
        for (const v of from[key] as Set<unknown>) target.add(v);
    }
    // «Все комплектации» поглощает конкретные: перечислять рядом бессмысленно
    if (into.trims.has('any')) for (const k of [...into.trims]) if (k !== 'any') into.trims.delete(k);
    // Один клиент хочет чёрный, другой пишет «любой кроме чёрного». Исключение
    // одного не должно вычеркнуть пожелание другого: поставщик пришлёт оба
    for (const c of [...into.excludedColors]) {
        if (into.exterior.has(c)) into.excludedColors.delete(c);
    }
    if (from.maxMileageKm !== null) into.maxMileageKm = Math.max(into.maxMileageKm ?? 0, from.maxMileageKm);
    into.budget.push(...from.budget);
    into.destination.push(...from.destination);
}

/* ------------------------------------------------------------------ */
/* Сообщения                                                           */
/* ------------------------------------------------------------------ */

const TRIM_TERMS = new Map(TRIMS.map(t => [t.key, t]));
const COLOR_TERMS = new Map([...COLORS, ANY_COLOR].map(t => [t.key, t]));
const FEATURE_TERMS = new Map(FEATURES.map(t => [t.key, t]));
const TRIM_ORDER = ['any', 'top', 'full', 'mid', 'base'];

const POWERTRAIN_RU: Record<Powertrain, string> = {
    BEV: 'электро', EREV: 'гибрид EREV', PHEV: 'подзаряжаемый гибрид', HEV: 'обычный гибрид',
    ICE: 'бензин/дизель', HYBRID: 'гибрид',
};
const POWERTRAIN_EN: Record<Powertrain, string> = {
    BEV: 'BEV (纯电)', EREV: 'EREV (增程)', PHEV: 'PHEV (插混)', HEV: 'HEV, non plug-in (油电混动)',
    ICE: 'ICE (燃油)', HYBRID: 'hybrid — please specify PHEV or HEV (混动)',
};

/** Telegram понимает ограниченный HTML: всё, что пришло от людей, экранируем. */
export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

function yearsLabel(years: Set<number>): string {
    const list = [...years].sort();
    if (list.length === 0) return '';
    const contiguous = list.every((y, i) => i === 0 || y === list[i - 1] + 1);
    return contiguous && list.length > 2 ? `${list[0]}–${list[list.length - 1]}` : list.join(', ');
}

const thousands = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

function colorList(keys: Set<string>, lang: 'ru' | 'en'): string {
    return [...keys]
        .map(k => COLOR_TERMS.get(k))
        .filter((t): t is Term => Boolean(t))
        .map(t => (lang === 'ru' ? t.ru : t.en))
        // В английских подписях бывают «/» и запятые — разделяем точкой с запятой
        .join(lang === 'ru' ? ', ' : '; ');
}

function trimList(f: RequestFacts, lang: 'ru' | 'en'): string {
    const generic = TRIM_ORDER
        .filter(k => f.trims.has(k))
        .map(k => (lang === 'ru' ? TRIM_TERMS.get(k)!.ru : TRIM_TERMS.get(k)!.en));
    // Заводские названия — первыми: по ним поставщик ищет в прайсе
    return [...f.officialTrims, ...generic].join(', ');
}

function conditionRu(f: RequestFacts): string {
    const upTo = f.maxMileageKm ? ` до ${thousands(f.maxMileageKm)} км` : '';
    if (f.condition.has('new') && f.condition.has('used')) return f.maxMileageKm ? `новая или с пробегом${upTo}` : 'новая или с малым пробегом';
    if (f.condition.has('used')) return `с пробегом${upTo}`;
    if (f.condition.has('new')) return 'новая';
    return '';
}

function conditionEn(f: RequestFacts): string {
    const mileage = f.maxMileageKm ? `, max ${f.maxMileageKm.toLocaleString('en-US')} km` : '';
    if (f.condition.has('new') && f.condition.has('used')) return `brand new or low mileage${mileage}`;
    if (f.condition.has('used')) return `used${mileage}`;
    if (f.condition.has('new')) return 'brand new, 0 km';
    return '';
}

function rowRu(row: DigestRow, n: number): string[] {
    const f = row.facts;
    const name = row.model.ruName ?? row.model.name;
    const lines = [`<b>${n}. ${escapeHtml(name)}</b> — ${row.requests} ${plural(row.requests, 'запрос', 'запроса', 'запросов')}`];

    if (f.powertrain.size) lines.push(`Двигатель: ${[...f.powertrain].map(p => POWERTRAIN_RU[p]).join(', ')}`);
    const trims = trimList(f, 'ru');
    if (trims) lines.push(`Комплектация: ${escapeHtml(trims)}`);

    const ext = colorList(f.exterior, 'ru');
    const int = colorList(f.interior, 'ru');
    const except = colorList(f.excludedColors, 'ru');
    const colorParts = [
        ext && `кузов ${ext}`,
        except && `кроме: ${except}`,
        int && `салон ${int}`,
    ].filter(Boolean);
    if (colorParts.length) lines.push(`Цвет: ${colorParts.join(' · ')}`);

    const years = yearsLabel(f.years);
    const condParts = [conditionRu(f), years && `${years} г.`].filter(Boolean);
    if (condParts.length) lines.push(`Состояние: ${condParts.join(' · ')}`);

    const wishes = [
        f.drive.has('AWD') ? 'полный привод' : '',
        f.drive.has('FWD') ? 'передний привод' : '',
        f.engineLiters.size ? `двигатель ${[...f.engineLiters].join(', ')} л` : '',
        f.evRangeKm.size ? `${[...f.evRangeKm].join('/')} км на электричестве` : '',
        ...[...f.features].map(k => FEATURE_TERMS.get(k)?.ru ?? ''),
        ...[...f.withoutFeatures].map(k => FEATURE_TERMS.get(k)?.ruWithout ?? `без: ${k}`),
    ].filter(Boolean);
    if (wishes.length) lines.push(`Пожелания: ${wishes.join(', ')}`);

    const own = [
        ...[...new Set(f.budget)].map(b => `бюджет ${b}`),
        ...new Set(f.destination),
        ...f.notes,
    ];
    if (own.length) lines.push(`<i>${escapeHtml(own.join(' · '))}</i>`);

    return lines;
}

function rowEn(row: DigestRow, n: number): string[] {
    const f = row.facts;
    const m = row.model;
    const extra = [m.zh, m.exportNote].filter(Boolean).join(' / ');
    const lines = [`<b>${n}. ${escapeHtml(m.name)}${extra ? ` (${escapeHtml(extra)})` : ''}</b>`];

    // Тип двигателя не угадываем: если клиент не сказал, а у модели их
    // несколько, прямо просим цены на все — иначе приедет что попало
    if (f.powertrain.size) {
        lines.push(`Powertrain: ${[...f.powertrain].map(p => POWERTRAIN_EN[p]).join(', ')}`);
    } else if ((m.powertrains?.length ?? 0) > 1) {
        lines.push(`Powertrain: not specified — please quote ${m.powertrains!.map(p => POWERTRAIN_EN[p]).join(' and ')}`);
    } else if (!m.powertrains) {
        lines.push('Powertrain: not specified — please quote available versions');
    }

    // Названия комплектаций из заявок бывают казахстанскими: Flagship у Monjaro,
    // Lux и Tech у CS75 Plus в Китае не существуют. Выдать их за заводские —
    // значит получить «такой нет» или цену не на ту версию. Поэтому помечаем
    // честно и просим подобрать китайскую
    const official = [...f.officialTrims];
    const generic = TRIM_ORDER.filter(k => f.trims.has(k)).map(k => TRIM_TERMS.get(k)!.en);
    if (official.length) {
        lines.push(`Trim as named by client: ${escapeHtml(official.join(', '))} — please offer the matching China-market version`);
    }
    if (generic.length) lines.push(`Trim: ${generic.join(', ')}`);
    if (!official.length && !generic.length) lines.push('Trim: not specified — please quote available versions');

    const ext = colorList(f.exterior, 'en');
    const int = colorList(f.interior, 'en');
    // «NOT» перед каждым: в «NOT black; yellow» жёлтый читается как пожелание
    const except = [...f.excludedColors].map(k => COLOR_TERMS.get(k)).filter((t): t is Term => Boolean(t))
        .map(t => `NOT ${t.en}`).join('; ');
    if (ext || except) lines.push(`Exterior: ${[ext, except].filter(Boolean).join('; ')}`);
    if (int) lines.push(`Interior: ${int}`);

    const years = yearsLabel(f.years);
    const condParts = [conditionEn(f), years && `model year ${years}`].filter(Boolean);
    if (condParts.length) lines.push(`Condition: ${condParts.join(' · ')}`);

    const specs = [
        f.drive.has('AWD') ? 'AWD / 4WD (四驱)' : '',
        f.drive.has('FWD') ? 'FWD (两驱)' : '',
        f.engineLiters.size ? `${[...f.engineLiters].join(', ')}L engine` : '',
        f.evRangeKm.size ? `${[...f.evRangeKm].join(' / ')} km electric range (CLTC)` : '',
        ...[...f.features].map(k => FEATURE_TERMS.get(k)?.en ?? ''),
        ...[...f.withoutFeatures].map(k => `without ${FEATURE_TERMS.get(k)?.en ?? k}`),
    ].filter(Boolean);
    if (specs.length) lines.push(`Requirements: ${specs.join('; ')}`);

    return lines;
}

/**
 * Telegram не отправит сообщение длиннее 4096 символов. Режем по позициям,
 * а не посреди строки, и помечаем продолжение.
 */
function paginate(header: string, blocks: string[], footer: string, label: (i: number, n: number) => string): string[] {
    const LIMIT = 3800;
    const pages: string[][] = [[]];
    let size = header.length + 60;

    for (const block of blocks) {
        if (pages[pages.length - 1].length > 0 && size + block.length + 2 > LIMIT) {
            pages.push([]);
            size = header.length + 60;
        }
        pages[pages.length - 1].push(block);
        size += block.length + 2;
    }
    if (footer && size + footer.length + 2 > LIMIT) pages.push([]);

    return pages.map((p, i) => {
        const head = pages.length > 1 ? `${header}\n${label(i + 1, pages.length)}` : header;
        const tail = i === pages.length - 1 && footer ? footer : '';
        return [head, ...p, tail].filter(Boolean).join('\n\n');
    });
}

export function renderRu(digest: Digest, dateLabel: string): string[] {
    const toOrder = digest.rows.filter(r => !r.inStock);
    const inStock = digest.rows.filter(r => r.inStock);
    const title = `📋 <b>Пополнение каталога — ${dateLabel}</b>`;

    if (digest.requestsTotal === 0) {
        return [`${title}\n\nНовых запросов на машины не было.`];
    }

    const header = `${title}\n${digest.requestsTotal} ${plural(digest.requestsTotal, 'заявка', 'заявки', 'заявок')}` +
        ` · ${toOrder.length} ${plural(toOrder.length, 'модель', 'модели', 'моделей')} к закупке`;

    const blocks = toOrder.map((r, i) => rowRu(r, i + 1).join('\n'));

    const footerParts: string[] = [];
    if (digest.unresolved.length) {
        const lines = ['<b>Уточнить у клиента</b>'];
        for (const u of digest.unresolved) {
            const what = [
                ...u.brands.map(b => `${b}: какая модель?`),
                ...u.ambiguous.map(a => `«${a.text}» — ${a.options.join(' или ')}?`),
            ];
            if (what.length === 0) what.push('марка и модель не названы');
            lines.push(`• ${escapeHtml(what.join(' '))}`);
            lines.push(`  <i>«${escapeHtml(u.excerpt)}»</i>`);
        }
        footerParts.push(lines.join('\n'));
    }
    if (inStock.length) {
        footerParts.push([
            '<b>Спрашивали — а у нас есть в наличии</b>',
            ...inStock.map(r => `• ${escapeHtml(r.model.ruName ?? r.model.name)} — ${r.requests} ${plural(r.requests, 'запрос', 'запроса', 'запросов')}`),
        ].join('\n'));
    }

    return paginate(header, blocks, footerParts.join('\n\n'), (i, n) => `<i>часть ${i} из ${n}</i>`);
}

export function renderEn(digest: Digest, dateLabel: string): string[] {
    const toOrder = digest.rows.filter(r => !r.inStock);
    if (toOrder.length === 0) return [];

    const header = [
        `<b>HUBDrive — vehicle sourcing request, ${dateLabel}</b>`,
        'Destination: Kazakhstan, delivery via Khorgos. Left-hand drive.',
        'For each line please quote: available trims and colours, price (CNY or USD), production date, ' +
        'stock or lead time. Please reply keeping the line numbers.',
    ].join('\n');

    const blocks = toOrder.map((r, i) => rowEn(r, i + 1).join('\n'));
    return paginate(header, blocks, '', (i, n) => `<i>part ${i} of ${n}</i>`);
}
