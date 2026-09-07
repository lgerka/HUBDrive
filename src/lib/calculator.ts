/**
 * Расчёт цены автомобиля под ключ: Китай → Казахстан.
 *
 * Менеджер вводит цену машины в Китае и город доставки — и сразу видит итог.
 * До этого расчёт жил в переписке и в голове, каждый считал по-своему,
 * и клиенту называли цифры, которые потом не сходились.
 *
 * Ставки сверены с законом 2026 года и с реальной сделкой владельца
 * (Zeekr 8X, 74 000 $). Сошлись до тенге: таможенный сбор, НДС, утильсбор
 * и первичная регистрация.
 *
 * Сами значения ставок живут не здесь, а в настройках (calculatorSettings):
 * менеджер правит их один раз, и это действует для всех. Здесь только
 * порядок расчёта — он законом задан жёстко и от настроек не зависит.
 */

import {
    CITIES,
    deliveryWeeksFor,
    type CalcSettings,
    type City,
    type UtilBracket,
} from './calculatorSettings';

export { CITIES, type City };

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
 * Коэффициент утилизационного платежа.
 *
 * Ступени берутся из настроек и отсортированы по возрастанию объёма,
 * поэтому годится первое совпадение. У чистого электромобиля утиля нет.
 */
export function utilCoefficient(
    powertrain: Powertrain,
    engineCc: number,
    brackets: UtilBracket[]
): number {
    if (powertrain === 'bev') return 0;
    for (const b of brackets) {
        if (b.maxCc === null || engineCc <= b.maxCc) return b.coefficient;
    }
    return brackets[brackets.length - 1]?.coefficient ?? 0;
}

/**
 * Сбор за первичную регистрацию, в МРП.
 *
 * Границы возраста: до двух лет включительно — минимальная ставка, три года —
 * средняя, старше — максимальная. В исходной спецификации средняя ступень
 * была записана условием, которое при целом возрасте никогда не выполняется,
 * и ставки 25 и 50 МРП оказывались недостижимы. Мы возим новые машины,
 * так что на сегодняшних расчётах это не сказывалось, но границу
 * стоит подтвердить у брокера, прежде чем считать по ней подержанную.
 */
export function registrationMrp(powertrain: Powertrain, ageYears: number): number {
    if (ageYears <= 2) return 0.25;
    if (ageYears === 3) return powertrain === 'bev' ? 25 : 50;
    return powertrain === 'bev' ? 250 : 500;
}

export type PriceCurrency = 'CNY' | 'USD';

export interface CalcInput {
    /** Цена машины в Китае, как её называет продавец. */
    price: number;
    currency: PriceCurrency;
    cityKey: string;
    powertrain: Powertrain;
    engineCc: number;
    year: number;
    /** Продажа только внутри Казахстана — тогда доступна нулевая пошлина. */
    kzOnly: boolean;
    /** Тенге за доллар, курс НБ РК. */
    kztPerUsd: number;
    /** Тенге за юань, курс НБ РК. */
    kztPerCny: number;
    settings: CalcSettings;
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
    city: City | undefined;
    weeks: { min: number; max: number };
}

