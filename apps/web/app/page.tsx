'use client';
import { useState } from 'react';
import PocA from './components/PocA';
import PocD from './components/PocD';
import PocE from './components/PocE';
import PocF from './components/PocF';

const POCS = [
  { key: 'A', label: 'A 原版', component: PocA },
  { key: 'D', label: 'D 宽松手账', component: PocD },
  { key: 'E', label: 'E 暖卡片', component: PocE },
  { key: 'F', label: 'F 侧栏总览', component: PocF },
];

export default function Page() {
  const [active, setActive] = useState('D');
  const { component: Active } = POCS.find((p) => p.key === active)!;

  return (
    <div>
      {/* POC switcher */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1 bg-black/70 backdrop-blur rounded-full px-2 py-1.5 shadow-xl">
        {POCS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: active === p.key ? '#fff' : 'transparent',
              color: active === p.key ? '#000' : 'rgba(255,255,255,0.6)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
