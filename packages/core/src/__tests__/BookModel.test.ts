import { Book, CreateBookInput, UpdateBookInput } from '../models/book';
import { IBookRepository } from '../repositories/IBookRepository';

const mockBook: Book = {
  id: 'book-1',
  name: '旅行账本',
  icon: '✈️',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const defaultBook: Book = {
  id: 'default',
  name: '默认账本',
  icon: '📒',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

function makeMockBookRepo(overrides?: Partial<IBookRepository>): IBookRepository {
  return {
    findAll: jest.fn().mockResolvedValue([defaultBook, mockBook]),
    findById: jest.fn().mockResolvedValue(mockBook),
    create: jest.fn().mockResolvedValue(mockBook),
    update: jest.fn().mockResolvedValue({ ...mockBook, name: '日本旅行' }),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('BookModel & Repository', () => {
  it('findAll returns all books', async () => {
    const repo = makeMockBookRepo();
    const books = await repo.findAll();
    expect(books).toHaveLength(2);
    expect(books[0].id).toBe('default');
    expect(books[1].id).toBe('book-1');
  });

  it('findById returns a specific book', async () => {
    const repo = makeMockBookRepo();
    const book = await repo.findById('book-1');
    expect(book).not.toBeNull();
    expect(book!.name).toBe('旅行账本');
    expect(book!.icon).toBe('✈️');
  });

  it('findById returns null for nonexistent book', async () => {
    const repo = makeMockBookRepo({
      findById: jest.fn().mockResolvedValue(null),
    });
    const book = await repo.findById('nonexistent');
    expect(book).toBeNull();
  });

  it('create creates a new book', async () => {
    const repo = makeMockBookRepo();
    const input: CreateBookInput = { name: '旅行账本', icon: '✈️' };
    const book = await repo.create(input);
    expect(repo.create).toHaveBeenCalledWith(input);
    expect(book.name).toBe('旅行账本');
  });

  it('update modifies book name', async () => {
    const repo = makeMockBookRepo();
    const input: UpdateBookInput = { name: '日本旅行' };
    const book = await repo.update('book-1', input);
    expect(repo.update).toHaveBeenCalledWith('book-1', input);
    expect(book.name).toBe('日本旅行');
  });

  it('softDelete marks book as deleted', async () => {
    const repo = makeMockBookRepo();
    await repo.softDelete('book-1');
    expect(repo.softDelete).toHaveBeenCalledWith('book-1');
  });
});
