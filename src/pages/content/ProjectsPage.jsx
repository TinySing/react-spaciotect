import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PROJECTS } from '../../data';
import { EmptyState, Icon, SectionHeader, Shell, useToast } from '../../components';

export function ProjectsPage() {
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('table');
  const navigate = useNavigate();
  const toast = useToast();
  const visible = PROJECTS.filter(project => {
    const matchesText = `${project.name} ${project.location} ${project.type}`.toLowerCase().includes(filter.toLowerCase());
    return matchesText && (!status || project.status === status);
  });
  return <Shell active="projects"><section className="page projects-page"><SectionHeader eyebrow="Portfolio workspace" title="Projects"><p>Manage Hong Kong public works projects, approvals, and design activity.</p></SectionHeader><div className="summary-grid"><article><span>Active projects</span><b>8</b><em>3 updated this week</em></article><article><span>Open comments</span><b>59</b><em>12 require response</em></article><article><span>Design studies</span><b>14</b><em>4 awaiting decision</em></article><article><span>Reports ready</span><b>6</b><em>2 issued this month</em></article></div><div className="toolbar"><label className="filter-input"><Icon name="search" /><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search projects, districts, or building types" /></label><label className="status-filter"><Icon name="filter" /><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{[...new Set(PROJECTS.map(project => project.status))].map(value => <option key={value} value={value}>{value}</option>)}</select></label><button className="secondary-btn" onClick={() => toast('New project workspace opened')}><Icon name="plus" />New project</button><div className="segmented"><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Grid</button></div></div><section className={`card project-table ${view === 'grid' ? 'project-grid' : ''}`}><div className="project-row project-header"><span>Project</span><span>Location</span><span>Building type</span><span>Comments</span><span>Status</span><span /></div>{visible.map(project => <Link className="project-row" key={project.id} to={project.id === 'e2' ? '/studio/bubble' : '/projects'} onClick={() => project.id !== 'e2' && toast(`${project.name} is represented as a future workspace`)} onDoubleClick={() => navigate('/site-analysis')}><span className="project-name"><i className="project-mark"><Icon name={project.type === 'Education' ? 'school' : 'building'} /></i><span><b>{project.name}</b><small>{project.code} · {project.phase}</small></span></span><span>{project.location}</span><span>{project.type}</span><span>{project.comments}</span><span><em className={`status-pill ${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</em></span><Icon name="chevron" /></Link>)}{!visible.length && <EmptyState title="No projects found">Try another project, district, or building type.</EmptyState>}</section></section></Shell>;
}
