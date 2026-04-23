export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📒',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'both')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    image_uri TEXT NOT NULL,
    ocr_result TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    note TEXT NOT NULL DEFAULT '',
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
    day_of_week INTEGER,
    day_of_month INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT,
    last_generated_date TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    note TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    receipt_id TEXT REFERENCES receipts(id),
    recurring_id TEXT REFERENCES recurring_transactions(id),
    book_id TEXT NOT NULL DEFAULT 'default' REFERENCES books(id),
    currency TEXT NOT NULL DEFAULT 'CNY',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id TEXT NOT NULL REFERENCES transactions(id),
    tag_id TEXT NOT NULL REFERENCES tags(id),
    PRIMARY KEY (transaction_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS quick_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    note TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'CNY',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    amount REAL NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(category_id, year, month)
  );
`;

export const DEFAULT_BOOK_SQL = `
  INSERT OR IGNORE INTO books (id, name, icon, created_at, updated_at) VALUES
    ('default', '默认账本', '📒', datetime('now'), datetime('now'));
`;

export const DEFAULT_CATEGORIES_SQL = `
  INSERT OR IGNORE INTO categories (id, name, icon, type, created_at, updated_at) VALUES
    ('cat-food',       '餐饮',   '🍜', 'expense', datetime('now'), datetime('now')),
    ('cat-transport',  '交通',   '🚗', 'expense', datetime('now'), datetime('now')),
    ('cat-shopping',   '购物',   '🛍️', 'expense', datetime('now'), datetime('now')),
    ('cat-health',     '医疗',   '💊', 'expense', datetime('now'), datetime('now')),
    ('cat-housing',    '住房',   '🏠', 'expense', datetime('now'), datetime('now')),
    ('cat-salary',     '薪资',   '💰', 'income',  datetime('now'), datetime('now')),
    ('cat-other-exp',  '其他支出','📦', 'expense', datetime('now'), datetime('now')),
    ('cat-other-inc',  '其他收入','💵', 'income',  datetime('now'), datetime('now')),
    -- Special system categories: cannot be deleted, only toggled
    ('cat-dai-fu',     '代付',   '🤝', 'expense', datetime('now'), datetime('now')),
    ('cat-shou-kuan',  '收款',   '💸', 'income',  datetime('now'), datetime('now'));
`;
