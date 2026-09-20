import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components';

const PROJECTS = [
  { id: 'school', name: 'Cheung Sha Wan Catholic Primary School', type: 'Education · Selected site', status: 'active', lng: 114.1559, lat: 22.3341 },
  { id: 'civic', name: 'Kowloon Civic Centre', type: 'Civic · Updated yesterday', status: 'complete', lng: 114.171, lat: 22.319 },
  { id: 'tower', name: 'Central Harbour Tower', type: 'Mixed-use · Active', status: 'active', lng: 114.137, lat: 22.299 },
  { id: 'residences', name: 'Tsuen Wan Residences', type: 'Residential · Complete', status: 'complete', lng: 114.119, lat: 22.369 },
  { id: 'campus', name: 'Sai Kung Wellness Campus', type: 'Healthcare · Draft', status: 'draft', lng: 114.188, lat: 22.351 },
];

const SHAPES = {
  ozp: [[114.144, 22.341], [114.168, 22.341], [114.172, 22.324], [114.163, 22.315], [114.143, 22.320]],
  height: [[114.149, 22.337], [114.163, 22.338], [114.166, 22.327], [114.151, 22.326]],
  green: [[114.175, 22.355], [114.199, 22.357], [114.204, 22.337], [114.183, 22.331], [114.173, 22.341]],
  transport: [[114.116, 22.371], [114.132, 22.354], [114.147, 22.341], [114.164, 22.326], [114.181, 22.310]],
  site: [[114.1549, 22.3346], [114.1562, 22.3347], [114.1567, 22.3337], [114.1552, 22.3334]],
};

// Floating layer chips, exactly as the mockup renders them (icon, label, swatch color).
const LAYER_CHIPS = [
  { id: 'ozp', label: 'OZP zones', color: '#e61e2a', icon: 'landmark' },
  { id: 'height', label: 'Height restriction', color: '#d97706', icon: 'ruler' },
  { id: 'green', label: 'Green belt', color: '#0e7c55', icon: 'trees' },
  { id: 'transport', label: 'Transport', color: '#697078', icon: 'train-front' },
  { id: 'projects', label: 'My projects', color: '#e61e2a', icon: 'map-pin' },
];

