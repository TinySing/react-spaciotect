import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, PROJECTS, STUDIO_STAGES } from '../data';
import { ChatAssistant } from './ChatAssistant';
import { Icon } from './primitives';
import { usePersistentState, useToast } from './state';

export function Shell({ children, active, projectContext = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchTargets = useMemo(() => [
    ...PROJECTS.map(project => ({ text: project.name, path: '/projects' })),
    { text: 'Cheung Sha Wan site analysis', path: '/site-analysis' },
    { text: 'Anderson Road studio', path: '/studio/bubble' },
    { text: 'Energy performance', path: '/energy' },
    { text: 'Design reports', path: '/reports' },
  ], []);
  const submitSearch = () => {
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = searchTargets.find(target => target.text.toLowerCase().includes(term));
    if (match) navigate(match.path);
    else toast('No matching workspace found');
  };
  useEffect(() => {
    const handleShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark">A</span>
        <span className="brand-copy"><b>A.I. SPACIOTECT</b><span>Architectural Services Department</span></span>
      </Link>
      <label className="global-search"><Icon name="search" /><input ref={searchInputRef} value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && submitSearch()} placeholder="Search projects, sites, or reports" /><kbd>⌘K</kbd></label>
      <div className="top-actions"><button className="icon-btn" onClick={() => toast('Messages are represented in this mockup')} title="Messages"><Icon name="message" /></button><button className="icon-btn notify-btn" onClick={() => toast('No new notifications')} title="Notifications"><Icon name="bell" /><i /></button><button className="account" onClick={() => toast('Account menu is represented in this mockup')}><span className="avatar">KT</span><span>Architect</span></button></div>
    </header>
    <aside className="rail"><nav aria-label="Primary navigation">{NAV_ITEMS.map(item => <NavLink key={item.key} to={item.path} className={({ isActive }) => `nav-link ${isActive || active === item.key ? 'on' : ''}`} end={item.path === '/'}><Icon name={item.icon} />{item.label}</NavLink>)}</nav><div className="rail-divider" /><div className="rail-spacer" /><div className="user-card"><span className="user-avatar">KT</span><span><b>Kai Tong</b><small>Architect</small></span></div></aside>
    <main className="workspace">{projectContext && <ProjectContextBar />}{children}</main>
    <ChatAssistant open={chatOpen} onToggle={() => setChatOpen(value => !value)} />
  </div>;
}

export function ProjectContextBar() {
  const [projectId, setProjectId] = usePersistentState('spaciotectProject', 'e2');
  const toast = useToast();
  const project = PROJECTS.find(item => item.id === projectId) || PROJECTS[0];
  return <section className="project-context" aria-label="Current project context">
    <Link className="project-back" to="/projects">←</Link>
    <span className="project-symbol"><Icon name="school" /></span>
    <label className="project-picker"><span>Current project</span><select value={project.id} onChange={event => { setProjectId(event.target.value); toast(`Project context changed to ${event.target.options[event.target.selectedIndex].text}`); }} aria-label="Current project">{PROJECTS.slice(0, 4).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <nav className="project-modules" aria-label="Project workspace"><NavLink to="/studio/bubble" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="box" />Studio</NavLink><NavLink to="/energy" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="chart" />Energy</NavLink><NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="file" />Reports</NavLink></nav>
    <span className="project-phase">{project.phase}</span>
  </section>;
}

export function StudioNavigation({ active }) {
  return <header className="studio-head"><nav className="stage-tabs" aria-label="Studio workflow">{STUDIO_STAGES.map((stage, index) => <NavLink key={stage.key} to={stage.path} className={({ isActive }) => `stage-tab ${isActive || active === stage.key ? 'active' : ''}`}><b>{index + 1}</b>{stage.label}</NavLink>)}</nav><span className="studio-status">Exploratory design study</span><div className="studio-actions"><Link className="secondary-btn" to="/options">Compare</Link><Link className="primary-btn" to="/reports?report=massing">Design report</Link></div></header>;
}

export function StudioFrame({ active, children }) {
  return <Shell active="studio" projectContext><section className="studio"><StudioNavigation active={active} />{children}</section></Shell>;
}
