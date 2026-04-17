import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyInitData } from '@/lib/telegram/verifyInitData';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData || !verifyInitData(initData).isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if it's admin
    const userParams = new URLSearchParams(initData);
    const userJson = userParams.get('user');
    if (userJson) {
      const userObj = JSON.parse(userJson);
      const dbUser = await prisma.user.findUnique({ where: { telegramId: userObj.id.toString() } });
      if ((dbUser as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = await context.params;

    const caseItem = await prisma.case.findUnique({
      where: { id }
    });

    if (!caseItem) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(caseItem);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData || !verifyInitData(initData).isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userParams = new URLSearchParams(initData);
    const userJson = userParams.get('user');
    if (userJson) {
      const userObj = JSON.parse(userJson);
      const dbUser = await prisma.user.findUnique({ where: { telegramId: userObj.id.toString() } });
      if ((dbUser as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = await context.params;
    const body = await request.json();

    const caseItem = await prisma.case.update({
      where: { id },
      data: {
        vehicleName: body.vehicleName,
        year: body.year,
        price: body.price,
        clientName: body.clientName,
        city: body.city,
        quote: body.quote,
        imageUrl: body.imageUrl,
      }
    });

    return NextResponse.json(caseItem);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData || !verifyInitData(initData).isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userParams = new URLSearchParams(initData);
    const userJson = userParams.get('user');
    if (userJson) {
      const userObj = JSON.parse(userJson);
      const dbUser = await prisma.user.findUnique({ where: { telegramId: userObj.id.toString() } });
      if ((dbUser as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = await context.params;

    await prisma.case.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
