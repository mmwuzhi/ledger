import { Receipt, CreateReceiptInput, OcrResult } from '../models';

export interface IReceiptRepository {
  findById(id: string): Promise<Receipt | null>;
  create(input: CreateReceiptInput): Promise<Receipt>;
  updateOcrResult(id: string, ocrResult: OcrResult): Promise<Receipt>;
  softDelete(id: string): Promise<void>;
}
