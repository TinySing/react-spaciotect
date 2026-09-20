export const SITE_ANALYSIS_REPORT_FIXTURE = {
  pages: [
    ['Cover', 'Project introduction'], ['Table of Contents', 'Evidence index'], ['a) Outline Zoning Plan', 'Planning context'],
    ['b) Site Location & Topology', 'Site setting'], ['c) Geotechnical Features', 'Ground conditions'], ['d) Connections', 'Movement and access'],
    ['e) Solar Control Study', 'Solar aspect and design implications'], ['f) Wind Study', 'Ventilation and comfort'], ['g) Trees', 'Landscape inventory'],
    ['h) Nearby Buildings', 'Surrounding context'], ['Blank Template Page', 'New evidence page'],
  ],
  modules: [
    { id: 'solar', name: 'Solar aspect diagram', title: 'Solar Aspect Study', x: 44, y: 112, width: 530, height: 480, style: 'White card', radius: 7, border: true, heading: true, locked: false, visible: true },
    { id: 'findings', name: 'Solar control implications', title: 'Solar Aspect', x: 592, y: 112, width: 505, height: 480, style: 'White card', radius: 7, border: true, heading: true, locked: false, visible: true },
  ],
  copy: {
    genericTitle: 'SITE CONTEXT',
    genericSummary: 'This report page captures project evidence, source references, and design implications.',
    findings: [
      ['1. East-facing facades', 'Receive gentle morning sun and suit classrooms, offices, residential units, and frequently occupied spaces.', 'Lower cooling loads than west-facing facades.'],
      ['2. South-facing facades', 'Receive the greatest annual solar exposure with good daylight and photovoltaic potential.', 'Use horizontal shading devices to limit overheating.'],
      ['3. West-facing facades', 'Carry the highest heat-gain risk from low-angle afternoon sun.', 'Minimise extensive glazing; place service cores, stairs, lifts, plant, and buffer spaces here.'],
      ['4. Winter solar access', 'Lower winter sun penetrates deeper into buildings.', 'Protect open spaces and communal areas from excessive overshadowing.'],
    ],
  },
};
