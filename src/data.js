export const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home', path: '/' },
  { key: 'projects', label: 'Projects', icon: 'folder', path: '/projects' },
  { key: 'analysis', label: 'Site Analysis', icon: 'map', path: '/site-analysis' },
  { key: 'studio', label: 'Studio', icon: 'box', path: '/studio/bubble' },
  { key: 'energy', label: 'Energy', icon: 'chart', path: '/energy' },
  { key: 'reports', label: 'Reports', icon: 'file', path: '/reports' },
];

export const PROJECTS = [
  { id: 'e2', name: 'Site E-2 Anderson Road Primary School', code: 'ASD-EDU-8591', phase: 'Room stacking', option: 'OPT-C', scheme: 'U-shaped Campus', location: 'Anderson Road', type: 'Education', status: 'In progress', comments: 12 },
  { id: 'csw', name: 'Cheung Sha Wan School Redevelopment', code: 'ASD-EDU-2026-014', phase: 'Massing review', option: 'Option M4', scheme: 'Stepped Courtyard', location: 'Kowloon', type: 'Education', status: 'Review', comments: 8 },
  { id: 'kt', name: 'Kai Tak Community Complex', code: 'ASD-CIV-2026-021', phase: 'Design report', option: 'Option C2', scheme: 'Civic Terrace', location: 'Kai Tak', type: 'Civic', status: 'In progress', comments: 15 },
  { id: 'ndhc', name: 'North District Health Centre', code: 'ASD-HLT-2026-006', phase: 'Energy simulation', option: 'Option H3', scheme: 'Healing Courtyard', location: 'Sheung Shui', type: 'Healthcare', status: 'Analysis', comments: 6 },
  { id: 'tko', name: 'Tseung Kwan O Public Library Extension', code: 'ASD-CUL-2026-012', phase: 'Concept design', option: 'Option L2', scheme: 'Civic Porch', location: 'Tseung Kwan O', type: 'Cultural', status: 'Draft', comments: 4 },
  { id: 'yl', name: 'Yuen Long Sports Centre Renewal', code: 'ASD-SPT-2026-017', phase: 'Design development', option: 'Option S1', scheme: 'Open Court', location: 'Yuen Long', type: 'Recreation', status: 'In progress', comments: 9 },
  { id: 'ab', name: 'Aberdeen Municipal Services Building', code: 'ASD-MUN-2026-010', phase: 'Planning', option: 'Option A1', scheme: 'Urban Stack', location: 'Aberdeen', type: 'Municipal', status: 'Review', comments: 5 },
];

export const STUDIO_STAGES = [
  { key: 'bubble', label: 'Bubble diagram', path: '/studio/bubble' },
  { key: 'massing', label: 'Site massing', path: '/studio/massing' },
  { key: 'rooms', label: 'Room stacking', path: '/studio/rooms' },
  { key: 'rendering', label: 'Rendering', path: '/studio/rendering' },
];

export const SITE_NODES = [
  { id: 'school', label: 'Cheung Sha Wan Catholic Primary School', x: 47, y: 49, color: '#e61e2a' },
  { id: 'station', label: 'MTR Nam Cheong Station', x: 24, y: 31, color: '#69747b' },
  { id: 'park', label: 'Lai Chi Kok Park', x: 74, y: 28, color: '#0e7c55' },
  { id: 'housing', label: 'Public housing cluster', x: 73, y: 72, color: '#d97706' },
];

export const SITE_LAYERS = [
  ['ozp', 'OZP zones', '#e61e2a'],
  ['height', 'Height restriction', '#d97706'],
  ['green', 'Green belt', '#0e7c55'],
  ['transport', 'Transport', '#697078'],
  ['projects', 'My projects', '#e61e2a'],
];

export const SITE_GRAPH_NODES = [
  { id: 'STR01', name: 'Street NW Frontage', elementType: 'street', role: 'street context', editable: false, x: 105, y: 82, radius: 34 },
  { id: 'PED01', name: 'Pedestrian Entrance Gate', elementType: 'fixed_gate', role: 'pedestrian access', editable: false, x: 865, y: 150, radius: 35 },
  { id: 'VEH01', name: 'Vehicular Entrance Gate', elementType: 'fixed_gate', role: 'vehicular access', editable: false, x: 870, y: 485, radius: 35 },
  { id: 'SCH01', name: 'School Main Block', elementType: 'building_block', role: 'school main block', editable: true, x: 430, y: 315, radius: 64 },
  { id: 'ASS01', name: 'Assembly Hall', elementType: 'hall', role: 'assembly', editable: true, x: 620, y: 385, radius: 49 },
  { id: 'CLA01', name: 'Classroom Cluster', elementType: 'classroom_cluster', role: 'learning', editable: true, x: 430, y: 105, radius: 52 },
  { id: 'BAS01', name: 'Basketball Courts', elementType: 'court', role: 'outdoor sports', editable: true, x: 175, y: 330, radius: 53 },
  { id: 'LOA01', name: 'Loading Unloading Space', elementType: 'loading_bay', role: 'loading', editable: true, x: 695, y: 495, radius: 38 },
  { id: 'DAI01', name: 'Daily Access Road', elementType: 'road', role: 'vehicular access', editable: true, x: 765, y: 350, radius: 39 },
  { id: 'EVA01', name: 'EVA Road', elementType: 'eva_road', role: 'emergency vehicle access', editable: true, x: 520, y: 520, radius: 40 },
];

