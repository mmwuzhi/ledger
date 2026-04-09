import { Book, CreateBookInput, UpdateBookInput } from '../models/book';

export interface IBookRepository {
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
  create(input: CreateBookInput): Promise<Book>;
  update(id: string, input: UpdateBookInput): Promise<Book>;
  softDelete(id: string): Promise<void>;
}
