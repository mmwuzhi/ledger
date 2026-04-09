import { Transaction, Category, Budget } from '../models';
import { BudgetProgress } from '../hooks/useBudgets';

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'txn-1',
  type: 'expense',
  amount: 100,
  categoryId: 'cat-1',
  note: '',
  date: '2024-01-15T12:00:00.000Z',
  receiptId: null,
  recurringId: null,
  bookId: 'default',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  deletedAt: null,
  ...overrides,
});

const makeCategory = (overrides: Partial<Category>): Category => ({
  id: 'cat-1',
  name: '餐饮',
  icon: '🍜',
  type: 'expense',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  ...overrides,
});

const makeBudget = (overrides: Partial<Budget>): Budget => ({
  id: 'budget-1',
  categoryId: null,
  amount: 1000,
  year: 2024,
  month: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Computes budget progress the same way useBudgetProgress does.
 */
function computeBudgetProgress(
  budgets: Budget[],
  expenses: Transaction[],
  categories: Category[],
): BudgetProgress[] {
  if (budgets.length === 0) return [];

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

  return budgets.map(budget => {
    let spentAmount: number;
    let categoryName: string;
    let categoryIcon: string;

    if (budget.categoryId === null) {
      spentAmount = expenses.reduce((sum, t) => sum + t.amount, 0);
      categoryName = '总预算';
      categoryIcon = '💰';
    } else {
      spentAmount = expenses
        .filter(t => t.categoryId === budget.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      const cat = categoryMap[budget.categoryId];
      categoryName = cat?.name ?? '未知';
      categoryIcon = cat?.icon ?? '📦';
    }

    const percentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      categoryName,
      categoryIcon,
      budgetAmount: budget.amount,
      spentAmount,
      percentage,
      isOverBudget: spentAmount > budget.amount,
    };
  }).sort((a, b) => {
    if (a.categoryId === null) return -1;
    if (b.categoryId === null) return 1;
    return b.percentage - a.percentage;
  });
}

describe('Budget progress calculation', () => {
  const categories = [
    makeCategory({ id: 'cat-food', name: '餐饮', icon: '🍜' }),
    makeCategory({ id: 'cat-transport', name: '交通', icon: '🚗' }),
    makeCategory({ id: 'cat-shopping', name: '购物', icon: '🛍️' }),
  ];

  it('correctly sums all expenses for overall budget', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: null, amount: 5000 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 200 }),
      makeTransaction({ id: 't2', categoryId: 'cat-transport', amount: 300 }),
      makeTransaction({ id: 't3', categoryId: 'cat-shopping', amount: 500 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('总预算');
    expect(result[0].categoryIcon).toBe('💰');
    expect(result[0].spentAmount).toBe(1000);
    expect(result[0].budgetAmount).toBe(5000);
    expect(result[0].percentage).toBe(20);
    expect(result[0].isOverBudget).toBe(false);
  });

  it('only sums matching category expenses for category budget', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-food', amount: 500 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 100 }),
      makeTransaction({ id: 't2', categoryId: 'cat-food', amount: 150 }),
      makeTransaction({ id: 't3', categoryId: 'cat-transport', amount: 300 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('餐饮');
    expect(result[0].spentAmount).toBe(250);
    expect(result[0].budgetAmount).toBe(500);
    expect(result[0].percentage).toBe(50);
    expect(result[0].isOverBudget).toBe(false);
  });

  it('calculates percentage correctly', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-food', amount: 300 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 225 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result[0].percentage).toBe(75);
  });

  it('sets isOverBudget flag when spent exceeds budget', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-food', amount: 200 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 150 }),
      makeTransaction({ id: 't2', categoryId: 'cat-food', amount: 100 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result[0].spentAmount).toBe(250);
    expect(result[0].percentage).toBe(125);
    expect(result[0].isOverBudget).toBe(true);
  });

  it('returns empty array when no budgets exist', () => {
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 100 }),
    ];

    const result = computeBudgetProgress([], expenses, categories);
    expect(result).toHaveLength(0);
  });

  it('sorts overall budget first, then by percentage descending', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-food', amount: 1000 }),
      makeBudget({ id: 'b2', categoryId: null, amount: 5000 }),
      makeBudget({ id: 'b3', categoryId: 'cat-transport', amount: 200 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 100 }),       // 10%
      makeTransaction({ id: 't2', categoryId: 'cat-transport', amount: 150 }),   // 75%
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result).toHaveLength(3);
    // Overall budget first
    expect(result[0].categoryId).toBeNull();
    expect(result[0].categoryName).toBe('总预算');
    // Then by percentage descending: transport (75%) before food (10%)
    expect(result[1].categoryName).toBe('交通');
    expect(result[1].percentage).toBe(75);
    expect(result[2].categoryName).toBe('餐饮');
    expect(result[2].percentage).toBe(10);
  });

  it('handles unknown category gracefully', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-unknown', amount: 500 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-unknown', amount: 100 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result[0].categoryName).toBe('未知');
    expect(result[0].categoryIcon).toBe('📦');
    expect(result[0].spentAmount).toBe(100);
  });

  it('returns zero percentage when no expenses match category', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-shopping', amount: 1000 }),
    ];
    const expenses = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 500 }),
    ];

    const result = computeBudgetProgress(budgets, expenses, categories);
    expect(result[0].spentAmount).toBe(0);
    expect(result[0].percentage).toBe(0);
    expect(result[0].isOverBudget).toBe(false);
  });
});
