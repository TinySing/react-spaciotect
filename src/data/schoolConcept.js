const HEIGHTS = [5.32, 3.95, 3.635, 3.635, 3.635, 3.635];
const BOUNDARY = [[0, 0], [-7.301, -20.621], [-8.624, -26.479], [6.494, -67.201], [8.148, -69.685], [11.125, -69.034], [16.148, -68.108], [21.198, -67.349], [26.272, -66.759], [31.361, -66.338], [108.364, -56.799], [110.093, .442], [0, 0]];

const PROGRAMME = [
  ['PC', 'Classroom', 67, 'learning'], ['SGT', 'Small-group teaching room', 56, 'learning'], ['MUS', 'Music room', 76, 'learning'], ['ART', 'Visual arts room', 76, 'learning'], ['GS', 'General studies + preparation', 98, 'learning'], ['MPR', 'Multi-purpose room', 84, 'community'], ['CAL', 'Computer-assisted learning room', 140, 'learning'], ['CALPREP', 'Computer preparation room', 35, 'learning'], ['LANG', 'Language room', 84, 'learning'], ['LIB', 'Library', 112, 'learning'], ['GUID', 'Guidance activity room', 23, 'administration'], ['INT', 'Interview room', 13, 'administration'], ['HEAD', 'Headmaster office', 14, 'administration'], ['DEPUTY', 'Deputy headmaster office', 10, 'administration'], ['DISC', 'Discipline master office', 10, 'administration'], ['GO', 'General office', 50, 'administration'], ['MED', 'Medical inspection room', 12, 'administration'], ['PRINT', 'Printing + security store', 14, 'administration'], ['GSTORE', 'General store', 14, 'service'], ['STAFF', 'Staff room', 268, 'administration'], ['COMMON', 'Staff common room', 45, 'administration'], ['SGO', 'Student guidance office', 7, 'administration'], ['PANTRY', 'Pantry', 6, 'service'], ['CONF', 'Conference room', 75, 'administration'], ['HALL', 'Assembly hall', 368, 'community'], ['STAGE', 'Stage', 93, 'community'], ['HSTORE', 'Chair store + dressing room', 174, 'community'], ['PE', 'PE store', 26, 'service'], ['CHANGE', 'Changing room', 28, 'service'], ['CPG', 'Covered playground', 766, 'community'], ['MPA', 'Multi-purpose area', 105, 'community'], ['SAC', 'Student activity centre', 176, 'community'], ['TUCK', 'Tuck shop + portioning', 50, 'community'], ['STORE', 'Stores', 73, 'service'], ['BARRACK', 'Barrack accommodation', 14, 'service'], ['CARE', 'Caretaker quarters', 64, 'service'],
].map(([key, name, unitArea, group]) => ({ key, name, unitArea, group }));

const rectangle = (x, depth, width, length) => [[x, -depth], [x + width, -depth], [x + width, -depth - length], [x, -depth - length], [x, -depth]];
const programmeFor = key => PROGRAMME.find(item => item.key === key);

