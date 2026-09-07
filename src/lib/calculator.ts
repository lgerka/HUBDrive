/**
 * Расчёт цены автомобиля под ключ: Китай → Казахстан.
 *
 * Менеджер вводит цену машины в Китае и город доставки — и сразу видит итог.
 * До этого расчёт жил в переписке и в голове, каждый считал по-своему,
 * и клиенту называли цифры, которые потом не сходились.
 *
 * Ставки сверены с законом 2026 года и с реальной сделкой владельца
 * (Zeekr 8X, 74 000 $). Сошлись до тенге: таможенный сбор, НДС, утильсбор
 * и первичная регистрация. Всё, что установлено законом, лежит здесь и задано
 * в МРП, а не в тенге: МРП меняется раз в год, и тогда правится одно число.
 */

/**
 * Ставки, установленные законом. Проверять в декабре, когда принимают
 * бюджет на следующий год.
 */
export const RATES = {
    /**
     * Месячный расчётный показатель, 2026 год.
     * Закон РК от 08.12.2025 № 239-VIII, ст. 7 п. 4.
     */
    mrp: 4325,
    /** НДС на импорт. Подняли с 12% с 1 января 2026 года. */
    vat: 0.16,
    /** Таможенный сбор за декларирование, в МРП. */
    customsFeeMrp: 6,
    /** Ввозная пошлина по единому тарифу ЕАЭС. */
    dutyEaeu: 0.15,
    /** Акциз на дорогие машины и порог, с которого он берётся, в МРП. */
    excise: 0.10,
    exciseThresholdMrp: 18_000,
    /** База утилизационного платежа, в МРП. */
    utilBaseMrp: 50,
    /** Свидетельство о регистрации транспортного средства, в МРП. */
    srtsMrp: 1.25,
    /** Государственные номера, в МРП. */
    platesMrp: 2.8,
} as const;

/**
 * Тип силовой установки — от него зависит почти всё.
 *
 * Разделение не косметическое. Чистый электромобиль не платит утильсбор
 * вообще, а последовательный гибрид платит по объёму своего генератора:
 * норма говорит «с электродвигателями, за исключением транспортных средств
 * с гибридной силовой установкой». Разница — три четверти миллиона тенге
 * на машине, и именно на этом сошёлся расчёт владельца.
 */
export type Powertrain = 'ice' | 'bev' | 'erev' | 'phev';

export const POWERTRAINS: { key: Powertrain; label: string; hint: string }[] = [
    { key: 'ice', label: 'Бензин / дизель', hint: 'Пошлина 15%, утиль по объёму' },
    { key: 'bev', label: 'Электро', hint: 'Утильсбор не платится' },
    { key: 'erev', label: 'Гибрид EREV', hint: 'Двигатель работает генератором' },
    { key: 'phev', label: 'Гибрид обычный', hint: 'Двигатель крутит колёса' },
];

/** Нужен ли объём двигателя: у чистого электромобиля его нет. */
export function needsEngine(powertrain: Powertrain): boolean {
    return powertrain !== 'bev';
}

/**
 * Может ли машина пройти по нулевой пошлине.
 *
 * Казахстан оставил за собой перечень изъятий по обязательствам ВТО: для
 * электромобилей и последовательных гибридов ввозная пошлина ноль вместо
 * пятнадцати процентов. Цена льготы — машину нельзя вывозить и перепродавать
 * в другие страны ЕАЭС. Поэтому это выбор менеджера, а не автоматика:
 * решение принимается до сделки, а не калькулятором.
 */
export function canUseWtoRate(powertrain: Powertrain): boolean {
    return powertrain === 'bev' || powertrain === 'erev';
}

/**
 * Утилизационный платёж: 50 МРП × коэффициент.
 *
 * Коэффициенты для машин из Китая. Для ввоза из России и Беларуси действует
 * другая таблица с запретительными значениями — мы оттуда не возим, и здесь
 * её нет намеренно, чтобы не подсказывать неверный расчёт.
 */
