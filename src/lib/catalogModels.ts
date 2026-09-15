/**
 * Справочник моделей для вечернего списка на закупку.
 *
 * Менеджеры пишут названия как придётся: «HONQI e-qm5», «DONGFEHNG VOYAH»,
 * «qin-I», «Taishin». Китайский поставщик по такому написанию машину в прайсе
 * не найдёт, поэтому каждая модель здесь приведена к экспортному имени,
 * а рядом стоят иероглифы — по ним он находит её наверняка.
 *
 * Иероглифы проставлены только там, где они подтверждены. Выдуманное название
 * в закупочном запросе хуже пустого: пустое поставщик переспросит, а по
 * неверному пришлёт цену на другую машину.
 *
 * Модели сведены до базовых — «Qin L», а не «Qin L DM-i» и «Qin L EV» отдельно.
 * Клиент тип двигателя называет редко, и угадывать его нельзя: если он
 * не указан, в английском списке поставщика прямо просят цены на оба варианта.
 */

/**
 * HYBRID — «гибрид» без уточнения у модели, где гибриды бывают разные.
 * Отдельным значением, чтобы не выдать обычный гибрид Toyota за подзаряжаемый.
 */
export type Powertrain = 'BEV' | 'EREV' | 'PHEV' | 'HEV' | 'ICE' | 'HYBRID';

export interface CatalogModel {
    id: string;
    brand: string;
    /** Имя для поставщика — как в китайском прайсе. */
    name: string;
    /** Имя для своих, если команда знает машину под другим: Monjaro, а не Xingyue L. */
    ruName?: string;
    /** Иероглифы. Только подтверждённые. */
    zh?: string;
    /** Экспортное имя, если оно отличается от китайского. */
    exportNote?: string;
    /** Какими бывает. Один вариант — не догадка, его можно подставить. */
    powertrains?: Powertrain[];
    aliases: string[];
    /** Собрано на лету из марки и следующих за ней слов, в справочнике нет. */
    adhoc?: boolean;
}

export interface CatalogBrand {
    name: string;
    aliases: string[];
}

