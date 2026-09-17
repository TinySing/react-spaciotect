import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Shell, useToast } from '../../components';
import { QuickAction } from '../shared';

const buildingVolumes = [
  { x: 300, w: 130, d: 90, top: 250, bottom: 600, count: 14, rise: 38 },
  { x: 470, w: 96, d: 70, top: 132, bottom: 548, count: 20, rise: 28 },
  { x: 600, w: 112, d: 78, top: 330, bottom: 570, count: 10, rise: 30 },
];

function HomeVisual() {
  const floorPaths = useMemo(() => buildingVolumes.flatMap(volume => Array.from({ length: volume.count + 1 }, (_, index) => {
    const ratio = index / volume.count;
    const y = volume.top + (volume.bottom - volume.top) * ratio;
    const x1 = volume.x + volume.w;
    const x2 = x1 + volume.d;
    return { d: `M${volume.x} ${y} L${x1} ${y - volume.rise} L${x2} ${y - volume.rise + 34} L${volume.x + volume.d} ${y + 34} Z`, opacity: .42 - ratio * .24 };
  })), []);
  const nodePoints = useMemo(() => Array.from({ length: 130 }, (_, index) => ({ cx: 180 + ((index * 83) % 700), cy: 90 + ((index * 47) % 520), r: index % 13 === 0 ? 2.2 : 1.2, opacity: index % 3 === 0 ? .5 : .3 })), []);
  const sparkPoints = useMemo(() => Array.from({ length: 9 }, (_, index) => ({ cx: 260 + ((index * 71) % 580), cy: 120 + ((index * 37) % 160) })), []);
  return <>
    <div className="visual" aria-hidden="true"><svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="slabA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DFE3E7" stopOpacity=".9" /><stop offset="100%" stopColor="#F4F5F6" stopOpacity="0" /></linearGradient>
        <linearGradient id="slabB" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#C9CED4" stopOpacity=".75" /><stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#AEB5BD" stopOpacity=".55" /><stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
      </defs>
      <g stroke="#D3D8DD" strokeWidth=".7" fill="none" opacity=".85">{Array.from({ length: 17 }, (_, index) => { const ratio = index / 16; const y = 470 + ratio * ratio * 190; return <line key={`plane-h-${index}`} x1={120 - ratio * 110} y1={y} x2={860 + ratio * 70} y2={y} opacity={.55 - ratio * .38} />; })}{Array.from({ length: 19 }, (_, index) => { const ratio = index / 18; return <line key={`plane-v-${index}`} x1={250 + ratio * 430} y1="470" x2={20 + ratio * 880} y2="660" opacity=".22" />; })}</g>
      <g className="building-volume" opacity=".95"><path d="M300 250 L430 212 L430 560 L300 600 Z" fill="url(#slabA)" /><path d="M430 212 L520 246 L520 594 L430 560 Z" fill="url(#slabB)" /><path d="M300 250 L430 212 L520 246 L390 286 Z" fill="#E7EAED" opacity=".9" /></g>
      <g className="building-volume" opacity=".9"><path d="M470 132 L566 104 L566 520 L470 548 Z" fill="url(#slabA)" /><path d="M566 104 L636 130 L636 546 L566 520 Z" fill="url(#slabB)" /><path d="M470 132 L566 104 L636 130 L540 158 Z" fill="#E9ECEF" opacity=".9" /></g>
      <g className="building-volume" opacity=".85"><path d="M600 330 L712 300 L712 540 L600 570 Z" fill="url(#slabA)" /><path d="M712 300 L790 328 L790 566 L712 540 Z" fill="url(#slabB)" /><path d="M600 330 L712 300 L790 328 L678 358 Z" fill="#E7EAED" opacity=".85" /></g>
      <g stroke="#B9C0C7" strokeWidth=".65" fill="none" opacity=".7">{floorPaths.map((path, index) => <path key={`floor-${index}`} d={path.d} opacity={path.opacity} />)}</g>
      <g stroke="#AEB5BD" strokeWidth=".7" opacity=".55">{[[300, 250, 600], [430, 212, 560], [520, 246, 594], [470, 132, 548], [566, 104, 520], [636, 130, 546], [600, 330, 570], [712, 300, 540], [790, 328, 566]].map(([x, y1, y2], index) => <line key={`column-${index}`} x1={x} y1={y1} x2={x} y2={y2} />)}</g>
      <g>{[[352, 250], [488, 132], [590, 104], [664, 300], [742, 300], [418, 212]].map(([x, y], index) => <React.Fragment key={`beam-${index}`}><rect x={x - 1.1} y={y - 150} width="2.2" height="152" fill="url(#beam)" /><circle cx={x} cy={y - 150} r="2" fill="#9AA2AA" opacity=".55" /></React.Fragment>)}</g>
      <g className="flow-curves" fill="none" stroke="#C6CCD2" strokeWidth=".8" opacity=".6"><path d="M210 470 C 360 392 560 372 780 418" /><path d="M200 506 C 358 424 566 404 800 454" /><path d="M192 542 C 356 456 572 436 818 490" /></g>
      <g>{nodePoints.map((point, index) => <circle key={`node-${index}`} cx={point.cx} cy={point.cy} r={point.r} fill="#8E959D" opacity={point.opacity} className={index % 7 === 0 ? 'spark-node' : undefined} />)}{sparkPoints.map((point, index) => <circle key={`spark-${index}`} cx={point.cx} cy={point.cy} r="2.4" fill="none" stroke="#697077" strokeWidth=".9" opacity=".6" className="spark-node spark-ring" />)}</g>
    </svg></div>
    <div className="meteor-field" aria-hidden="true"><svg viewBox="0 0 1200 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path className="meteor-guide" d="M20 318 C245 245 420 294 635 294 C735 294 810 270 875 300 C950 329 1060 342 1180 325" /><path className="meteor-guide" d="M10 340 C230 420 425 300 650 315 C750 330 815 330 875 300 C960 270 1080 250 1190 260" /><path className="meteor-guide" d="M0 424 C225 486 430 382 665 394 S970 374 1200 428" /><path className="meteor-trails" pathLength="1200" d="M20 318 C245 245 420 294 635 294 C735 294 810 270 875 300 C950 329 1060 342 1180 325" /><path className="meteor-trails" pathLength="1200" d="M10 340 C230 420 425 300 650 315 C750 330 815 330 875 300 C960 270 1080 250 1190 260" /><path className="meteor-trails" pathLength="1200" d="M0 424 C225 486 430 382 665 394 S970 374 1200 428" /></svg></div>
    <div className="decor" aria-hidden="true"><svg viewBox="0 0 340 250" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#C2C7CC" strokeWidth=".85" opacity=".95">{[92, 102, 112, 122, 132, 142].map(y => <path key={`decor-a-${y}`} d={`M-20 ${y}C24 ${y - 32} 70 ${y - 34} 108 ${y - 14}s72 34 116 16 78-34 122-20`} />)}</g><g fill="none" stroke="#CBD0D5" strokeWidth=".8" opacity=".8">{[186, 198, 210].map(y => <path key={`decor-b-${y}`} d={`M-20 ${y}C36 ${y - 16} 78 ${y - 10} 120 ${y + 8}s84 26 132 10 88-22 128-10`} />)}</g><g fill="none" stroke="#CDD2D7" strokeWidth=".8" strokeLinecap="round" opacity=".9"><path d="M52 26v34h38" /><path d="M148 18v24a8 8 0 0 0 8 8h44" /><path d="M268 40v28a8 8 0 0 1-8 8h-36" /><path d="M96 236v-26a8 8 0 0 1 8-8h40" /><path d="M212 240v-22h44" /></g><g fill="#555B61">{[[52, 26, 2.6], [90, 60, 2.2], [148, 18, 2.4], [200, 50, 2.2], [268, 40, 2.6], [224, 76, 2.2], [96, 236, 2.4], [144, 202, 2.2], [256, 218, 2.4], [18, 160, 2.2], [310, 128, 2.2]].map(([cx, cy, r], index) => <circle key={`decor-dot-${index}`} cx={cx} cy={cy} r={r} />)}</g><g fill="#777D82" opacity=".38">{[[76, 152], [122, 70], [182, 146], [238, 160], [296, 196], [34, 214], [164, 236]].map(([cx, cy], index) => <circle key={`decor-muted-dot-${index}`} cx={cx} cy={cy} r="1.7" />)}</g></svg></div>
  </>;
}

