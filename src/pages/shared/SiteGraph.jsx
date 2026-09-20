import React, { useRef } from 'react';

const NODE_COLORS = {
  street: '#8b9094', fixed_gate: '#f39a55', building_block: '#e95e45', hall: '#8a68b5',
  classroom_cluster: '#6875bd', court: '#ed7156', loading_bay: '#8a68b5', road: '#8b9094', eva_road: '#6baa72',
};

// Coordinates are scoped to this reference drawing; business data stays separate.
const SOURCE_POSITIONS = {
  STR01: [242, 270], PED01: [352, 410], VEH01: [392, 525], SCH01: [575, 315],
  ASS01: [830, 405], CLA01: [600, 205], BAS01: [640, 420], LOA01: [610, 495],
  DAI01: [470, 490], EVA01: [535, 490],
};

function wrapLabel(name) {
  const lines = [];
  let line = '';
  name.replace('Loading Unloading', 'Loading / Unloading').split(' ').forEach(word => {
    if (`${line} ${word}`.trim().length > 15 && line) { lines.push(line); line = word; } else line = `${line} ${word}`.trim();
  });
  if (line) lines.push(line);
  return lines;
}

function nodePosition(node) {
  if (node.x !== undefined && node.y !== undefined && (node.id.startsWith('USER') || node.positioned)) return [node.x, node.y];
  return SOURCE_POSITIONS[node.id] || [node.x, node.y];
}

function GraphNode({ node, selected, pending, draggable, onSelect, onDragStart }) {
  const lines = wrapLabel(node.name);
  const [x, y] = nodePosition(node);
  return <g
    className={`actual-bubble-node ${node.editable ? '' : 'context'} ${selected ? 'selected' : ''} ${pending ? 'pending' : ''}`}
    data-id={node.id}
    role="button"
    tabIndex="0"
    transform={`translate(${x} ${y})`}
    style={{ '--node': node.color || NODE_COLORS[node.elementType] || '#8b9094' }}
    onClick={() => onSelect(node)}
    onPointerDown={event => draggable && node.editable && onDragStart(event, node)}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node); }
    }}
  >
    <circle r={node.radius} />
    <text>{lines.map((line, index) => <tspan key={`${line}-${index}`} x="0" dy={index ? 11 : -((lines.length - 1) * 5.5)}>{line}</tspan>)}</text>
    <title>{node.name} · {node.role}</title>
  </g>;
}

export function SiteGraph({ nodes: sourceNodes = [], relationships: sourceRelationships = [], selectedId, pendingIds = [], userNodes = [], userEdges = [], userGroups = [], nodeOverrides = {}, onSelect, onNodeMove, draggable = false }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const nodes = [...sourceNodes.map(node => ({ ...node, ...nodeOverrides[node.id] })), ...userNodes];
  const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
  const edges = [...sourceRelationships, ...userEdges];
  const toGraphPoint = event => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: (event.clientX - rect.left) / rect.width * 1200, y: (event.clientY - rect.top) / rect.height * 700 };
  };
  const startDrag = (event, node) => {
    if (event.button !== 0) return;
    const point = toGraphPoint(event);
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.ownerSVGElement.setPointerCapture(event.pointerId);
    const [x, y] = nodePosition(node);
    dragRef.current = { id: node.id, pointerId: event.pointerId, x: point.x, y: point.y, nodeX: x, nodeY: y };
  };
  const moveDrag = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = toGraphPoint(event);
    if (!point) return;
    onNodeMove?.(drag.id, {
      x: Math.round(Math.max(310, Math.min(900, drag.nodeX + point.x - drag.x))),
      y: Math.round(Math.max(145, Math.min(540, drag.nodeY + point.y - drag.y))),
    });
  };
  const endDrag = event => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return <svg ref={svgRef} className={`actual-site-graph${draggable ? ' node-draggable' : ''}`} viewBox="0 0 1200 700" role="img" aria-label="Site E-2 conceptual bubble diagram" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
    <defs><marker id="graphArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#9ca3a6" /></marker></defs>
    <text className="graph-heading" x="150" y="74">SITE E-2 / CONCEPT SITE RELATIONSHIPS</text>
    <polygon className="site-boundary" points="342,145 940,165 910,520 370,550 295,330" />
    <rect className="street-band" x="232" y="140" width="20" height="410" rx="1" />
    <text className="street-label" x="225" y="382" transform="rotate(-90 225 382)">Street connection · indicative</text>
    {userGroups.map(group => <ellipse key={group.id} className="cluster user-group" cx={group.x} cy={group.y} rx={group.rx} ry={group.ry} />)}
    {edges.map((edge, index) => {
      const start = byId[edge.source];
      const end = byId[edge.target];
      if (!start || !end) return null;
      const [startX, startY] = nodePosition(start);
      const [endX, endY] = nodePosition(end);
      const curved = edge.type !== 'ADJACENT_TO';
      const offset = (index % 3 - 1) * 11;
      const midX = (startX + endX) / 2 + offset;
      const midY = (startY + endY) / 2 - offset;
      return <path key={`${edge.source}-${edge.target}-${index}`} className={`graph-edge ${curved ? 'context' : ''} ${edge.userCreated ? 'user-edge' : ''}`} d={curved ? `M${startX} ${startY} Q${midX} ${midY} ${endX} ${endY}` : `M${startX} ${startY} L${endX} ${endY}`} markerEnd="url(#graphArrow)"><title>{edge.type} · {edge.source} to {edge.target}</title></path>;
    })}
    {nodes.map(node => <GraphNode key={node.id} node={node} selected={selectedId === node.id} pending={pendingIds.includes(node.id)} draggable={draggable} onSelect={onSelect} onDragStart={startDrag} />)}
    <g className="graph-north" transform="translate(990 150)"><text x="0" y="0">N</text><path d="M0 48 V10 M-9 21 L0 10 L9 21" /><text className="graph-north-note" x="-28" y="69">provisional</text></g>
    <g className="graph-legend" transform="translate(835 605)"><text className="legend-title" y="0">LEGEND</text><line className="legend-line" x1="0" y1="19" x2="42" y2="19" markerEnd="url(#graphArrow)" /><text className="legend-text" x="52" y="22">Adjacency</text><line className="legend-line dashed" x1="0" y1="40" x2="42" y2="40" /><text className="legend-text" x="52" y="43">Containment / context</text><line className="legend-boundary" x1="0" y1="61" x2="42" y2="61" /><text className="legend-text" x="52" y="64">Retained site boundary</text></g>
  </svg>;
}

export { NODE_COLORS };
