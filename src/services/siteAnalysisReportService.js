import { toReportModel } from '../adapters/studioModel';
import { SITE_ANALYSIS_REPORT_FIXTURE } from '../data/siteAnalysisReport';
import { isApiDataSource, request } from './httpClient';

const clone = value => JSON.parse(JSON.stringify(value));

export async function loadSiteAnalysisReport(projectId = 'e2', { signal } = {}) {
  const source = isApiDataSource
    ? await request(`/projects/${encodeURIComponent(projectId)}/site-analysis-report`, { signal })
    : clone(SITE_ANALYSIS_REPORT_FIXTURE);
  return toReportModel(source);
}

export async function saveSiteAnalysisReportPatch(projectId, moduleId, patch) {
  if (!isApiDataSource) return { id: moduleId, ...patch, source: 'mock' };
  return request(`/projects/${encodeURIComponent(projectId)}/site-analysis-report/modules/${encodeURIComponent(moduleId)}`, { method: 'PATCH', body: patch });
}
