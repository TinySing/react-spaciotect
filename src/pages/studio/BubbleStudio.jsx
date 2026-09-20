import React, { useMemo, useRef, useState } from 'react';
import { Icon, StudioFrame, usePersistentState, useToast } from '../../components';
import { useStudioModel } from '../../hooks/useStudioModel';
import { saveStudioPatch } from '../../services/studioService';
import { NODE_COLORS, SiteGraph, useCanvasNavigation } from '../shared';

const TOOLS = [
  ['mouse-pointer-2', 'Select'], ['circle-plus', 'Add node'], ['group', 'Group nodes'],
  ['git-branch-plus', 'Connect'], ['hand', 'Pan'], ['zoom-in', 'Zoom in'],
  ['zoom-out', 'Zoom out'], ['scan', 'Fit view'], ['rotate-ccw', 'Reset diagram'],
];

const OPTIONS = ['Option S1 - Courtyard learning campus', 'Option S2 - Linear civic edge', 'Option S3 - Terraced landscape'];
const TYPE_BY_ELEMENT = {
  classroom_cluster: 'Learning', hall: 'Community', court: 'Landscape', fixed_gate: 'Arrival',
  loading_bay: 'Service', road: 'Service', eva_road: 'Service', building_block: 'Building',
};
const GRAPH_POSITIONS = {
  STR01: [242, 270], PED01: [352, 410], VEH01: [392, 525], SCH01: [575, 315], ASS01: [830, 405],
  CLA01: [600, 205], BAS01: [640, 420], LOA01: [610, 495], DAI01: [470, 490], EVA01: [535, 490],
};
const CONSTRAINTS = [
  ['Emergency vehicle access', 'Serve at least 25% of the building facade perimeter within 10 m.', 'Required', 'hard'],
  ['Assembly hall interface', 'Keep a direct physical interface at ground-floor level.', 'Required', 'hard'],
  ['Classroom cluster interface', 'Maintain direct connection across the upper-floor learning cluster.', 'Required', 'hard'],
  ['Basketball court adjacency', 'Prefer a shared edge for student access to social open space.', 'Preferred', 'soft'],
];

function displayPosition(node) {
  return node.positioned || node.id.startsWith('USER') ? [node.x, node.y] : GRAPH_POSITIONS[node.id] || [node.x, node.y];
}

function BubbleInspector({ node, values, nodes, relationships, tab, constraintStates, onTabChange, onChange, onConstraintChange, onBeginConnect, onSave, dirty }) {
  const linked = useMemo(() => relationships.filter(edge => edge.source === node.id || edge.target === node.id), [node.id, relationships]);
  const relatedNode = edge => nodes.find(item => item.id === (edge.source === node.id ? edge.target : edge.source));
  return <aside className="property-panel">
    <p className="eyebrow">Selected space</p><h2>{values.name}</h2><p>Update a node and its relationship intent.</p>
    <div className="prop-tabs" role="tablist">{['Properties', 'Constraints', 'Relationships'].map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => onTabChange(item)}>{item}</button>)}</div>
    {tab === 'Properties' && <>
      <div className="field"><label>Name</label><input value={values.name} onChange={event => onChange('name', event.target.value)} /></div>
      <div className="field"><label>Space type</label><select value={values.type} onChange={event => onChange('type', event.target.value)}><option>Building</option><option>Circulation</option><option>Learning</option><option>Community</option><option>Landscape</option><option>Service</option><option>Arrival</option></select></div>
      <div className="field-grid"><div className="field"><label>Target area (m²)</label><input value={values.area} placeholder="Not specified in site graph" onChange={event => onChange('area', event.target.value)} /></div><div className="field"><label>Priority</label><select value={values.priority} onChange={event => onChange('priority', event.target.value)}><option>Essential</option><option>Preferred</option></select></div></div>
      <div className="field"><label>Colour</label><input type="color" value={values.color} onChange={event => onChange('color', event.target.value)} /></div>
      <p className="eyebrow bubble-relations-label">Key relationships</p>
      {linked.slice(0, 3).map((edge, index) => { const target = relatedNode(edge); return <div className="relation" key={`${edge.source}-${edge.target}-${index}`}><span className="relation-dot" style={{ background: target?.color || NODE_COLORS[target?.elementType] || '#9ca3a6' }} />{target?.name || 'Linked space'}<span>{edge.type === 'ADJACENT_TO' ? 'Adjacent' : 'Context'}</span></div>; })}
      <button className="primary-btn bubble-save" onClick={onSave}><Icon name="save" />{dirty ? 'Save option' : 'Option saved'}</button>
    </>}
    {tab === 'Constraints' && <section className="bubble-inspector-section">
      <p className="inspector-section-label">Rule status</p><div className="constraint-summary"><b>4 / 4</b><span>active constraints satisfied</span></div><p className="inspector-helper">Review the planning intent attached to {values.name}.</p>
      <div className="constraint-list">{CONSTRAINTS.map(([name, description, initial, level]) => <label className="constraint-row" key={name}><span><b>{name}</b><small>{description}</small></span><select className={`constraint-state ${level}`} value={constraintStates[name] || initial} onChange={event => onConstraintChange(name, event.target.value)}><option>{initial}</option><option>Review</option></select></label>)}</div>
    </section>}
    {tab === 'Relationships' && <section className="bubble-inspector-section">
      <p className="inspector-section-label">Graph links</p><p className="inspector-helper">{linked.length} verified relationship{linked.length === 1 ? '' : 's'} for {values.name}.</p>
      <div className="relationship-list">{linked.map((edge, index) => { const target = relatedNode(edge); return <div className="relationship-row" key={`${edge.source}-${edge.target}-${index}`}><span><b>{target?.name || 'Linked space'}</b><small>{edge.userCreated ? 'User-created adjacency.' : 'Verified graph relationship.'}</small><small className="relationship-evidence"><Icon name="database" />{edge.userCreated ? 'Session draft' : 'Source fact'}</small></span><em className={edge.type === 'ADJACENT_TO' ? '' : 'preferred'}>{edge.type === 'ADJACENT_TO' ? 'Required' : 'Preferred'}</em></div>; })}</div>
      <button className="relationship-add" onClick={onBeginConnect}><Icon name="git-branch-plus" />Connect another space</button>
    </section>}
  </aside>;
}

