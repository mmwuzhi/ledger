import { Tag, CreateTagInput, UpdateTagInput } from '../models/tag';

export interface ITagRepository {
  findAll(): Promise<Tag[]>;
  findById(id: string): Promise<Tag | null>;
  create(input: CreateTagInput): Promise<Tag>;
  update(id: string, input: UpdateTagInput): Promise<Tag>;
  softDelete(id: string): Promise<void>;

  // Transaction-Tag relationships
  findByTransactionId(transactionId: string): Promise<Tag[]>;
  findTransactionIdsByTagId(tagId: string): Promise<string[]>;
  addToTransaction(transactionId: string, tagId: string): Promise<void>;
  removeFromTransaction(transactionId: string, tagId: string): Promise<void>;
  setTransactionTags(transactionId: string, tagIds: string[]): Promise<void>;
}
