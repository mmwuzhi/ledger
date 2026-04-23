function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (d === todayStr) return '今天';
  if (d === yesterdayStr) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('formatDate', () => {
  it("returns '今天' for today's date", () => {
    expect(formatDate(todayStr())).toBe('今天');
  });

  it("returns '昨天' for yesterday's date", () => {
    expect(formatDate(yesterdayStr())).toBe('昨天');
  });

  it('returns M月D日 for an older date', () => {
    expect(formatDate('2026-04-20')).toBe('4月20日');
  });
});
