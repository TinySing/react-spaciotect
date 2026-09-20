// Schedule-of-accommodation dialog, ported from the mockup's studio-soa.js.
// The mockup prepended a trigger to .studio-actions and appended a <dialog> to
// <body>; here StudioNavigation renders this component inside .studio-actions.
// The React port always has HKSchoolStudio, so it uses the v2 storage key and
// the HKSchool schedule definitions.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/icons.jsx';
import { HKSchoolStudio } from '../adapters/hkSchoolAdapter.js';

const definitions = HKSchoolStudio.scheduleDefinitions.map(([name, group, quantity, area, categories], index) => ({ id: index, name, group, quantity, area, categories }));
const groups = [...new Set(definitions.map(row => row.group))];

// Shared with the studio pages: the current design option, read at dialog-open
// time exactly as the mockup read `.studio-view.active .outcome-option`.
let currentOption = 'C';
export function setCurrentOption(option) { if (option) currentOption = option; }

const format = value => value == null ? 'TBC' : value.toLocaleString('en', { maximumFractionDigits: 1 });

const baseline = () => definitions.map(row => ({ ...row }));
const valid = rows => Array.isArray(rows) && rows.length === definitions.length && rows.every((row, index) => row.id === index && ['quantity', 'area'].every(field => row[field] === null || typeof row[field] === 'number' && Number.isFinite(row[field]) && row[field] >= (field === 'area' ? .1 : 0) && row[field] <= 100000 && (field !== 'quantity' || Number.isInteger(row[field]))));

function readProject() {
  try { return JSON.parse(localStorage.getItem('spaciotectProject')) || 'e2'; } catch { return 'e2'; }
}
function readProjectName() {
  try {
    const stored = JSON.parse(localStorage.getItem('spaciotectProject'));
    if (stored) return { e2: 'Anderson Road', p1: 'Queen’s Hill Estate', p2: 'Tai Po Schoolhouse', p3: 'Sham Shui Po Works' }[stored] || 'Anderson Road';
  } catch { /* fall through */ }
  return 'Anderson Road';
}
function loadSaved(storageKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && valid(stored.rows) && Number.isInteger(stored.revision) && stored.revision >= 0)
      return { revision: stored.revision, rows: baseline().map((row, index) => ({ ...row, quantity: stored.rows[index].quantity, area: stored.rows[index].area })) };
  } catch { /* baseline */ }
  return { revision: 0, rows: baseline() };
}

function collectModel(option) {
  const model = {};
  const data = HKSchoolStudio.getRooms(option);
  if (!data?.Spaces) return model;
  definitions.forEach((definition, index) => {
    const spaces = data.Spaces.filter(space => definition.categories.includes(space.Category));
    let complete = true;
    const netArea = spaces.reduce((total, space) => {
      const points = space.Geometry?.Curve?.ControlPoints;
      if (!points || points.length < 3) { complete = false; return total; }
      return total + Math.abs(points.reduce((sum, point, pointIndex) => {
        const next = points[(pointIndex + 1) % points.length];
        return sum + point.X * next.Y - next.X * point.Y;
      }, 0)) / 2;
    }, 0);
    model[index] = { quantity: spaces.length, area: complete ? netArea : null };
  });
  return model;
}

function comparison(row, model) {
  const actual = model[row.id];
  if (!actual) return ['Model unavailable', ''];
  if (row.quantity == null) return ['Target TBC', ''];
  if (actual.quantity !== row.quantity) return [`${actual.quantity > row.quantity ? '+' : ''}${actual.quantity - row.quantity} rooms`, 'soa-gap'];
  if (row.area == null || actual.area == null) return ['Area TBC', ''];
  const gap = actual.area - row.quantity * row.area;
  return gap < -.1 ? [`${format(gap)} m²`, 'soa-gap'] : ['Totals aligned', 'soa-match'];
}

