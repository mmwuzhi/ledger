import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ ok: true, message: 'Database initialized' });
  } catch (error) {
    console.error('DB init failed:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
