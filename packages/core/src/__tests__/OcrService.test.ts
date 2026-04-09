import { OcrService } from '../services/OcrService';

describe('OcrService.parseRawText', () => {
  let service: OcrService;

  beforeEach(() => {
    service = new OcrService({ recognize: jest.fn() });
  });

  it('extracts amount with ¥ symbol', () => {
    const result = service.parseRawText('商品 x2\n合计 ¥88.50\n谢谢惠顾');
    expect(result.amount).toBe(88.5);
  });

  it('extracts amount with 合计 keyword', () => {
    const result = service.parseRawText('合计：128.00');
    expect(result.amount).toBe(128);
  });

  it('extracts ISO date', () => {
    const result = service.parseRawText('日期: 2024-03-15\n合计 50');
    expect(result.date).toBe('2024-03-15');
  });

  it('extracts Chinese date format', () => {
    const result = service.parseRawText('2024年3月15日\n合计 50');
    expect(result.date).toBe('2024-03-15');
  });

  it('returns null for unrecognized amount', () => {
    const result = service.parseRawText('no price here');
    expect(result.amount).toBeNull();
  });

  it('returns null for unrecognized date', () => {
    const result = service.parseRawText('合计 50');
    expect(result.date).toBeNull();
  });

  it('includes raw text in result', () => {
    const text = '合计 ¥50';
    const result = service.parseRawText(text);
    expect(result.rawText).toBe(text);
  });
});
