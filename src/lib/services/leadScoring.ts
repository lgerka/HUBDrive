import { User, Filter, Event } from '@prisma/client';

export interface LeadScoreResult {
    score: number;
    level: 'HOT' | 'WARM' | 'COLD';
    reasons: string[];
}

// Ensure the related models have compatible typings when passed to calculateLeadScore
export type UserWithRelations = User & {
    filters?: Filter[];
    events?: Event[];
};

/**
 * Lead scoring по PRD §17:
 *   «Просто смотрю» +10, «Планирую покупку» +40, «Готов купить сейчас» +80,
 *   телефон +15, избранное +10, «Связаться» +30,
 *   3+ карточек за 7 дней +10, 5+ карточек за 14 дней +20.
 * Учитывается максимальная степень готовности среди фильтров пользователя.
 */
export function calculateLeadScore(user: UserWithRelations): LeadScoreResult {
    let score = 0;
    const reasons: string[] = [];

    // Степень готовности — берём самый сильный сигнал среди фильтров (PRD: 10/40/80)
    if (user.filters && user.filters.length > 0) {
        const plans = user.filters.map(f => f.purchasePlan);
        if (plans.includes('ready_now')) {
            score += 80;
            reasons.push('Готов купить сейчас (+80)');
        } else if (plans.includes('three_months')) {
            score += 40;
            reasons.push('Планирует покупку (+40)');
        } else {
            score += 10;
            reasons.push('Просто смотрит (+10)');
        }
    }

    // Сохранил телефон (+15)
    if (user.phone) {
        score += 15;
        reasons.push('Указал телефон (+15)');
    }

    if (user.events && user.events.length > 0) {
        // Добавил авто в избранное (+10 за каждое)
        const favs = user.events.filter(e => e.type === 'favorite_added');
        if (favs.length > 0) {
            score += favs.length * 10;
            reasons.push(`Добавлений в избранное: ${favs.length} (+${favs.length * 10})`);
        }

        // Нажал «Связаться» / «Позвонить» (+30 за каждое)
        const clicks = user.events.filter(e => e.type === 'contact_clicked' || e.type === 'call_clicked');
        if (clicks.length > 0) {
            score += clicks.length * 30;
            reasons.push(`Нажатий «Связаться»: ${clicks.length} (+${clicks.length * 30})`);
        }

        // Активность по карточкам: 3+ за 7 дней (+10), 5+ за 14 дней (+20)
        const now = Date.now();
        const views7d = user.events.filter(e =>
            e.type === 'vehicle_opened' && e.createdAt > new Date(now - 7 * 24 * 60 * 60 * 1000)
        ).length;
        const views14d = user.events.filter(e =>
            e.type === 'vehicle_opened' && e.createdAt > new Date(now - 14 * 24 * 60 * 60 * 1000)
        ).length;

        if (views14d >= 5) {
            score += 20;
            reasons.push(`Открыл ${views14d} карточек за 14 дней (+20)`);
        }
        if (views7d >= 3) {
            score += 10;
            reasons.push(`Открыл ${views7d} карточек за 7 дней (+10)`);
        }
    }

    let level: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    if (score >= 80) level = 'HOT';
    else if (score >= 40) level = 'WARM';

    return { score, level, reasons };
}
