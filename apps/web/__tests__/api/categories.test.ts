// Tests for GET /api/categories

import { NextRequest } from 'next/server';

const mockFindAll = jest.fn();

jest.mock('@/lib/db', () => ({ getDb: jest.fn(), initDb: jest.fn() }));
jest.mock('@/lib/repositories/TursoCategoryRepository', () => ({
  TursoCategoryRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require('@/app/api/categories/route');

const CATEGORIES = [
  { id: 'cat-1', name: '餐饮', icon: '🍜', type: 'expense' },
  { id: 'cat-2', name: '交通', icon: '🚇', type: 'expense' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockFindAll.mockResolvedValue(CATEGORIES);
});

describe('GET /api/categories', () => {
  it('returns 200 with the category list from the repository', async () => {
    const req = new NextRequest('http://localhost/api/categories');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindAll).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body).toEqual(CATEGORIES);
  });
});
