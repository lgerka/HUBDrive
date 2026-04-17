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

export function calculateLeadScore(user: UserWithRelations): LeadScoreResult {
    let score = 0;
    const reasons: string[] = [];

    // Base score for registering
    score += 10;
    reasons.push("Регистрация (+10)");

    // Profile info
    if (user.phone) {
        score += 20;
        reasons.push("Указал телефон (+20)");
    }

    // Check filters
    if (user.filters && user.filters.length > 0) {
        score += user.filters.length * 15;
        reasons.push(`Активных фильтров: ${user.filters.length} (+${user.filters.length * 15})`);
        
        for (const filter of user.filters) {
            // "ready_now" is the exact string value in the Prisma Enum (check case/syntax in JS runtime)
            if (filter.purchasePlan === 'ready_now') {
                score += 50;
                reasons.push(`Готов к покупке сейчас (фильтр: ${filter.brand}) (+50)`);
            } else if (filter.purchasePlan === 'three_months') {
                score += 20;
                reasons.push(`Планирует покупку в перспективе (фильтр: ${filter.brand}) (+20)`);
            }
        }
    }

    // Check events
    if (user.events && user.events.length > 0) {
        const clicks = user.events.filter(e => e.type === 'contact_clicked' || e.type === 'call_clicked');
        if (clicks.length > 0) {
            score += clicks.length * 30;
            reasons.push(`Просмотры контактов: ${clicks.length} (+${clicks.length * 30})`);
        }

        const favs = user.events.filter(e => e.type === 'favorite_added');
        if (favs.length > 0) {
            score += favs.length * 5;
            reasons.push(`Добавлений в избранное: ${favs.length} (+${favs.length * 5})`);
        }

        // recent activity
        const recentEvents = user.events.filter(e => e.createdAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
        if (recentEvents.length > 0) {
            score += 15;
            reasons.push(`Высокая недавняя активность (+15)`);
        }
    }

    let level: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    if (score >= 80) level = 'HOT';
    else if (score >= 40) level = 'WARM';

    return { score, level, reasons };
}
