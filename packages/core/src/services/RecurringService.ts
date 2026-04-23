import { IRecurringRepository } from '../repositories/IRecurringRepository';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { RecurringTransaction } from '../models/recurring';
import { Transaction } from '../models/transaction';

export class RecurringService {
  constructor(
    private readonly recurringRepo: IRecurringRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  /**
   * Check all enabled recurring transactions and generate any that are due.
   * Call this on app startup.
   * Returns the list of newly generated transactions.
   */
  async generateDueTransactions(
    today: string = new Date().toISOString().slice(0, 10)
  ): Promise<Transaction[]> {
    const recurring = await this.recurringRepo.findEnabled();
    const generated: Transaction[] = [];

    for (const r of recurring) {
      const dates = this.getDueDates(r, today);
      for (const date of dates) {
        const txn = await this.transactionRepo.create({
          type: r.type,
          amount: r.amount,
          categoryId: r.categoryId,
          note: r.note,
          date: `${date}T00:00:00.000Z`,
          receiptId: null,
          recurringId: r.id,
        });
        generated.push(txn);
      }
      if (dates.length > 0) {
        await this.recurringRepo.updateLastGeneratedDate(r.id, dates[dates.length - 1]);
      }
    }

    return generated;
  }

  /**
   * Get all dates that should have been generated since lastGeneratedDate (or startDate) up to today.
   */
  getDueDates(r: RecurringTransaction, today: string): string[] {
    const dates: string[] = [];
    const startFrom = r.lastGeneratedDate ? this.nextDay(r.lastGeneratedDate) : r.startDate;

    const endLimit = r.endDate && r.endDate < today ? r.endDate : today;
    if (startFrom > endLimit) return dates;

    let current = startFrom;

    while (current <= endLimit) {
      if (this.isDueOn(r, current)) {
        dates.push(current);
      }
      current = this.nextDay(current);
    }

    return dates;
  }

  private isDueOn(r: RecurringTransaction, dateStr: string): boolean {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    switch (r.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return date.getUTCDay() === (r.dayOfWeek ?? 0);
      case 'monthly': {
        const dayOfMonth = r.dayOfMonth ?? 1;
        const lastDayOfMonth = new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
        ).getUTCDate();
        // If dayOfMonth > last day of month, use last day
        const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
        return date.getUTCDate() === targetDay;
      }
      default:
        return false;
    }
  }

  private nextDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}
