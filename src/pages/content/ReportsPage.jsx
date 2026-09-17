import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon, SectionHeader, Shell, useToast } from '../../components';
import { EnergyReport, MassingReport, ReportType } from '../shared';

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const report = params.get('report');
  const toast = useToast();
  const selectReport = value => value ? setParams({ report: value }) : setParams({});
  return <Shell active="reports" projectContext><section className="reports-page"><nav className="report-tabs"><button className={!report ? 'active' : ''} onClick={() => selectReport('')}>Report centre</button><button className={report === 'massing' ? 'active' : ''} onClick={() => selectReport('massing')}>Massing decision</button><button className={report === 'energy' ? 'active' : ''} onClick={() => selectReport('energy')}>Energy report</button></nav>{!report && <><SectionHeader eyebrow="Evidence and decisions" title="Report centre"><p>Review issued studies, decision records, and performance evidence.</p></SectionHeader><div className="report-type-grid"><ReportType icon="map" title="Site Analysis Report" description="Environmental, planning, and access evidence" onClick={() => navigate('/site-analysis-report')} /><ReportType icon="box" title="Massing Decision Report" description="Option M4 geometry and design gate" onClick={() => selectReport('massing')} /><ReportType icon="chart" title="Energy Report" description="Predicted building performance" onClick={() => selectReport('energy')} /></div><section className="recent-report-list"><h2>Recent report activity</h2><div><Link to="/reports?report=massing"><span className="status-dot green" /><b>Selected option design / E2 / M4 / Issue 02</b><small>Updated 09 September 2026</small><Icon name="chevron" /></Link><Link to="/reports?report=energy"><span className="status-dot blue" /><b>Energy performance / legacy M4 study</b><small>Updated 10 September 2026</small><Icon name="chevron" /></Link><Link to="/site-analysis-report"><span className="status-dot amber" /><b>Cheung Sha Wan / site analysis report</b><small>Updated 08 September 2026</small><Icon name="chevron" /></Link></div></section></>}{report === 'massing' && <MassingReport onExport={() => toast('Print-ready massing PDF prepared')} />}{report === 'energy' && <EnergyReport onExport={() => toast('Print-ready energy PDF prepared')} />}</section></Shell>;
}
