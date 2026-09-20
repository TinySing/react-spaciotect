import React, { useEffect, useState } from 'react';
import { ROOM_GROUPS } from '../../data';
import { Icon, StudioFrame, useToast } from '../../components';
import { useStudioModel } from '../../hooks/useStudioModel';
import { saveStudioPatch } from '../../services/studioService';
import { RoomRelationshipGraph, ThreeRoomGraphViewport, ThreeRoomStackViewport } from '../shared';

const FLOOR_LABELS = ['G', '1', '2', '3', '4', '5'];
const KPI_DETAILS = {
  spatial: { label: 'Spatial', value: 'Modelled area', note: 'Room polygon area and programme balance for the selected floor.' },
  energy: { label: 'Energy', value: 'EUI 102 kWh/m²/yr', note: 'Illustrative whole-building energy indicator for this option.' },
  ventilation: { label: 'Ventilation', value: 'Good potential', note: 'Courtyard-facing learning rooms receive the strongest cross-ventilation potential.' },
  daylight: { label: 'Daylight', value: 'Good potential', note: 'Perimeter teaching rooms receive the strongest daylight potential.' },
};
const GRAPH_TOOLS = [['Clear', 'circle-x'], ['Select', 'mouse-pointer-2'], ['Move', 'move'], ['Relationship', 'git-branch-plus'], ['Orbit', 'hand'], ['Zoom in', 'zoom-in'], ['Zoom out', 'zoom-out'], ['Fit view', 'scan']];
const STACK_TOOLS = [['Clear', 'circle-x'], ['Select', 'mouse-pointer-2'], ['Move', 'move-3d'], ['Rotate', 'rotate-cw'], ['Resize', 'scan'], ['Height', 'move-up'], ['West', 'arrow-left'], ['East', 'arrow-right'], ['North', 'arrow-up'], ['South', 'arrow-down'], ['Undo', 'undo-2'], ['Redo', 'redo-2']];

const clone = value => JSON.parse(JSON.stringify(value));
const floorOf = room => {
  const suffix = room?.Name?.split('-').pop();
  return suffix === 'G' ? 1 : Number(suffix) + 1;
};
const geometryOf = room => room?.Geometry?.Curve?.ControlPoints || [];
const isCirculation = room => /hallway|lobby|corridor|stair/i.test(room.Category || '');
const areaOf = room => {
  const points = geometryOf(room);
  if (points.length < 4) return 0;
  return Math.abs(points.slice(0, -1).reduce((sum, point, index, list) => {
    const next = list[(index + 1) % list.length];
    return sum + point.X * next.Y - next.X * point.Y;
  }, 0) / 2);
};
const boundsOf = room => {
  const points = geometryOf(room);
  if (!points.length) return { x: 0, y: 0, width: 0, depth: 0, height: 3.6 };
  const xs = points.map(point => point.X);
  const ys = points.map(point => point.Y);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...ys) - Math.min(...ys), height: room.Geometry.Direction?.Z || 3.6 };
};

