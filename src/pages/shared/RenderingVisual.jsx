import React from 'react';

const LIGHTS = {
  'Late afternoon': { sky: '#c6d8dc', ground: '#d1dbd0', building: '#d9dad3', shade: '#a7b2aa', glass: '#255b68', sun: '#eab35d' },
  Morning: { sky: '#bfd9e6', ground: '#dbe4d8', building: '#e7e6dc', shade: '#b3c2bd', glass: '#2c6878', sun: '#f2c879' },
  Overcast: { sky: '#dce5e6', ground: '#d9dfd9', building: '#d0d6d2', shade: '#aab4b0', glass: '#426a72', sun: '#d9dfdf' },
};

const MATERIALS = {
  'Warm brick + concrete': { brick: '#b7846c', concrete: '#d8d8ce', accent: '#d9c1a7' },
  'Light render': { brick: '#c6d0cb', concrete: '#e8e8e1', accent: '#cadbd5' },
  'Timber accents': { brick: '#a87859', concrete: '#d5d8ce', accent: '#c9a16f' },
};

function WindowGrid({ x, y, width, rows = 4, columns = 6, color }) {
  return <g className="render-window-grid">{Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => <rect key={`${row}-${column}`} x={x + column * (width / columns)} y={y + row * 17} width={width / columns - 5} height="9" rx="1" fill={color} />))}</g>;
}

function BuildingVolume({ x, y, width, height, depth, floors, material, light, label }) {
  const sideX = x + depth;
  const sideY = y - depth * .42;
  return <g className="render-volume" aria-label={label}>
    <polygon className="render-volume-side" points={`${x + width},${y} ${sideX + width},${sideY} ${sideX + width},${sideY + height} ${x + width},${y + height}`} fill={light.shade} />
    <polygon className="render-volume-front" points={`${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`} fill={material.concrete} />
    <polygon className="render-volume-roof" points={`${x},${y} ${x + width},${y} ${sideX + width},${sideY} ${sideX},${sideY}`} fill={material.accent} />
    <WindowGrid x={x + 16} y={y + 19} width={width - 30} rows={floors} columns={Math.max(3, Math.floor(width / 36))} color={light.glass} />
    {Array.from({ length: floors - 1 }, (_, index) => <line key={index} x1={x} y1={y + (index + 1) * (height / floors)} x2={x + width} y2={y + (index + 1) * (height / floors)} stroke={light.shade} strokeWidth="2" opacity=".7" />)}
    <polygon className="render-side-windows" points={`${x + width + 12},${y + 18} ${sideX + width - 12},${sideY + 18} ${sideX + width - 12},${sideY + height - 20} ${x + width + 12},${y + height - 20}`} fill={light.glass} opacity=".8" />
  </g>;
}

function Tree({ x, y, scale = 1 }) {
  return <g className="render-tree-detail" transform={`translate(${x} ${y}) scale(${scale})`}><rect x="-3" y="8" width="6" height="27" rx="2" fill="#6d6250" /><circle cx="-13" cy="3" r="15" fill="#779b61" /><circle cx="10" cy="1" r="17" fill="#88a968" /><circle cx="0" cy="-12" r="18" fill="#9bb676" /></g>;
}

function Vehicle({ x, y, color, bus = false }) {
  return <g className="render-vehicle" transform={`translate(${x} ${y})`}><rect x="0" y="0" width={bus ? 48 : 27} height="13" rx="3" fill={color} /><rect x="5" y="-7" width={bus ? 34 : 15} height="8" rx="2" fill={color} /><rect x="8" y="-5" width="7" height="5" fill="#d6e7ea" /><rect x={bus ? 26 : 18} y="-5" width="7" height="5" fill="#d6e7ea" /><circle cx="8" cy="14" r="4" fill="#454d4e" /><circle cx={bus ? 39 : 20} cy="14" r="4" fill="#454d4e" /></g>;
}

