import React, { useEffect, useState } from 'react';
import { SITE_GRAPH_NODES, SITE_GRAPH_RELATIONSHIPS } from '../../data';
import { Icon, StudioFrame, usePersistentState, useToast } from '../../components';
import { ModelSourcePanel, NODE_COLORS, SiteGraph, useCanvasNavigation } from '../shared';
import { MODEL_FILES } from './constants';

const BUBBLE_TOOLS = ['Select', 'Add node', 'Group nodes', 'Connect', 'Pan', 'Zoom in', 'Zoom out', 'Fit view', 'Reset diagram'];

function nodeType(node) {
  if (node.elementType === 'classroom_cluster') return 'Learning';
  if (node.elementType === 'hall') return 'Community';
  if (node.elementType === 'court') return 'Landscape';
  if (node.elementType === 'fixed_gate') return 'Arrival';
  if (['loading_bay', 'road', 'eva_road'].includes(node.elementType)) return 'Service';
  return node.elementType === 'building_block' ? 'Building' : 'Service';
}

function SoADialog({ open, onClose }) {
  const [savedRows, setSavedRows] = usePersistentState('spaciotect-soa-v2-e2', [
    { name: 'General classroom', group: 'Learning', quantity: 30, area: 67 },
    { name: 'Small group room', group: 'Learning', quantity: 2, area: 35 },
    { name: 'Assembly hall', group: 'Community', quantity: 1, area: 520 },
    { name: 'Multi-purpose room', group: 'Community', quantity: 5, area: 72 },
    { name: 'Staff room', group: 'Administration', quantity: 1, area: 180 },
    { name: 'Student toilets', group: 'Service', quantity: 12, area: null },
  ]);
  const [draft, setDraft] = useState(savedRows);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  useEffect(() => {
    if (open) {
      setDraft(savedRows);
      setQuery('');
      setGroup('');
    }
  }, [open, savedRows]);
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  if (!open) return null;
  const update = (name, field, value) => setDraft(rows => rows.map(row => row.name === name ? { ...row, [field]: value === '' ? null : Number(value) } : row));
  const visibleRows = draft.filter(row => (!query || row.name.toLowerCase().includes(query.toLowerCase())) && (!group || row.group === group));
  const save = () => { setSavedRows(draft); onClose(); };
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="soa-dialog" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="soa-title"><header><div><p className="eyebrow">Anderson Road · M4</p><h2 id="soa-title">Schedule of accommodation</h2></div><button onClick={onClose}><Icon name="close" /></button></header><div className="soa-toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search spaces" /><select value={group} onChange={event => setGroup(event.target.value)}><option value="">All groups</option><option>Learning</option><option>Community</option><option>Administration</option></select></div><table><thead><tr><th>Space</th><th>Group</th><th>Quantity</th><th>Unit area / m²</th><th>Target / m²</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.name}><td><b>{row.name}</b></td><td>{row.group}</td><td><input type="number" min="0" value={row.quantity ?? ''} onChange={event => update(row.name, 'quantity', event.target.value)} /></td><td><input type="number" min="0" value={row.area ?? ''} placeholder="TBC" onChange={event => update(row.name, 'area', event.target.value)} /></td><td>{row.quantity != null && row.area != null ? (row.quantity * row.area).toLocaleString() : 'TBC'}</td></tr>)}</tbody></table><footer><span>{draft.reduce((sum, row) => sum + (row.quantity || 0), 0)} scheduled spaces</span><div><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={save}>Save changes</button></div></footer></section></div>;
}

