import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Shell, useToast } from '../../components';
import { useSiteAnalysisReport } from '../../hooks/useSiteAnalysisReport';
import { saveSiteAnalysisReportPatch } from '../../services/siteAnalysisReportService';

const SHEET_WIDTH = 1140;
const SHEET_HEIGHT = 720;
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function SolarDiagram() {
  return <svg className="solar-aspect-svg" viewBox="0 0 500 390" role="img" aria-label="Solar aspect diagram">
    <path d="M-20 282 135 214 168 228 8 297Z" fill="#d6d9d5" /><path d="M340 149 520 38" stroke="#d4d8d5" strokeWidth="18" />
    <path d="M20 180 124 106 234 126 208 228 63 203Z" fill="#fff" stroke="#aeb8b1" strokeWidth="2" transform="rotate(-11 135 168)" />
    <path d="M228 134 379 125 394 222 235 237Z" fill="#fff" stroke="#aeb8b1" strokeWidth="2" transform="rotate(-5 306 180)" />
    <path d="M145 259 316 249 331 333 124 345Z" fill="#fff" stroke="#aeb8b1" strokeWidth="2" transform="rotate(-4 230 298)" />
    <text x="101" y="162">School wing</text><text x="291" y="170">Assembly hall</text><text x="224" y="303">Covered playground</text>
    <path d="M31 170 Q246 68 470 153" fill="none" stroke="#ffbd08" strokeWidth="3" strokeDasharray="3 6" />
    <path d="M18 302 Q258 227 474 306" fill="none" stroke="#ffbd08" strokeWidth="3" strokeDasharray="3 6" />
    {[58,108,166,230,291,362,437].map((x, index) => <circle key={'summer' + x} cx={x} cy={170 - Math.abs(index - 3) * 12} r="6" fill="#ffc400" />)}
    {[54,116,178,255,334,412,476].map((x, index) => <circle key={'winter' + x} cx={x} cy={302 - Math.abs(index - 3) * 11} r="6" fill="#ffc400" />)}
    <circle cx="102" cy="349" r="8" fill="#7bc66a" /><circle cx="120" cy="354" r="8" fill="#7bc66a" /><circle cx="363" cy="336" r="10" fill="#7bc66a" /><circle cx="385" cy="330" r="7" fill="#7bc66a" />
    <text className="solar-label" x="38" y="137">Summer Solstice</text><text className="solar-time" x="38" y="154">6am</text><text className="solar-time" x="450" y="154">7pm</text>
    <text className="solar-label" x="38" y="278">Winter Solstice</text><text className="solar-time" x="38" y="323">8am</text><text className="solar-time" x="447" y="323">5pm</text>
    <path d="M461 45 l7 -19 7 19 -7 -5z" fill="#bf1421" /><text x="466" y="61" className="north">N</text>
  </svg>;
}

function EditableText({ as: Tag = 'span', value, editable, onChange, className }) {
  return <Tag className={className} contentEditable={editable} suppressContentEditableWarning={editable} onBlur={event => editable && onChange(event.currentTarget.textContent || '')}>{value}</Tag>;
}

function SolarFindings({ findings, editable, onChange }) {
  return <div className="site-report-findings"><header><span>☼</span><div><b>Solar Aspect</b><small>Facade orientation, daylight, heat gain, shading, and winter access.</small></div></header><div className="site-report-finding-grid">{findings.map((item, itemIndex) => <article key={itemIndex}><EditableText as="b" value={item[0]} editable={editable} onChange={value => onChange(itemIndex, 0, value)} /><EditableText as="p" value={item[1]} editable={editable} onChange={value => onChange(itemIndex, 1, value)} /><EditableText as="p" value={item[2]} editable={editable} onChange={value => onChange(itemIndex, 2, value)} /></article>)}</div><footer>Template requirement: test seasonal sun paths and translate orientation into clear architectural responses.</footer></div>;
}

