import { Category, CreateCategoryInput, UpdateCategoryInput } from '../models';

export interface ICategoryRepository {
  findAll(options?: { includeDeleted?: boolean }): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  softDelete(id: string): Promise<void>;
}
