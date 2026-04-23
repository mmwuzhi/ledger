type Item = { id: string; date: string; [key: string]: unknown };

function groupByDate(items: Item[]) {
  const map = new Map<string, Item[]>();
  for (const t of items) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  return [...map.entries()];
}

const makeItem = (id: string, date: string): Item => ({ id, date });

describe('groupByDate', () => {
  it('groups items across 2 distinct dates into 2 groups', () => {
    const items = [
      makeItem('1', '2026-04-22'),
      makeItem('2', '2026-04-22'),
      makeItem('3', '2026-04-21'),
    ];
    const result = groupByDate(items);
    expect(result).toHaveLength(2);
    expect(result[0][0]).toBe('2026-04-22');
    expect(result[0][1]).toHaveLength(2);
    expect(result[1][0]).toBe('2026-04-21');
    expect(result[1][1]).toHaveLength(1);
  });

  it('preserves insertion order within a group', () => {
    const items = [makeItem('a', '2026-04-22'), makeItem('b', '2026-04-22'), makeItem('c', '2026-04-22')];
    const result = groupByDate(items);
    expect(result[0][1].map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty input', () => {
    expect(groupByDate([])).toHaveLength(0);
  });
});