function GenericSheet({ page, title, summary, editable, onChange }) {
  const illustrations = ['SITE CONTEXT', 'DOCUMENT INDEX', 'PLANNING OVERLAY', 'SITE TOPOGRAPHY', 'GROUND CONDITIONS', 'ACCESS AND CONNECTIONS', 'WIND RESPONSE', 'TREE SURVEY', 'NEARBY BUILT FORM', 'NEW PAGE'];
  const fallbackTitle = illustrations[Math.min(page, illustrations.length - 1)];
  return <div className="generic-analysis-sheet"><EditableText as="h2" value={title || fallbackTitle} editable={editable} onChange={value => onChange('title', value)} /><EditableText as="p" value={summary} editable={editable} onChange={value => onChange('summary', value)} /><div className="generic-sheet-map"><span /><span /><span /><i /><i /><i /></div><div className="generic-sheet-cards"><article><b>Evidence summary</b><p>Key site observations inform the emerging option and review notes.</p></article><article><b>Design response</b><p>Use the documented constraints to guide the next design gate.</p></article></div></div>;
}

function PageThumbnail({ page, index, active, onClick }) {
  return <button className={'site-report-thumb' + (active ? ' active' : '')} onClick={onClick}><small>{String(index + 1).padStart(2, '0')}</small><div><b>{page[0]}</b><span /><section><i /><i /></section></div></button>;
}

