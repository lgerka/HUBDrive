import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all active filters with user data for city
        const filters = await prisma.filter.findMany({
            include: { user: true }
        });

        // 1. Top Brands
        const brandCounts: Record<string, number> = {};
        filters.forEach(f => {
            brandCounts[f.brand] = (brandCounts[f.brand] || 0) + 1;
        });
        const topBrands = Object.entries(brandCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 2. Top Models
        const modelCounts: Record<string, number> = {};
        filters.forEach(f => {
            if (f.model) {
                const key = `${f.brand} ${f.model}`;
                modelCounts[key] = (modelCounts[key] || 0) + 1;
            }
        });
        const topModels = Object.entries(modelCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 3. Average Budget
        const filtersWithBudget = filters.filter(f => f.budgetMax > 0);
        const avgBudget = filtersWithBudget.length > 0 
            ? Math.round(filtersWithBudget.reduce((sum, f) => sum + f.budgetMax, 0) / filtersWithBudget.length)
            : 0;

        // 4. Top Budgets (Distribution)
        const budgetRanges = {
            'До 10 млн': 0,
            '10 - 15 млн': 0,
            '15 - 20 млн': 0,
            '20 - 30 млн': 0,
            'Более 30 млн': 0
        };
        filters.forEach(f => {
            const b = f.budgetMax;
            if (b < 10000000) budgetRanges['До 10 млн']++;
            else if (b < 15000000) budgetRanges['10 - 15 млн']++;
            else if (b < 20000000) budgetRanges['15 - 20 млн']++;
            else if (b < 30000000) budgetRanges['20 - 30 млн']++;
            else budgetRanges['Более 30 млн']++;
        });

        // 5. Geography (Cities)
        const cityCounts: Record<string, number> = {};
        filters.forEach(f => {
            const city = f.user?.city || 'Не указан';
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        });
        const topCities = Object.entries(cityCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json({
            totalFilters: filters.length,
            topBrands,
            topModels,
            avgBudget,
            budgetDistribution: Object.entries(budgetRanges).map(([name, count]) => ({ name, count })),
            topCities
        });

    } catch (error) {
        console.error('Error calculating demand:', error);
        return NextResponse.json({ error: 'Failed to calc demand' }, { status: 500 });
    }
}