function CommentComposer({ nodeName, value, onChange, onSubmit, onClose }) {
  return <form className="bubble-comment-composer" onSubmit={onSubmit}><div><b>Comment on {nodeName}</b><button type="button" onClick={onClose} aria-label="Close comment"><Icon name="close" /></button></div><input autoFocus value={value} onChange={event => onChange(event.target.value)} placeholder="Add a review note…" /><button className="primary-btn" disabled={!value.trim()}>Add comment</button></form>;
}

export function BubbleStudio() {
  const toast = useToast();
  const [drafts, setDrafts] = usePersistentState('spaciotectBubbleDrafts', {});
  const [selectedId, setSelectedId] = useState('SCH01');
  const [option, setOption] = useState(OPTIONS[0]);
  const [tool, setTool] = useState('Select');
  const [tab, setTab] = useState('Properties');
  const [pendingIds, setPendingIds] = useState([]);
  const [userNodes, setUserNodes] = useState([]);
  const [userEdges, setUserEdges] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [constraintStates, setConstraintStates] = useState({});
  const [dirty, setDirty] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [commentCount, setCommentCount] = useState(0);
  const [orbit, setOrbit] = useState({ x: 0, z: 0 });
  const orbitDragRef = useRef(null);
  const { viewportStyle, navigationHandlers, zoomIn, zoomOut, resetViewport } = useCanvasNavigation({ minScale: .65, maxScale: 2 });
  const { data: studioModel, loading, error, reload } = useStudioModel('e2', 'C');
  if (loading) return <StudioFrame active="bubble"><div className="studio-data-state">Loading relationship graph…</div></StudioFrame>;
  if (error || !studioModel) return <StudioFrame active="bubble"><div className="studio-data-state error">Unable to load the relationship graph.<button type="button" onClick={reload}>Retry</button></div></StudioFrame>;
  const sourceNodes = studioModel.bubble.nodes;
  const sourceRelationships = studioModel.bubble.relationships;
  const allNodes = [...sourceNodes.map(node => ({ ...node, ...overrides[node.id] })), ...userNodes];
  const allRelationships = [...sourceRelationships, ...userEdges];
  const selectedNode = allNodes.find(node => node.id === selectedId) || allNodes.find(node => node.id === 'SCH01');
  const values = { name: selectedNode.name, type: selectedNode.type || TYPE_BY_ELEMENT[selectedNode.elementType] || 'Service', area: selectedNode.area || '', priority: selectedNode.priority || 'Essential', color: selectedNode.color || NODE_COLORS[selectedNode.elementType] || '#e95e45' };
  const markDirty = () => setDirty(true);

  const selectNode = node => {
    if (tool === 'Connect') {
      if (!pendingIds.length) { setPendingIds([node.id]); toast('Select the second space to create a relationship'); return; }
      if (pendingIds[0] === node.id) return;
      const duplicate = allRelationships.some(edge => (edge.source === pendingIds[0] && edge.target === node.id) || (edge.source === node.id && edge.target === pendingIds[0]));
      if (duplicate) toast('These spaces are already connected');
      else { setUserEdges(edges => [...edges, { source: pendingIds[0], target: node.id, type: 'ADJACENT_TO', userCreated: true }]); markDirty(); toast('Relationship created'); }
      setPendingIds([]); setTool('Select');
      return;
    }
    if (tool === 'Group nodes') { setPendingIds(ids => ids.includes(node.id) ? ids.filter(id => id !== node.id) : [...ids, node.id]); return; }
    setSelectedId(node.id);
  };

  const addNode = event => {
    if (tool !== 'Add node' || !event.target.closest('.diagram-canvas') || event.target.closest('.actual-bubble-node')) return;
    const rect = event.currentTarget.querySelector('.diagram-canvas')?.getBoundingClientRect();
    if (!rect) return;
    const id = `USER${userNodes.length + 1}`;
    const node = { id, name: 'New Programme Node', role: 'user added programme node', elementType: 'building_block', editable: true, positioned: true, x: Math.round(Math.max(310, Math.min(900, (event.clientX - rect.left) / rect.width * 1200))), y: Math.round(Math.max(145, Math.min(540, (event.clientY - rect.top) / rect.height * 700))), radius: 35, color: '#e95e45' };
    setUserNodes(nodes => [...nodes, node]); setSelectedId(id); setTool('Select'); markDirty(); toast(`${id} added to site graph`);
  };
  const moveNode = (id, position) => {
    if (id.startsWith('USER')) setUserNodes(nodes => nodes.map(node => node.id === id ? { ...node, ...position, positioned: true } : node));
    else setOverrides(current => ({ ...current, [id]: { ...current[id], ...position, positioned: true } }));
    markDirty();
  };
  const resetDiagram = () => { setUserNodes([]); setUserEdges([]); setUserGroups([]); setPendingIds([]); setOverrides({}); setConstraintStates({}); setDrafts(current => { const next = { ...current }; delete next[option]; return next; }); setSelectedId('SCH01'); setTool('Select'); setDirty(false); resetView(); toast('Diagram reset'); };
  const groupNodes = () => {
    const members = allNodes.filter(node => pendingIds.includes(node.id));
    if (members.length < 2) { toast('Select at least two spaces to create a group'); return; }
    const points = members.map(displayPosition);
    const xs = points.map(([x]) => x); const ys = points.map(([, y]) => y);
    setUserGroups(groups => [...groups, { id: `GROUP${groups.length + 1}`, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, rx: Math.max(70, (Math.max(...xs) - Math.min(...xs)) / 2 + 58), ry: Math.max(55, (Math.max(...ys) - Math.min(...ys)) / 2 + 52) }]);
    setPendingIds([]); setTool('Select'); markDirty(); toast('Programme group created');
  };
  const activateTool = name => {
    if (name === 'Zoom in') { zoomIn(); return; }
    if (name === 'Zoom out') { zoomOut(); return; }
    if (name === 'Fit view') { resetViewport(); toast('View fitted to diagram'); return; }
    if (name === 'Reset diagram') { resetDiagram(); return; }
    if (name === 'Group nodes' && tool === 'Group nodes') { groupNodes(); return; }
    setPendingIds([]); setTool(name);
  };
  const updateValue = (key, value) => {
    if (selectedNode.id.startsWith('USER')) setUserNodes(nodes => nodes.map(node => node.id === selectedNode.id ? { ...node, [key]: value } : node));
    else setOverrides(current => ({ ...current, [selectedNode.id]: { ...current[selectedNode.id], [key]: value } }));
    markDirty();
  };
  const resetView = () => { resetViewport(); setOrbit({ x: 0, z: 0 }); };
  const startOrbit = event => {
    if (event.button !== 0 || event.target.closest('button, [role="button"], input, select, textarea')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    orbitDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, orbit };
  };
  const moveOrbit = event => {
    const start = orbitDragRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setOrbit({
      x: Math.max(-18, Math.min(18, start.orbit.x - (event.clientY - start.y) * .075)),
      z: Math.max(-20, Math.min(20, start.orbit.z + (event.clientX - start.x) * .075)),
    });
  };
  const endOrbit = event => {
    if (orbitDragRef.current?.pointerId === event.pointerId) orbitDragRef.current = null;
  };
  const loadOption = nextOption => {
    const saved = drafts[nextOption];
    setOption(nextOption); setUserNodes(saved?.userNodes || []); setUserEdges(saved?.userEdges || []); setUserGroups(saved?.userGroups || []); setOverrides(saved?.overrides || {}); setConstraintStates(saved?.constraintStates || {}); setSelectedId('SCH01'); setPendingIds([]); setTool('Select'); setDirty(false); resetView(); toast(saved ? `${nextOption} restored` : `${nextOption} loaded`);
  };
  const saveOption = async () => {
    const draft = { userNodes, userEdges, userGroups, overrides, constraintStates };
    try {
      await saveStudioPatch('e2', 'C', 'bubble/drafts', option, draft);
      setDrafts(current => ({ ...current, [option]: draft }));
      setDirty(false);
      toast(`${option} saved`);
    } catch (saveError) {
      toast('Unable to save this diagram. Your session draft is still open.');
    }
  };
  const submitComment = event => { event.preventDefault(); if (!comment.trim()) return; setCommentCount(value => value + 1); setComment(''); setCommentOpen(false); toast(`Comment added to ${values.name}`); };
  const canvasHandlers = tool === 'Pan' ? navigationHandlers : { onPointerDown: startOrbit, onPointerMove: moveOrbit, onPointerUp: endOrbit, onPointerCancel: endOrbit, onWheel: navigationHandlers.onWheel };
  const sceneStyle = { ...viewportStyle, transform: `perspective(1200px) rotateX(${orbit.x}deg) rotateZ(${orbit.z}deg) ${viewportStyle.transform}` };
  const toolHint = tool === 'Pan' ? 'Drag canvas to pan' : tool === 'Add node' ? 'Click canvas to add a node' : tool === 'Connect' ? 'Select two spaces to connect' : tool === 'Group nodes' ? 'Select spaces, then choose Group nodes again' : 'Drag empty canvas to rotate · drag an editable node to move';

  return <StudioFrame active="bubble">
    <section className="diagram-shell bubble-prototype">
      <header className="diagram-bar"><div className="diagram-title">Bubble diagram<span>Site E-2 Anderson Road Primary School</span></div><select className="diagram-select" value={option} onChange={event => loadOption(event.target.value)}>{OPTIONS.map(item => <option key={item}>{item}</option>)}</select><span className="badge green">12 / 12 rules satisfied</span><div className="diagram-tools"><button className="secondary-btn" onClick={() => setCommentOpen(value => !value)}><Icon name="message-square-plus" />Comment{commentCount ? ` (${commentCount})` : ''}</button><button className="secondary-btn" onClick={() => { resetView(); toast('View reset'); }}><Icon name="rotate-ccw" />Reset view</button></div></header>
      <div className="diagram-workspace" onClick={addNode} {...canvasHandlers}>
        <div className="diagram-canvas site-reference"><div className="bubble-graph-layer" style={sceneStyle}><SiteGraph nodes={sourceNodes} relationships={sourceRelationships} selectedId={selectedId} pendingIds={pendingIds} userNodes={userNodes} userEdges={userEdges} userGroups={userGroups} nodeOverrides={overrides} onSelect={selectNode} onNodeMove={moveNode} draggable={tool === 'Select'} /></div></div>
        <div className="bubble-manipulation-tools" role="toolbar" aria-label="Bubble diagram manipulation tools">{TOOLS.map(([icon, name]) => <button type="button" key={name} className={tool === name ? 'active' : ''} onClick={event => { event.stopPropagation(); activateTool(name); }} title={name} aria-label={name}><Icon name={icon} /></button>)}</div>
        <span className="rotation-hint">{toolHint}</span>
        {commentOpen && <CommentComposer nodeName={values.name} value={comment} onChange={setComment} onSubmit={submitComment} onClose={() => setCommentOpen(false)} />}
        <BubbleInspector node={selectedNode} values={values} nodes={allNodes} relationships={allRelationships} tab={tab} constraintStates={constraintStates} onTabChange={setTab} onChange={updateValue} onConstraintChange={(name, value) => { setConstraintStates(current => ({ ...current, [name]: value })); markDirty(); }} onBeginConnect={() => { setTab('Properties'); setPendingIds([]); setTool('Connect'); toast('Select two spaces to create a relationship'); }} onSave={saveOption} dirty={dirty} />
      </div>
    </section>
  </StudioFrame>;
}
