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

export function GISMap({ layers, selected, search, onSearch, onSelect, onExport }) {
  const mapRef = useRef(null);
  const dragRef = useRef(null);
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
  const visibleProjects = PROJECTS.filter(project => !search.trim() || project.name.toLowerCase().includes(search.trim().toLowerCase()));
  const reset = () => { setCenter({ lng: 114.1559, lat: 22.3341 }); setZoom(14); };
  const handlePointerDown = event => {
    if (event.button !== 0 || event.target.closest('button, input')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, center };
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
  const handleWheel = event => {
    event.preventDefault();
    setZoom(value => Math.max(11, Math.min(17, value + (event.deltaY < 0 ? 1 : -1))));
  };
  return <div ref={mapRef} className="map-panel gis-map" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onWheel={handleWheel}>
    <div className="map-tile-layer">{tiles.map(tile => <img key={`${tile.x}-${tile.y}-${zoom}`} className="map-tile" src={tile.src} alt="" draggable="false" style={{ left: tile.left, top: tile.top }} />)}</div>
    <div className="map-wash" />
    <svg className="map-overlay-layer" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true"><path className="map-zone-ozp" d={layers.ozp ? shapePath(SHAPES.ozp, center, zoom, size.width, size.height) : ''} /><path className="map-zone-height" d={layers.height ? shapePath(SHAPES.height, center, zoom, size.width, size.height) : ''} /><path className="map-zone-green" d={layers.green ? shapePath(SHAPES.green, center, zoom, size.width, size.height) : ''} /><path className="map-zone-transport" d={layers.transport ? shapePath(SHAPES.transport, center, zoom, size.width, size.height, false) : ''} /><path className="map-site-pulse" d={shapePath(SHAPES.site, center, zoom, size.width, size.height)} /><path className="map-site-boundary" d={shapePath(SHAPES.site, center, zoom, size.width, size.height)} /></svg>
    <div className="map-marker-layer">{layers.projects && visibleProjects.map(project => { const point = mapPoint(project.lng, project.lat, center, zoom, size.width, size.height); return <button key={project.id} className={`map-marker ${project.status} ${selected === project.id ? 'selected' : ''}`} style={{ left: point.x, top: point.y }} onClick={event => { event.stopPropagation(); onSelect(project.id); }}><span className="map-pin" /><span className="map-marker-label"><b>{project.name}</b><span>{project.type}</span></span></button>; })}</div>
    <div className="map-tools"><span className="gis-badge"><Icon name="map" />GIS context</span><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search site context" aria-label="Search site context" /><button onClick={() => setZoom(value => Math.min(17, value + 1))} aria-label="Zoom in">+</button><button onClick={() => setZoom(value => Math.max(11, value - 1))} aria-label="Zoom out">−</button><button onClick={reset} aria-label="Centre map"><Icon name="map" /></button><button onClick={onExport}><Icon name="download" />Export</button></div>
    <div className="map-compass">N<br /><b>↑</b></div><span className="map-scale">{zoom >= 15 ? '100 m' : zoom <= 13 ? '500 m' : '250 m'} · HK80</span>
  </div>;
}