export function SoaDialog() {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const [project] = useState(readProject);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => baseline());
  const [saved, setSaved] = useState(() => loadSaved(`spaciotect-soa-v2-${project}`));
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [showDiscard, setShowDiscard] = useState(false);
  const [contextText, setContextText] = useState('');
  const model = useMemo(() => collectModel(currentOption), [open]);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  function requestClose() {
    if (dirty) { setShowDiscard(true); return; }
    dialogRef.current?.close();
    setOpen(false);
    triggerRef.current?.focus();
  }

  function openDialog() {
    setDraft(structuredClone(saved.rows));
    setDirty(false);
    setShowDiscard(false);
    setSearch('');
    setGroup('');
    setContextText(`${readProjectName()} · OPT-${currentOption}`);
    setOpen(true);
  }

  function save() {
    if (!valid(draft)) return;
    const next = { revision: saved.revision + 1, rows: structuredClone(draft) };
    try { localStorage.setItem(`spaciotect-soa-v2-${project}`, JSON.stringify(next)); }
    catch { return; }
    setSaved(next);
    setDirty(false);
    setShowDiscard(false);
  }

  const known = draft.filter(row => row.quantity != null && row.area != null);
  const quantity = draft.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const area = known.reduce((sum, row) => sum + row.quantity * row.area, 0);
  const canSave = dirty && valid(draft);

  const rows = draft.filter(row => `${row.name} ${row.categories.join(' ')}`.toLowerCase().includes(search.toLowerCase()) && (!group || row.group === group));

  function editRow(id, field, value) {
    setDraft(current => {
      const next = current.map(row => row.id === id ? { ...row, [field]: value === '' ? null : Number(value) } : row);
      setDirty(JSON.stringify(next) !== JSON.stringify(saved.rows));
      return next;
    });
  }

  return (
    <>
      <button ref={triggerRef} className="secondary studio-soa-trigger" type="button" title="Schedule of accommodation" aria-haspopup="dialog" data-pending={String(saved.revision > 0)} disabled={project !== 'e2'} onClick={openDialog}>
        <Icon name="table-properties" />SoA
      </button>
      <dialog ref={dialogRef} className="soa-dialog" aria-labelledby="soa-title" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestClose(); } }} onCancel={event => { event.preventDefault(); requestClose(); }}>
        <header>
          <div>
            <h2 id="soa-title">Schedule of accommodation</h2>
            <p>{contextText}</p>
          </div>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Close schedule" title="Close schedule"><Icon name="x" /></button>
        </header>
        <div className="soa-summary" aria-live="polite">
          <span>Scheduled quantity<strong>{format(quantity)}</strong></span>
          <span>Known target area / m²<strong>{format(area)}</strong></span>
          <span>Incomplete targets<strong>{draft.length - known.length}</strong></span>
          <span>Schedule<strong>{saved.revision ? `Revision ${saved.revision}` : 'Baseline'}</strong></span>
        </div>
        <div className="soa-filters">
          <label className="soa-search"><Icon name="search" /><input type="search" placeholder="Find accommodation" aria-label="Find accommodation" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <select aria-label="Programme group" value={group} onChange={event => setGroup(event.target.value)}>
            <option value="">All programmes</option>
            {groups.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="soa-table-wrap">
          <table className="soa-table">
            <thead><tr><th scope="col">Accommodation</th><th scope="col">Quantity</th><th scope="col">Unit area / m²</th><th scope="col">Target / m²</th><th scope="col">Model qty / m²</th><th scope="col">Comparison</th></tr></thead>
            <tbody>
              {rows.map(row => {
                const actual = model[row.id];
                const [message, style] = comparison(row, model);
                return (
                  <tr key={row.id}>
                    <td>{row.name}<small>{row.group}{definitions[row.id].quantity == null ? ' · Model-only' : ''}</small></td>
                    <td><input type="number" min="0" max="100000" step="1" placeholder="TBC" data-field="quantity" aria-label={`${row.name} quantity`} value={row.quantity ?? ''} onChange={event => editRow(row.id, 'quantity', event.target.value)} /></td>
                    <td><input type="number" min="0.1" max="100000" step="0.1" placeholder="TBC" data-field="area" aria-label={`${row.name} unit area`} value={row.area ?? ''} onChange={event => editRow(row.id, 'area', event.target.value)} /></td>
                    <td data-target>{format(row.quantity == null || row.area == null ? null : row.quantity * row.area)}</td>
                    <td>{actual ? `${actual.quantity}<small>${format(actual.area)} m²</small>` : 'Unavailable'}</td>
                    <td data-comparison className={style}>{message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="soa-empty" hidden={rows.length > 0}>No matching accommodation</div>
        </div>
        <p className="soa-notes">Reference: EDB 30-classroom schedule and approved NOFA in SoA_8446.pdf. TBC = no supplied target. Comparisons use live room counts and polygon areas, not GFA or compliance. Saved targets do not automatically regenerate geometry.</p>
        <div className="soa-discard" hidden={!showDiscard}>
          <span>Discard unsaved changes?</span>
          <button className="secondary" onClick={() => setShowDiscard(false)}>Keep editing</button>
          <button className="secondary" onClick={() => { setDirty(false); requestClose(); }}>Discard changes</button>
        </div>
        <footer>
          <span className="soa-save-status" role="status">{dirty ? 'Unsaved changes' : saved.revision ? 'Saved locally · Model update pending' : 'Baseline · Existing model'}</span>
          <button className="secondary" onClick={requestClose}>Cancel</button>
          <button className="primary" onClick={save} disabled={!canSave}><Icon name="save" />Save SoA</button>
        </footer>
      </dialog>
    </>
  );
}

export default SoaDialog;
