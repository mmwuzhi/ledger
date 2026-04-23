// Tests for GET and DELETE /api/transactions
// Mocks TursoTransactionRepository so no real DB connection is needed.

import { NextRequest } from 'next/server';

const mockFindAll = jest.fn();
const mockSearch = jest.fn();
const mockSoftDelete = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/db', () => ({ getDb: jest.fn(), initDb: jest.fn() }));
jest.mock('@/lib/repositories/TursoTransactionRepository', () => ({
  TursoTransactionRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
    search: mockSearch,
    softDelete: mockSoftDelete,
    create: mockCreate,
  })),
}));

// Import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET, DELETE } = require('@/app/api/transactions/route');

const FIXTURE = [
  { id: '1', type: 'expense', amount: 38.5, categoryId: 'cat-1', note: '午饭', date: '2026-04-22T00:00:00.000Z' },
];

const CREATED = { ...FIXTURE[0], id: '2', note: '晚饭' };

beforeEach(() => {
  jest.clearAllMocks();
  mockFindAll.mockResolvedValue(FIXTURE);
  mockSearch.mockResolvedValue(FIXTURE);
  mockSoftDelete.mockResolvedValue(undefined);
  mockCreate.mockResolvedValue(CREATED);
});

describe('GET /api/transactions', () => {
  it('calls findAll() when no query params and returns 200', async () => {
    const req = new NextRequest('http://localhost/api/transactions');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(mockSearch).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body).toEqual(FIXTURE);
  });

  it('calls search() not findAll() when keyword param is present', async () => {
    const req = new NextRequest('http://localhost/api/transactions?keyword=午饭');
    await GET(req);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ keyword: '午饭' }));
    expect(mockFindAll).not.toHaveBeenCalled();
  });

  it('passes dateFrom and dateTo to search()', async () => {
    const req = new NextRequest(
      'http://localhost/api/transactions?dateFrom=2026-04-01&dateTo=2026-04-30'
    );
    await GET(req);
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '2026-04-01', dateTo: '2026-04-30' })
    );
  });
});

describe('DELETE /api/transactions', () => {
  it('calls softDelete with the given id and returns 200', async () => {
    const req = new NextRequest('http://localhost/api/transactions', {
      method: 'DELETE',
      body: JSON.stringify({ id: '1' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockSoftDelete).toHaveBeenCalledWith('1');
  });
});

describe('POST /api/transactions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { POST } = require('@/app/api/transactions/route');

  it('calls create() with valid body and returns 201', async () => {
    const body = { type: 'expense', amount: 38.5, categoryId: 'cat-1', date: '2026-04-22', note: '晚饭' };
    const req = new NextRequest('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'expense', amount: 38.5 }));
    const json = await res.json();
    expect(json).toEqual(CREATED);
  });

  it('returns 400 when required field amount is missing', async () => {
    const body = { type: 'expense', categoryId: 'cat-1', date: '2026-04-22' };
    const req = new NextRequest('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
