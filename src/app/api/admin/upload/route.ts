import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/server/admin';
import { prisma } from '@/lib/server/prisma';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

export async function POST(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'Supabase Storage not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env' },
                { status: 503 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, WEBP, GIF' }, { status: 400 });
        }

        // Validate file size (5 MB max)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `news/${uuidv4()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage via REST API
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                // apikey — для новых ключей sb_secret_*, Authorization — для legacy service_role JWT
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': file.type,
                'x-upsert': 'true',
            },
            body: buffer,
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            console.error('Supabase upload error:', err);
            return NextResponse.json({ error: 'Upload failed', details: err }, { status: 500 });
        }

        // Build public URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
