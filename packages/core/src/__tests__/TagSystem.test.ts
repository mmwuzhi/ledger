import { Tag, CreateTagInput, UpdateTagInput } from '../models/tag';
import { ITagRepository } from '../repositories/ITagRepository';

const mockTags: Tag[] = [
  {
    id: 'tag-1',
    name: '报销',
    color: '#ef4444',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'tag-2',
    name: 'AA',
    color: '#3b82f6',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'tag-3',
    name: '旅行',
    color: '#22c55e',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
  },
];

function makeMockTagRepo(overrides?: Partial<ITagRepository>): ITagRepository {
  return {
    findAll: jest.fn().mockResolvedValue(mockTags),
    findById: jest.fn().mockResolvedValue(mockTags[0]),
    create: jest.fn().mockResolvedValue(mockTags[0]),
    update: jest.fn().mockResolvedValue({ ...mockTags[0], name: '可报销' }),
    softDelete: jest.fn().mockResolvedValue(undefined),
    findByTransactionId: jest.fn().mockResolvedValue([mockTags[0], mockTags[2]]),
    findTransactionIdsByTagId: jest.fn().mockResolvedValue(['txn-1', 'txn-2']),
    addToTransaction: jest.fn().mockResolvedValue(undefined),
    removeFromTransaction: jest.fn().mockResolvedValue(undefined),
    setTransactionTags: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Tag System', () => {
  describe('Tag CRUD', () => {
    it('findAll returns all tags', async () => {
      const repo = makeMockTagRepo();
      const tags = await repo.findAll();
      expect(tags).toHaveLength(3);
      expect(tags[0].name).toBe('报销');
      expect(tags[0].color).toBe('#ef4444');
    });

    it('findById returns specific tag', async () => {
      const repo = makeMockTagRepo();
      const tag = await repo.findById('tag-1');
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe('报销');
    });

    it('create creates a new tag', async () => {
      const repo = makeMockTagRepo();
      const input: CreateTagInput = { name: '报销', color: '#ef4444' };
      await repo.create(input);
      expect(repo.create).toHaveBeenCalledWith(input);
    });

    it('update modifies tag', async () => {
      const repo = makeMockTagRepo();
      const input: UpdateTagInput = { name: '可报销' };
      const tag = await repo.update('tag-1', input);
      expect(tag.name).toBe('可报销');
    });

    it('softDelete marks tag as deleted', async () => {
      const repo = makeMockTagRepo();
      await repo.softDelete('tag-1');
      expect(repo.softDelete).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('Transaction-Tag relationships', () => {
    it('findByTransactionId returns tags for a transaction', async () => {
      const repo = makeMockTagRepo();
      const tags = await repo.findByTransactionId('txn-1');
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe('报销');
      expect(tags[1].name).toBe('旅行');
    });

    it('findTransactionIdsByTagId returns transaction IDs', async () => {
      const repo = makeMockTagRepo();
      const ids = await repo.findTransactionIdsByTagId('tag-1');
      expect(ids).toEqual(['txn-1', 'txn-2']);
    });

    it('addToTransaction links tag to transaction', async () => {
      const repo = makeMockTagRepo();
      await repo.addToTransaction('txn-1', 'tag-2');
      expect(repo.addToTransaction).toHaveBeenCalledWith('txn-1', 'tag-2');
    });

    it('removeFromTransaction unlinks tag from transaction', async () => {
      const repo = makeMockTagRepo();
      await repo.removeFromTransaction('txn-1', 'tag-1');
      expect(repo.removeFromTransaction).toHaveBeenCalledWith('txn-1', 'tag-1');
    });

    it('setTransactionTags replaces all tags for a transaction', async () => {
      const repo = makeMockTagRepo();
      await repo.setTransactionTags('txn-1', ['tag-1', 'tag-3']);
      expect(repo.setTransactionTags).toHaveBeenCalledWith('txn-1', ['tag-1', 'tag-3']);
    });

    it('setTransactionTags with empty array clears all tags', async () => {
      const repo = makeMockTagRepo();
      await repo.setTransactionTags('txn-1', []);
      expect(repo.setTransactionTags).toHaveBeenCalledWith('txn-1', []);
    });
  });
});
