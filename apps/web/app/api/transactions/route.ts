import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { TursoTransactionRepository } from '@/lib/repositories/TursoTransactionRepository';
import type { TransactionSearchFilters, CreateTransactionInput } from '@moneybook/core';

async function getRepo() {
  await initDb();
  return new TursoTransactionRepository(getDb());
}

export async function GET(req: NextRequest) {
  try {
    const repo = await getRepo();
    const { searchParams } = req.nextUrl;

    const keyword = searchParams.get('keyword') ?? undefined;
    const type = searchParams.get('type') as 'income' | 'expense' | null;
    const categoryId = searchParams.get('categoryId') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');

    const hasFilters =
      keyword || type || categoryId || dateFrom || dateTo || amountMin || amountMax;

    let transactions;
    if (hasFilters) {
      const filters: TransactionSearchFilters = {
        keyword,
        type: type ?? undefined,
        categoryId,
        dateFrom,
        dateTo,
        amountMin: amountMin ? parseFloat(amountMin) : undefined,
        amountMax: amountMax ? parseFloat(amountMax) : undefined,
      };
      transactions = await repo.search(filters);
    } else {
      transactions = await repo.findAll();
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, categoryId, date, note, receiptId, currency } = body;

    if (!type || amount == null || !categoryId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const repo = await getRepo();
    const input: CreateTransactionInput = { type, amount, categoryId, date, note, receiptId, currency };
    const transaction = await repo.create(input);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const repo = await getRepo();
    await repo.softDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
