import React from 'react';
import { MASSING_OPTIONS } from '../../data';
import massingData from '../../data/massingData.json';

const COLORS = { learning: '#b9cdbf', hall: '#d8c4ae', context: '#9eafa8', site: '#e2ebe5', court: '#bed4b3' };

function point(x, y, z = 0) { return [380 + (x + y) * 3.05, 200 + (x - y) * 1.35 - z * 4.2]; }
function asPolygons(value) {
  if (!Array.isArray(value) || !value.length) return [];
  if (typeof value[0]?.[0] === 'number') return [value];
  if (typeof value[0]?.[0]?.[0] === 'number') return value;
  return value.flatMap(asPolygons);
}
function polygonPoints(polygon, z = 0) { return polygon.map(([x, y]) => point(x, y, z).map(value => value.toFixed(1)).join(',')).join(' '); }
function linePoints(line, z = 0) { return line.map(([x, y]) => point(x, y, z).map(value => value.toFixed(1)).join(',')).join(' '); }
function boundsOf(site) {
  const points = asPolygons(site.site_boundary)[0] || [];
  const xs = points.map(item => item[0]);
  const ys = points.map(item => item[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function ExtrudedFootprint({ polygon, base, height, color, opacity = 1, selected = false }) {
  const top = polygonPoints(polygon, base + height);
  const bottom = polygonPoints(polygon, base);
  const sideFaces = polygon.slice(0, -1).map(([x, y], index) => {
    const next = polygon[index + 1];
    return <polygon key={`${x}-${y}-${index}`} className="massing-face massing-side" points={`${point(x, y, base).join(',')} ${point(next[0], next[1], base).join(',')} ${point(next[0], next[1], base + height).join(',')} ${point(x, y, base + height).join(',')}`} fill={color} />;
  });
  return <g className={`massing-volume ${selected ? 'selected' : ''}`} opacity={opacity}>
    <polygon className="massing-face massing-front" points={bottom} fill={color} />
    {sideFaces}
    <polygon className="massing-face massing-top" points={top} fill={color} />
  </g>;
}

function ContextBlock({ polygon, height }) { return <ExtrudedFootprint polygon={polygon} base={0} height={height} color={COLORS.context} opacity=".25" />; }

export function MassingVisual({ option = 'M4', compact = false, style, visibleLayers, visibleLevels = 6, shadows = true, context = true }) {
  const sourceOption = option === 'M4' ? 'C' : option === 'M3' ? 'B' : option === 'M2' || option === 'M1' ? 'A' : option;
  const site = massingData[sourceOption] || massingData.C;
  const showLayer = name => !visibleLayers || visibleLayers[name] !== false;
  const visualStyle = typeof style === 'string' ? { transform: style } : style;
  const bounds = boundsOf(site);
  const floorHeights = site.f2f_height || [];
  const maxFloor = Math.min(site.nr_floors || floorHeights.length, visibleLevels);
  const buildingFootprints = [asPolygons(site.ground_floor_building_footprint), ...((site.other_floor_building_footprints || []).slice(0, Math.max(0, maxFloor - 1)).map(asPolygons))];
  const levelBases = floorHeights.slice(0, maxFloor).map((_, index) => floorHeights.slice(0, index).reduce((sum, value) => sum + value, 0));
  const siteBoundary = asPolygons(site.site_boundary)[0] || [];
  const contextPolygons = [
    [[bounds.minX + 10, bounds.maxY + 18], [bounds.maxX - 28, bounds.maxY + 18], [bounds.maxX - 28, bounds.maxY + 34], [bounds.minX + 10, bounds.maxY + 34]],
    [[bounds.maxX + 10, bounds.minY + 16], [bounds.maxX + 32, bounds.minY + 16], [bounds.maxX + 32, bounds.maxY - 18], [bounds.maxX + 10, bounds.maxY - 18]],
    [[bounds.minX - 30, bounds.minY + 14], [bounds.minX - 10, bounds.minY + 14], [bounds.minX - 10, bounds.maxY - 28], [bounds.minX - 30, bounds.maxY - 28]],
    [[bounds.minX + 28, bounds.minY - 30], [bounds.maxX - 24, bounds.minY - 30], [bounds.maxX - 24, bounds.minY - 12], [bounds.minX + 28, bounds.minY - 12]],
  ];
  const entry = asPolygons(site.pedestrian_entrance_lines)[0]?.at(-1) || [5, -47];
  const entryPoint = point(entry[0], entry[1], 0);
  const title = MASSING_OPTIONS[option]?.title || `OPT-${sourceOption} massing`;
  return <div className={`massing-visual ${compact ? 'compact' : ''} option-${option.toLowerCase()} ${shadows ? '' : 'no-shadows'}`} style={visualStyle} aria-label={`${title} preview`}>
    <svg className="massing-model-svg" viewBox="0 0 760 470" role="img" aria-label={`${title} BIM model`}>
      {showLayer('Landscape') && <>
        <polygon className="massing-site-plane" points={polygonPoints([[bounds.minX - 42, bounds.minY - 32], [bounds.maxX + 42, bounds.minY - 32], [bounds.maxX + 42, bounds.maxY + 50], [bounds.minX - 42, bounds.maxY + 50]])} fill={COLORS.site} />
        {asPolygons(site.basketball_court_open_area).map((polygon, index) => <polygon key={`court-${index}`} className="massing-courtyard" points={polygonPoints(polygon, .12)} fill={COLORS.court} />)}
        <polygon className="massing-boundary" points={polygonPoints(siteBoundary, .2)} />
      </>}
      {context && showLayer('Landscape') && <g className="massing-context-layer">{contextPolygons.map((polygon, index) => <ContextBlock key={`context-${index}`} polygon={polygon} height={8 + index * 2} />)}<polyline className="massing-context-line" points={linePoints(site.pedestrian_entrance_lines, .2)} /><polyline className="massing-context-line" points={linePoints(site.vehicular_entrance_lines, .2)} /></g>}
      {showLayer('Structure') && buildingFootprints.map((floorPolygons, floorIndex) => floorPolygons.map((polygon, polygonIndex) => <ExtrudedFootprint key={`floor-${floorIndex}-${polygonIndex}`} polygon={polygon} base={levelBases[floorIndex]} height={floorHeights[floorIndex] || 3.6} color={floorIndex === 0 && polygonIndex > 0 ? COLORS.hall : COLORS.learning} opacity={showLayer('Envelope') ? 1 : .72} />))}
      {showLayer('Access / EVA') && <>{(site.EVA_road_centerline || []).map((line, index) => <polyline key={`eva-${index}`} className="massing-eva" points={linePoints(line, .25)} />)}<g className="massing-entrance"><circle cx={entryPoint[0]} cy={entryPoint[1]} r="10" /><path d={`M${entryPoint[0] - 14},${entryPoint[1]} h28 M${entryPoint[0]},${entryPoint[1] - 14} v28`} /><rect x={entryPoint[0] - 55} y={entryPoint[1] - 44} width="110" height="22" rx="4" fill="#e62c36" /><text x={entryPoint[0]} y={entryPoint[1] - 29} fill="#fff" textAnchor="middle" fontSize="9" fontWeight="700">MAIN ENTRANCE</text></g></>}
      <text className="massing-north" x="700" y="48">N</text><text className="massing-north-arrow" x="701" y="70">↑</text>
    </svg>
  </div>;
}
