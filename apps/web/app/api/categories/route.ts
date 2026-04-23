import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { TursoCategoryRepository } from '@/lib/repositories/TursoCategoryRepository';

export async function GET() {
  try {
    await initDb();
    const repo = new TursoCategoryRepository(getDb());
    const categories = await repo.findAll();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
