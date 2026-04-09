import { OcrResult } from '../models';

export interface IOcrProvider {
  recognize(imageUri: string): Promise<string>;
}

export class OcrService {
  constructor(private readonly provider: IOcrProvider) {}

  async processReceipt(imageUri: string): Promise<OcrResult> {
    const rawText = await this.provider.recognize(imageUri);
    return this.parseRawText(rawText);
  }

  parseRawText(rawText: string): OcrResult {
    const amount = this.extractAmount(rawText);
    const date = this.extractDate(rawText);
    const note = this.extractNote(rawText);
    return { amount, date, note, rawText };
  }

  private extractAmount(text: string): number | null {
    // Match patterns like: ¥123.45, $12.00, 123.45, 合计 123
    const patterns = [
      /[¥$￥]\s*(\d+(?:\.\d{1,2})?)/,
      /合计[：:]\s*(\d+(?:\.\d{1,2})?)/,
      /总计[：:]\s*(\d+(?:\.\d{1,2})?)/,
      /total[：:\s]+(\d+(?:\.\d{1,2})?)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  private extractDate(text: string): string | null {
    // Match YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日
    const patterns = [
      /(\d{4}[-/]\d{2}[-/]\d{2})/,
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    ];
    const isoPattern = text.match(patterns[0]);
    if (isoPattern) return isoPattern[1].replace(/\//g, '-');
    const cnPattern = text.match(patterns[1]);
    if (cnPattern) {
      const [, y, m, d] = cnPattern;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
  }

  private extractNote(text: string): string {
    // Return first meaningful line as note (trim whitespace, skip short lines)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    return lines[0] ?? '';
  }
}
