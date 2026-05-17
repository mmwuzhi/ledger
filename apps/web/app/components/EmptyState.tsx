import Link from 'next/link';

const TERRA = '#b5693a';

export function EmptyState({ type }: { type: 'empty' | 'no-results' }) {
  const isNoResults = type === 'no-results';

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <p className="text-stone-400 text-sm font-medium mt-1">
        {isNoResults ? '未找到相关记录' : '暂无记录'}
      </p>
      {isNoResults && (
        <p className="text-stone-300 text-xs">试试其他关键词</p>
      )}
      {!isNoResults && (
        <Link
          href="/add"
          className="mt-1 text-xs hover:underline"
          style={{ color: TERRA }}
        >
          立刻开始记账 →
        </Link>
      )}
    </div>
  );
}
