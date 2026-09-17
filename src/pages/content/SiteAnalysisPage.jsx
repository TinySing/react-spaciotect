import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_LAYERS } from '../../data';
import { Icon, Shell, useToast } from '../../components';
import { Event, GISMap } from '../shared';

const SELECTED_LABELS = {
  school: 'Cheung Sha Wan Catholic Primary School',
  civic: 'Kowloon Civic Centre',
  tower: 'Central Harbour Tower',
  residences: 'Tsuen Wan Residences',
  campus: 'Sai Kung Wellness Campus',
};

export function SiteAnalysisPage() {
  const [layers, setLayers] = useState(() => Object.fromEntries(SITE_LAYERS.map(([id]) => [id, id !== 'transport'])));
  const [selected, setSelected] = useState('school');
  const [tab, setTab] = useState('activity');
  const [search, setSearch] = useState('');
  const [legendOpen, setLegendOpen] = useState(true);
  const [siteCardOpen, setSiteCardOpen] = useState(true);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const toast = useToast();
  const toggleLayer = id => setLayers(current => ({ ...current, [id]: !current[id] }));
  return <Shell active="analysis"><section className="analysis-page"><GISMap layers={layers} selected={selected} search={search} onSearch={setSearch} onSelect={id => { setSelected(id); toast(`${SELECTED_LABELS[id]} selected`); }} onExport={() => toast('Site snapshot export prepared')} />{legendOpen && <div className="map-legend"><header><b>Map legend</b><button onClick={() => setLegendOpen(false)} aria-label="Close map legend"><Icon name="close" /></button></header><p>Planning context</p><span><i className="legend-red" />OZP boundary</span><span><i className="legend-amber" />Height control</span><span><i className="legend-green" />Green belt</span><p>Project status</p><span><i className="legend-red-dot" />Active site</span><span><i className="legend-green-dot" />Completed</span></div>}<div className="analysis-layerbar"><button className="legend-toggle" onClick={() => setLegendOpen(value => !value)}><Icon name="layers" />{legendOpen ? 'Hide legend' : 'Map legend'}</button>{SITE_LAYERS.map(([id, label, color]) => <button key={id} className={layers[id] ? 'active' : ''} style={{ '--chip': color }} onClick={() => { toggleLayer(id); toast(`${label} ${layers[id] ? 'hidden' : 'shown'}`); }} aria-pressed={layers[id]}><i /><Icon name={id === 'transport' ? 'map' : id === 'green' ? 'leaf' : 'building'} />{label}</button>)}</div><aside className="analysis-side"><div className="analysis-heading"><div><p className="eyebrow">Site analysis</p><h1>Cheung Sha Wan</h1><p>Catholic Primary School · NKIL 6512</p></div><span className="live-pill">Live</span></div><div className="site-facts"><span><b>8,300 m²</b> Site area</span><span><b>1.5</b> Plot ratio</span><span><b>45 m</b> Max height</span></div>{siteCardOpen && <div className="selected-site"><span className="site-icon"><Icon name="school" /></span><div><b>{SELECTED_LABELS[selected] || 'Selected site'}</b><small>Selected site · Hong Kong</small></div><button onClick={() => toast('Site details opened')}><Icon name="chevron" /></button><button className="site-card-close" onClick={() => setSiteCardOpen(false)} aria-label="Close selected site card"><Icon name="close" /></button></div>}<div className="analysis-tabs">{[['activity', 'Recent activity'], ['constraints', 'Constraints'], ['data', 'Source data']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div><div className="analysis-events">{tab === 'activity' && <><Event title="Site boundary verified" time="09:42">Boundary matched against the latest LandsD lot record.</Event><Event title="Wendy added a planning note" time="09:18">North edge requires an acoustic buffer from the transport corridor.</Event><Event title="Height overlay updated" time="Yesterday" warning>45 m restriction intersects 23% of the development envelope.</Event></>}{tab === 'constraints' && <><Event title="G/IC zoning" time="Verified">Government, institution, or community use permitted.</Event><Event title="45 m height restriction" time="Material" warning>Controls the north-east portion of the site envelope.</Event><Event title="Plot ratio 1.5" time="Current">Maximum estimated GFA is 12,450 m².</Event></>}{tab === 'data' && <><Event title="Lot boundary" time="Today">Lands Department · authoritative geometry.</Event><Event title="Planning controls" time="3 days">Planning Department · OZP and building height control.</Event><Event title="Utilities record" time="Pending" warning>Drainage alignment awaits confirmation.</Event></>}</div><div className="analysis-alert"><Icon name="bell" /><span><b>1 item needs review</b><small>Confirm the access point before generating massing options.</small></span></div><button className="secondary-btn full-btn" onClick={() => { setAnalysisStarted(true); toast('Site analysis started'); }}>{analysisStarted ? 'Analysis running · 1 review item' : 'Start analysis'} <Icon name="arrow" /></button><Link className="primary-btn full-btn" to="/site-analysis-report">Open site analysis report <Icon name="arrow" /></Link></aside></section></Shell>;
}
