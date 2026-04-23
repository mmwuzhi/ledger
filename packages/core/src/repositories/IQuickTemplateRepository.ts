import {
  QuickTemplate,
  CreateQuickTemplateInput,
  UpdateQuickTemplateInput,
} from '../models/quick-template';

export interface IQuickTemplateRepository {
  findAll(): Promise<QuickTemplate[]>;
  findById(id: string): Promise<QuickTemplate | null>;
  create(input: CreateQuickTemplateInput): Promise<QuickTemplate>;
  update(id: string, input: UpdateQuickTemplateInput): Promise<QuickTemplate>;
  softDelete(id: string): Promise<void>;
}
