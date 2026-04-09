import { z } from 'zod';

export const OcrResultSchema = z.object({
  amount: z.number().nullable(),
  date: z.string().nullable(),           // ISO date string or null if not detected
  note: z.string().default(''),
  rawText: z.string().default(''),
});

export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  imageUri: z.string(),                  // local file path
  ocrResult: OcrResultSchema.nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
export type OcrResult = z.infer<typeof OcrResultSchema>;
export type CreateReceiptInput = Pick<Receipt, 'imageUri'>;
