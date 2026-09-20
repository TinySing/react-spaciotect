import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StudioFrame, useToast } from '../../components';
import { useStudioModel } from '../../hooks/useStudioModel';
import { ModelSourcePanel, ThreeMassingViewport } from '../shared';
import { MODEL_FILES } from './constants';

const STUDIO_OPTIONS = {
  A: { title: 'L-shaped school', descriptor: 'Site E-2 · Preliminary massing', storeys: 6, height: '23.8 m', allocated: 8500, site: 7031, ground: 2540, upper: 5960, outside: 4491 },
  B: { title: 'Parallel wings school', descriptor: 'Site E-2 · Preliminary massing', storeys: 6, height: '23.8 m', allocated: 8820, site: 7031, ground: 2580, upper: 6240, outside: 4451 },
  C: { title: 'Courtyard school', descriptor: 'Site E-2 · Preliminary massing', storeys: 6, height: '23.8 m', allocated: 9053, site: 7031, ground: 2632, upper: 6420, outside: 4398 },
};

const TOOL_ITEMS = [
  ['Select', 'mouse-pointer-2'], ['Extrude', 'move-up'], ['Bend', 'corner-up-right'], ['Chamfer', 'ruler'],
  ['Subtract', 'square-minus'], ['Offset', 'move-3d'], ['Clip', 'scissors'], ['Merge', 'combine'],
];