export function utilCoefficient(powertrain: Powertrain, engineCc: number): number {
    if (powertrain === 'bev') return 0;
    if (engineCc <= 1000) return 1.5;
    if (engineCc <= 2000) return 3.5;
    if (engineCc <= 3000) return 5;
    return 11.5;
}

/** Сбор за первичную регистрацию, в МРП. Зависит от возраста и типа. */
export function registrationMrp(powertrain: Powertrain, ageYears: number): number {
    if (ageYears <= 2) return 0.25;
    if (powertrain === 'bev') return ageYears < 3 ? 25 : 250;
    return ageYears < 3 ? 50 : 500;
}

/**
 * Города доставки.
 *
 * Разбито на три части так, как считает владелец: проход границы одинаков
 * для всех, транзит зависит от страны, доставка — от города.
 */
export interface Destination {
    key: string;
    city: string;
    country: 'KZ' | 'KG' | 'RU';
    /** Транзит до страны назначения, доллары. */
    transitUsd: number;
    /** Доставка до города, доллары. */
    deliveryUsd: number;
}

export const DESTINATIONS: Destination[] = [
    { key: 'almaty', city: 'Алматы', country: 'KZ', transitUsd: 200, deliveryUsd: 200 },
    { key: 'astana', city: 'Астана', country: 'KZ', transitUsd: 200, deliveryUsd: 400 },
    { key: 'shymkent', city: 'Шымкент', country: 'KZ', transitUsd: 200, deliveryUsd: 350 },
    { key: 'karaganda', city: 'Караганда', country: 'KZ', transitUsd: 200, deliveryUsd: 350 },
    { key: 'aktobe', city: 'Актобе', country: 'KZ', transitUsd: 200, deliveryUsd: 600 },
    { key: 'atyrau', city: 'Атырау', country: 'KZ', transitUsd: 200, deliveryUsd: 650 },
    { key: 'bishkek', city: 'Бишкек', country: 'KG', transitUsd: 400, deliveryUsd: 500 },
    { key: 'moscow', city: 'Москва', country: 'RU', transitUsd: 400, deliveryUsd: 1500 },
];

/** Проход границы в юанях — так его выставляет китайская сторона. */
export const BORDER_CROSSING_CNY = 3500;

/**
 * Расходы, не зависящие от цены машины.
 *
 * Государственных ставок здесь нет — это договорные цены подрядчиков.
 * Значения из реальной сделки владельца, но открыты для правки: брокер
 * и тарифы склада меняются, а зашить их намертво — значит однажды назвать
 * клиенту цену, которой нет.
 */
export interface FixedCosts {
    /** Склад временного хранения. */
    svh: number;
    /** СБКТС, ЭПТС и подача утильсбора одним пакетом. */
    certification: number;
    /** Сверка агрегатов. */
    inspection: number;
    /** Эвакуатор с СВХ. */
    towing: number;
    /** Услуги брокера, доллары. */
    brokerUsd: number;
}

export const DEFAULT_FIXED: FixedCosts = {
    svh: 25_000,
    certification: 250_000,
    inspection: 25_000,
    towing: 25_000,
    brokerUsd: 200,
};

/** Комиссия HUBDrive по умолчанию — середина вилки владельца. */
export const DEFAULT_COMMISSION_USD = 2000;

export type PriceCurrency = 'CNY' | 'USD';

export interface CalcInput {
    /** Цена машины в Китае, как её называет продавец. */
    price: number;
    currency: PriceCurrency;
    destinationKey: string;
    powertrain: Powertrain;
    engineCc: number;
    year: number;
    /** Продажа только внутри Казахстана — тогда доступна нулевая пошлина. */
    kzOnly: boolean;
    /** Тенге за доллар, курс НБ РК. */
    kztPerUsd: number;
    /** Тенге за юань, курс НБ РК. */
    kztPerCny: number;
    /** Наша комиссия, доллары. */
    commissionUsd: number;
    fixed: FixedCosts;
}

export interface CalcLine {
    label: string;
    kzt: number;
    hint?: string;
}