export function HomePage() {
  const [prompt, setPrompt] = useState('');
  const toast = useToast();
  const submit = () => { if (prompt.trim()) { toast('Design prompt added to the workspace'); setPrompt(''); } };
  return <Shell active="home"><section className="home-page"><HomeVisual /><div className="home-content"><p className="greeting">Good morning, <b>Kai</b></p><h1>What would you like to do today?</h1><div className="home-composer"><div><input value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} placeholder="Message AI chat assistant" /><small>AI design assistant · Exploratory work only</small></div><button className="send-btn" onClick={submit}><Icon name="arrow" /></button><div className="composer-chips"><button onClick={() => setPrompt('school site in Kowloon')}>e.g. school site in Kowloon</button><button onClick={() => setPrompt('max GFA')}>max GFA</button><button onClick={() => setPrompt('site constraints')}>site constraints</button><button onClick={() => setPrompt('compare options')}>compare options</button></div></div></div><div className="home-lower"><h2>Quick actions</h2><div className="quick-actions"><QuickAction icon="layers" title="Analyse a Site" path="/site-analysis" /><QuickAction icon="box" title="Generate Concept" path="/studio/bubble" /><QuickAction icon="chart" title="Test Development Yield" path="/options" /><QuickAction icon="copy" title="Compare Options" path="/options" /><QuickAction icon="upload" title="Upload & Manage Data" path="/projects" /></div><h2 className="recent-heading">Previous sessions <Link to="/projects">View all <Icon name="arrow" /></Link></h2><div className="recent-grid"><Link to="/site-analysis" className="recent-card"><span className="status-dot green" /><div><b>Kowloon School Extension</b><small>Today, 09:42 · Review zoning constraints</small></div><Icon name="chevron" /></Link><Link to="/studio/bubble" className="recent-card"><span className="status-dot amber" /><div><b>Sha Tin Community Hub</b><small>Yesterday, 16:18 · Resolve room areas</small></div><Icon name="chevron" /></Link><Link to="/options" className="recent-card"><span className="status-dot blue" /><div><b>Kai Tak Civic Centre</b><small>28 Jul, 14:05 · Confirm massing</small></div><Icon name="chevron" /></Link><Link to="/energy" className="recent-card"><span className="status-dot green" /><div><b>Tseung Kwan O Primary School</b><small>24 Jul, 11:30 · Review energy results</small></div><Icon name="chevron" /></Link></div></div></section></Shell>;
}