export function RoomsStudio() {
  const toast = useToast();
  const [option, setOption] = useState('OPT-C');
  const { data: studioModel, loading, error, reload } = useStudioModel('e2', option.replace('OPT-', ''));
  const [model, setModel] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [floor, setFloor] = useState(1);
  const [orientation, setOrientation] = useState('columns');
  const [representation, setRepresentation] = useState('3D');
  const [selected, setSelected] = useState(null);
  const [kpi, setKpi] = useState('spatial');
  const [graphTool, setGraphTool] = useState('Select');
  const [relationshipSource, setRelationshipSource] = useState(null);
  const [stackTool, setStackTool] = useState('Select');
  const [graphZoom, setGraphZoom] = useState(1);
  const [stackZoom, setStackZoom] = useState(1);
  const [stackRevision, setStackRevision] = useState(0);
  const [locked, setLocked] = useState([]);
  const [checks, setChecks] = useState(null);

  useEffect(() => {
    if (studioModel?.option?.id !== option) return;
    setModel({ rooms: clone(studioModel.rooms.spaces), graph: clone(studioModel.rooms.graph), site: clone(studioModel.rooms.site) });
    setPast([]);
    setFuture([]);
    setSelected(null);
    setRelationshipSource(null);
    setChecks(null);
    setStackRevision(value => value + 1);
  }, [studioModel, option]);

  if (!model) {
    if (error) return <StudioFrame active="rooms"><div className="studio-data-state error">Unable to load the room layout.<button type="button" onClick={reload}>Retry</button></div></StudioFrame>;
    return <StudioFrame active="rooms"><div className="studio-data-state">Loading room layout…</div></StudioFrame>;
  }

  const rooms = model.rooms.filter(room => geometryOf(room).length > 3);
  const floorRooms = rooms.filter(room => floorOf(room) === floor);
  const selectedRoom = rooms.find(room => room.Name === selected);
  const selectedBounds = boundsOf(selectedRoom);
  const floorArea = floorRooms.reduce((sum, room) => sum + areaOf(room), 0);
  const circulationArea = floorRooms.filter(isCirculation).reduce((sum, room) => sum + areaOf(room), 0);
  const selectedRelationships = selected ? model.graph.relationships.filter(item => item.source === selected || item.target === selected) : [];
  const programme = ROOM_GROUPS.map(group => ({ ...group, value: floorRooms.filter(room => room.Category?.toLowerCase().includes(group.id === 'admin' ? 'admin' : group.id)).reduce((sum, room) => sum + areaOf(room), 0) }));

  const commit = change => {
    setPast(history => [...history, model]);
    setFuture([]);
    setModel(current => change(JSON.parse(JSON.stringify(current))));
    setChecks(null);
  };
  const selectRoom = id => {
    const room = rooms.find(item => item.Name === id);
    if (!room) return;
    setSelected(id);
    setFloor(floorOf(room));
  };
  const updateRoom = async event => {
    event.preventDefault();
    if (!selectedRoom || locked.includes(selectedRoom.Name)) return;
    const values = new FormData(event.currentTarget);
    const x = Number(values.get('x'));
    const y = Number(values.get('y'));
    const width = Number(values.get('width'));
    const depth = Number(values.get('depth'));
    const height = Number(values.get('height'));
    if (![x, y, width, depth, height].every(Number.isFinite) || width <= 0 || depth <= 0 || height <= 0) {
      toast('Enter positive room dimensions');
      return;
    }
    const patch = { x, y, width, depth, height };
    commit(next => {
      const room = next.rooms.find(item => item.Name === selected);
      room.Geometry.Curve.ControlPoints = [{ X: x, Y: y, Z: 0 }, { X: x + width, Y: y, Z: 0 }, { X: x + width, Y: y + depth, Z: 0 }, { X: x, Y: y + depth, Z: 0 }, { X: x, Y: y, Z: 0 }];
      room.Geometry.Direction.Z = height;
      return next;
    });
    try {
      await saveStudioPatch('e2', option, 'rooms', selectedRoom.Name, patch);
      toast(`${selectedRoom.Name} updated`);
    } catch (saveError) {
      toast('Unable to save room geometry. The local draft remains editable.');
    }
  };
  const undo = () => {
    if (!past.length) return toast('Nothing to undo');
    const previous = past[past.length - 1];
    setPast(history => history.slice(0, -1));
    setFuture(history => [model, ...history]);
    setModel(previous);
  };
  const redo = () => {
    if (!future.length) return toast('Nothing to redo');
    const next = future[0];
    setFuture(history => history.slice(1));
    setPast(history => [...history, model]);
    setModel(next);
  };
  const resetViews = () => {
    setGraphZoom(1);
    setStackZoom(1);
    setStackRevision(value => value + 1);
    setGraphTool('Select');
    setRelationshipSource(null);
    setStackTool('Select');
    toast('Room views reset');
  };
  const changeOption = next => {
    setModel(null);
    setOption(next);
    setSelected(null);
    setRelationshipSource(null);
    setChecks(null);
    toast(`${next} room layout loading`);
  };
  const graphAction = tool => {
    if (tool === 'Clear') { setSelected(null); setRelationshipSource(null); return; }
    if (tool === 'Relationship') { setGraphTool('Relationship'); setRelationshipSource(null); return toast('Select the source room, then select its related room'); }
    if (tool === 'Zoom in') return setGraphZoom(value => Math.min(2.2, value * 1.18));
    if (tool === 'Zoom out') return setGraphZoom(value => Math.max(.5, value / 1.18));
    if (tool === 'Fit view') return setGraphZoom(1);
    setGraphTool(tool);
  };
  const selectGraphNode = id => {
    if (graphTool === 'Select') return selectRoom(id);
    if (graphTool !== 'Relationship') return;
    if (!relationshipSource) {
      setRelationshipSource(id);
      setSelected(id);
      return toast('Now select the related room');
    }
    if (relationshipSource === id) return toast('Choose a different room');
    const source = relationshipSource;
    const exists = model.graph.relationships.some(item => (item.source === source && item.target === id) || (item.source === id && item.target === source));
    if (!exists) commit(next => {
      next.graph.relationships.push({ relationshipId: `REL-SESSION-${Date.now()}`, type: 'ADJACENT_TO', source, target: id, adjacencyType: 'user_defined', rationale: 'Added in room stacking review' });
      return next;
    });
    setRelationshipSource(null);
    setSelected(id);
    setGraphTool('Select');
    toast(exists ? 'Those rooms are already related' : 'Room relationship added');
  };
  const stackAction = tool => {
    if (tool === 'Clear') return setSelected(null);
    if (tool === 'Undo') return undo();
    if (tool === 'Redo') return redo();
    if (tool === 'Height') return selectedRoom ? document.querySelector('.room-edit-form [name="height"]')?.focus() : toast('Select one room to edit its height');
    if (['West', 'East', 'North', 'South'].includes(tool)) {
      if (!selectedRoom || locked.includes(selectedRoom.Name)) return toast('Select an unlocked room first');
      const delta = { West: [-.5, 0], East: [.5, 0], North: [0, .5], South: [0, -.5] }[tool];
      commit(next => {
        next.rooms.find(room => room.Name === selected).Geometry.Curve.ControlPoints.forEach(point => { point.X += delta[0]; point.Y += delta[1]; });
        return next;
      });
      return toast(`${selectedRoom.Name} moved ${tool.toLowerCase()}`);
    }
    setStackTool(tool);
  };
  const runChecks = () => {
    const invalid = floorRooms.filter(room => areaOf(room) <= 0 || boundsOf(room).height <= 0);
    const overlaps = floorRooms.filter((room, index) => floorRooms.slice(index + 1).some(other => {
      const a = boundsOf(room); const b = boundsOf(other);
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.depth && a.y + a.depth > b.y;
    }));
    setChecks({ invalid, overlaps });
    toast(invalid.length || overlaps.length ? 'Draft checks found items to review' : 'Current floor checks passed');
  };
  const exportDraft = () => {
    const blob = new Blob([JSON.stringify({ schema: 'room-layout-draft/1', floor, rooms: model.rooms, relationships: model.graph.relationships }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `opt-c-room-layout-${FLOOR_LABELS[floor - 1]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast('Room layout draft exported');
  };

  return <StudioFrame active="rooms">
    <div className="studio-content rooms-prototype">
      <section className="studio-canvas-wrap">
        <div className="canvas-toolbar room-option-bar">
          <label>Design option <select value={option} onChange={event => changeOption(event.target.value)}><option>OPT-C</option><option>OPT-B</option><option>OPT-A</option></select></label>
          <div className="room-view-actions"><div className="floor-tabs">{FLOOR_LABELS.map((label, index) => <button key={label} className={floor === index + 1 ? 'active' : ''} onClick={() => { setFloor(index + 1); setSelected(null); }}>{label}</button>)}</div><div className="room-representation-toggle"><button className={representation === 'Plan' ? 'active' : ''} onClick={() => setRepresentation('Plan')}>Plan</button><button className={representation === '3D' ? 'active' : ''} onClick={() => setRepresentation('3D')}>3D</button></div><div className="room-orientation-toggle"><button title="Side by side" className={orientation === 'columns' ? 'active' : ''} onClick={() => setOrientation('columns')}><Icon name="columns-2" /></button><button title="Top and bottom" className={orientation === 'rows' ? 'active' : ''} onClick={() => setOrientation('rows')}><Icon name="rows-2" /></button></div><button className="room-source" onClick={() => toast('stack_graph.json · linked BHoM room geometry')}><Icon name="layers-3" />stack_graph.json</button><button className="room-reset-views" onClick={resetViews}><Icon name="refresh" />Reset views</button></div>
        </div>
        <div className={`room-review-grid room-orientation-${orientation}`}>
          <section className="room-review-pane room-graph-pane"><header><b>All floors 3D Bubble Graph</b><span>Adjacency and circulation review</span></header>{representation === '3D' ? <ThreeRoomGraphViewport graph={model.graph} spaces={model.rooms} site={model.site} floor={floor} selected={selected} tool={graphTool} zoom={graphZoom} resetKey={stackRevision} onSelect={selectGraphNode} /> : <RoomRelationshipGraph graph={model.graph} floor={floor} selected={selected} onSelect={selectGraphNode} />}<div className="room-pane-tools graph-pane-tools">{GRAPH_TOOLS.map(([tool, icon], index) => <React.Fragment key={tool}>{index === 4 && <i className="room-tool-divider" /> }<button title={tool} className={graphTool === tool ? 'active' : ''} onClick={() => graphAction(tool)}><Icon name={icon} /></button></React.Fragment>)}</div></section>
          <div className="room-review-splitter" aria-hidden="true" />
          <section className="room-review-pane room-stack-pane"><header><b>{option} 3D Room Massing</b><span>{FLOOR_LABELS[floor - 1]}/F emphasized in full building</span></header><ThreeRoomStackViewport spaces={model.rooms} site={model.site} floor={floor} selected={selected} representation={representation} zoom={stackZoom} resetKey={stackRevision} interaction={stackTool} orbitEnabled={stackTool !== 'Move'} onSelect={id => ['Select', 'Resize', 'Height'].includes(stackTool) && selectRoom(id)} /><div className="room-pane-tools stack-pane-tools">{STACK_TOOLS.map(([tool, icon], index) => <React.Fragment key={tool}>{[5, 10].includes(index) && <i className="room-tool-divider" /> }<button title={tool} className={stackTool === tool ? 'active' : ''} onClick={() => stackAction(tool)}><Icon name={icon} /></button></React.Fragment>)}</div></section>
        </div>
      </section>
      <aside className="studio-inspector room-layout-panel"><header className="room-panel-head"><b>Layout review</b><span>Source snapshot</span></header><div className="room-panel-body">
        <div className="inspector-head"><p className="room-code">{option} / {FLOOR_LABELS[floor - 1]}/F</p><h2>Room planning</h2><p>Anderson Road · Detailed layout</p></div>
        <div className="layout-metrics"><div><b>{floorRooms.length}</b><small>Rooms on floor</small></div><div><b>{Math.round(floorArea)} m²</b><small>Modelled area</small></div><div><b>{floorArea ? `${Math.round(circulationArea / floorArea * 100)}%` : '0%'}</b><small>Circulation share</small></div><div><b>{rooms.length}</b><small>Building spaces</small></div></div>
        <section className="layout-section"><div className="section-title"><h3>Performance</h3><span>Floor <button onClick={() => toast('Whole-building view is represented by the all-floor graph')}>All 3D</button></span></div><div className="layout-kpis">{Object.entries(KPI_DETAILS).map(([id, detail]) => <button key={id} className={kpi === id ? 'active' : ''} onClick={() => setKpi(id)}><Icon name={id === 'spatial' ? 'layout-grid' : id === 'energy' ? 'zap' : id === 'ventilation' ? 'wind' : 'sun-medium'} /><span>{detail.label}</span></button>)}</div><strong className="layout-kpi-value">{KPI_DETAILS[kpi].value}</strong><p>{KPI_DETAILS[kpi].note}</p></section>
        <section className="layout-section"><h3>Programme balance</h3><div className="programme-bar">{programme.map(group => <i key={group.id} style={{ width: `${floorArea ? Math.max(2, group.value / floorArea * 100) : 0}%`, background: group.color }} />)}</div><div className="room-programme-key">{programme.map(group => <span key={group.id}><i style={{ background: group.color }} />{group.label}</span>)}</div></section>
        <section className="layout-section room-properties"><h3><Icon name="scan" />Room properties</h3><label>Room<select value={selected || ''} onChange={event => event.target.value && selectRoom(event.target.value)}><option value="">No selection</option>{floorRooms.map(room => <option key={room.Name} value={room.Name}>{room.Name}</option>)}</select></label>{!selectedRoom ? <p className="room-selection-empty">No room selected.</p> : <><form onSubmit={updateRoom} className="room-edit-form"><div><label>X<input name="x" type="number" step=".1" defaultValue={selectedBounds.x} disabled={locked.includes(selectedRoom.Name)} /></label><label>Y<input name="y" type="number" step=".1" defaultValue={selectedBounds.y} disabled={locked.includes(selectedRoom.Name)} /></label></div><div><label>Width<input name="width" type="number" step=".1" defaultValue={selectedBounds.width} disabled={locked.includes(selectedRoom.Name)} /></label><label>Depth<input name="depth" type="number" step=".1" defaultValue={selectedBounds.depth} disabled={locked.includes(selectedRoom.Name)} /></label></div><label>Height<input name="height" type="number" step=".1" defaultValue={selectedBounds.height} disabled={locked.includes(selectedRoom.Name)} /></label><button className="secondary-btn" type="submit" disabled={locked.includes(selectedRoom.Name)}><Icon name="save" />Apply changes</button></form><button className="room-lock" onClick={() => setLocked(ids => ids.includes(selectedRoom.Name) ? ids.filter(id => id !== selectedRoom.Name) : [...ids, selectedRoom.Name])}>{locked.includes(selectedRoom.Name) ? 'Unlock room' : 'Lock selected geometry'}</button>{selectedRelationships.length > 0 && <div className="room-relation-list">{selectedRelationships.slice(0, 4).map((relation, index) => <span key={`${relation.source}-${relation.target}-${index}`}><i />{relation.source === selected ? relation.target : relation.source}<em>{relation.adjacencyType || 'Adjacent'}</em></span>)}</div>}</>}</section>
        <section className="layout-section draft-checks"><h3><Icon name="clipboard-check" />Draft checks</h3><button className="secondary-btn" onClick={runChecks}>Check current floor</button>{checks ? <p className={checks.invalid.length || checks.overlaps.length ? 'check-failed' : 'check-passed'}>{checks.invalid.length || checks.overlaps.length ? `${checks.invalid.length + checks.overlaps.length} item(s) need review.` : 'No area or bounding-box issues found.'}</p> : <p>Preliminary area, bounding-box and graph checks only. Egress, clearances and code compliance are not verified.</p>}</section>
        <section className="layout-section layout-footer"><div className="layout-actions"><button className="primary-btn" onClick={exportDraft}><Icon name="download" />Export draft</button><button title="Undo" disabled={!past.length} onClick={undo}><Icon name="undo-2" /></button><button title="Redo" disabled={!future.length} onClick={redo}><Icon name="redo-2" /></button></div><small className="layout-revision">Revision {past.length} · Session draft · Source files unchanged</small></section>
      </div></aside>
    </div>
  </StudioFrame>;
}

export default RoomsStudio;