function world(lng, lat, zoom) {
  const size = 256 * 2 ** zoom;
  const x = (lng + 180) / 360 * size;
  const sin = Math.sin(lat * Math.PI / 180);
  const y = (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  return { x, y };
}

function mapPoint(lng, lat, center, zoom, width, height) {
  const origin = world(center.lng, center.lat, zoom);
  const point = world(lng, lat, zoom);
  return { x: point.x - origin.x + width / 2, y: point.y - origin.y + height / 2 };
}

function shapePath(points, center, zoom, width, height, close = true) {
  return `${points.map((point, index) => { const projected = mapPoint(point[0], point[1], center, zoom, width, height); return `${index ? 'L' : 'M'}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`; }).join(' ')}${close ? ' Z' : ''}`;
}

export function GISMap({ layers, selected, onToggleLayer, onSelect }) {
  const mapRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [center, setCenter] = useState({ lng: 114.1559, lat: 22.3341 });
  const [zoom, setZoom] = useState(14);
  const [size, setSize] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    const project = PROJECTS.find(item => item.id === selected);
    if (project) setCenter({ lng: project.lng, lat: project.lat });
  }, [selected]);
  useEffect(() => {
    if (!mapRef.current) return undefined;
    const updateSize = () => setSize({ width: mapRef.current.clientWidth || 1200, height: mapRef.current.clientHeight || 800 });
    const observer = new ResizeObserver(updateSize);
    observer.observe(mapRef.current);
    updateSize();
    return () => observer.disconnect();
  }, []);
  const tiles = useMemo(() => {
    const origin = world(center.lng, center.lat, zoom);
    const startX = Math.floor((origin.x - size.width / 2) / 256);
    const endX = Math.floor((origin.x + size.width / 2) / 256);
    const startY = Math.floor((origin.y - size.height / 2) / 256);
    const endY = Math.floor((origin.y + size.height / 2) / 256);
    const next = [];
    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        next.push({ x, y, src: `https://${['a', 'b', 'c'][Math.abs(x + y) % 3]}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}@2x.png`, left: x * 256 - origin.x + size.width / 2, top: y * 256 - origin.y + size.height / 2 });
      }
    }
    return next;
  }, [center, size, zoom]);
  const locate = () => { setCenter({ lng: 114.1559, lat: 22.3341 }); setZoom(14); };
  const handlePointerDown = event => {
    if (event.target.closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, center };
    setDragging(true);
  };
  const handlePointerMove = event => {
    if (!dragRef.current) return;
    const start = dragRef.current;
    const origin = world(start.center.lng, start.center.lat, zoom);
    const nextOrigin = { x: origin.x - (event.clientX - start.x), y: origin.y - (event.clientY - start.y) };
    const sizeAtZoom = 256 * 2 ** zoom;
    const lng = nextOrigin.x / sizeAtZoom * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * nextOrigin.y / sizeAtZoom))) * 180 / Math.PI;
    setCenter({ lng, lat });
  };
  const endDrag = () => { dragRef.current = null; setDragging(false); };
  const handleWheel = event => {
    event.preventDefault();
    setZoom(value => Math.max(11, Math.min(17, value + (event.deltaY < 0 ? 1 : -1))));
  };
  const scaleText = zoom >= 15 ? '100 m' : zoom <= 13 ? '500 m' : '250 m';
  const sitePath = shapePath(SHAPES.site, center, zoom, size.width, size.height);
  return <>
    <div ref={mapRef} className={`map${dragging ? ' dragging' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={handleWheel}>
      <div className="tile-layer">{tiles.map(tile => <img key={`${tile.x}-${tile.y}-${zoom}`} className="tile" src={tile.src} alt="" draggable="false" style={{ left: tile.left, top: tile.top }} />)}</div>
      <div className="map-wash" />
      <div className="map-grid" />
      <svg className="overlay-layer" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
        {layers.ozp && <path className="zone" d={shapePath(SHAPES.ozp, center, zoom, size.width, size.height)} />}
        {layers.height && <path className="height-zone" d={shapePath(SHAPES.height, center, zoom, size.width, size.height)} />}
        {layers.green && <path className="greenbelt" d={shapePath(SHAPES.green, center, zoom, size.width, size.height)} />}
        {layers.transport && <path className="corridor" d={shapePath(SHAPES.transport, center, zoom, size.width, size.height, false)} />}
        <path className="site-boundary-pulse" d={sitePath} />
        <path className="site-boundary" d={sitePath} />
      </svg>
      <div className="marker-layer">{layers.projects && PROJECTS.map(project => { const point = mapPoint(project.lng, project.lat, center, zoom, size.width, size.height); return <button key={project.id} className={`marker ${project.status}${selected === project.id ? ' selected' : ''}`} style={{ left: point.x, top: point.y }} onClick={event => { event.stopPropagation(); onSelect(project.id); }}><span className="pin" /><span className="marker-label"><b>{project.name}</b><span>{project.type}</span></span></button>; })}</div>
    </div>
    <div className="layerbar">{LAYER_CHIPS.map(chip => <button key={chip.id} className={`layer-chip${layers[chip.id] ? ' active' : ''}`} style={{ '--chip-color': chip.color }} onClick={() => onToggleLayer(chip.id)}><span className="swatch" /><Icon name={chip.icon} />{chip.label}</button>)}</div>
    <div className="zoom-controls">
      <button title="Zoom in" onClick={() => setZoom(value => Math.min(17, value + 1))}><Icon name="plus" /></button>
      <button title="Zoom out" onClick={() => setZoom(value => Math.max(11, value - 1))}><Icon name="minus" /></button>
      <button title="Return to selected site" onClick={locate}><Icon name="crosshair" /></button>
    </div>
    <div className="map-status"><span className="scale" /><span>{scaleText}</span><span>HK80 · 835620E · 821430N</span></div>
  </>;
}
