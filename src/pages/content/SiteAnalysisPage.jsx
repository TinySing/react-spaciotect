import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Shell } from '../../components';
import { Event, GISMap } from '../shared';

const SELECTED_LABELS = {
  school: 'Cheung Sha Wan Catholic Primary School',
  civic: 'Kowloon Civic Centre',
  tower: 'Central Harbour Tower',
  residences: 'Tsuen Wan Residences',
  campus: 'Sai Kung Wellness Campus',
};

export function SiteAnalysisPage() {
  const navigate = useNavigate();
  const [layers, setLayers] = useState({ ozp: true, height: true, green: true, transport: false, projects: true });
  const [selected, setSelected] = useState('school');
  const [cardDismissed, setCardDismissed] = useState(false);
  const [legendClosed, setLegendClosed] = useState(false);
  const [tab, setTab] = useState('activity');
  const selectProject = id => { setSelected(id); setCardDismissed(false); };

  // The mockup's topbar search selected a matching project on the GIS page;
  // the React shell search dispatches the same commit here.
  useEffect(() => {
    const handler = event => {
      const term = String(event.detail || '').toLowerCase();
      const match = Object.entries(SELECTED_LABELS).find(([, name]) => name.toLowerCase().includes(term));
      if (match) selectProject(match[0]);
    };
    window.addEventListener('spaciotect:gis-search', handler);
    return () => window.removeEventListener('spaciotect:gis-search', handler);
  }, []);

  return <Shell active="analysis"><section className="analysis-page">
    <GISMap layers={layers} selected={selected} onToggleLayer={id => setLayers(current => ({ ...current, [id]: !current[id] }))} onSelect={selectProject} />
    <aside className="context-panel">
      <div className="panel-head">
        <p className="eyebrow">Site intelligence</p>
        <div className="panel-title-row"><div><h1>Cheung Sha Wan</h1><p>Catholic Primary School · NKIL 6512</p></div><span className="live">Live</span></div>
      </div>
      <div className="metrics">
        <div className="metric"><span>Site area</span><b>8,300 m²</b><em>Verified</em></div>
        <div className="metric"><span>Plot ratio</span><b>1.5</b><em>Within OZP</em></div>
        <div className="metric"><span>Max height</span><b>45 m</b><em>12 storeys</em></div>
      </div>
      <div className="tabs">{[['activity', 'Activity'], ['constraints', 'Constraints'], ['data', 'Data health']].map(([id, label]) => <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>)}</div>
      <div className="panel-body">
        {tab === 'activity' && <>
          <div className="section-title">Recent activity <span>View all</span></div>
          <div className="timeline">
            <Event title="Site boundary verified" time="09:42">Boundary matched against the latest LandsD lot record.</Event>
            <Event title="Wendy added a planning note" time="09:18" message>North edge requires an acoustic buffer from the transport corridor.</Event>
            <Event title="Height overlay updated" time="Yesterday" warning>45 m restriction intersects 23% of the development envelope.</Event>
          </div>
          <div className="alert-card"><Icon name="triangle-alert" /><div><b>1 item needs review</b><p>Confirm the access point before generating massing options.</p></div></div>
        </>}
        {tab === 'constraints' && <>
          <div className="section-title">Active constraints <span>6 layers</span></div>
          <div className="timeline">
            <Event title="G/IC zoning" time="Verified">Government, institution, or community use permitted.</Event>
            <Event title="45 m height restriction" time="Material" warning>Controls the north-east portion of the site envelope.</Event>
            <Event title="Plot ratio 1.5" time="Current">Maximum estimated GFA is 12,450 m².</Event>
          </div>
        </>}
        {tab === 'data' && <>
          <div className="section-title">Source coverage <span>92% complete</span></div>
          <div className="timeline">
            <Event title="Lot boundary" time="Today">Lands Department · authoritative geometry.</Event>
            <Event title="Planning controls" time="3 days">Planning Department · OZP and building height control.</Event>
            <Event title="Utilities record" time="Pending" warning>Drainage alignment awaits confirmation.</Event>
          </div>
        </>}
      </div>
      <div className="panel-foot"><button className="secondary" onClick={() => navigate('/site-analysis-report')}>Export snapshot</button><button className="primary" onClick={() => navigate('/site-analysis-report')}><Icon name="sparkles" />Start analysis</button></div>
    </aside>
    <section className={`legend${legendClosed ? ' closed' : ''}`}>
      <button className="legend-toggle" onClick={() => setLegendClosed(value => !value)}><Icon name="layers-3" /><b>Map legend</b><i className="chev"><Icon name="chevron-left" /></i></button>
      <div className="legend-body">
        <div className="legend-group"><h3>Planning context</h3><div className="legend-item"><span style={{ background: '#e61e2a66' }} />OZP boundary</div><div className="legend-item"><span style={{ background: '#d9770666' }} />Height control</div><div className="legend-item"><span style={{ background: '#0e7c5566' }} />Green belt</div></div>
        <div className="legend-group"><h3>Project status</h3><div className="legend-item"><span style={{ background: '#e61e2a', borderRadius: '50%' }} />Active</div><div className="legend-item"><span style={{ background: '#0e7c55', borderRadius: '50%' }} />Complete</div><div className="legend-item"><span style={{ background: '#8b9095', borderRadius: '50%' }} />Draft</div></div>
      </div>
    </section>
    <section className={`site-card${selected === 'school' && !cardDismissed ? ' show' : ''}`}>
      <div className="site-card-head"><span className="site-icon"><Icon name="school" /></span><div><h2>Cheung Sha Wan Catholic Primary School</h2><p>Selected site · Sham Shui Po</p></div><button className="close-card" onClick={() => setCardDismissed(true)}><Icon name="x" /></button></div>
      <div className="site-facts"><div><span>Status</span><b>Active</b></div><div><span>Blocks</span><b>3</b></div><div><span>Updated</span><b>09:42</b></div></div>
    </section>
  </section></Shell>;
}
