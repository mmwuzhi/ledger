import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';

export class ExportService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async exportToCsv(): Promise<string> {
    const [transactions, categories] = await Promise.all([
      this.transactionRepo.findAll(),
      this.categoryRepo.findAll({ includeDeleted: true }),
    ]);
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    const header = '日期,类型,分类,金额,备注';
    const rows = transactions.map(t => {
      const date = t.date.slice(0, 10);
      const type = t.type === 'income' ? '收入' : '支出';
      const category = categoryMap[t.categoryId] ?? '未知';
      const note = t.note.replace(/,/g, '，');
      return `${date},${type},${category},${t.amount},${note}`;
    });

    return [header, ...rows].join('\n');
  }
}
