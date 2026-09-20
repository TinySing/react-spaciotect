import { SITE_GRAPH_NODES, SITE_GRAPH_RELATIONSHIPS } from '../data';
import andersonData from '../data/andersonData.json';
import massingData from '../data/massingData.json';
import studioData from '../data/studioData.json';
import { SCHOOL_CONCEPT, SCHOOL_MASSING_SITE } from '../data/schoolConcept';
import { adapted } from '../adapters/hkSchoolAdapter';
import { toStudioModel } from '../adapters/studioModel';
import { isApiDataSource, request } from './httpClient';

const clone = value => JSON.parse(JSON.stringify(value));
const optionKey = optionId => String(optionId || 'C').replace(/^OPT-/, '').toUpperCase();
const summaryByOption = {
  A: { title: 'L-shaped school', allocated: 8500, ground: 2540, upper: 5960, outside: 4491 },
  B: { title: 'Parallel wings school', allocated: 8820, ground: 2580, upper: 6240, outside: 4451 },
  C: { title: 'Courtyard school', allocated: 9053, ground: 2632, upper: 6420, outside: 4398 },
};

function mockStudioOption(projectId, optionId) {
  const key = optionKey(optionId);
  const roomBundle = key === 'C' ? adapted.rooms : andersonData[`room-validation-asd-stacker_OPT-${key}.json`] || studioData.rooms;
  const site = key === 'C' ? SCHOOL_MASSING_SITE : massingData[key] || massingData.C;
  return {
    project: { id: projectId, name: 'Site E-2 Anderson Road Primary School' },
    option: { id: `OPT-${key}`, label: `OPT-${key}` },
    bubble: { nodes: SITE_GRAPH_NODES, relationships: SITE_GRAPH_RELATIONSHIPS },
    massing: { site, summary: summaryByOption[key] || summaryByOption.C },
    rooms: roomBundle,
    graph: key === 'C' ? adapted.graph : studioData.stackGraph,
    roomSite: key === 'C' ? adapted.site : andersonData[`site_design_geo_OPT-${key}.json`] || site,
    rendering: { scene: SCHOOL_CONCEPT, summary: summaryByOption[key] || summaryByOption.C },
  };
}

export async function loadStudioModel(projectId = 'e2', optionId = 'C', { signal } = {}) {
  const source = isApiDataSource
    ? await request(`/projects/${encodeURIComponent(projectId)}/studio/options/${encodeURIComponent(optionKey(optionId))}`, { signal })
    : clone(mockStudioOption(projectId, optionId));
  return toStudioModel(source, optionId);
}

/** Sends a small user edit; the caller keeps view-only state locally. */
export async function saveStudioPatch(projectId, optionId, scope, entityId, patch) {
  if (!isApiDataSource) return { id: entityId, ...patch, source: 'mock' };
  return request(`/projects/${encodeURIComponent(projectId)}/studio/options/${encodeURIComponent(optionKey(optionId))}/${scope}/${encodeURIComponent(entityId)}`, { method: 'PATCH', body: patch });
}