function model(
    brand: string,
    name: string,
    opts: Omit<CatalogModel, 'id' | 'brand' | 'name'>
): CatalogModel {
    return { id: name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-'), brand, name, ...opts };
}

export const CATALOG_BRANDS: CatalogBrand[] = [
    { name: 'BYD', aliases: ['byd', 'бид', 'бүд', 'буд', 'б.у.д.'] },
    { name: 'Fangchengbao', aliases: ['fangchengbao', 'fang cheng bao', 'fcb', 'фанчэнбао', 'фанченбао', 'leopard', 'леопард'] },
    { name: 'Denza', aliases: ['denza', 'денза'] },
    { name: 'Geely', aliases: ['geely', 'джили', 'джилли', 'гили'] },
    { name: 'Geely Galaxy', aliases: ['galaxy', 'галакси', 'гэлакси'] },
    { name: 'Li Auto', aliases: ['li', 'lixiang', 'liauto', 'lixiang', 'лисян', 'лисянг'] },
    { name: 'Zeekr', aliases: ['zeekr', 'зикр', 'зикер', 'зеекр'] },
    { name: 'Hongqi', aliases: ['hongqi', 'honqi', 'hong qi', 'хунци', 'хончи', 'хонгчи'] },
    { name: 'Voyah', aliases: ['voyah', 'воях', 'вояж'] },
    { name: 'Dongfeng', aliases: ['dongfeng', 'dongfehng', 'донгфенг', 'дунфэн'] },
    { name: 'Aito', aliases: ['aito', 'аито', 'айто', 'seres', 'wenjie'] },
    { name: 'Avatr', aliases: ['avatr', 'аватр'] },
    { name: 'Deepal', aliases: ['deepal', 'дипал', 'дипэл'] },
    { name: 'Changan', aliases: ['changan', 'чанган', 'чангань', 'qiyuan', 'цийюань'] },
    { name: 'Chery', aliases: ['chery', 'cherry', 'чери', 'черри'] },
    { name: 'Jetour', aliases: ['jetour', 'джетур', 'жетур'] },
    { name: 'Exeed', aliases: ['exeed', 'эксид', 'иксид'] },
    { name: 'Omoda', aliases: ['omoda', 'омода'] },
    { name: 'Jaecoo', aliases: ['jaecoo', 'джейку', 'джеку'] },
    { name: 'Haval', aliases: ['haval', 'хавал', 'хавейл'] },
    { name: 'Tank', aliases: ['tank'] },
    { name: 'Lynk & Co', aliases: ['lynk', 'lynkco', 'линк'] },
    { name: 'Xpeng', aliases: ['xpeng', 'xiaopeng', 'сяопэн', 'икспенг'] },
    { name: 'Nio', aliases: ['nio', 'нио'] },
    { name: 'GAC Aion', aliases: ['aion', 'айон', 'аион'] },
    { name: 'Leapmotor', aliases: ['leapmotor', 'липмотор'] },
    { name: 'Wuling', aliases: ['wuling', 'вулинг'] },
    { name: 'Baojun', aliases: ['baojun', 'баоцзюнь', 'баоджун'] },
    { name: 'Rox', aliases: ['rox', 'polestones', 'рокс'] },
    // Не китайские, но их тоже спрашивают — и возят через Китай
    { name: 'Toyota', aliases: ['toyota', 'тойота'] },
    { name: 'Lexus', aliases: ['lexus', 'лексус'] },
    { name: 'Mercedes-Benz', aliases: ['mercedes', 'benz', 'мерседес', 'мерс'] },
    { name: 'BMW', aliases: ['bmw', 'бмв'] },
    { name: 'Audi', aliases: ['audi', 'ауди'] },
    { name: 'Volkswagen', aliases: ['volkswagen', 'vw', 'фольксваген'] },
    { name: 'Hyundai', aliases: ['hyundai', 'хендай', 'хёндай', 'хундай'] },
    { name: 'Kia', aliases: ['kia', 'киа'] },
    { name: 'Mazda', aliases: ['mazda', 'мазда'] },
    { name: 'Nissan', aliases: ['nissan', 'ниссан'] },
    { name: 'Honda', aliases: ['honda', 'хонда'] },
    { name: 'Land Rover', aliases: ['landrover', 'rangerover', 'рэнджровер', 'ренджровер'] },
    { name: 'Porsche', aliases: ['porsche', 'порше'] },
    { name: 'Tesla', aliases: ['tesla', 'тесла'] },
];

export const CATALOG_MODELS: CatalogModel[] = [
    /* --------------------------------- BYD --------------------------------- */
    model('BYD', 'BYD Qin L', { zh: '秦L', powertrains: ['PHEV', 'BEV'],
        aliases: ['qin l', 'цинь л', 'цин л', 'кин л', 'чин л'] }),
    model('BYD', 'BYD Qin Plus', { zh: '秦PLUS', powertrains: ['PHEV', 'BEV'],
        aliases: ['qin plus', 'qin+', 'цинь плюс', 'цин плюс'] }),
    // Экспортный «Sealion 6» — это Song Plus, а китайский 海狮06 — другой
    // кроссовер. Написание висит на обеих: без уточнения не заказываем
    model('BYD', 'BYD Song Plus', { zh: '宋PLUS', powertrains: ['PHEV', 'BEV'], exportNote: 'export: Sealion 6 / Seal U',
        aliases: ['song plus', 'song+', 'сонг плюс', 'сон плюс', 'sealion 6', 'seal u'] }),
    // Экспортный «Sealion 5» — это Song Pro, а китайский 海狮05 — другая машина
    model('BYD', 'BYD Song Pro', { zh: '宋Pro', powertrains: ['PHEV'], exportNote: 'export: Sealion 5',
        aliases: ['song pro', 'сонг про', 'sealion 5'] }),
    model('BYD', 'BYD Song L', { zh: '宋L', powertrains: ['BEV', 'PHEV'],
        aliases: ['song l', 'сонг л'] }),
    model('BYD', 'BYD Seal', { zh: '海豹', powertrains: ['BEV'],
        aliases: ['byd seal'] }),
    model('BYD', 'BYD Seal 05', { zh: '海豹05', powertrains: ['PHEV'], exportNote: 'export: Seal 5',
        aliases: ['seal 05', 'seal 5', 'сил 05'] }),
    model('BYD', 'BYD Seal 06', { zh: '海豹06', powertrains: ['PHEV', 'BEV'], exportNote: 'export: Seal 6',
        aliases: ['seal 06', 'seal 6', 'сил 06'] }),
    model('BYD', 'BYD Seal 07', { zh: '海豹07', powertrains: ['PHEV', 'BEV'],
        aliases: ['seal 07', 'seal 7', 'сил 07'] }),
    model('BYD', 'BYD Seal 08', { zh: '海豹08', powertrains: ['BEV', 'PHEV'],
        aliases: ['seal 08'] }),
    model('BYD', 'BYD Sealion 05', { zh: '海狮05', powertrains: ['PHEV', 'BEV'],
        aliases: ['sealion 05', 'sealion 5', 'силайон 05', 'си лайон 05'] }),
    // У 海狮06 комплектации называются 领航 — в заявках это «Pilot Edition»
    model('BYD', 'BYD Sealion 06', { zh: '海狮06', powertrains: ['PHEV', 'BEV'],
        aliases: ['sealion 06', 'sealion 6', 'силайон 06', 'си лайон 06'] }),
    // Единственный случай, когда экспортная цифра совпадает: Sealion 7 = 海狮07
    model('BYD', 'BYD Sealion 07', { zh: '海狮07', powertrains: ['BEV', 'PHEV'],
        aliases: ['sealion 07', 'sealion 7', 'силайон 07', 'си лайон 07'] }),
    // «Sealion 8» — экспортное имя Tang L, а Sealion 08 — отдельная китайская
    // модель. Самая опасная пара во всём списке: написание висит на обеих
    model('BYD', 'BYD Sealion 08', { zh: '海狮08', powertrains: ['BEV', 'PHEV'],
        aliases: ['sealion 08', 'sealion 8', 'силайон 08', 'си лайон 08'] }),
    // Кириллическое «хан» отдельным словом не берём: в Казахстане это
    // «Хан Шатыр» и «Хан Тенгри», а не BYD
    model('BYD', 'BYD Han', { zh: '汉', powertrains: ['BEV', 'PHEV'],
        aliases: ['byd han', 'han', 'бид хан'] }),
    model('BYD', 'BYD Tang', { zh: '唐', powertrains: ['BEV', 'PHEV'],
        aliases: ['byd tang', 'tang', 'бид тан'] }),
    model('BYD', 'BYD Tang L', { zh: '唐L', powertrains: ['PHEV', 'BEV'], exportNote: 'export: Sealion 8 / Atto 8',
        aliases: ['tang l', 'тан л', 'sealion 8', 'atto 8'] }),
    model('BYD', 'BYD Yuan Plus', { zh: '元PLUS', powertrains: ['BEV'], exportNote: 'export: Atto 3',
        aliases: ['yuan plus', 'yuan+', 'atto 3', 'юань плюс'] }),
    model('BYD', 'BYD Dolphin', { zh: '海豚', powertrains: ['BEV'],
        aliases: ['dolphin', 'дельфин', 'долфин'] }),
    model('BYD', 'BYD Destroyer 05', { zh: '驱逐舰05', powertrains: ['PHEV'],
        aliases: ['destroyer 05', 'дестроер 05'] }),

    /* ------------------------ Fangchengbao и Denza ------------------------- */
    model('Fangchengbao', 'Fangchengbao Bao 5', { zh: '方程豹豹5', powertrains: ['PHEV'], exportNote: 'export: Denza B5',
        aliases: ['bao 5', 'leopard 5', 'byd leopard 5', 'леопард 5', 'denza b5'] }),
    model('Fangchengbao', 'Fangchengbao Bao 8', { powertrains: ['PHEV'], exportNote: 'export: Denza B8',
        aliases: ['bao 8', 'leopard 8', 'byd leopard 8', 'леопард 8', 'denza b8'] }),
    model('Fangchengbao', 'Fangchengbao Tai 3', { powertrains: ['BEV'],
        aliases: ['tai 3', 'titanium 3', 'leopard titanium 3'] }),
    // «Flash Charge» (闪充版) бывает только у электрической версии
    model('Fangchengbao', 'Fangchengbao Tai 7', { zh: '方程豹钛7', powertrains: ['PHEV', 'BEV'], exportNote: 'export: BYD Ti7',
        aliases: ['tai 7', 'titanium 7', 'leopard titanium 7', 'byd ti7', 'ti7'] }),
    model('Denza', 'Denza D9', { zh: '腾势D9', powertrains: ['BEV', 'PHEV'],
        aliases: ['denza d9', 'денза d9'] }),

    /* -------------------------------- Geely -------------------------------- */
    // В китайском прайсе Monjaro нет — там это Xingyue L
    model('Geely', 'Geely Xingyue L', { ruName: 'Geely Monjaro', zh: '星越L', exportNote: 'export: Monjaro',
        powertrains: ['ICE', 'PHEV'], aliases: ['monjaro', 'монжаро', 'монжара', 'xingyue l'] }),
    model('Geely', 'Geely Xingyue S', { zh: '星越S', powertrains: ['ICE'],
        aliases: ['xingyue s'] }),
    model('Geely', 'Geely Binyue', { ruName: 'Geely Coolray', zh: '缤越', exportNote: 'export: Coolray',
        powertrains: ['ICE'], aliases: ['coolray', 'кулрей', 'кулрэй', 'binyue'] }),
    model('Geely', 'Geely Boyue', { ruName: 'Geely Atlas', zh: '博越', exportNote: 'export: Atlas',
        powertrains: ['ICE'], aliases: ['atlas', 'атлас', 'boyue', 'atlas pro'] }),
    model('Geely', 'Geely Xingyue', { ruName: 'Geely Tugella', zh: '星越', exportNote: 'export: Tugella',
        powertrains: ['ICE'], aliases: ['tugella', 'тугелла', 'тугела', 'xingyue'] }),

    /* ----------------------------- Geely Galaxy ---------------------------- */
    model('Geely Galaxy', 'Geely Galaxy E5', { zh: '银河E5', powertrains: ['BEV'], exportNote: 'export: EX5',
        aliases: ['galaxy e5', 'geely e5', 'geely ex5', 'ex5'] }),
    model('Geely Galaxy', 'Geely Galaxy Starship 7', { zh: '银河星舰7', powertrains: ['PHEV', 'BEV'], exportNote: 'export: EX5 EM-i / Starray EM-i',
        aliases: ['starship 7', 'galaxy starship 7', 'старшип 7'] }),
    // L6 и L7 есть и у Li Auto — написание висит на обеих марках,
    // решает марка, названная рядом
    model('Geely Galaxy', 'Geely Galaxy L6', { zh: '银河L6', powertrains: ['PHEV'],
        aliases: ['galaxy l6', 'l6'] }),
    model('Geely Galaxy', 'Geely Galaxy L7', { zh: '银河L7', powertrains: ['PHEV'],
        aliases: ['galaxy l7', 'l7'] }),

    /* ------------------------------- Li Auto ------------------------------- */
    // «Li6» пишут и про L6 (гибрид), и про i6 (электро) — написание висит на обеих
    model('Li Auto', 'Li Auto L6', { zh: '理想L6', powertrains: ['EREV'],
        aliases: ['li6', 'li l6', 'lixiang l6', 'li auto l6', 'l6', 'лисян l6'] }),
    model('Li Auto', 'Li Auto L7', { zh: '理想L7', powertrains: ['EREV'],
        aliases: ['li7', 'li l7', 'lixiang l7', 'li auto l7', 'l7', 'лисян l7'] }),
    model('Li Auto', 'Li Auto L8', { zh: '理想L8', powertrains: ['EREV'],
        aliases: ['li8', 'li l8', 'lixiang l8', 'l8'] }),
    model('Li Auto', 'Li Auto L9', { zh: '理想L9', powertrains: ['EREV'],
        aliases: ['li9', 'li l9', 'lixiang l9', 'l9', 'лисян l9'] }),
    model('Li Auto', 'Li Auto MEGA', { zh: '理想MEGA', powertrains: ['BEV'],
        aliases: ['li mega', 'lixiang mega'] }),
    model('Li Auto', 'Li Auto i8', { zh: '理想i8', powertrains: ['BEV'],
        aliases: ['li i8', 'lixiang i8'] }),
    model('Li Auto', 'Li Auto i6', { zh: '理想i6', powertrains: ['BEV'],
        aliases: ['li i6', 'lixiang i6', 'li6'] }),

    /* -------------------------------- Zeekr -------------------------------- */
    model('Zeekr', 'Zeekr 001', { zh: '极氪001', powertrains: ['BEV'], aliases: ['zeekr 001', 'зикр 001'] }),
    model('Zeekr', 'Zeekr 007', { zh: '极氪007', powertrains: ['BEV'], aliases: ['zeekr 007', 'зикр 007'] }),
    model('Zeekr', 'Zeekr 7X', { zh: '极氪7X', powertrains: ['BEV'], aliases: ['zeekr 7x', 'зикр 7x'] }),
    model('Zeekr', 'Zeekr 7GT', { zh: '极氪7GT', powertrains: ['BEV'], aliases: ['zeekr 7gt'] }),
    model('Zeekr', 'Zeekr 009', { zh: '极氪009', powertrains: ['BEV'], aliases: ['zeekr 009', 'зикр 009'] }),
    model('Zeekr', 'Zeekr X', { zh: '极氪X', powertrains: ['BEV'], aliases: ['zeekr x'] }),
    model('Zeekr', 'Zeekr 8X', { zh: '极氪8X', powertrains: ['PHEV'], aliases: ['zeekr 8x', 'зикр 8x'] }),
    model('Zeekr', 'Zeekr 9X', { zh: '极氪9X', powertrains: ['PHEV'], aliases: ['zeekr 9x', 'зикр 9x'] }),

    /* -------------------------------- Hongqi ------------------------------- */
    model('Hongqi', 'Hongqi E-QM5', { zh: '红旗E-QM5', powertrains: ['BEV'],
        aliases: ['e-qm5', 'eqm5', 'e qm5', 'qm5'] }),
    model('Hongqi', 'Hongqi HS5', { zh: '红旗HS5', powertrains: ['ICE'], aliases: ['hongqi hs5', 'hs5'] }),
    model('Hongqi', 'Hongqi H5', { zh: '红旗H5', powertrains: ['ICE'], aliases: ['hongqi h5', 'h5'] }),
    // H9 есть и у Haval — решает марка
    model('Hongqi', 'Hongqi H9', { zh: '红旗H9', powertrains: ['ICE'], aliases: ['hongqi h9', 'h9'] }),
    model('Hongqi', 'Hongqi E-HS9', { zh: '红旗E-HS9', powertrains: ['BEV'], aliases: ['e-hs9', 'ehs9', 'e hs9'] }),

    /* -------------------------------- Voyah -------------------------------- */
    // Voyah — самостоятельный бренд. «Dongfeng Voyah» заставит поставщика
    // искать в прайсе Dongfeng, где этих моделей нет
    model('Voyah', 'Voyah Free', { zh: '岚图FREE', powertrains: ['BEV', 'EREV'], aliases: ['voyah free', 'воях фри'] }),
    model('Voyah', 'Voyah Dreamer', { zh: '岚图梦想家', powertrains: ['BEV', 'PHEV'], aliases: ['voyah dreamer', 'voyah dream', 'dreamer'] }),
    model('Voyah', 'Voyah Passion', { zh: '岚图追光', powertrains: ['BEV', 'PHEV'], aliases: ['voyah passion', 'passion'] }),
    model('Voyah', 'Voyah Courage', { zh: '岚图知音', powertrains: ['BEV'], aliases: ['voyah courage', 'courage'] }),
    // Taishan — шестиместный и только PHEV. Taishan X8 — отдельная пятиместная
    // модель, и PHEV, и EV. Длинное написание найдётся раньше короткого
    model('Voyah', 'Voyah Taishan', { zh: '岚图泰山', powertrains: ['PHEV'],
        aliases: ['taishan', 'taishin', 'тайшань', 'тайшан', 'voyah taishan'] }),
    model('Voyah', 'Voyah Taishan X8', { zh: '岚图泰山X8', powertrains: ['PHEV', 'BEV'],
        aliases: ['taishan x8', 'taishin x8', 'тайшань x8', 'voyah x8'] }),

    /* --------------------------------- Aito -------------------------------- */
    model('Aito', 'Aito M5', { zh: '问界M5', powertrains: ['EREV', 'BEV'], aliases: ['aito m5', 'wenjie m5', 'аито m5'] }),
    model('Aito', 'Aito M7', { zh: '问界M7', powertrains: ['EREV', 'BEV'], aliases: ['aito m7', 'wenjie m7', 'аито m7'] }),
    model('Aito', 'Aito M8', { zh: '问界M8', powertrains: ['EREV', 'BEV'], aliases: ['aito m8', 'wenjie m8'] }),
    model('Aito', 'Aito M9', { zh: '问界M9', powertrains: ['EREV', 'BEV'], aliases: ['aito m9', 'wenjie m9', 'аито m9'] }),

    /* -------------------------------- Avatr -------------------------------- */
    model('Avatr', 'Avatr 06', { zh: '阿维塔06', powertrains: ['BEV', 'EREV'], aliases: ['avatr 06'] }),
    model('Avatr', 'Avatr 07', { zh: '阿维塔07', powertrains: ['BEV', 'EREV'], aliases: ['avatr 07'] }),
    model('Avatr', 'Avatr 11', { zh: '阿维塔11', powertrains: ['BEV', 'EREV'], aliases: ['avatr 11'] }),
    model('Avatr', 'Avatr 12', { zh: '阿维塔12', powertrains: ['BEV', 'EREV'], aliases: ['avatr 12'] }),

    /* -------------------------------- Deepal ------------------------------- */
    model('Deepal', 'Deepal S05', { zh: '深蓝S05', powertrains: ['EREV', 'BEV'], aliases: ['deepal s05', 's05'] }),
    // S7 — дорестайл S07, переименованный ради Европы
    model('Deepal', 'Deepal S07', { zh: '深蓝S07', powertrains: ['EREV', 'BEV'], aliases: ['deepal s07', 'deepal s7', 's07'] }),
    model('Deepal', 'Deepal S09', { zh: '深蓝S09', powertrains: ['EREV'], aliases: ['deepal s09', 's09'] }),
    model('Deepal', 'Deepal SL03', { zh: '深蓝SL03', powertrains: ['EREV', 'BEV'], exportNote: 'restyled as L07',
        aliases: ['deepal sl03', 'sl03', 'deepal l07'] }),
    model('Deepal', 'Deepal G318', { zh: '深蓝G318', powertrains: ['EREV'], aliases: ['g318', 'deepal g318'] }),

    /* ------------------------------- Changan ------------------------------- */
    model('Changan', 'Changan CS75 Plus', { zh: '长安CS75PLUS', powertrains: ['ICE'],
        aliases: ['cs75 plus', 'cs75', 'cs 75', '75 plus'] }),
    model('Changan', 'Changan CS55 Plus', { zh: '长安CS55PLUS', powertrains: ['ICE'],
        aliases: ['cs55 plus', 'cs55', '55 plus'] }),
    model('Changan', 'Changan Uni-K', { zh: '长安UNI-K', powertrains: ['ICE', 'PHEV'], aliases: ['uni-k', 'unik', 'uni k'] }),
    model('Changan', 'Changan Uni-T', { zh: '长安UNI-T', powertrains: ['ICE'], aliases: ['uni-t', 'unit', 'uni t'] }),
    model('Changan', 'Changan Uni-V', { zh: '长安UNI-V', powertrains: ['ICE', 'PHEV'], aliases: ['uni-v', 'univ', 'uni v'] }),
    model('Changan', 'Changan X5 Plus', { zh: '长安X5 PLUS', powertrains: ['ICE'], aliases: ['x5 plus', 'oshan x5 plus'] }),
    // Qiyuan за рубежом называется Nevo. У Q05 два разных поколения:
    // первое — PHEV, «全新Q05» с конца 2025 — электро
    model('Changan', 'Changan Qiyuan Q05', { zh: '长安启源Q05', powertrains: ['PHEV', 'BEV'], exportNote: 'export: Nevo Q05',
        aliases: ['qiyuan q05', 'nevo q05', 'q05'] }),
    model('Changan', 'Changan Qiyuan Q07', { zh: '长安启源Q07', powertrains: ['PHEV'], exportNote: 'export: Nevo Q07',
        aliases: ['qiyuan q07', 'nevo q07', 'q07'] }),

    /* ------------------------------ прочие Китай --------------------------- */
    model('Chery', 'Chery Tiggo 7 Pro', { powertrains: ['ICE', 'PHEV'], aliases: ['tiggo 7 pro', 'tiggo 7', 'тигго 7'] }),
    model('Chery', 'Chery Tiggo 8 Pro', { powertrains: ['ICE', 'PHEV'], aliases: ['tiggo 8 pro', 'tiggo 8', 'тигго 8'] }),
    model('Chery', 'Chery Tiggo 4 Pro', { powertrains: ['ICE'], aliases: ['tiggo 4 pro', 'tiggo 4', 'тигго 4'] }),
    model('Chery', 'Chery Arrizo 8', { powertrains: ['ICE'], aliases: ['arrizo 8', 'аризо 8', 'арризо 8'] }),
    model('Jetour', 'Jetour Dashing', { zh: '捷途大圣', powertrains: ['ICE'], aliases: ['dashing', 'дашинг'] }),
    model('Jetour', 'Jetour X70 Plus', { powertrains: ['ICE'], aliases: ['x70 plus', 'x70'] }),
    model('Jetour', 'Jetour X90 Plus', { powertrains: ['ICE'], aliases: ['x90 plus', 'x90'] }),
    model('Jetour', 'Jetour T2', { zh: '捷途旅行者', exportNote: 'China: Traveller', powertrains: ['ICE', 'PHEV'],
        aliases: ['jetour t2', 'traveller', 'traveler', 't2'] }),
    model('Jetour', 'Jetour T1', { powertrains: ['ICE', 'PHEV'], aliases: ['jetour t1', 't1'] }),
    model('Exeed', 'Exeed TXL', { powertrains: ['ICE'], aliases: ['txl'] }),
    model('Exeed', 'Exeed RX', { powertrains: ['ICE', 'PHEV'], aliases: ['exeed rx'] }),
    model('Exeed', 'Exeed VX', { powertrains: ['ICE', 'PHEV'], aliases: ['exeed vx'] }),
    model('Exeed', 'Exeed LX', { powertrains: ['ICE'], aliases: ['exeed lx'] }),
    model('Omoda', 'Omoda C5', { powertrains: ['ICE', 'BEV'], aliases: ['omoda c5', 'omoda 5', 'c5'] }),
    model('Jaecoo', 'Jaecoo J7', { powertrains: ['ICE', 'PHEV'], aliases: ['jaecoo j7', 'j7'] }),
    model('Jaecoo', 'Jaecoo J8', { powertrains: ['ICE', 'PHEV'], aliases: ['jaecoo j8', 'j8'] }),
    model('Haval', 'Haval Jolion', { zh: '哈弗初恋', powertrains: ['ICE', 'PHEV'], aliases: ['jolion', 'джолион'] }),
    model('Haval', 'Haval H6', { zh: '哈弗H6', powertrains: ['ICE', 'PHEV'], aliases: ['haval h6', 'h6', 'хавал h6'] }),
    model('Haval', 'Haval H9', { zh: '哈弗H9', powertrains: ['ICE'], aliases: ['haval h9', 'h9'] }),
    model('Haval', 'Haval Dargo', { zh: '哈弗大狗', powertrains: ['ICE'], aliases: ['dargo', 'даргo', 'дарго', 'big dog'] }),
    model('Tank', 'Tank 300', { zh: '坦克300', powertrains: ['ICE', 'PHEV'], aliases: ['tank 300', 'танк 300'] }),
    model('Tank', 'Tank 400', { zh: '坦克400', powertrains: ['ICE', 'PHEV'], aliases: ['tank 400', 'танк 400'] }),
    model('Tank', 'Tank 500', { zh: '坦克500', powertrains: ['ICE', 'PHEV'], aliases: ['tank 500', 'танк 500'] }),
    model('Tank', 'Tank 700', { zh: '坦克700', powertrains: ['PHEV'], aliases: ['tank 700', 'танк 700'] }),
    model('Lynk & Co', 'Lynk & Co 01', { zh: '领克01', powertrains: ['ICE', 'PHEV'], aliases: ['lynk 01', 'lynk co 01', 'линк 01'] }),
    model('Lynk & Co', 'Lynk & Co 08', { zh: '领克08', powertrains: ['PHEV'], aliases: ['lynk 08', 'lynk co 08', 'линк 08'] }),
    model('Lynk & Co', 'Lynk & Co 09', { zh: '领克09', powertrains: ['ICE', 'PHEV'], aliases: ['lynk 09', 'lynk co 09', 'линк 09'] }),
    model('Xpeng', 'Xpeng G6', { zh: '小鹏G6', powertrains: ['BEV'], aliases: ['xpeng g6'] }),
    model('Xpeng', 'Xpeng G9', { zh: '小鹏G9', powertrains: ['BEV'], aliases: ['xpeng g9'] }),
    model('Xpeng', 'Xpeng P7', { zh: '小鹏P7', powertrains: ['BEV'], aliases: ['xpeng p7'] }),
    model('Xpeng', 'Xpeng X9', { zh: '小鹏X9', powertrains: ['BEV'], aliases: ['xpeng x9'] }),
    model('Nio', 'Nio ES6', { zh: '蔚来ES6', powertrains: ['BEV'], aliases: ['nio es6', 'es6'] }),
    model('Nio', 'Nio ES8', { zh: '蔚来ES8', powertrains: ['BEV'], aliases: ['nio es8', 'es8'] }),
    model('Nio', 'Nio EC6', { zh: '蔚来EC6', powertrains: ['BEV'], aliases: ['nio ec6', 'ec6'] }),
    model('Nio', 'Nio ET5', { zh: '蔚来ET5', powertrains: ['BEV'], aliases: ['nio et5', 'et5'] }),
    model('Nio', 'Nio ET7', { zh: '蔚来ET7', powertrains: ['BEV'], aliases: ['nio et7', 'et7'] }),
    model('GAC Aion', 'GAC Aion Y Plus', { powertrains: ['BEV'], aliases: ['aion y plus', 'aion y'] }),
    model('GAC Aion', 'GAC Aion S Plus', { powertrains: ['BEV'], aliases: ['aion s plus', 'aion s'] }),
    model('GAC Aion', 'GAC Aion V', { powertrains: ['BEV'], aliases: ['aion v'] }),
    model('Leapmotor', 'Leapmotor C10', { zh: '零跑C10', powertrains: ['BEV', 'EREV'], aliases: ['leapmotor c10', 'c10'] }),
    model('Leapmotor', 'Leapmotor C11', { zh: '零跑C11', powertrains: ['BEV', 'EREV'], aliases: ['leapmotor c11', 'c11'] }),
    model('Leapmotor', 'Leapmotor C16', { zh: '零跑C16', powertrains: ['BEV', 'EREV'], aliases: ['leapmotor c16', 'c16'] }),
    model('Leapmotor', 'Leapmotor B10', { zh: '零跑B10', powertrains: ['BEV', 'EREV'], aliases: ['leapmotor b10', 'b10'] }),
    model('Wuling', 'Wuling Bingo', { zh: '五菱缤果', powertrains: ['BEV'], aliases: ['bingo', 'бинго'] }),
    model('Baojun', 'Baojun Yunduo', { zh: '宝骏云朵', powertrains: ['BEV'], exportNote: 'export: Wuling Cloud EV',
        aliases: ['yunduo', 'baojun cloud', 'wuling cloud', 'cloud ev'] }),
    model('Rox', 'Rox 01', { zh: '极石01', powertrains: ['EREV'], aliases: ['rox 01', 'rox'] }),
];