function createConcept() {
  const rooms = [];
  const counters = {};
  const rowPositions = Array(6).fill(16);
  const add = (key, name, group, floor, x, depth, width, length, extra = {}) => {
    const counterKey = `${key}-${floor}`;
    const number = counters[counterKey] = (counters[counterKey] || 0) + 1;
    const base = HEIGHTS.slice(0, floor).reduce((total, height) => total + height, 0);
    const height = extra.height || HEIGHTS[floor];
    rooms.push({ id: `${key}${number}-${floor || 'G'}`, key, name, group, floor, x, depth, width, length, base, height, area: width * length, polygon: rectangle(x, depth, width, length), ...extra });
  };
  const allocated = (key, floor, x, depth, width, length, extra) => {
    const item = programmeFor(key);
    add(key, item.name, item.group, floor, x, depth, width, length, extra);
  };
  const south = (key, floor) => {
    const item = programmeFor(key);
    const width = Math.max(2, item.unitArea / 10);
    allocated(key, floor, rowPositions[floor], 15, width, item.unitArea / width);
    rowPositions[floor] += width;
  };

  for (let floor = 0; floor < 6; floor += 1) {
    add('COR', 'Access gallery', 'circulation', floor, 12, 12, 92, 3);
    add('STAIR', 'West escape stair', 'circulation', floor, 12, 4, 5, 8, { stack: 'west-stair' });
    add('STAIR', 'East escape stair', 'circulation', floor, 98, 4, 6, 8, { stack: 'east-stair' });
    add('WC', 'Boys toilet', 'service', floor, 76, 7, 5, 5, { stack: 'boys' });
    add('WC', 'Girls toilet', 'service', floor, 81, 7, 5, 5, { stack: 'girls' });
    add('AWC', 'Accessible toilet', 'service', floor, 86, 9, 3, 3, { stack: 'accessible' });
    add('SWC', 'Staff toilet', 'service', floor, 89, 9, 3, 3, { stack: 'staff-wc' });
    add('CLEAN', 'Cleaner store', 'service', floor, 92, 10, 2, 2, { stack: 'cleaner' });
    add('LIFT', 'Accessible lift', 'circulation', floor, 94, 8, 4, 4, { stack: 'lift' });
    if (floor) {
      for (let index = 0; index < 6; index += 1) allocated('PC', floor, 20 + index * 8.375, 4, 8.375, 8);
      south('MPA', floor);
    }
  }
  let northX = 20;
  for (const key of ['STAFF', 'GO', 'HEAD', 'DEPUTY', 'DISC', 'MED', 'PRINT']) {
    const item = programmeFor(key);
    const width = Math.max(2, item.unitArea / 8);
    allocated(key, 0, northX, 12 - item.unitArea / width, width, item.unitArea / width);
    northX += width;
  }
  for (const key of ['GUID', 'INT', 'GSTORE', 'SGO', 'PANTRY', 'PE', 'CHANGE', 'CHANGE', 'TUCK', 'STORE', 'BARRACK', 'CARE']) south(key, 0);
  for (const [floor, keys] of [[1, ['LIB', 'CAL', 'CALPREP']], [2, ['SGT', 'SGT', 'LANG']], [3, ['MUS', 'ART', 'GS']]]) for (const key of keys) south(key, floor);
  add('COR', 'Arrival gallery', 'circulation', 0, 12, 15, 4, 40);
  add('LOBBY', 'Entrance lobby', 'circulation', 0, 8, 43, 4, 8);
  let westDepth = 27;
  for (const key of ['CONF', 'MPR', 'SAC', 'COMMON']) {
    const item = programmeFor(key);
    const length = item.unitArea / 16;
    allocated(key, 0, 16, westDepth, 16, length);
    westDepth += length;
  }
  allocated('CPG', 0, 76, 27, 28, 766 / 28);
  add('COR', 'Playground gallery', 'circulation', 0, 73, 15, 3, 39.4);
  add('COR', 'Hall approach gallery', 'circulation', 1, 73, 15, 3, 39.4);
  add('COR', 'Roof-play approach gallery', 'circulation', 3, 73, 15, 3, 15);
  add('COR', 'Roof-play bridge', 'circulation', 3, 76, 27, 4, 3);
  add('COR', 'Hall foyer', 'circulation', 1, 76, 27, 3, 27.4, { height: HEIGHTS[1] + HEIGHTS[2] });
  let hallDepth = 27;
  for (const key of ['HALL', 'STAGE', 'HSTORE']) {
    const item = programmeFor(key);
    const length = item.unitArea / 25;
    allocated(key, 1, 79, hallDepth, 25, length, { height: HEIGHTS[1] + HEIGHTS[2] });
    hallDepth += length;
  }
  return { name: 'Courtyard school', boundary: BOUNDARY, heights: HEIGHTS, rooms, court: { x: 36, depth: 30, width: 32, length: 19 }, roofCourt: { x: 80, depth: 28, width: 22, length: 22, base: 12.905 } };
}

export const SCHOOL_CONCEPT = createConcept();

export const SCHOOL_CONCEPT_SPACES = SCHOOL_CONCEPT.rooms.map(room => ({
  Name: room.id,
  Category: room.name.toLowerCase(),
  ProgrammeKey: room.key,
  Geometry: {
    Curve: { ControlPoints: room.polygon.map(([X, Y]) => ({ X, Y, Z: room.base })) },
    Direction: { X: 0, Y: 0, Z: room.height },
    Capped: true,
  },
}));

export const SCHOOL_MASSING_SITE = {
  site_boundary: SCHOOL_CONCEPT.boundary,
  pedestrian_entrance_lines: [[-1.239, -47.309], [5, -47]],
  vehicular_entrance_lines: [[6.244, -66.544], [6.5, -64]],
  nr_floors: SCHOOL_CONCEPT.heights.length,
  f2f_height: SCHOOL_CONCEPT.heights,
  ground_floor_building_footprint: SCHOOL_CONCEPT.rooms.filter(room => room.floor === 0).map(room => room.polygon),
  other_floor_building_footprints: SCHOOL_CONCEPT.heights.slice(1).map((_, index) => SCHOOL_CONCEPT.rooms.filter(room => room.floor === index + 1).map(room => room.polygon)),
  hall_footprint: [],
  basketball_court_open_area: [rectangle(SCHOOL_CONCEPT.court.x, SCHOOL_CONCEPT.court.depth, SCHOOL_CONCEPT.court.width, SCHOOL_CONCEPT.court.length)],
  loading_unloading_spaces: [],
  EVA_road_centerline: [[[6.5, -64], [15, -59], [45, -58.5], [68, -56.5]]],
};
