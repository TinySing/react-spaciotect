import React from 'react';
import { SITE_GRAPH_NODES, SITE_GRAPH_RELATIONSHIPS } from '../../data';

const NODE_COLORS = {
  street: '#8b9094',
  fixed_gate: '#f39a55',
  building_block: '#e95e45',
  hall: '#8a68b5',
  classroom_cluster: '#6875bd',
  court: '#ed7156',
  loading_bay: '#8a68b5',
  road: '#8b9094',
  eva_road: '#6baa72',
};

function wrapLabel(name) {
  const words = name.replace('Loading Unloading', 'Loading / Unloading').split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    if (`${line} ${word}`.trim().length > 15 && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines;
}

function GraphNode({ node, selected, pending, onSelect, onTogglePending }) {
  const lines = wrapLabel(node.name);
  return <g
    className={`actual-bubble-node ${node.editable ? '' : 'context'} ${selected ? 'selected' : ''} ${pending ? 'pending' : ''}`}
    data-id={node.id}
    role="button"
    tabIndex="0"
    transform={`translate(${node.x} ${node.y})`}
    style={{ '--node': node.color || NODE_COLORS[node.elementType] || '#8b9094' }}
    onClick={() => onSelect(node)}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(node);
      }
    }}
  >
    <circle r={node.radius} />
    <text>{lines.map((line, index) => <tspan key={line} x="0" dy={index ? 10 : -((lines.length - 1) * 5)}>{line}</tspan>)}</text>
    <title>{node.name} · {node.role}</title>
  </g>;
}

export function SiteGraph({ selectedId, pendingIds = [], userNodes = [], userEdges = [], userGroups = [], onSelect }) {
  const nodes = [...SITE_GRAPH_NODES, ...userNodes];
  const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
  const edges = [...SITE_GRAPH_RELATIONSHIPS, ...userEdges];
  return <svg className="actual-site-graph" viewBox="0 0 960 610" role="img" aria-label="Site E-2 conceptual bubble diagram">
    <defs><marker id="graphArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#9ca3a6" /></marker></defs>
    <text className="graph-heading" x="24" y="30">SITE E-2 · VALIDATED RELATIONSHIP GRAPH</text>
    <ellipse className="cluster school" cx="440" cy="300" rx="245" ry="205" />
    <text className="cluster-title" x="440" y="218">SCHOOL BUILDING</text>
    <text className="cluster-subtitle" x="440" y="234">LEARNING + ASSEMBLY CLUSTER · 35.56% SITE AREA</text>
    <ellipse className="cluster service" cx="690" cy="455" rx="205" ry="112" />
    {userGroups.map(group => <ellipse key={group.id} className="cluster user-group" cx={group.x} cy={group.y} rx={group.rx} ry={group.ry} />)}
    {edges.map((edge, index) => {
      const start = byId[edge.source];
      const end = byId[edge.target];
      if (!start || !end) return null;
      const curved = edge.type !== 'ADJACENT_TO';
      const offset = (index % 3 - 1) * 13;
      const mx = (start.x + end.x) / 2 + offset;
      const my = (start.y + end.y) / 2 - offset;
      return <path key={`${edge.source}-${edge.target}-${index}`} className={`graph-edge ${curved ? 'context' : ''}`} d={`M${start.x} ${start.y} Q${mx} ${my} ${end.x} ${end.y}`} markerEnd="url(#graphArrow)"><title>{edge.type} · {edge.source} to {edge.target}</title></path>;
    })}
    {nodes.map(node => <GraphNode key={node.id} node={node} selected={selectedId === node.id} pending={pendingIds.includes(node.id)} onSelect={onSelect} />)}
    <g transform="translate(758 545)"><text className="legend-title" y="0">LEGEND</text><line className="legend-line" x1="0" y1="18" x2="42" y2="18" markerEnd="url(#graphArrow)" /><text className="legend-text" x="52" y="21">Adjacency</text><line className="legend-line dashed" x1="0" y1="38" x2="42" y2="38" /><text className="legend-text" x="52" y="41">Containment / context</text><line className="legend-cluster" x1="0" y1="58" x2="42" y2="58" /><text className="legend-text" x="52" y="61">Programme cluster</text></g>
  </svg>;
}

export { NODE_COLORS };