export function calculate(input: CalcInput): CalcResult {
    const s = input.settings;
    const r = s.rates;
    const city = CITIES.find(c => c.key === input.cityKey);
    const kztUsd = input.kztPerUsd > 0 ? input.kztPerUsd : 1;
    const kztCny = input.kztPerCny > 0 ? input.kztPerCny : 1;
    const fromUsd = (usd: number) => usd * kztUsd;

    const carKzt = input.currency === 'CNY' ? input.price * kztCny : fromUsd(input.price);
    const borderKzt = s.borderCrossingCny * kztCny;

    const transitUsd = city ? s.transitUsd[city.country] : 0;
    const deliveryUsd = city ? (s.byCity[city.key]?.deliveryUsd ?? 0) : 0;
    const logisticsKzt = borderKzt + fromUsd(transitUsd + deliveryUsd);

    // Таможенная стоимость — цена машины на границе, и только она.
    // Проход границы, транзит и всё, что дальше, в базу пошлины и НДС
    // не входят: в реальной декларации владельца НДС посчитан именно так,
    // и сошёлся до восьми тенге. Менеджер вводит цену на Хоргосе —
    // доставка до границы в ней уже есть
    const customsValue = carKzt;

    const customsFee = r.customsFeeMrp * r.mrp;

    // Нулевая ставка только тем, кому она положена, и только если машина
    // остаётся в Казахстане: вывоз в ЕАЭС по ней запрещён
    const wtoRate = input.kzOnly && canUseWtoRate(input.powertrain);
    const dutyRate = wtoRate ? 0 : r.dutyEaeu;
    const duty = customsValue * dutyRate;

    // Акциз на роскошь — не плата за объём двигателя. Считается по каждой
    // машине отдельно, не по партии
    const luxuryExcise = customsValue >= r.exciseLuxuryThresholdMrp * r.mrp
        ? customsValue * r.exciseLuxury
        : 0;

    // Второй акциз, по объёму двигателя, по умолчанию выключен: ставку
    // никто не подтвердил, а включённой она молча подняла бы каждую цену
    const volumeExcise = input.powertrain !== 'bev'
        && r.exciseVolumeKztPerCc > 0
        && input.engineCc > r.exciseVolumeThresholdCc
        ? input.engineCc * r.exciseVolumeKztPerCc
        : 0;

    const excise = luxuryExcise + volumeExcise;
    const vat = (customsValue + duty + customsFee + excise) * r.vat;

    const coefficient = utilCoefficient(input.powertrain, input.engineCc, r.utilBrackets);
    const util = r.utilBaseMrp * r.mrp * coefficient;

    const age = Math.max(0, new Date().getFullYear() - input.year);
    const regMrp = registrationMrp(input.powertrain, age);
    const registrationTotalMrp = regMrp + r.srtsMrp + r.platesMrp;
    const registration = registrationTotalMrp * r.mrp;

    const f = s.fixed;
    const paperwork = f.svh + f.certification + f.eraGlonass + f.inspection
        + f.towing + fromUsd(f.brokerUsd);

    // Перевод денег в Китай стоит процент от суммы. На пошлину и НДС
    // не влияет: они считаются от таможенной стоимости по курсу Нацбанка
    const paymentFee = carKzt * s.chinaPaymentFeePct;

    const commissionKzt = fromUsd(s.commissionUsd);

    const lines: CalcLine[] = [
        {
            label: 'Автомобиль в Китае',
            kzt: carKzt,
            hint: input.currency === 'CNY'
                ? `${fmt(input.price)} ¥ × ${kztCny.toFixed(2)} ₸`
                : `${fmt(input.price)} $ × ${kztUsd.toFixed(2)} ₸`,
        },
        ...(paymentFee > 0
            ? [{
                label: 'Перевод денег в Китай',
                kzt: paymentFee,
                hint: `${pct(s.chinaPaymentFeePct)} от цены машины`,
            }]
            : []),
        {
            label: 'Логистика из Китая',
            kzt: logisticsKzt,
            hint: `граница ${fmt(s.borderCrossingCny)} ¥ · транзит ${transitUsd} $ · до города ${deliveryUsd} $`,
        },
        { label: 'Таможенный сбор', kzt: customsFee, hint: `${r.customsFeeMrp} МРП` },
        {
            label: 'Таможенная пошлина',
            kzt: duty,
            hint: wtoRate
                ? 'нулевая ставка ВТО — без права вывоза в ЕАЭС'
                : `${pct(r.dutyEaeu)} от таможенной стоимости`,
        },
        ...(excise > 0
            ? [{
                label: 'Акциз',
                kzt: excise,
                hint: luxuryExcise > 0
                    ? `${pct(r.exciseLuxury)} — машина дороже ${fmt(r.exciseLuxuryThresholdMrp * r.mrp)} ₸`
                    : `${fmt(input.engineCc)} см³ × ${fmt(r.exciseVolumeKztPerCc)} ₸`,
            }]
            : []),
        { label: 'НДС', kzt: vat, hint: `${pct(r.vat)} от стоимости с пошлиной и сбором` },
        {
            label: 'Утилизационный сбор',
            kzt: util,
            hint: coefficient === 0
                ? 'электромобили освобождены'
                : `${r.utilBaseMrp} МРП × ${coefficient}`,
        },
        {
            label: 'Регистрация и номера',
            kzt: registration,
            hint: `${String(round(registrationTotalMrp, 2)).replace('.', ',')} МРП · ${ageLabel(age)}`,
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
        city,
        weeks: deliveryWeeksFor(s, input.cityKey),
    };
}

function round(n: number, digits: number): number {
    const k = 10 ** digits;
    return Math.round(n * k) / k;
}

function fmt(n: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function pct(rate: number): string {
    return `${round(rate * 100, 2)}%`.replace('.', ',');
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
        result.city ? `📍 Доставка: ${result.city.city}` : null,
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

    lines.push('', `Срок доставки: ${weeksLabel(result.weeks)}.`, '', 'HUBDrive · hubdrive.asia');

    return lines.filter(l => l !== null).join('\n');
}

/** «3–6 недель», с правильным окончанием, если срок ровный. */
export function weeksLabel(weeks: { min: number; max: number }): string {
    const n = weeks.max;
    const last = n % 10;
    const teen = n % 100 >= 11 && n % 100 <= 14;
    const word = !teen && last === 1 ? 'неделя' : !teen && last >= 2 && last <= 4 ? 'недели' : 'недель';
    return weeks.min === weeks.max ? `${n} ${word}` : `${weeks.min}–${weeks.max} ${word}`;
}
