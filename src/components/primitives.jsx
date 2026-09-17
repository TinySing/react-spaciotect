import React from 'react';

const ICONS = {
  home: '⌂', folder: '▤', map: '⌖', box: '◇', chart: '▥', file: '▧', search: '⌕', bell: '♢', message: '□',
  arrow: '→', spark: '✦', school: '⌂', check: '✓', close: '×', chevron: '›', filter: '≡', sliders: '☷', plus: '+',
  sun: '☼', leaf: '❧', zap: 'ϟ', gauge: '◉', building: '▥', eye: '◉', rotate: '↻', download: '↓', refresh: '↻', layers: '▱', copy: '▣', upload: '♧',
};

export function Icon({ name, className = '' }) {
  return <span aria-hidden="true" className={`icon ${className}`}>{ICONS[name] || '•'}</span>;
}

export function EmptyState({ title, children }) {
  return <div className="empty-state"><Icon name="file" /><b>{title}</b><span>{children}</span></div>;
}

export function SectionHeader({ eyebrow, title, children }) {
  return <header className="page-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children}</div></header>;
}
