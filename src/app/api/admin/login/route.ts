import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const adminSecret = process.env.ADMIN_SECRET_KEY;

        if (!adminSecret) {
            return NextResponse.json({ error: 'ADMIN_SECRET_KEY is not configured on the server' }, { status: 500 });
        }

        if (password === adminSecret) {
            const cookieStore = await cookies();
            cookieStore.set({
                name: 'admin_session',
                value: adminSecret,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
