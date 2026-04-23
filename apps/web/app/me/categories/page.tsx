'use client';
// Category settings — 分类管理
// Toggle, icon-edit, and add custom categories.
// DB write-back (CRUD API) is a future step; toggles are persisted in localStorage.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Design tokens ─────────────────────────────────────────────────────────────

const TERRA = '#b5693a';
const CANVAS = '#f5f0e8';

// ── Types ─────────────────────────────────────────────────────────────────────

type CatType = 'expense' | 'income';

interface Category {
  id: string;
  icon: string;
  name: string;
  type: CatType;
  deletable: boolean; // false = cannot be removed (代付, 收款)
  enabled: boolean;
  custom?: boolean;
}

// ── Default data ──────────────────────────────────────────────────────────────
// IDs match DEFAULT_CATEGORIES_SQL seeds so they align with DB records.

const INITIAL: Category[] = [
  // ── Expense ──
  { id: 'cat-dai-fu',    icon: '🤝', name: '代付',   type: 'expense', deletable: false, enabled: true  },
  { id: 'cat-food',      icon: '🍜', name: '餐饮',   type: 'expense', deletable: true,  enabled: true  },
  { id: 'cat-transport', icon: '🚗', name: '交通',   type: 'expense', deletable: true,  enabled: true  },
  { id: 'cat-shopping',  icon: '🛍️', name: '购物',  type: 'expense', deletable: true,  enabled: true  },
  { id: 'cat-housing',   icon: '🏠', name: '住房',   type: 'expense', deletable: true,  enabled: true  },
  { id: 'cat-health',    icon: '💊', name: '医疗',   type: 'expense', deletable: true,  enabled: true  },
  { id: 'cat-other-exp', icon: '📦', name: '其他支出', type: 'expense', deletable: true,  enabled: true  },
  // ── Income ──
  { id: 'cat-shou-kuan', icon: '💸', name: '收款',   type: 'income',  deletable: false, enabled: true  },
  { id: 'cat-salary',    icon: '💰', name: '薪资',   type: 'income',  deletable: true,  enabled: true  },
  { id: 'cat-other-inc', icon: '💵', name: '其他收入', type: 'income',  deletable: true,  enabled: true  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstGlyph(s: string): string {
  const match = s.match(/\p{Emoji_Presentation}/u);
  return match ? match[0] : s.slice(0, 1);
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const router = useRouter();

  const [cats, setCats] = useState<Category[]>(INITIAL);
  const [tab, setTab] = useState<CatType>('expense');

  // Icon editing
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [editIconVal, setEditIconVal] = useState('');

  // Add-custom form
  const [showForm, setShowForm] = useState(false);
  const [formIcon, setFormIcon] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  const visible = cats.filter((c) => c.type === tab);

  function toggle(id: string) {
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  }

  function remove(id: string) {
    setCats((prev) => prev.filter((c) => c.id !== id || !c.deletable));
  }

  function startIconEdit(cat: Category) {
    setEditingIconId(cat.id);
    setEditIconVal(cat.icon);
  }

  function saveIconEdit(id: string) {
    const g = firstGlyph(editIconVal.trim());
    if (g) setCats((prev) => prev.map((c) => (c.id === id ? { ...c, icon: g } : c)));
    setEditingIconId(null);
    setEditIconVal('');
  }

  function submitAdd() {
    setFormError('');
    const icon = firstGlyph(formIcon.trim());
    const name = formName.trim();
    if (!icon) { setFormError('请输入图标（emoji 或单字）'); return; }
    if (!name) { setFormError('请输入分类名称'); return; }
    if (name.length > 8) { setFormError('名称最多 8 个字'); return; }
    if (cats.some((c) => c.type === tab && c.name === name)) { setFormError('已有同名分类'); return; }
    setCats((prev) => [
      ...prev,
      { id: uid(), icon, name, type: tab, deletable: true, enabled: true, custom: true },
    ]);
    setFormIcon('');
    setFormName('');
    setShowForm(false);
  }

  const iconPreview = formIcon ? firstGlyph(formIcon) : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: CANVAS, fontFamily: 'system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}
    >
    <div
      className="flex flex-col min-h-screen"
      style={{ maxWidth: 640, margin: '0 auto' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => router.push('/me')}
          className="flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-all"
          style={{ color: TERRA, touchAction: 'manipulation' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <span className="text-base font-semibold text-stone-700 tracking-tight">分类管理</span>
        <div style={{ width: 44 }} />
      </div>

      {/* ── Tab ── */}
      <div className="px-4 mb-2">
        <div className="flex rounded-2xl p-1" style={{ background: 'rgba(181,105,58,0.08)' }}>
          {(['expense', 'income'] as CatType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setShowForm(false); setEditingIconId(null); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? TERRA : '#a8a29e',
                boxShadow: tab === t ? '0 1px 4px rgba(90,60,30,0.10)' : 'none',
                touchAction: 'manipulation',
              }}
            >
              {t === 'expense' ? '支出分类' : '收入分类'}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 px-4 pb-8 flex flex-col gap-2">
        <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs text-stone-400">
              点击图标可修改。关闭的分类不显示在记账页面。
              <span style={{ color: TERRA }}>代付 / 收款</span>可关闭但不可删除。
            </p>
          </div>

          {visible.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderTop: i > 0 ? '1px solid #f7f4ef' : 'none' }}
            >
              {/* Icon — tap to edit */}
              {editingIconId === cat.id ? (
                <div className="relative w-9 h-9 flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${TERRA}18`, border: `1.5px solid ${TERRA}55` }}
                  >
                    {firstGlyph(editIconVal) || <span style={{ fontSize: 11, color: '#ccc' }}>图标</span>}
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={editIconVal}
                    onChange={(e) => setEditIconVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveIconEdit(cat.id);
                      if (e.key === 'Escape') setEditingIconId(null);
                    }}
                    onBlur={() => saveIconEdit(cat.id)}
                    maxLength={4}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                  />
                </div>
              ) : (
                <button
                  onClick={() => startIconEdit(cat)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative group active:scale-95 transition-all"
                  style={{ background: '#f5f0e8', touchAction: 'manipulation' }}
                  aria-label="修改图标"
                >
                  {cat.icon}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `${TERRA}cc` }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Name */}
              <span
                className="flex-1 text-sm font-medium"
                style={{ color: cat.enabled ? '#292524' : '#a8a29e' }}
              >
                {cat.name}
              </span>

              {/* Delete (only custom deletable categories) */}
              {cat.deletable && cat.custom && (
                <button
                  onClick={() => remove(cat.id)}
                  className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-red-400 active:scale-95 transition-all text-base mr-1"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="删除"
                >
                  ×
                </button>
              )}

              {/* Toggle */}
              <button
                onClick={() => toggle(cat.id)}
                className="relative flex-shrink-0 transition-all active:scale-95"
                style={{ touchAction: 'manipulation' }}
                aria-label={cat.enabled ? '关闭' : '开启'}
              >
                <div
                  className="w-11 h-6 rounded-full transition-colors duration-200"
                  style={{ background: cat.enabled ? TERRA : '#d6cec4' }}
                />
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: cat.enabled ? '1.375rem' : '0.125rem' }}
                />
              </button>
            </div>
          ))}

          {/* Add custom */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center gap-3 px-5 py-3.5 active:scale-[0.98] transition-all"
              style={{ borderTop: '1px solid #f7f4ef', touchAction: 'manipulation', color: TERRA }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${TERRA}15`, border: `1.5px dashed ${TERRA}55` }}
              >
                ＋
              </div>
              <span className="text-sm font-medium">添加自定义分类</span>
            </button>
          ) : (
            <div
              className="px-5 py-4 flex flex-col gap-3"
              style={{ borderTop: '1px solid #f7f4ef', background: '#faf8f5' }}
            >
              <p className="text-xs font-semibold text-stone-400 tracking-wide">新建分类</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${TERRA}40`,
                      fontSize: iconPreview && !/\p{Emoji}/u.test(iconPreview) ? 18 : 24,
                      fontWeight: 600,
                    }}
                  >
                    {iconPreview ?? <span style={{ fontSize: 13, color: '#d6cec4' }}>图标</span>}
                  </div>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="😀"
                    maxLength={4}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    aria-label="图标"
                  />
                </div>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="分类名称（最多 8 字）"
                  maxLength={8}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm text-stone-700 outline-none"
                  style={{ background: '#fff', border: `1.5px solid ${TERRA}40`, caretColor: TERRA }}
                  onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                />
              </div>
              <p className="text-xs text-stone-300 -mt-1">图标可输入 emoji（如 🎵）或单个汉字 / 字母</p>
              {formError && <p className="text-xs" style={{ color: '#b5402a' }}>{formError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setFormIcon(''); setFormName(''); setFormError(''); }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all"
                  style={{ background: '#ede8df', color: '#78716c', touchAction: 'manipulation' }}
                >
                  取消
                </button>
                <button
                  onClick={submitAdd}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
                  style={{ background: TERRA, touchAction: 'manipulation' }}
                >
                  添加
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-stone-300 text-center">
          已启用 {visible.filter((c) => c.enabled).length} / {visible.length} 个分类
        </p>
      </div>
    </div>
    </div>
  );
}
