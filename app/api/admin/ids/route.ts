// app/api/admin/ids/route.ts
import { NextResponse } from 'next/server';
import { getAdminIds } from '@/lib/supabase/admin-utils';

export async function GET() {
  try {
    const adminIds = await getAdminIds();
    return NextResponse.json({ adminIds }, { status: 200 });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des admin IDs:', error);
    return NextResponse.json({ error: 'Impossible de récupérer les admin IDs' }, { status: 500 });
  }
}
