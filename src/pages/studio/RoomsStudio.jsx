import React, { useState } from 'react';
import { ROOM_GROUPS } from '../../data';
import studioData from '../../data/studioData.json';
import { Icon, StudioFrame, useToast } from '../../components';
import { ModelSourcePanel, RoomRelationshipGraph, RoomStackVisual, SiteContextPills, useCanvasNavigation } from '../shared';
import { MODEL_FILES } from './constants';

const FLOOR_LABELS = ['G', '1', '2', '3', '4', '5'];

export function RoomsStudio() {
  const [mode, setMode] = useState('split');
  const [floor, setFloor] = useState(1);
  const [selected, setSelected] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('Properties');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState('stack_graph.json');
  const [contextLayer, setContextLayer] = useState('Map');
  const [assistantMode, setAssistantMode] = useState('Fast mode');
  const { viewportStyle, navigationHandlers, resetViewport } = useCanvasNavigation();
  const toast = useToast();
  const selectedNode = studioData.stackGraph.nodes.find(node => node.globalId === selected);
  const selectedSpace = studioData.rooms.Spaces.find(space => space.Name === selected);
  const selectedLabel = selectedNode ? `${selectedNode.globalId} · ${selectedNode.spaceType || selectedNode.name}` : 'Select a room';
  const selectedFloor = selectedNode?.floorLevel || (selectedSpace ? selectedSpace.Name.endsWith('-G') ? 1 : Number(selectedSpace.Name.split('-').pop()) + 1 : floor);

  return <StudioFrame active="rooms">
    <div className="studio-content rooms-content">
      <div className="studio-canvas-wrap">
        <div className="canvas-toolbar">
          <SiteContextPills value={contextLayer} onChange={name => { setContextLayer(name); toast(`${name} context selected`); }} />
          <div className="mode-toggle" aria-label="Room view mode">
            <button className={mode === 'split' ? 'active' : ''} onClick={() => setMode('split')}>Split review</button>
            <button className={mode === 'graph' ? 'active' : ''} onClick={() => setMode('graph')}>Bubble graph</button>
            <button className={mode === 'stack' ? 'active' : ''} onClick={() => setMode('stack')}>Room stack</button>
          </div>
          <div className="floor-tabs" aria-label="Floor selector">
            {FLOOR_LABELS.map((label, index) => <button key={label} className={floor === index + 1 ? 'active' : ''} onClick={() => { setFloor(index + 1); toast(`${label}/F selected`); }}>{label}</button>)}
          </div>
          <button className="source-button" onClick={() => setSourceOpen(true)}><Icon name="layers" />{sourceFile}</button>
          <button onClick={resetViewport}><Icon name="refresh" />Reset view</button>
        </div>
        <div className={`room-review-grid room-mode-${mode}`} style={viewportStyle} {...navigationHandlers}>
          {(mode === 'split' || mode === 'graph') && <section className="room-review-pane room-review-graph-pane">
            <header><b>All floors 3D Bubble Graph</b><span>{studioData.stackGraph.nodes.length} spaces · {studioData.stackGraph.relationships.length} relationships</span></header>
            <RoomRelationshipGraph floor={floor} selected={selected} onSelect={setSelected} />
          </section>}
          {(mode === 'split' || mode === 'stack') && <section className="room-review-pane room-review-stack-pane">
            <header><b>OPT-C 3D Room Massing</b><span>{floor === 1 ? 'G/F' : `${floor - 1}/F`} emphasized in full building</span></header>
            <RoomStackVisual floor={floor} selected={selected} onSelect={setSelected} />
          </section>}
        </div>
        <div className="room-legend">{ROOM_GROUPS.map(group => <span key={group.id}><i style={{ background: group.color }} />{group.label}</span>)}</div>
        <div className="canvas-caption"><b>Room planning review · {floor === 1 ? 'G/F' : `${floor - 1}/F`}</b><span>{selectedLabel} selected · drag to pan · scroll to zoom · source: {sourceFile}</span></div>
      </div>
      <aside className="studio-inspector">
        <div className="inspector-head"><p className="eyebrow">Room planning</p><h2>{selectedLabel}</h2><p>Selected on {selectedFloor === 1 ? 'ground floor' : `floor ${selectedFloor - 1}`}</p></div>
        <div className="mode-toggle"><button className={assistantMode === 'Fast mode' ? 'active' : ''} onClick={() => { setAssistantMode('Fast mode'); toast('Fast mode enabled'); }}>Fast mode</button><button className={assistantMode === 'DeepThink' ? 'active' : ''} onClick={() => { setAssistantMode('DeepThink'); toast('DeepThink mode enabled'); }}>DeepThink</button></div>
        <div className="metric-list"><div className="metric-row"><span>Graph nodes</span><b>{studioData.stackGraph.nodes.length}</b></div><div className="metric-row"><span>Relationships</span><b>{studioData.stackGraph.relationships.length}</b></div><div className="metric-row"><span>BHoM spaces</span><b>{studioData.rooms.Spaces.length}</b></div><div className="metric-row"><span>Active floor</span><b>{floor === 1 ? 'G/F' : `${floor - 1}/F`}</b></div><div className="metric-row"><span>Selected area</span><b>{selectedSpace?.area_m2 ? `${selectedSpace.area_m2} m²` : 'Source geometry'}</b></div></div>
        <div className="accommodation"><h3>Accommodation</h3><div><span style={{ background: '#73a9e8' }} />Learning cluster<b>3,960 m²</b></div><div><span style={{ background: '#7fd4c0' }} />Specialist rooms<b>1,180 m²</b></div><div><span style={{ background: '#e3a7bc' }} />Community use<b>1,420 m²</b></div><div><span style={{ background: '#f2cf60' }} />Administration<b>520 m²</b></div></div>
        <p className="studio-hint">{assistantMode} keeps the current room rule set and updates the selected layout.</p>
        <div className="inspector-tabs">{['Properties', 'Adjacency', 'Validation'].map(name => <button key={name} className={inspectorTab === name ? 'active' : ''} onClick={() => setInspectorTab(name)}>{name}</button>)}</div>
        <div className="inspector-status"><Icon name="check" /><span><b>{inspectorTab === 'Validation' ? 'Validation ready' : 'Validated outcome'}</b>Project 8591 · Site E-2</span></div>
        {inspectorTab === 'Properties' && <dl><dt>Space group</dt><dd>{selectedNode?.spaceCategory || selectedSpace?.Category || 'Not classified'}</dd><dt>Level</dt><dd>{selectedFloor === 1 ? 'Ground floor' : `${selectedFloor - 1}/F`}</dd><dt>Source</dt><dd>{sourceFile}</dd></dl>}
        {inspectorTab === 'Adjacency' && <div className="relation-list"><span>Central circulation <em>Connected</em></span><span>Shared learning <em>Adjacent</em></span><span>Service route <em>Review</em></span></div>}
        {inspectorTab === 'Validation' && <div className="inspector-note"><b>Room validation passed</b><p>Area schedule, group assignment, and floor relationship are ready for layout review.</p></div>}
        <button className="secondary-btn full-btn" onClick={() => setSourceOpen(true)}><Icon name="file" />View BIM evidence</button><button className="secondary-btn full-btn" onClick={() => toast('Layout review opened')}><Icon name="sliders" />Open layout review</button>
      </aside>
    </div>
    <ModelSourcePanel files={MODEL_FILES} current={sourceFile} onSelect={setSourceFile} open={sourceOpen} onClose={() => setSourceOpen(false)} />
  </StudioFrame>;
}