export function MassingStudio() {
  const [option, setOption] = useState('C');
  const [context, setContext] = useState(true);
  const [tool, setTool] = useState('Select');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState('site_design_geo_OPT-C.json');
  const [shadows, setShadows] = useState(true);
  const [levels, setLevels] = useState(6);
  const [representation, setRepresentation] = useState('3D');
  const [viewRevision, setViewRevision] = useState(0);
  const [selectedMass, setSelectedMass] = useState(null);
  const [edits, setEdits] = useState({});
  const navigate = useNavigate();
  const toast = useToast();
  const { data: studioModel, loading, error, reload } = useStudioModel('e2', option);
  const hasCurrentOption = studioModel?.option?.id === `OPT-${option}`;
  const current = hasCurrentOption ? studioModel.massing.summary : STUDIO_OPTIONS[option];
  const allocation = (current.ground / current.site * 100).toFixed(1);
  const resetView = () => {
    setTool('Select');
    setRepresentation('3D');
    setLevels(6);
    setSelectedMass(null);
    setEdits({});
    setViewRevision(value => value + 1);
    toast('Massing view reset');
  };
  const chooseOption = next => {
    setOption(next);
    setSourceFile(`site_design_geo_OPT-${next}.json`);
    setSelectedMass(null);
    setEdits({});
    setViewRevision(value => value + 1);
    toast(`OPT-${next} geometry loaded`);
  };
  const chooseTool = name => {
    setTool(name);
    toast(name === 'Select' ? 'Select a mass to inspect it' : `${name}: click a mass to apply`);
  };
  const exportImage = () => {
    const canvas = document.querySelector('.massing-prototype .three-massing-viewport canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `site-massing-opt-${option}.png`;
    link.click();
    toast('Massing image downloaded');
  };
  const onMassPick = useCallback((mass, activeTool) => {
    setSelectedMass(mass);
    if (activeTool === 'Select') return;
    setEdits(currentEdits => ({ ...currentEdits, [mass.id]: { type: activeTool } }));
    toast(`${activeTool} applied to ${mass.label}`);
  }, [toast]);
  const effectiveCamera = representation === 'Plan' ? 'Top' : representation === 'Front' ? 'Front' : 'Perspective';

  return <StudioFrame active="massing">
    <div className="studio-content massing-content massing-prototype">
      <div className="studio-canvas-wrap">
        <div className="canvas-toolbar massing-option-bar">
          <label>Design option<select value={option} onChange={event => chooseOption(event.target.value)}><option value="A">OPT-A · L-shaped</option><option value="B">OPT-B · Parallel wings</option><option value="C">OPT-C · U-shaped</option></select></label>
          <button type="button" className="massing-toolbar-reset" title="Reset massing view" aria-label="Reset massing view" onClick={resetView}><Icon name="rotate-ccw" /></button>
        </div>
        <div className={`massing-stage ${context ? '' : 'context-hidden'} ${shadows ? '' : 'shadows-off'}`}>
          {loading && <div className="studio-data-state">Loading massing model…</div>}
          {error && <div className="studio-data-state error">Unable to load the massing model.<button type="button" onClick={reload}>Retry</button></div>}
          {hasCurrentOption && <ThreeMassingViewport site={studioModel.massing.site} context={context} visibleLevels={levels} shadows={shadows} representation={representation} cameraMode={effectiveCamera} resetKey={viewRevision} activeTool={tool} selectedMassId={selectedMass?.id} edits={edits} onMassPick={onMassPick} />}
          <div className="massing-controls" role="toolbar" aria-label="Massing operations">{TOOL_ITEMS.map(([name, icon]) => <button type="button" key={name} onClick={() => chooseTool(name)} className={tool === name ? 'active' : ''} title={name} aria-label={name}><Icon name={icon} /></button>)}</div>
          {context && <div className="site-context-note">Map context · indicative site boundary · provisional north</div>}
          <div className="stage-north">N<b>↑</b><small>provisional</small></div>
          <div className="massing-operation-status"><b>{tool}</b>{selectedMass ? ` · ${selectedMass.label}` : tool === 'Select' ? ' · click a mass to select' : ' · click a mass to apply'}</div>
        </div>
      </div>
      <aside className="studio-inspector">
        <div className="inspector-head"><p className="eyebrow">Massing overview</p><h2>{current.title}</h2><p>{current.descriptor}</p></div>
        <div className="massing-metrics"><span><small>Storeys</small><b>{current.storeys}</b></span><span><small>Floor-stack height</small><b>{current.height}</b></span><span><small>Allocated space area / m²</small><b>{current.allocated.toLocaleString()}</b></span><span><small>Ground allocation / site</small><b>{allocation}%</b></span></div>
        <section className="area-balance"><h3>Area balance</h3><i><b style={{ width: `${allocation}%` }} /></i><div><span>Site area</span><b>{current.site.toLocaleString()} m²</b><span>Ground space allocation</span><b>{current.ground.toLocaleString()} m²</b><span>Upper space allocation</span><b>{current.upper.toLocaleString()} m²</b><span>Outside ground allocation</span><b>{current.outside.toLocaleString()} m²</b></div></section>
        <section className="programme-key"><h3>Programme</h3><div><span><i className="learning" />Learning</span><span><i className="community" />Community</span><span><i className="administration" />Administration</span><span><i className="circulation" />Circulation</span><span><i className="service" />Service</span><span><i className="play" />Play areas</span></div></section>
        <section className="massing-config"><h3>Model layers</h3><label><input type="checkbox" checked={context} onChange={event => setContext(event.target.checked)} /> Surrounding context</label><label><input type="checkbox" checked={shadows} onChange={event => setShadows(event.target.checked)} /> Cast shadows</label><label><span>Visible levels <b>{levels === 6 ? 'G + 5' : `G + ${levels - 1}`}</b></span><input type="range" min="1" max="6" value={levels} onChange={event => setLevels(Number(event.target.value))} /></label></section>
        <div className="representation-toggle">{['3D', 'Plan', 'Front'].map(name => <button type="button" key={name} className={representation === name ? 'active' : ''} onClick={() => setRepresentation(name)}>{name}</button>)}<button type="button" title="Export image" aria-label="Export image" onClick={exportImage}><Icon name="download" /></button></div>
        <div className="inspector-section"><h3>Design assumptions</h3><p>Reference programme: 5,773 m² NOFA. Project target: 11,503 m² GFA. Allocation is not statutory GFA or verified coverage.</p></div>
        <button className="secondary-btn full-btn" onClick={() => setSourceOpen(true)}><Icon name="file" />View BIM evidence</button>
        <button className="primary-btn full-btn" onClick={() => navigate('/reports?report=massing')}>Review decision report <Icon name="arrow" /></button>
      </aside>
    </div>
    <ModelSourcePanel files={MODEL_FILES} current={sourceFile} onSelect={setSourceFile} open={sourceOpen} onClose={() => setSourceOpen(false)} />
  </StudioFrame>;
}
