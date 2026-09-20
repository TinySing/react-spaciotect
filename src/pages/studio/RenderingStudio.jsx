import React, { useState } from 'react';
import { Icon, StudioFrame, useToast } from '../../components';
import { useStudioModel } from '../../hooks/useStudioModel';
import { ThreeRenderingViewport } from '../shared';

const VIEWPOINTS = ['Overview', 'Arrival', 'Courtyard', 'Roofscape'];
const DESIGN_OPTIONS = [
  ['OPT-A', 'OPT-A · Linear campus'],
  ['OPT-B', 'OPT-B · Courtyard campus'],
  ['OPT-C', 'OPT-C · U-shaped'],
];
const MATERIALS = [
  ['#dce3df', 'Mineral facade'],
  ['#567f89', 'Framed glazing'],
  ['#f3eee3', 'Solar shading'],
  ['#ac8762', 'Timber seating'],
  ['#738456', 'Planting'],
  ['#626d70', 'Paved arrival'],
];

function downloadCanvas(toast) {
  const canvas = document.querySelector('.three-rendering-viewport canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'rendering-study-OPT-C.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Rendering image prepared');
}

export function RenderingStudio() {
  const [option, setOption] = useState('OPT-C');
  const [viewpoint, setViewpoint] = useState('Arrival');
  const [light, setLight] = useState('Daylight');
  const [shadows, setShadows] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const toast = useToast();
  const { data: studioModel, loading, error, reload } = useStudioModel('e2', option.replace('OPT-', ''));
  const hasCurrentOption = studioModel?.option?.id === option;
  const reset = () => {
    setOption('OPT-C');
    setViewpoint('Arrival');
    setLight('Daylight');
    setShadows(true);
    setResetToken(value => value + 1);
    toast('Rendering view reset');
  };
  const selectViewpoint = name => {
    setViewpoint(name);
    toast(name + ' viewpoint selected');
  };
  const changeOption = value => {
    setOption(value);
    setResetToken(token => token + 1);
    toast(`${value} rendering study loaded`);
  };

  return <StudioFrame active="rendering">
    <div className="studio-content rendering-content rendering-prototype">
      <div className="studio-canvas-wrap rendering-canvas-wrap">
        <div className="canvas-toolbar rendering-option-bar">
          <label>Design option<select value={option} onChange={event => changeOption(event.target.value)} aria-label="Design option">{DESIGN_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button type="button" onClick={reset} title="Reset rendering view" aria-label="Reset rendering view"><Icon name="rotate-ccw" /></button>
        </div>
        <div className="rendering-stage">
          {loading && <div className="studio-data-state">Loading rendering model…</div>}
          {error && <div className="studio-data-state error">Unable to load the rendering model.<button type="button" onClick={reload}>Retry</button></div>}
          {hasCurrentOption && <ThreeRenderingViewport scene={studioModel.rendering.scene} viewpoint={viewpoint} lightName={light} shadows={shadows} resetToken={resetToken} />}
          <div className="render-toolbar">
            <button type="button" onClick={reset}><Icon name="rotate-ccw" />Reset view</button>
            <button type="button" onClick={() => downloadCanvas(toast)}><Icon name="download" />Export image</button>
          </div>
          <div className="render-status">Illustrative design study · Not an approved design</div>
          <div className="render-north"><b>↑</b><span>N</span><small>provisional</small></div>
        </div>
      </div>
      <aside className="studio-inspector rendering-inspector">
        <div className="inspector-head">
          <b>Rendering study</b>
          <p className="rendering-eyebrow">ANDERSON ROAD / OPT-C</p>
          <h2>Courtyard school</h2>
          <p>Architecture &amp; landscape study</p>
        </div>
        <section className="rendering-section">
          <h3>Viewpoint</h3>
          <div className="rendering-choice-grid" role="group" aria-label="Rendering viewpoint">
            {VIEWPOINTS.map(name => <button type="button" key={name} className={viewpoint === name ? 'active' : ''} aria-pressed={viewpoint === name} onClick={() => selectViewpoint(name)}>{name}</button>)}
          </div>
        </section>
        <section className="rendering-section">
          <h3>Light</h3>
          <div className="rendering-choice-grid" role="group" aria-label="Rendering light">
            {['Daylight', 'Late afternoon'].map(name => <button type="button" key={name} className={light === name ? 'active' : ''} aria-pressed={light === name} onClick={() => { setLight(name); toast(name + ' lighting selected'); }}>{name}</button>)}
          </div>
          <label className="rendering-shadow-toggle"><input type="checkbox" checked={shadows} onChange={event => setShadows(event.target.checked)} /> Cast shadows</label>
        </section>
        <section className="rendering-section">
          <h3>Material study</h3>
          <div className="rendering-palette">{MATERIALS.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
        </section>
        <section className="rendering-section rendering-scene">
          <h3>Scene</h3>
          <dl>
            <div><dt>Architecture</dt><dd>Windows, doors &amp; galleries</dd></div>
            <div><dt>Landscape</dt><dd>Trees, planters &amp; seating</dd></div>
            <div><dt>School life</dt><dd>Students &amp; teachers</dd></div>
            <div><dt>Arrival</dt><dd>Bus, parking &amp; crossing</dd></div>
          </dl>
        </section>
        <section className="rendering-section rendering-export">
          <button type="button" onClick={() => downloadCanvas(toast)}><Icon name="download" />Export image</button>
        </section>
        <section className="rendering-section rendering-notes">
          <h3>Study notes</h3>
          <p>Illustrative design study. Not an approved design.</p>
          <p>Facade, planting, people, road and parking are presentation assumptions, not surveyed or approved proposals. Access, vehicle movements, planting and construction details remain unverified.</p>
        </section>
      </aside>
    </div>
  </StudioFrame>;
}
