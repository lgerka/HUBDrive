import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        const user = await prisma.user.findFirst();
        if(!user) return console.log('no user');
        
        const body: any = {
            title: '',
            brand: 'Zeekr',
            model: '001',
            budgetMax: 5000000,
            yearFrom: 2020,
            bodyTypes: [],
            engineTypes: ['Электро'],
            purchasePlan: 'three_months',
            notificationsEnabled: true
        };

        const newFilter = await prisma.filter.create({
            data: {
                ...body,
                budgetMax: body.budgetMax ? Number(body.budgetMax) : 0, 
                brand: body.brand || 'Не выбрано',
                userId: user.id,
                id: undefined, 
            }
        });
        console.log("Success", newFilter.id);
    } catch(e: any) {
        console.error("Prisma Error:", e);
    }
}
test();
