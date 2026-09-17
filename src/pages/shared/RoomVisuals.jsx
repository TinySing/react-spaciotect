import React from 'react';
import studioData from '../../data/studioData.json';

const GRAPH_COLORS = { learning: '#4f86c6', community: '#d96a98', administration: '#38a978', circulation: '#f0b43c', occupiable: '#4f86c6', service: '#9b8eb4' };
const graph = studioData.stackGraph;
const spaces = studioData.rooms.Spaces;

function floorName(floor) { return floor === 1 ? 'G' : `${floor - 1}`; }
function levelOf(name) { const suffix = name.split('-').pop(); return suffix === 'G' ? 1 : Number(suffix) + 1; }
function roomColor(category) { return GRAPH_COLORS[category] || GRAPH_COLORS.occupiable; }

export function RoomRelationshipGraph({ floor, selected, onSelect }) {
  const nodes = graph.nodes;
  const ids = new Set(nodes.map(node => node.globalId));
  const edges = graph.relationships.filter(edge => ids.has(edge.source) && ids.has(edge.target));
  const positions = {};
  [1, 2, 3, 4, 5, 6].forEach(level => {
    const levelNodes = nodes.filter(node => node.floorLevel === level);
    const columns = Math.max(1, Math.ceil(levelNodes.length / 2));
    levelNodes.forEach((node, index) => {
      const top = index % 2 === 0;
      const column = Math.floor(index / 2);
      positions[node.globalId] = [125 + column * (710 / Math.max(1, columns - 1)), 125 + (6 - level) * 62 + (top ? -16 : 16)];
    });
  });
  return <svg className="room-graph-svg" viewBox="60 70 840 480" role="img" aria-label={`All floors 3D room relationship graph · ${floorName(floor)} highlighted`}><rect className="room-floor-frame" x="82" y="88" width="796" height="444" rx="24" />{[1, 2, 3, 4, 5, 6].map(level => <g key={level} className={`room-floor-band ${level === floor ? 'active' : ''}`}><line x1="96" y1={125 + (6 - level) * 62} x2="864" y2={125 + (6 - level) * 62} /><text x="104" y={119 + (6 - level) * 62}>{floorName(level)}/F</text></g>)}{edges.map((edge, index) => { const start = positions[edge.source]; const end = positions[edge.target]; return start && end ? <line key={`${edge.source}-${edge.target}-${index}`} className="room-edge" x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}><title>{edge.adjacencyType || 'adjacency'} · {edge.source} to {edge.target}</title></line> : null; })}{nodes.map(node => { const position = positions[node.globalId]; const active = node.floorLevel === floor; return <g key={node.globalId} className={`room-node ${active ? 'active-floor' : ''} ${selected === node.globalId ? 'selected' : ''}`} transform={`translate(${position[0]} ${position[1]})`} role="button" tabIndex="0" onClick={() => onSelect(node.globalId)} onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && onSelect(node.globalId)}><circle r={active ? 20 : 12} fill={roomColor(node.spaceCategory)} /><text>{active ? node.globalId : node.globalId.slice(0, 4)}</text><title>{node.globalId} · {node.spaceType || node.name} · {node.spaceCategory}</title></g>; })}</svg>;
}

function iso(x, y, z = 0) { return [380 + (x - y) * 4.1, 330 + (x + y) * 1.7 - z * 10]; }
function polygon(points) { return points.map(point => `${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' '); }

export function RoomStackVisual({ floor, selected, onSelect }) {
  const geometric = spaces.filter(space => space.Geometry?.Curve?.ControlPoints?.length > 2);
  return <svg className="room-stack-svg" viewBox="20 20 740 450" role="img" aria-label="BHoM room stack"><text className="room-stack-title" x="48" y="50">BHoM ROOM STACK · {floorName(floor)}/F HIGHLIGHTED</text>{geometric.map(space => { const controls = space.Geometry.Curve.ControlPoints; const baseZ = controls[0].Z || 0; const height = space.Geometry.Direction?.Z || 3.6; const base = controls.slice(0, -1).map(point => iso(point.X, point.Y, baseZ)); const top = controls.slice(0, -1).map(point => iso(point.X, point.Y, baseZ + height)); const active = levelOf(space.Name) === floor; const fill = roomColor(space.Category); return <g key={space.Name} className={`room-volume ${selected === space.Name ? 'selected-room' : ''}`} style={{ '--room': fill }} opacity={active ? .96 : .15} role="button" tabIndex="0" onClick={() => onSelect(space.Name)} onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && onSelect(space.Name)}><polygon className="room-volume-side" points={polygon([base[0], base[1], top[1], top[0]])} /><polygon className="room-volume-top" points={polygon(top)}><title>{space.Name} · {space.Category} · {floorName(levelOf(space.Name))}/F</title></polygon></g>; })}<g className="room-stack-axis"><text x="45" y="415">G</text><text x="45" y="245">5/F</text><line x1="55" y1="400" x2="55" y2="210" /></g></svg>;
}
