'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Category, Transaction } from '@moneybook/core';
import type { OcrResult } from '@/app/api/ocr/route';
import { getBool, SETTINGS_KEYS } from '@/lib/settings';

// ── Design tokens (same as home page) ──────────────────────────────────────

const NUNITO = "'Nunito', 'Helvetica Neue', sans-serif";
const TERRA = '#b5693a';
const GREEN = '#2d7a4f';
const RED = '#b5402a';
const CANVAS = '#f5f0e8';

// Known system category IDs (seeded by DEFAULT_CATEGORIES_SQL)
const CAT_DAI_FU_ID = 'cat-dai-fu';
const CAT_SHOU_KUAN_ID = 'cat-shou-kuan';

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${y}年${parseInt(m)}月${parseInt(day)}日`;
}

function sanitizeAmount(val: string): string {
  const digits = val.replace(/[^\d.]/g, '');
  const parts = digits.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  if (parts[1]?.length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return digits;
}

// ── Types ────────────────────────────────────────────────────────────────────

type Attachment = { id: string; name: string; url: string; isImage: boolean };
type CurrencyOption = { code: string; symbol: string };

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AddPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());

  // 代付 linking (UI only — full DB linking deferred to a future step)
  const [linkedTxId, setLinkedTxId] = useState<string | null>(null);
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  // Settings (read from localStorage on mount)
  const [ocrAutoAttach, setOcrAutoAttach] = useState(true);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [enabledCurrencies, setEnabledCurrencies] = useState<CurrencyOption[]>([]);
  const [currency, setCurrency] = useState('CNY');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOcrAutoAttach(getBool(SETTINGS_KEYS.ocrAutoAttach, true));
    const mc = getBool(SETTINGS_KEYS.multiCurrency, false);
    setMultiCurrency(mc);
    if (mc) {
      try {
        const stored = localStorage.getItem(SETTINGS_KEYS.currencies);
        const parsed: CurrencyOption[] = stored ? JSON.parse(stored) : [];
        if (parsed.length > 0) setEnabledCurrencies(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // OCR state
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachments (stored in component state only — no DB persistence yet)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const isReimburse = catId === CAT_SHOU_KUAN_ID;

  // Fetch 代付 transactions only when 收款 is selected
  const { data: daiFuTxns = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'daiFu'],
    queryFn: () =>
      fetch(`/api/transactions?categoryId=${CAT_DAI_FU_ID}`).then((r) => r.json()),
    enabled: isReimburse,
    staleTime: 10_000,
  });

  const linkedTx = daiFuTxns.find((t) => t.id === linkedTxId);

  // ── Derived category list ──────────────────────────────────────────────────

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === txType || c.type === 'both'),
    [categories, txType]
  );

  // ── Submit mutation ────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      router.push('/');
    },
  });

  function handleSubmit() {
    if (!catId || !amount || addMutation.isPending) return;
    const payload = {
      type: txType,
      amount: parseFloat(amount),
      categoryId: catId,
      // Store as UTC midnight so date comparisons work correctly
      date: `${date}T00:00:00.000Z`,
      note: note.trim(),
      currency,
    };
    addMutation.mutate(payload);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleTypeChange(t: 'expense' | 'income') {
    setTxType(t);
    setCatId(null);
    setLinkedTxId(null);
    setShowLinkPicker(false);
  }

  function handleCatSelect(id: string) {
    const next = catId === id ? null : id;
    setCatId(next);
    if (next !== CAT_SHOU_KUAN_ID) {
      setLinkedTxId(null);
      setShowLinkPicker(false);
    }
  }

  // Auto-resize textarea
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // OCR: send image to /api/ocr → auto-fill fields
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setOcrImage(dataUrl);
      setOcrState('loading');
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (!res.ok) throw new Error(await res.text());
        const result: OcrResult = await res.json();
        if (result.amount != null) setAmount(String(result.amount));
        if (result.note) setNote(result.note);
        if (result.date) setDate(result.date);
        setOcrState('done');
        // Auto-add OCR image to attachments (respects "识别后自动添加附件" setting)
        if (ocrAutoAttach) {
          setAttachments((prev) => [
            ...prev,
            { id: Math.random().toString(36).slice(2), name: file.name, url: dataUrl, isImage: true },
          ]);
        }
      } catch {
        setOcrState('error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  function clearOcr() {
    setOcrImage(null);
    setOcrState('idle');
  }

  function handleAttachSelect(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach((file) => {
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), name: file.name, url, isImage: file.type.startsWith('image/') },
      ]);
    });
    if (attachInputRef.current) attachInputRef.current.value = '';
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Derived UI state ───────────────────────────────────────────────────────

  const amountColor = txType === 'expense' ? RED : GREEN;
  const toggleBg = txType === 'expense' ? 'rgba(181,64,42,0.08)' : 'rgba(45,122,79,0.08)';
  const canSubmit = !!catId && !!amount && parseFloat(amount) > 0 && !addMutation.isPending;

  // The symbol for the currently selected currency
  const currencySymbol =
    enabledCurrencies.find((c) => c.code === currency)?.symbol ?? '¥';

  // All currencies for picker: user's enabled list; fallback to CNY
  const allCurrencies: CurrencyOption[] =
    enabledCurrencies.length > 0 ? enabledCurrencies : [{ code: 'CNY', symbol: '¥' }];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: CANVAS, fontFamily: 'system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}
    >
    <div
      className="flex flex-col min-h-screen"
      style={{ maxWidth: 640, margin: '0 auto' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-all"
          style={{ color: TERRA, touchAction: 'manipulation' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-base font-semibold text-stone-700 tracking-tight">记一笔</span>
        <div style={{ width: 52 }} />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4">

        {/* ── Type toggle ── */}
        <div className="flex rounded-2xl p-1 transition-colors duration-300" style={{ background: toggleBg }}>
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: txType === t ? '#fff' : 'transparent',
                color: txType === t ? (t === 'expense' ? RED : GREEN) : '#a8a29e',
                boxShadow: txType === t ? '0 1px 4px rgba(90,60,30,0.10)' : 'none',
                touchAction: 'manipulation',
              }}
            >
              {t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>

        {/* ── Currency picker (only when multi-currency is enabled) ── */}
        {multiCurrency && allCurrencies.length > 1 && (
          <div className="flex gap-2 px-1">
            {allCurrencies.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setCurrency(opt.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: currency === opt.code ? `${TERRA}18` : '#fff',
                  color: currency === opt.code ? TERRA : '#a8a29e',
                  outline: currency === opt.code ? `1.5px solid ${TERRA}40` : '1.5px solid #e8e2d8',
                  touchAction: 'manipulation',
                }}
              >
                <span>{opt.symbol}</span>
                <span>{opt.code}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Amount card ── */}
        <div
          className="rounded-3xl px-5 pt-5 pb-6"
          style={{ background: '#fff', boxShadow: '0 2px 8px rgba(90,60,30,0.07), 0 6px 24px rgba(90,60,30,0.04)' }}
        >
          {/* OCR button row */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-8 h-8 rounded-xl active:scale-95 transition-all"
              style={{
                background: ocrImage ? `${TERRA}15` : '#f5f0e8',
                color: ocrImage ? TERRA : '#a8a29e',
                touchAction: 'manipulation',
              }}
              aria-label="拍照识别"
            >
              {ocrState === 'loading' ? (
                <span className="animate-spin text-sm leading-none">⏳</span>
              ) : ocrState === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : ocrState === 'error' ? (
                <span className="text-xs" style={{ color: RED }}>!</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          </div>

          {/* OCR image preview */}
          {ocrImage && (
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ocrImage} alt="receipt" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ border: `2px solid ${TERRA}30` }} />
              <p className="flex-1 text-xs text-stone-400 truncate">
                {ocrState === 'loading' ? '正在识别…' : ocrState === 'error' ? '识别失败，请手动填写' : '识别完成'}
              </p>
              <button onClick={clearOcr} className="text-stone-300 hover:text-stone-500 text-sm active:scale-95">✕</button>
            </div>
          )}

          {/* Amount input */}
          <div className="flex items-baseline justify-center gap-1">
            <span
              className="font-bold tabular-nums transition-colors duration-300"
              style={{ fontFamily: NUNITO, fontSize: 22, color: amountColor, opacity: 0.5, letterSpacing: '-0.01em' }}
            >
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              className="no-spinner bg-transparent outline-none text-center tabular-nums transition-colors duration-300 placeholder-stone-200"
              style={{
                fontFamily: NUNITO,
                fontSize: 52,
                fontWeight: 800,
                color: amount ? amountColor : '#e0d8ce',
                letterSpacing: '-0.04em',
                caretColor: amountColor,
                width: '100%',
                maxWidth: 280,
              }}
            />
          </div>
        </div>

        {/* ── Category grid ── */}
        <div className="rounded-3xl p-4" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-300 mb-3 px-1">分类</p>

          {catsLoading ? (
            <div className="py-6 text-center text-xs text-stone-300">加载中…</div>
          ) : filteredCats.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-300">暂无分类，请前往「我的」页面添加</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filteredCats.map((cat) => {
                const active = catId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCatSelect(cat.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: active ? `${TERRA}18` : '#faf8f5',
                      outline: active ? `2px solid ${TERRA}55` : '2px solid transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    <span className="text-2xl leading-none">{cat.icon}</span>
                    <span className="text-xs font-medium leading-tight" style={{ color: active ? TERRA : '#78716c' }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 收款 → 关联代付 picker */}
          {isReimburse && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f5f0e8' }}>
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-300 mb-2 px-1">
                关联代付交易（选填）
              </p>

              {linkedTx ? (
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: `${TERRA}10`, border: `1px solid ${TERRA}30` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-600 truncate">
                      🤝 {linkedTx.date.slice(0, 10)} · {linkedTx.note || '代付'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: NUNITO, color: RED }}>
                      -¥{linkedTx.amount.toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setLinkedTxId(null)} className="text-stone-300 hover:text-stone-500 text-sm active:scale-95">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLinkPicker((v) => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-stone-400 active:scale-95 transition-all"
                  style={{ background: '#faf8f5', border: '1.5px dashed #e0d8ce', touchAction: 'manipulation' }}
                >
                  <span>🔗</span>
                  <span>选择代付记录…</span>
                </button>
              )}

              {showLinkPicker && !linkedTx && (
                <div className="mt-2 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(90,60,30,0.08)' }}>
                  {daiFuTxns.length === 0 ? (
                    <div className="px-4 py-5 text-center text-xs text-stone-300 bg-white">暂无代付记录</div>
                  ) : (
                    daiFuTxns.map((tx, i) => (
                      <button
                        key={tx.id}
                        onClick={() => { setLinkedTxId(tx.id); setShowLinkPicker(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 active:scale-[0.98] transition-all text-left"
                        style={{ background: '#fff', borderTop: i > 0 ? '1px solid #f7f4ef' : 'none', touchAction: 'manipulation' }}
                      >
                        <span className="text-base">🤝</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-600 truncate">{tx.note || '代付'}</p>
                          <p className="text-xs text-stone-400">{tx.date.slice(0, 10)}</p>
                        </div>
                        <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ fontFamily: NUNITO, color: RED }}>
                          -¥{tx.amount.toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Note + Date ── */}
        <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <span className="text-stone-300 flex-shrink-0 mt-0.5">✏️</span>
            <textarea
              placeholder="备注（选填）"
              value={note}
              rows={1}
              onChange={(e) => { setNote(e.target.value); autoResize(e.target); }}
              onFocus={(e) => autoResize(e.target)}
              className="flex-1 bg-transparent text-sm text-stone-700 placeholder-stone-300 outline-none resize-none overflow-hidden leading-relaxed"
              style={{ minHeight: 24 }}
            />
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="text-stone-300 flex-shrink-0">📅</span>
            <label className="flex-1 flex items-center justify-between cursor-pointer">
              <span className="text-sm text-stone-700">{formatDisplayDate(date)}</span>
              <span className="text-xs text-stone-300">▾</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="absolute opacity-0 w-0 h-0" />
            </label>
          </div>
        </div>

        {/* ── Attachments ── */}
        <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-stone-300">附件</span>
              <button
                onClick={() => attachInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium active:scale-95 transition-all"
                style={{ background: '#f5f0e8', color: TERRA, touchAction: 'manipulation' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                添加
              </button>
              <input ref={attachInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" multiple className="hidden" onChange={handleAttachSelect} />
            </div>

            {attachments.length === 0 ? (
              <button
                onClick={() => attachInputRef.current?.click()}
                className="w-full flex items-center justify-center py-5 rounded-2xl active:scale-[0.98] transition-all"
                style={{ border: '1.5px dashed #e0d8ce', color: '#c8bfb5', touchAction: 'manipulation' }}
                aria-label="添加附件"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {attachments.map((a) => (
                  <div key={a.id} className="relative group">
                    {a.isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.url} alt={a.name} className="w-16 h-16 rounded-xl object-cover" style={{ border: '1.5px solid #f0ebe3' }} />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1" style={{ background: '#f5f0e8', border: '1.5px solid #e8e2d8' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TERRA} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="truncate w-12 text-center" style={{ fontSize: 9, color: '#78716c' }}>{a.name.split('.').pop()?.toUpperCase()}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity active:scale-95"
                      style={{ background: '#b5402a', touchAction: 'manipulation' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit error */}
        {addMutation.isError && (
          <p className="text-xs text-center px-4" style={{ color: RED }}>
            保存失败，请重试
          </p>
        )}

        <div className="h-4" />
      </div>

      {/* ── Sticky submit ── */}
      <div
        className="sticky bottom-0 px-4 py-4"
        style={{
          background: `${CANVAS}f0`,
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(232,226,216,0.8)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all active:scale-95"
          style={{
            background: canSubmit ? TERRA : '#d6cec4',
            boxShadow: canSubmit ? `0 4px 16px ${TERRA}44` : 'none',
            touchAction: 'manipulation',
          }}
        >
          {addMutation.isPending ? '保存中…' : '＋ 记一笔'}
        </button>
      </div>
    </div>
    </div>
  );
}
