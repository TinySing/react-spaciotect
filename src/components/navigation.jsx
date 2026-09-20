import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, PROJECTS, STUDIO_STAGES } from '../data';
import { ChatAssistant } from './ChatAssistant';
import { Icon } from './primitives';
import { usePersistentState, useToast } from './state';
import { SoaDialog } from '../studio/SoaDialog';

export function Shell({ children, active, projectContext = false, variant = '' }) {
  const shellVariant = variant || (projectContext ? 'prototype' : '');
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState('');
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
    // On the GIS page the mockup's topbar search selected a matching project.
    if (location.pathname === '/site-analysis') {
      window.dispatchEvent(new CustomEvent('spaciotect:gis-search', { detail: term }));
      return;
    }
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

  return <div className={`app-shell${shellVariant ? ` app-shell--${shellVariant}` : ''}`}>
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark">A</span>
        <span className="brand-copy"><b>A.I. SPACIOTECT</b><span>Architectural Services Department</span></span>
      </Link>
      <label className="global-search"><Icon name="search" /><input ref={searchInputRef} value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && submitSearch()} placeholder="Search projects, sites, or reports" /><kbd>⌘K</kbd></label>
      <div className="top-actions"><div className="top-action-menu"><button className="icon-btn" type="button" onClick={() => setOpenMenu(current => current === 'messages' ? '' : 'messages')} title="Messages" aria-label="Messages" aria-expanded={openMenu === 'messages'}><Icon name="message" /></button>{openMenu === 'messages' && <div className="top-popover" role="status"><b>Messages</b><span>No unread project messages.</span></div>}</div><div className="top-action-menu"><button className="icon-btn notify-btn" type="button" onClick={() => setOpenMenu(current => current === 'notifications' ? '' : 'notifications')} title="Notifications" aria-label="Notifications" aria-expanded={openMenu === 'notifications'}><Icon name="bell" /><i /></button>{openMenu === 'notifications' && <div className="top-popover" role="status"><b>Notifications</b><span>No new notifications.</span></div>}</div><div className="top-action-menu"><button className="account" type="button" onClick={() => setOpenMenu(current => current === 'account' ? '' : 'account')} aria-expanded={openMenu === 'account'}><span className="avatar">KT</span><span>Architect</span></button>{openMenu === 'account' && <div className="top-popover account-popover"><b>Kai Tong</b><span>Architect</span><Link to="/projects" onClick={() => setOpenMenu('')}>Open projects</Link></div>}</div></div>
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
    <span className="project-phase">{project.phase}</span>
  </section>;
}

export function StudioNavigation({ active }) {
  const primaryAction = active === 'bubble' ? { label: 'Generate massing', to: '/studio/massing' } : { label: 'Design report', to: '/reports?report=massing' };
  return <header className="studio-head"><nav className="stage-tabs" aria-label="Studio workflow">{STUDIO_STAGES.map((stage, index) => <NavLink key={stage.key} to={stage.path} className={({ isActive }) => `stage-tab ${isActive || active === stage.key ? 'active' : ''}`}><b>{index + 1}</b>{stage.label}</NavLink>)}</nav><span className="studio-status">Exploratory design study</span><div className="studio-actions"><SoaDialog /><Link className="secondary-btn" to="/options">Compare</Link><Link className="primary-btn" to={primaryAction.to}>{primaryAction.label}</Link></div></header>;
}

export function StudioFrame({ active, children }) {
  return <Shell active="studio" projectContext variant="prototype"><section className="studio"><StudioNavigation active={active} />{children}</section></Shell>;
}