export interface CalcResult {
    lines: CalcLine[];
    /** Себестоимость без нашей комиссии. */
    costKzt: number;
    commissionKzt: number;
    totalKzt: number;
    /** Итог в долларах — так удобнее сверяться с китайским прайсом. */
    totalUsd: number;
    /** Таможенная стоимость: от неё считаются пошлина и НДС. */
    customsValueKzt: number;
    dutyRate: number;
    destination: Destination | undefined;
}

export function calculate(input: CalcInput): CalcResult {
    const dest = DESTINATIONS.find(d => d.key === input.destinationKey);
    const kztUsd = input.kztPerUsd > 0 ? input.kztPerUsd : 1;
    const kztCny = input.kztPerCny > 0 ? input.kztPerCny : 1;
    const fromUsd = (usd: number) => usd * kztUsd;

    const carKzt = input.currency === 'CNY' ? input.price * kztCny : fromUsd(input.price);
    const borderKzt = BORDER_CROSSING_CNY * kztCny;

    const transitUsd = dest?.transitUsd ?? 0;
    const deliveryUsd = dest?.deliveryUsd ?? 0;
    const logisticsKzt = borderKzt + fromUsd(transitUsd + deliveryUsd);

    // Таможенная стоимость — цена машины на границе, и только она.
    // Проход границы, транзит и всё, что дальше, в базу пошлины и НДС
    // не входят: в реальной декларации владельца НДС посчитан именно так,
    // и сошёлся до восьми тенге. Менеджер вводит цену на Хоргосе —
    // доставка до границы в ней уже есть
    const customsValue = carKzt;

    const customsFee = RATES.customsFeeMrp * RATES.mrp;

    // Нулевая ставка только тем, кому она положена, и только если машина
    // остаётся в Казахстане: вывоз в ЕАЭС по ней запрещён
    const wtoRate = input.kzOnly && canUseWtoRate(input.powertrain);
    const dutyRate = wtoRate ? 0 : RATES.dutyEaeu;
    const duty = customsValue * dutyRate;

    // Акциз — это налог на роскошь, а не плата за объём двигателя.
    // Считается по каждой машине отдельно, не по партии
    const excise = customsValue >= RATES.exciseThresholdMrp * RATES.mrp
        ? customsValue * RATES.excise
        : 0;

    const vat = (customsValue + duty + customsFee + excise) * RATES.vat;

    const coefficient = utilCoefficient(input.powertrain, input.engineCc);
    const util = RATES.utilBaseMrp * RATES.mrp * coefficient;

    const age = Math.max(0, new Date().getFullYear() - input.year);
    const regMrp = registrationMrp(input.powertrain, age);
    const registrationTotalMrp = regMrp + RATES.srtsMrp + RATES.platesMrp;
    const registration = registrationTotalMrp * RATES.mrp;

    const f = input.fixed;
    const paperwork = f.svh + f.certification + f.inspection + f.towing + fromUsd(f.brokerUsd);

    const commissionKzt = fromUsd(input.commissionUsd);

    const lines: CalcLine[] = [
        {
            label: 'Автомобиль в Китае',
            kzt: carKzt,
            hint: input.currency === 'CNY'
                ? `${fmt(input.price)} ¥ × ${kztCny.toFixed(2)} ₸`
                : `${fmt(input.price)} $ × ${kztUsd.toFixed(2)} ₸`,
        },
        {
            label: 'Логистика из Китая',
            kzt: logisticsKzt,
            hint: `граница ${fmt(BORDER_CROSSING_CNY)} ¥ · транзит ${transitUsd} $ · до города ${deliveryUsd} $`,
        },
        { label: 'Таможенный сбор', kzt: customsFee, hint: `${RATES.customsFeeMrp} МРП` },
        {
            label: 'Таможенная пошлина',
            kzt: duty,
            hint: wtoRate
                ? 'нулевая ставка ВТО — без права вывоза в ЕАЭС'
                : `${pct(RATES.dutyEaeu)} от таможенной стоимости`,
        },
        ...(excise > 0
            ? [{
                label: 'Акциз',
                kzt: excise,
                hint: `${pct(RATES.excise)} — машина дороже ${fmt(RATES.exciseThresholdMrp * RATES.mrp)} ₸`,
            }]
            : []),
        { label: 'НДС', kzt: vat, hint: `${pct(RATES.vat)} от стоимости с пошлиной и сбором` },
        {
            label: 'Утилизационный сбор',
            kzt: util,
            hint: coefficient === 0
                ? 'электромобили освобождены'
                : `${RATES.utilBaseMrp} МРП × ${coefficient}`,
        },
        {
            label: 'Регистрация и номера',
            kzt: registration,
            hint: `${String(registrationTotalMrp).replace('.', ',')} МРП · ${ageLabel(age)}`,
        },
        { label: 'Оформление и склад', kzt: paperwork, hint: 'СВХ, СБКТС, сверка, эвакуатор, брокер' },
    ];

    const costKzt = lines.reduce((sum, l) => sum + l.kzt, 0);
    const totalKzt = costKzt + commissionKzt;

    return {
        lines,
        costKzt,
        commissionKzt,
        totalKzt,
        totalUsd: totalKzt / kztUsd,
        customsValueKzt: customsValue,
        dutyRate,
        destination: dest,
    };
}

