const clone = value => JSON.parse(JSON.stringify(value));

const toOptionId = value => String(value || 'C').replace(/^OPT-/, '').toUpperCase();

const toSummary = (optionId, summary = {}) => ({
  id: `OPT-${optionId}`,
  title: summary.title || 'Courtyard school',
  descriptor: summary.descriptor || 'Site E-2 · Preliminary massing',
  storeys: summary.storeys || 6,
  height: summary.height || '23.8 m',
  allocated: summary.allocated || 9053,
  site: summary.site || 7031,
  ground: summary.ground || 2632,
  upper: summary.upper || 6420,
  outside: summary.outside || 4398,
});

/**
 * Converts mock fixtures or API responses into the only shape the Studio UI uses.
 * Keep backend field-name compatibility here instead of scattering it in pages.
 */
export function toStudioModel(source = {}, requestedOption) {
  const optionId = toOptionId(source.optionId || source.option?.id || requestedOption);
  const roomSource = source.rooms?.Spaces ? source.rooms : source.rooms || {};
  const graph = source.graph || source.rooms?.graph || { nodes: [], relationships: [] };
  const site = source.site || source.massing?.site || {};

  return {
    project: source.project || { id: 'e2', name: 'Site E-2 Anderson Road Primary School' },
    option: { id: `OPT-${optionId}`, label: source.option?.label || `OPT-${optionId}` },
    bubble: {
      nodes: clone(source.bubble?.nodes || []),
      relationships: clone(source.bubble?.relationships || []),
      boundary: clone(source.bubble?.boundary || []),
    },
    massing: { site: clone(site), summary: toSummary(optionId, source.massing?.summary || source.summary) },
    rooms: { spaces: clone(roomSource.Spaces || roomSource.spaces || []), graph: clone(graph), site: clone(source.roomSite || site) },
    rendering: { scene: source.rendering?.scene || null, summary: toSummary(optionId, source.rendering?.summary || source.summary) },
  };
}

export function toReportModel(source = {}) {
  return {
    pages: clone(source.pages || []),
    modules: clone(source.modules || []),
    copy: clone(source.copy || {}),
  };
}
