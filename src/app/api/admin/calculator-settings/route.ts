import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin, adminIdentity } from '@/lib/server/admin';
import { getCalcSettings, saveCalcSettings } from '@/lib/server/calculatorSettings';
import { applyCalcPatch, validateSettings, rejectedPaths } from '@/lib/calculatorSettings';

/** Настройки калькулятора: комиссия, расходы, логистика по городам, ставки. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getCalcSettings());
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
    const result = await saveCalcSettings(patch as Record<string, unknown>, version, author);

    if (!result.ok) {
        return NextResponse.json(
            {
                error: 'Настройки уже изменил кто-то другой',
                stored: result.stored,
            },
            { status: 409 }
        );
    }

    return NextResponse.json({ ok: true, ...result.stored });
}
