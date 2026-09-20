import React from 'react';

// Icon now renders real lucide SVGs (see icons.jsx); the legacy glyph names used
// across the app resolve through its alias table.
export { Icon } from './icons.jsx';

export function EmptyState({ title, children }) {
  return <div className="empty-state"><Icon name="file" /><b>{title}</b><span>{children}</span></div>;
}

export function SectionHeader({ eyebrow, title, children }) {
  return <header className="page-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children}</div></header>;
}
