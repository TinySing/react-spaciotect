import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components';

export function QuickAction({ icon, title, path }) {
  return <Link className="quick-action" to={path}><Icon name={icon} /><b>{title}</b></Link>;
}

export function Event({ title, time, children, warning = false, message = false }) {
  return <article className={`event ${warning ? 'warning' : ''} ${message ? 'message' : ''}`.trimEnd()}><span className="event-dot" /><div className="event-head"><b>{title}</b><time>{time}</time></div><p>{children}</p></article>;
}

export function Kpi({ icon, label, value, unit, note }) { return <article className="energy-kpi"><Icon name={icon} /><span>{label}</span><strong>{value}</strong><small>{unit}</small><em>{note}</em></article>; }

export function DetailPanel({ title, score, children }) { return <article className="energy-detail-panel"><header><h2>{title}</h2>{score && <span>{score}</span>}</header>{children}</article>; }

export function BarRow({ label, value, percent, color, active = false, onClick }) {
  const handleKeyDown = event => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };
  return <div className={`bar-row ${active ? 'active' : ''}`} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={handleKeyDown}><span>{label}</span><i style={{ '--bar-width': `${percent}%`, '--bar-color': `var(--${color})` }} /><b>{value} GWh</b></div>;
}

export function SiteContextPills({ value, onChange }) {
  return <div className="context-pills" role="toolbar" aria-label="Site context"><span>Context</span>{['Map', 'Surroundings', 'OZP zones', 'Height restriction'].map(name => <button key={name} className={value === name ? 'active' : ''} onClick={() => onChange(name)}>{name}</button>)}</div>;
}