export function RenderingVisual({ viewpoint = 'Courtyard', lightName = 'Late afternoon', materialName = 'Warm brick + concrete', shadows = true }) {
  const light = LIGHTS[lightName] || LIGHTS['Late afternoon'];
  const material = MATERIALS[materialName] || MATERIALS['Warm brick + concrete'];
  const viewpointTransform = { Overview: 'translate(0 0) scale(1)', Arrival: 'translate(-42 22) scale(1.1)', Courtyard: 'translate(-15 8) scale(1.06)', Roofscape: 'translate(12 46) scale(1.04) rotate(-2 500 330)' }[viewpoint] || 'translate(0 0) scale(1)';
  return <svg className="rendering-visual" viewBox="0 0 1000 650" role="img" aria-label={`${viewpoint} architectural rendering`}>
    <defs><linearGradient id="render-sky-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={light.sky} /><stop offset=".64" stopColor="#eef1ed" /><stop offset=".65" stopColor={light.ground} /></linearGradient><filter id="render-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter></defs>
    <rect width="1000" height="650" fill="url(#render-sky-gradient)" />
    <circle className="render-sun-detail" cx="780" cy="130" r="30" fill={light.sun} opacity=".75" />
    <g transform={viewpointTransform}>
      <polygon className="render-site" points="86,492 465,364 928,478 532,624" fill={light.ground} stroke="#a3b0a8" strokeWidth="2" />
      <polygon className="render-road" points="68,513 322,431 358,442 108,541" fill="#5c6870" /><path d="M91 520 L321 447" stroke="#f4f0d4" strokeWidth="3" strokeDasharray="25 20" />
      {shadows && <g className="render-shadows" opacity=".24" filter="url(#render-shadow)"><polygon points="190,445 535,320 842,430 492,566" fill="#4e625c" /><ellipse cx="730" cy="497" rx="135" ry="34" fill="#4e625c" /></g>}
      <BuildingVolume x={205} y={264} width={226} height={190} depth={78} floors={5} material={material} light={light} label="Learning block" />
      <BuildingVolume x={414} y={237} width={184} height={176} depth={72} floors={4} material={material} light={light} label="Central teaching block" />
      <BuildingVolume x={604} y={294} width={220} height={128} depth={66} floors={3} material={material} light={light} label="Sports hall" />
      <g className="render-bridge"><polygon points="344,286 682,188 700,202 365,307" fill={material.concrete} /><polygon points="365,307 700,202 700,224 365,329" fill={light.shade} /><line x1="400" y1="289" x2="400" y2="318" stroke={light.shade} strokeWidth="4" /><line x1="505" y1="256" x2="505" y2="285" stroke={light.shade} strokeWidth="4" /><line x1="610" y1="222" x2="610" y2="251" stroke={light.shade} strokeWidth="4" /></g>
      <g className="render-courtyard-detail"><polygon points="364,428 542,369 684,413 500,477" fill="#77bfa1" stroke="#426e63" strokeWidth="2" /><path d="M404 426 L550 378 M515 466 L650 420 M513 397 L514 449 M461 423 C475 400 552 399 581 424 C558 447 480 448 461 423Z" fill="none" stroke="#e5f1db" strokeWidth="2" /></g>
      <g className="render-roof-court"><polygon points="616,285 760,239 863,271 716,320" fill="#61be9e" stroke="#466c64" strokeWidth="2" /><path d="M650 282 L792 245 M702 308 L842 270 M728 273 l3 27 M682 276 c14 -18 46 -14 53 4 c-10 17 -43 18 -53 -4Z" fill="none" stroke="#e2f1d5" strokeWidth="2" /><path d="M608 280 L760 230 L876 266 L720 321Z" fill="none" stroke="#5d7068" strokeWidth="3" strokeDasharray="6 4" /></g>
      <g className="render-entry"><polygon points="264,454 352,425 394,439 306,470" fill="#f4f2e9" /><text x="277" y="449" fontSize="10" fill="#314b4d" fontWeight="700">MAIN ENTRY</text></g>
      <Tree x={164} y={462} scale={1.15} /><Tree x={336} y={518} scale={.85} /><Tree x={760} y={458} scale={1.15} /><Tree x={862} y={430} scale={.85} /><Tree x={566} y={539} scale={.9} />
      <Vehicle x={112} y={515} color="#e2b638" bus /><Vehicle x={440} y={511} color="#497d8b" /><Vehicle x={482} y={499} color="#b56b57" /><Vehicle x={525} y={486} color="#557d65" />
      <g className="render-people" fill="#46545a"><circle cx="391" cy="485" r="4" /><circle cx="404" cy="479" r="4" /><circle cx="695" cy="461" r="4" /><circle cx="711" cy="456" r="4" /></g>
    </g>
  </svg>;
}
