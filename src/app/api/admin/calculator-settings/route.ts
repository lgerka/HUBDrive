import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin, adminIdentity } from '@/lib/server/admin';
import { getCalcSettings, saveCalcSettings } from '@/lib/server/calculatorSettings';
import { recalcAllTurnkeyPrices } from '@/lib/server/turnkeyPrices';
import { applyCalcPatch, validateSettings, rejectedPaths } from '@/lib/calculatorSettings';

// Курс Нацбанка иногда отвечает медленно: с запасом по времени запрос не
// оборвётся на середине, оставив менеджера без расчёта
export const maxDuration = 30;

/** Настройки калькулятора: комиссия, расходы, логистика по городам, ставки. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        return NextResponse.json(await getCalcSettings());
    } catch (error) {
        // Отвечать заводскими значениями нельзя: страница примет их
        // за сохранённые и посчитает клиенту неверную цену
        console.error('[калькулятор] настройки не прочитались:', error);
        return NextResponse.json({ error: 'Настройки не прочитались' }, { status: 503 });
    }
}

/**
 * Сохранение правок.
 *
 * Пишем не весь объект, а патч — только то, что меняли. Проверяем его здесь
 * ещё раз, хотя форма уже проверила: браузер можно обойти, а цена ошибки —
 * неверные суммы у всех менеджеров до тех пор, пока кто-нибудь не заметит.
 */
export async function PUT(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Пустой запрос' }, { status: 400 });
    }

    const { patch, version } = body as { patch?: unknown; version?: unknown };
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return NextResponse.json({ error: 'Нечего сохранять' }, { status: 400 });
    }
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
        return NextResponse.json({ error: 'Не указана версия настроек' }, { status: 400 });
    }

    // Сначала — не отвергло ли слияние что-нибудь из присланного. Проверять
    // один только результат слияния бессмысленно: негодное значение в нём уже
    // заменено заводским, и проверка всегда проходит
    const rejected = rejectedPaths(patch);
    if (Object.keys(rejected).length > 0) {
        return NextResponse.json({ error: 'Проверьте значения', errors: rejected }, { status: 400 });
    }

    // Затем — правила, которые касаются сочетаний: например, начало срока
    // позже его конца. Поодиночке оба значения допустимы
    const errors = validateSettings(applyCalcPatch(patch));
    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ error: 'Проверьте значения', errors }, { status: 400 });
    }

    const author = await adminIdentity(request, prisma);

    let result;
    try {
        result = await saveCalcSettings(patch as Record<string, unknown>, version, author);
    } catch (error) {
        console.error('[калькулятор] настройки не сохранились:', error);
        return NextResponse.json({ error: 'База недоступна, настройки не сохранены' }, { status: 503 });
    }

    if (!result.ok) {
        return NextResponse.json(
            {
                error: 'Настройки уже изменил кто-то другой',
                stored: result.stored,
            },
            { status: 409 }
        );
    }

    // Новая комиссия или логистика должна сразу дойти до цен в каталоге.
    // Если пересчёт не прошёл, настройки не откатываем: они уже сохранены
    // и верны, а цены догонит утренний пересчёт. Но говорим об этом прямо
    let recalc: { changed: number; total: number } | { error: string } | null;
    try {
        const s = await recalcAllTurnkeyPrices('settings');
        recalc = s.enabled ? { changed: s.changed, total: s.total } : null;
    } catch (error) {
        console.error('[настройки] цены в каталоге не пересчитались:', error);
        recalc = { error: 'Цены в каталоге не пересчитались — это сделает утренний пересчёт' };
    }

    return NextResponse.json({ ok: true, ...result.stored, recalc });
}