export function BubbleStudio() {
  const [selected, setSelected] = useState('SCH01');
  const [soaOpen, setSoaOpen] = useState(false);
  const [contextVisible, setContextVisible] = useState(true);
  const [tool, setTool] = useState('Select');
  const [inspectorTab, setInspectorTab] = useState('Properties');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState('site_graph.json');
  const [nodeName, setNodeName] = useState('School Main Block');
  const [spaceType, setSpaceType] = useState('Building');
  const [targetArea, setTargetArea] = useState('');
  const [priority, setPriority] = useState('Essential');
  const [nodeColor, setNodeColor] = useState(NODE_COLORS.building_block);
  const [diagramOption, setDiagramOption] = useState('Option S1');
  const [commentOpen, setCommentOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);
  const [userNodes, setUserNodes] = useState([]);
  const [userEdges, setUserEdges] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const { viewportStyle, navigationHandlers, zoomIn, zoomOut, resetViewport } = useCanvasNavigation({ minScale: .65, maxScale: 2 });
  const toast = useToast();
  const selectedNode = SITE_GRAPH_NODES.find(node => node.id === selected) || userNodes.find(node => node.id === selected) || SITE_GRAPH_NODES[3];

  const selectNode = node => {
    setSelected(node.id);
    setNodeName(node.name);
    setSpaceType(nodeType(node));
    setTargetArea(node.id === 'SCH01' ? '' : String(node.area || ''));
    setNodeColor(node.color || NODE_COLORS[node.elementType] || '#e95e45');
  };
  const handleGraphSelect = node => {
    if (tool === 'Connect') {
      if (!pendingIds.length) {
        setPendingIds([node.id]);
        toast('Select the second node');
      } else if (pendingIds[0] !== node.id) {
        setUserEdges(edges => [...edges, { source: pendingIds[0], target: node.id, type: 'ADJACENT_TO' }]);
        setPendingIds([]);
        toast('Relationship created');
      }
      return;
    }
    if (tool === 'Group nodes') {
      setPendingIds(ids => ids.includes(node.id) ? ids.filter(id => id !== node.id) : [...ids, node.id]);
      return;
    }
    selectNode(node);
  };
  const addNode = event => {
    if (tool !== 'Add node' || event.target.closest('.actual-bubble-node')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const id = `USER${userNodes.length + 1}`;
    setUserNodes(nodes => [...nodes, { id, name: 'New Programme Node', role: 'user added programme node', elementType: 'building_block', editable: true, x: Math.max(35, Math.min(925, ((event.clientX - rect.left) / rect.width) * 960)), y: Math.max(55, Math.min(570, ((event.clientY - rect.top) / rect.height) * 610)), radius: 34, color: '#e61e2a' }]);
    toast(`${id} added to site graph`);
  };
  const handleTool = name => {
    if (name === 'Zoom in') return zoomIn();
    if (name === 'Zoom out') return zoomOut();
    if (name === 'Fit view') return resetViewport();
    if (name === 'Reset diagram') {
      setUserNodes([]);
      setUserEdges([]);
      setUserGroups([]);
      setPendingIds([]);
      setTool('Select');
      resetViewport();
      toast('Diagram reset');
      return;
    }
    if (name === 'Group nodes' && tool === 'Group nodes' && pendingIds.length > 1) {
      const members = SITE_GRAPH_NODES.concat(userNodes).filter(node => pendingIds.includes(node.id));
      setUserGroups(groups => [...groups, { id: `GROUP${groups.length + 1}`, x: members.reduce((sum, node) => sum + node.x, 0) / members.length, y: members.reduce((sum, node) => sum + node.y, 0) / members.length, rx: Math.max(70, 58 + members.length * 12), ry: Math.max(55, 52 + members.length * 8) }]);
      setPendingIds([]);
      toast('Nodes grouped');
      return;
    }
    setTool(name);
    setPendingIds([]);
  };
  return <StudioFrame active="bubble"><div className="studio-content bubble-content"><div className="studio-canvas-wrap"><div className="canvas-toolbar"><label className="diagram-option">Diagram<select value={diagramOption} onChange={event => { setDiagramOption(event.target.value); toast(`${event.target.value} loaded`); }}><option>Option S1</option><option>Option S2</option><option>Option S3</option></select></label><button className="source-button" onClick={() => setSourceOpen(true)}><Icon name="chart" />{sourceFile}</button><span>{SITE_GRAPH_NODES.length + userNodes.length} nodes · {SITE_GRAPH_RELATIONSHIPS.length + userEdges.length} relationships</span><button onClick={() => { setContextVisible(value => !value); toast(contextVisible ? 'Site context hidden' : 'Site context shown'); }} className={contextVisible ? 'active' : ''}><Icon name="eye" />Context</button><button onClick={() => setCommentOpen(value => !value)}><Icon name="message" />Comment</button><button onClick={resetViewport}><Icon name="refresh" />Reset view</button></div><div className={`bubble-canvas ${contextVisible ? '' : 'context-hidden'}`} onClick={addNode} {...navigationHandlers}><div className="bubble-graph-layer" style={viewportStyle}><SiteGraph selectedId={selected} pendingIds={pendingIds} userNodes={userNodes} userEdges={userEdges} userGroups={userGroups} onSelect={handleGraphSelect} /></div><div className="bubble-manipulation-tools" role="toolbar" aria-label="Bubble diagram manipulation tools">{BUBBLE_TOOLS.map(name => <button key={name} className={tool === name ? 'active' : ''} onClick={event => { event.stopPropagation(); handleTool(name); }} title={name} aria-label={name}><Icon name={name === 'Select' ? 'check' : name === 'Add node' ? 'plus' : name === 'Connect' ? 'plus' : name === 'Pan' ? 'map' : name === 'Zoom in' || name === 'Zoom out' ? 'search' : name === 'Reset diagram' || name === 'Fit view' ? 'refresh' : 'layers'} /></button>)}</div><div className="bubble-tool-status"><b>{tool}</b> · {tool === 'Connect' ? 'Select the first node' : tool === 'Add node' ? 'Click canvas to place a node' : tool === 'Group nodes' ? 'Select nodes, then press Group again' : tool === 'Pan' ? 'Drag canvas to pan' : 'Ready'}</div><div className="north-mark">N<br /><b>↑</b><small>provisional</small></div></div><div className="canvas-caption"><b>{diagramOption} · Site E-2 relationship model</b><span>Programme clusters, fixed access and directional relationships from the validated site graph · {tool} tool{commentOpen ? ' · comment mode' : ''}</span></div></div><aside className="studio-inspector"><div className="inspector-head"><p className="eyebrow">Selected node</p><h2>{selectedNode.name}</h2><p>{selectedNode.role}</p></div><div className="inspector-tabs">{['Properties', 'Constraints', 'Relationships'].map(name => <button key={name} className={inspectorTab === name ? 'active' : ''} onClick={() => setInspectorTab(name)}>{name}</button>)}</div><div className="inspector-body"><div className="inspector-status"><Icon name="check" /><span><b>Validated outcome</b>Project 8591 · Site E-2</span></div>{inspectorTab === 'Properties' && <><dl><dt>Name</dt><dd><input value={nodeName} onChange={event => setNodeName(event.target.value)} onBlur={() => toast('Node name updated')} /></dd><dt>Space type</dt><dd><select value={spaceType} onChange={event => setSpaceType(event.target.value)}><option>Building</option><option>Circulation</option><option>Learning</option><option>Community</option><option>Landscape</option><option>Service</option><option>Arrival</option></select></dd><dt>Target area (m²)</dt><dd><input type="number" value={targetArea} placeholder="Not specified in site graph" onChange={event => setTargetArea(event.target.value)} /></dd><dt>Priority</dt><dd><select value={priority} onChange={event => setPriority(event.target.value)}><option>Essential</option><option>Preferred</option></select></dd><dt>Colour</dt><dd><input type="color" value={nodeColor} onChange={event => setNodeColor(event.target.value)} /></dd><dt>Relationship type</dt><dd>{selectedNode.id === 'SCH01' ? 'Programme cluster' : selectedNode.editable ? 'Validated relationship' : 'Retained site context'}</dd><dt>Evidence</dt><dd>{sourceFile}</dd></dl><button className="secondary-btn full-btn" onClick={() => toast('Site bubble option saved')}><Icon name="check" />Save option</button></>}{inspectorTab === 'Constraints' && <div className="inspector-note"><b>Fixed access condition</b><p>Keep the pedestrian gate, EVA road, and school arrival relationship visible for the next design gate.</p></div>}{inspectorTab === 'Relationships' && <div className="relation-list">{SITE_GRAPH_RELATIONSHIPS.filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id).slice(0, 5).map(edge => <span key={`${edge.source}-${edge.target}`}><b>{edge.source === selectedNode.id ? edge.target : edge.source}</b><em>{edge.type === 'ADJACENT_TO' ? 'Adjacent' : 'Context'}</em></span>)}</div>}</div><button className="secondary-btn full-btn" onClick={() => { toast('Connect another space enabled'); setTool('Connect'); }}><Icon name="plus" />Connect another space</button><button className="secondary-btn full-btn" onClick={() => setSourceOpen(true)}><Icon name="file" />View model evidence</button><button className="primary-btn full-btn" onClick={() => setSoaOpen(true)}>Open schedule of accommodation <Icon name="arrow" /></button></aside></div><SoADialog open={soaOpen} onClose={() => setSoaOpen(false)} /><ModelSourcePanel files={MODEL_FILES} current={sourceFile} onSelect={setSourceFile} open={sourceOpen} onClose={() => setSourceOpen(false)} /></StudioFrame>;
}