export const SITE_GRAPH_RELATIONSHIPS = [
  { type: 'ADJACENT_TO', source: 'SCH01', target: 'ASS01' },
  { type: 'ADJACENT_TO', source: 'SCH01', target: 'CLA01' },
  { type: 'LOCATED_IN', source: 'ASS01', target: 'SCH01' },
  { type: 'LOCATED_IN', source: 'CLA01', target: 'SCH01' },
  { type: 'ADJACENT_TO', source: 'SCH01', target: 'BAS01' },
  { type: 'ADJACENT_TO', source: 'ASS01', target: 'VEH01' },
  { type: 'ADJACENT_TO', source: 'ASS01', target: 'LOA01' },
  { type: 'LOCATED_OUTSIDE_OF', source: 'CLA01', target: 'STR01' },
  { type: 'ADJACENT_TO', source: 'EVA01', target: 'SCH01' },
  { type: 'ADJACENT_TO', source: 'DAI01', target: 'VEH01' },
  { type: 'ADJACENT_TO', source: 'LOA01', target: 'DAI01' },
  { type: 'ADJACENT_TO', source: 'EVA01', target: 'DAI01' },
  { type: 'ADJACENT_TO', source: 'BAS01', target: 'PED01' },
  { type: 'ADJACENT_TO', source: 'CLA01', target: 'BAS01' },
];

export const MASSING_OPTIONS = {
  M1: { title: 'L-shaped school', descriptor: 'Compact and capacity-first', storeys: 6, ground: 2600, upper: 9400, open: 850, score: 72, color: '#b8cbd6' },
  M2: { title: 'Parallel teaching wings', descriptor: 'Clear circulation and daylight', storeys: 6, ground: 2750, upper: 8250, open: 1100, score: 78, color: '#a7c7c3' },
  M3: { title: 'Split courtyard school', descriptor: 'Balanced outdoor rooms and access', storeys: 6, ground: 2850, upper: 8450, open: 1210, score: 82, color: '#c8c4a9' },
  M4: { title: 'Courtyard school', descriptor: 'U-shaped campus with a protected heart', storeys: 6, ground: 2900, upper: 8600, open: 1330, score: 86, color: '#b8c9a9' },
};

export const ROOM_GROUPS = [
  { id: 'learning', label: 'Learning', color: '#4f86c6', rooms: ['Classroom 01', 'Classroom 02', 'Science room', 'Library'] },
  { id: 'community', label: 'Community', color: '#d96a98', rooms: ['Assembly hall', 'Dining hall', 'Multi-purpose room'] },
  { id: 'admin', label: 'Administration', color: '#38a978', rooms: ['General office', 'Staff room', 'Principal office'] },
  { id: 'circulation', label: 'Circulation', color: '#f0b43c', rooms: ['Main stair', 'Lift lobby', 'Central corridor'] },
];

export const ENERGY_SCENARIOS = {
  standard: { label: 'Typical weather', eui: 94, annual: '2.34', hvac: '1.43', hvacShare: '61.2%', baseline: '18.3%', delta: 21 },
  extreme: { label: 'Extreme weather', eui: 102, annual: '2.54', hvac: '1.62', hvacShare: '63.8%', baseline: '11.3%', delta: 13 },
};

export const SOA_BASELINE = [
  { name: 'General classroom', group: 'Learning', quantity: 30, area: 67 },
  { name: 'Small group room', group: 'Learning', quantity: 2, area: 35 },
  { name: 'Assembly hall', group: 'Community', quantity: 1, area: 520 },
  { name: 'Multi-purpose room', group: 'Community', quantity: 5, area: 72 },
  { name: 'Staff room', group: 'Administration', quantity: 1, area: 180 },
  { name: 'Student toilets', group: 'Service', quantity: 12, area: null },
];