export function SiteAnalysisReportPage() {
  const toast = useToast();
  const { data: reportModel, error, reload } = useSiteAnalysisReport('e2');
  const [reportPages, setReportPages] = useState([]);
  const [page, setPage] = useState(6);
  const [modules, setModules] = useState([]);
  const [copy, setCopy] = useState({ findings: [] });
  const [pageCopy, setPageCopy] = useState({});
  const [selectedId, setSelectedId] = useState('solar');
  const [tool, setTool] = useState('select');
  const [scale, setScale] = useState(.78);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [notes, setNotes] = useState([]);
  const [saveState, setSaveState] = useState('saved');
  const dragRef = useRef(null);
  const stageRef = useRef(null);
  const hasModuleEditsRef = useRef(false);
  const saveRevisionRef = useRef(0);
  useEffect(() => () => {
    const drag = dragRef.current;
    if (!drag) return;
    window.removeEventListener('pointermove', drag.moveHandler);
    window.removeEventListener('pointerup', drag.endHandler);
    window.removeEventListener('pointercancel', drag.endHandler);
    dragRef.current = null;
  }, []);
  useEffect(() => {
    if (!reportModel) return;
    hasModuleEditsRef.current = false;
    saveRevisionRef.current = 0;
    setReportPages(clone(reportModel.pages));
    setModules(clone(reportModel.modules));
    setCopy(clone(reportModel.copy));
    setSaveState('saved');
    setPage(current => Math.min(current, reportModel.pages.length - 1));
  }, [reportModel]);
  const selected = modules.find(item => item.id === selectedId) || modules.find(item => item.visible) || modules[0];
  const visibleModules = useMemo(() => modules.filter(item => item.visible), [modules]);
  const hiddenModules = useMemo(() => modules.filter(item => !item.visible), [modules]);

  useEffect(() => {
    if (!hasModuleEditsRef.current) return undefined;
    const snapshot = clone(modules);
    const revision = saveRevisionRef.current;
    const timer = window.setTimeout(async () => {
      setSaveState('saving');
      try {
        await Promise.all(snapshot.map(module => saveSiteAnalysisReportPatch('e2', module.id, module)));
        if (revision === saveRevisionRef.current) setSaveState('saved');
      } catch (saveError) {
        if (revision === saveRevisionRef.current) {
          setSaveState('error');
          toast('Unable to save component changes. Your local edits are retained.');
        }
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [modules, toast]);

  if (!reportPages.length) {
    if (error) return <Shell active="reports"><div className="site-report-data-state error">Unable to load the site analysis report.<button type="button" onClick={reload}>Retry</button></div></Shell>;
    return <Shell active="reports"><div className="site-report-data-state">Loading site analysis report…</div></Shell>;
  }

  const markModuleEdits = () => { hasModuleEditsRef.current = true; saveRevisionRef.current += 1; setSaveState('pending'); };
  const commit = next => { setHistory(items => [...items.slice(-24), clone(modules)]); setFuture([]); markModuleEdits(); setModules(next); };
  const updateModule = (id, patch) => commit(modules.map(item => item.id === id ? { ...item, ...patch } : item));
  const undo = () => { if (!history.length) return toast('Nothing to undo'); const previous = history[history.length - 1]; setFuture(items => [clone(modules), ...items]); setHistory(items => items.slice(0, -1)); markModuleEdits(); setModules(previous); };
  const redo = () => { if (!future.length) return toast('Nothing to redo'); const next = future[0]; setHistory(items => [...items, clone(modules)]); setFuture(items => items.slice(1)); markModuleEdits(); setModules(next); };
  const changePage = value => { const next = clamp(value, 0, reportPages.length - 1); setPage(next); if (next !== 6) setSelectedId('solar'); };
  const fieldChange = (field, value) => updateModule(selected.id, { [field]: Number(value) || 0 });
  const setAlignment = type => {
    if (type === 'left') updateModule(selected.id, { x: 44 });
    if (type === 'centre') updateModule(selected.id, { x: Math.round((SHEET_WIDTH - selected.width) / 2) });
    if (type === 'right') updateModule(selected.id, { x: SHEET_WIDTH - selected.width - 44 });
    if (type === 'fit') updateModule(selected.id, { x: 44, width: SHEET_WIDTH - 88 });
  };
  const startDrag = (event, item, resize = false) => {
    if (tool !== 'select' || item.locked) return;
    event.preventDefault(); event.stopPropagation(); setSelectedId(item.id);
    const drag = { id: item.id, resize, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y, width: item.width, height: item.height, initialModules: clone(modules), moveHandler: onPointerMove, endHandler: endDrag };
    dragRef.current = drag;
    window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', endDrag, { once: true });
  };
  const onPointerMove = event => {
    const data = dragRef.current; if (!data) return; const dx = Math.round((event.clientX - data.startX) / scale); const dy = Math.round((event.clientY - data.startY) / scale);
    if (data.resize) setModules(items => items.map(item => item.id === data.id ? { ...item, width: clamp(data.width + dx, 170, SHEET_WIDTH - item.x - 18), height: clamp(data.height + dy, 130, SHEET_HEIGHT - item.y - 18) } : item));
    else setModules(items => items.map(item => item.id === data.id ? { ...item, x: clamp(data.x + dx, 12, SHEET_WIDTH - item.width - 12), y: clamp(data.y + dy, 54, SHEET_HEIGHT - item.height - 12) } : item));
  };
  const endDrag = () => {
    const drag = dragRef.current;
    if (drag) {
      setHistory(items => [...items.slice(-24), drag.initialModules]);
      setFuture([]);
      markModuleEdits();
    }
    dragRef.current = null;
    window.removeEventListener('pointermove', drag?.moveHandler || onPointerMove);
    window.removeEventListener('pointerup', drag?.endHandler || endDrag);
    window.removeEventListener('pointercancel', drag?.endHandler || endDrag);
  };
  const canvasClick = event => { if (tool !== 'note') return; const rect = event.currentTarget.getBoundingClientRect(); setNotes(items => [...items, { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }]); toast('Review note added to this page'); };
  const updateFinding = (itemIndex, valueIndex, value) => setCopy(current => ({ ...current, findings: current.findings.map((item, index) => index === itemIndex ? item.map((part, partIndex) => partIndex === valueIndex ? value : part) : item) }));
  const updateGenericCopy = (field, value) => setPageCopy(current => ({ ...current, [page]: { ...current[page], [field]: value } }));
  const currentPageCopy = pageCopy[page] || {};
  const addPage = () => {
    const nextPage = [`Custom evidence page ${reportPages.length + 1}`, 'New evidence page'];
    setReportPages(items => [...items, nextPage]);
    setPage(reportPages.length);
    setSelectedId('solar');
    toast('A new editable evidence page was added');
  };
  const exportPdf = () => {
    document.title = `${reportPages[page][0]} · Site analysis report`;
    window.print();
    toast('Print dialog opened — choose Save as PDF to export');
  };
  const shareReport = async () => {
    const shareData = { title: 'Site analysis report', text: `${reportPages[page][0]} · Cheung Sha Wan site analysis`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast('Report link shared');
        return;
      }
      await navigator.clipboard?.writeText(window.location.href);
      toast('Report link copied to clipboard');
    } catch (error) {
      if (error?.name !== 'AbortError') toast('Unable to share the report from this browser');
    }
  };

  return <Shell active="reports"><section className="site-analysis-editor">
    <header className="site-report-topline"><nav className="site-report-types"><Link to="/reports"><Icon name="layout-grid" />Overview</Link><Link className="active" to="/site-analysis-report"><Icon name="file-chart-column" />Site analysis</Link><Link to="/reports?report=massing"><Icon name="box" />Massing</Link><Link to="/reports?report=energy"><Icon name="chart" />Energy</Link></nav><div className="site-report-actions"><button onClick={shareReport}><Icon name="share-2" />Share</button><button className="export" onClick={exportPdf}><Icon name="download" />Export PDF</button></div></header>
    <div className="site-report-toolbar"><div className="history-tools"><button onClick={undo} title="Undo"><Icon name="undo-2" /></button><button onClick={redo} title="Redo"><Icon name="redo-2" /></button><i /><button onClick={() => changePage(page - 1)} title="Previous page"><Icon name="chevron-left" /></button><button onClick={() => changePage(page + 1)} title="Next page"><Icon name="chevron-right" /></button></div><div className="mode-tools"><button className={tool === 'select' ? 'active' : ''} onClick={() => setTool('select')}><Icon name="mouse-pointer-2" />Select</button><button className={tool === 'text' ? 'active' : ''} onClick={() => setTool('text')}><Icon name="file-text" />Edit text</button><button className={tool === 'note' ? 'active' : ''} onClick={() => setTool('note')}><Icon name="message-square-plus" />Note</button></div><div className="zoom-tools"><span className={'site-report-save-state ' + saveState}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : saveState === 'pending' ? 'Changes pending' : 'All changes saved'}</span><button onClick={() => setScale(value => clamp(value - .08, .52, 1.12))}><Icon name="minus" /></button><span>{Math.round(scale * 100)}%</span><button onClick={() => setScale(value => clamp(value + .08, .52, 1.12))}><Icon name="plus" /></button><button onClick={() => setScale(.78)}><Icon name="scan" />Fit</button><button onClick={() => { stageRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); toast('Page centered'); }}><Icon name="rows-2" />Center page</button></div></div>
    <div className="site-report-layout"><aside className="site-report-rail"><div className="rail-label"><span>SAR TEMPLATE</span><b>{reportPages.length} pages</b></div>{reportPages.map((reportPage, index) => <PageThumbnail key={`${reportPage[0]}-${index}`} page={reportPage} index={index} active={page === index} onClick={() => changePage(index)} />)}<button className="site-add-page" onClick={addPage}><Icon name="plus" />Add page</button></aside>
      <main className={'site-report-stage tool-' + tool} ref={stageRef} onClick={canvasClick}><div className="site-report-paper-wrap" style={{ width: SHEET_WIDTH * scale, height: SHEET_HEIGHT * scale }}><article className="site-report-paper" style={{ transform: 'scale(' + scale + ')' }}><header className="paper-header"><div><b>CHEUNG SHA WAN · SITE ANALYSIS REPORT</b><h1>{reportPages[page][0]}</h1></div><div><b>PAGE {String(page + 1).padStart(2, '0')}</b><small>{reportPages[page][1]}</small></div></header>{page === 6 ? visibleModules.map(item => <section key={item.id} className={'site-paper-module style-' + item.style.toLowerCase().replaceAll(' ', '-') + (selectedId === item.id ? ' selected' : '') + (item.border ? '' : ' no-border') + (item.heading ? '' : ' no-heading')} style={{ left: item.x, top: item.y, width: item.width, height: item.height, borderRadius: item.radius }} onPointerDown={event => startDrag(event, item)} onClick={event => { event.stopPropagation(); setSelectedId(item.id); }}><EditableText as="b" className="module-title" value={item.title} editable={tool === 'text'} onChange={value => updateModule(item.id, { title: value })} /><div className="module-content">{item.id === 'solar' ? <SolarDiagram /> : <SolarFindings findings={copy.findings} editable={tool === 'text'} onChange={updateFinding} />}</div>{selectedId === item.id && tool === 'select' && !item.locked && <span className="module-resize" onPointerDown={event => startDrag(event, item, true)} />}</section>) : <GenericSheet page={page} title={currentPageCopy.title || reportPages[page][0]} summary={currentPageCopy.summary || copy.genericSummary} editable={tool === 'text'} onChange={updateGenericCopy} />}{notes.map((note, index) => <span className="canvas-note" key={index} style={{ left: note.x, top: note.y }}><Icon name="message-square" />Note</span>)}<footer className="paper-footer"><span>A.I. SPACIOTECT · Preliminary site intelligence</span><span>Architectural Services Department · 10 Sep 2026</span></footer></article></div></main>
      <aside className="site-report-inspector"><header><b>{selected?.name || 'No component selected'}</b><small>{selected?.locked ? 'Locked' : 'Selected'}</small></header>{selected && <><section><h3>TRANSFORM</h3><div className="transform-fields">{[['X position', 'x'], ['Y position', 'y'], ['Width', 'width'], ['Height', 'height']].map(([label, field]) => <label key={field}>{label}<input type="number" value={selected[field]} onChange={event => fieldChange(field, event.target.value)} /></label>)}</div><div className="align-controls"><button onClick={() => setAlignment('left')} title="Align left"><Icon name="panel-top" /></button><button onClick={() => setAlignment('centre')} title="Align centre"><Icon name="columns-2" /></button><button onClick={() => setAlignment('right')} title="Align right"><Icon name="panel-top" /></button><button onClick={() => setAlignment('fit')} title="Fit width"><Icon name="arrow-left" /><Icon name="arrow-right" /></button></div></section><section><h3>APPEARANCE</h3><label className="inspector-label">Component style<select value={selected.style} onChange={event => updateModule(selected.id, { style: event.target.value })}><option>White card</option><option>Transparent</option><option>Muted card</option></select></label><label className="radius-control">Corner radius<button onClick={() => updateModule(selected.id, { radius: clamp(selected.radius - 1, 0, 20) })}>−</button><span>{selected.radius} px</span><button onClick={() => updateModule(selected.id, { radius: clamp(selected.radius + 1, 0, 20) })}>+</button></label><label className="switch-line">Show border<input type="checkbox" checked={selected.border} onChange={event => updateModule(selected.id, { border: event.target.checked })} /></label><label className="switch-line">Show heading<input type="checkbox" checked={selected.heading} onChange={event => updateModule(selected.id, { heading: event.target.checked })} /></label></section><section><h3>CONTENT</h3><button className="inspector-action" onClick={() => { setTool('text'); toast('Click visible text to edit it'); }}><Icon name="file-text" />Edit text in component</button><label className="switch-line">Lock component<input type="checkbox" checked={selected.locked} onChange={event => updateModule(selected.id, { locked: event.target.checked })} /></label><button className="inspector-remove" disabled={visibleModules.length <= 1 && selected.visible} onClick={() => { if (selected.visible) { updateModule(selected.id, { visible: false }); toast('Component removed. Use Restore below to bring it back.'); } else { updateModule(selected.id, { visible: true }); toast('Component restored to this report page.'); } }}>{selected.visible ? 'Remove component' : 'Restore component'}</button>{hiddenModules.length > 0 && <div className="hidden-components">{hiddenModules.map(item => <button key={item.id} onClick={() => { updateModule(item.id, { visible: true }); setSelectedId(item.id); toast(`${item.name} restored`); }}>Restore {item.name}</button>)}</div>}</section></>}</aside>
    </div>
  </section></Shell>;
}