function fmt(n: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function pct(rate: number): string {
    return `${(rate * 100).toFixed(1).replace(/[.,]0$/, '')}%`;
}

function ageLabel(age: number): string {
    if (age <= 0) return 'новый';
    const last = age % 10;
    const teen = age % 100 >= 11 && age % 100 <= 14;
    const word = !teen && last === 1 ? 'год' : !teen && last >= 2 && last <= 4 ? 'года' : 'лет';
    return `${age} ${word}`;
}

/** Сумма в тенге, как её принято писать клиенту. */
export function formatKzt(n: number): string {
    return `${fmt(Math.max(0, n))} ₸`;
}

/**
 * Как показывать расчёт клиенту.
 *
 * Подробный вид — это доверие: видно, что цена не с потолка, и видно
 * отдельной строкой каждый сбор. Но в нём же видна наша комиссия, а называть
 * маржу уместно не всякому и не сразу. Поэтому у менеджера есть и короткий
 * вид: итог и обещание, что доплат не будет.
 */
export type MessageMode = 'full' | 'short';

/**
 * Готовый текст для мессенджера.
 *
 * Менеджер жмёт «скопировать» и вставляет в WhatsApp — без переписывания цифр
 * руками, где легко ошибиться на разряд. Порядок продающий: сначала итог,
 * потом из чего он складывается, и отдельной строкой — что доплат не будет.
 * Именно этот вопрос люди задают в переписке чаще всего.
 */
export function asMessage(
    result: CalcResult,
    carName: string,
    year: number,
    mode: MessageMode = 'full'
): string {
    const title = [carName.trim() || 'Автомобиль из Китая', year ? `${year} г.` : '']
        .filter(Boolean).join(', ');

    // Пустая строка здесь — это абзац в сообщении, а не пропуск. Убирать
    // из массива нужно только необязательные пункты, поэтому они null,
    // а разделители остаются обычными строками
    const lines: (string | null)[] = [
        `🚗 ${title}`,
        result.destination ? `📍 Доставка: ${result.destination.city}` : null,
        '',
        `💰 Цена под ключ: ${formatKzt(result.totalKzt)}`,
        '',
    ];

    if (mode === 'full') {
        lines.push('Что входит:');
        // Нулевые строки клиенту не показываем: «Утильсбор — 0 ₸» вызывает
        // вопрос вместо доверия
        for (const l of result.lines) {
            if (l.kzt > 0) lines.push(`• ${l.label} — ${formatKzt(l.kzt)}`);
        }
        if (result.commissionKzt > 0) {
            lines.push(`• Услуги HUBDrive — ${formatKzt(result.commissionKzt)}`);
        }
        lines.push('', 'Доплат при получении нет — растаможка, оформление');
        lines.push('и номера уже в сумме.');
    } else {
        lines.push('В сумму уже входит всё: автомобиль, доставка из Китая,');
        lines.push('растаможка, оформление и номера.');
        lines.push('Доплат при получении нет.');
    }

    lines.push('', 'Срок доставки: 4–8 недель.', '', 'HUBDrive · hubdrive.asia');

    return lines.filter(l => l !== null).join('\n');
}
