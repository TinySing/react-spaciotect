// HK School concept model, ported verbatim from the mockup's
// data-inlined-from="hk-school-model.js" script (ai-spaciotect-site-massing.html).

const boundary = [[0,0],[-7.301,-20.621],[-8.624,-26.479],[6.494,-67.201],[8.148,-69.685],[11.125,-69.034],[16.148,-68.108],[21.198,-67.349],[26.272,-66.759],[31.361,-66.338],[108.364,-56.799],[110.093,.442],[0,0]];
const heights = [5.32,3.95,3.635,3.635,3.635,3.635];
const colors = {learning:'#77a7b7',community:'#cb8589',administration:'#96ad87',service:'#ad9cb9',circulation:'#dfc37d',outdoor:'#57a685'};
const programme = [
  ['PC','Classroom',30,67,'learning'],
  ['SGT','Small-group teaching room',2,56,'learning'],
  ['MUS','Music room',1,76,'learning'],['ART','Visual arts room',1,76,'learning'],
  ['GS','General studies + preparation',1,98,'learning'],
  ['MPR','Multi-purpose room',1,84,'community'],
  ['CAL','Computer-assisted learning room',1,140,'learning'],['CALPREP','Computer preparation room',1,35,'learning'],
  ['LANG','Language room',1,84,'learning'],['LIB','Library',1,112,'learning'],
  ['GUID','Guidance activity room',1,23,'administration'],['INT','Interview room',1,13,'administration'],
  ['HEAD','Headmaster office',1,14,'administration'],['DEPUTY','Deputy headmaster office',1,10,'administration'],
  ['DISC','Discipline master office',1,10,'administration'],['GO','General office',1,50,'administration'],
  ['MED','Medical inspection room',1,12,'administration'],['PRINT','Printing + security store',1,14,'administration'],
  ['GSTORE','General store',1,14,'service'],['STAFF','Staff room',1,268,'administration'],
  ['COMMON','Staff common room',1,45,'administration'],['SGO','Student guidance office',1,7,'administration'],
  ['PANTRY','Pantry',1,6,'service'],['CONF','Conference room',1,75,'administration'],
  ['HALL','Assembly hall',1,368,'community'],['STAGE','Stage',1,93,'community'],
  ['HSTORE','Chair store + dressing room',1,174,'community'],['PE','PE store',1,26,'service'],
  ['CHANGE','Changing room',2,28,'service'],['CPG','Covered playground',1,766,'community'],
  ['MPA','Multi-purpose area',5,105,'community'],['SAC','Student activity centre',1,176,'community'],
  ['TUCK','Tuck shop + portioning',1,50,'community'],['STORE','Stores',1,73,'service'],
  ['BARRACK','Barrack accommodation',1,14,'service'],['CARE','Caretaker quarters',1,64,'service']
].map(([key,name,quantity,unitArea,group]) => ({key,name,quantity,unitArea,group,source:'SoA_8446.pdf, approved NOFA, pp. 1-2'}));
const rectangle = (x,depth,width,length) => [[x,-depth],[x+width,-depth],[x+width,-depth-length],[x,-depth-length],[x,-depth]];
function sharedEdge(first,second) {
  const horizontal = Math.min(first.x+first.width,second.x+second.width)-Math.max(first.x,second.x);
  const vertical = Math.min(first.depth+first.length,second.depth+second.length)-Math.max(first.depth,second.depth);
  if (Math.abs(first.depth+first.length-second.depth)<1e-6 || Math.abs(second.depth+first.length-first.depth)<1e-6) return Math.max(0,horizontal);
  if (Math.abs(first.x+first.width-second.x)<1e-6 || Math.abs(second.x+first.width-first.x)<1e-6) return Math.max(0,vertical);
  return 0;
}
function create() {
  const rooms = [], counters = {}, rowPositions = Array(6).fill(16);
  function add(key,name,group,floor,x,depth,width,length,extra = {}) {
    const counterKey = `${key}-${floor}`, number = counters[counterKey] = (counters[counterKey] || 0)+1;
    const base = heights.slice(0,floor).reduce((total,height)=>total+height,0);
    const height = extra.height || heights[floor];
    rooms.push({id:`${key}${number}-${floor || 'G'}`,key,name,group,floor,x,depth,width,length,base,height,area:width*length,polygon:rectangle(x,depth,width,length),...extra});
  }
  const row = key => programme.find(item => item.key===key);
  function allocated(key,floor,x,depth,width,length,extra) {
    const item = row(key);
    add(key,item.name,item.group,floor,x,depth,width,length,extra);
  }
  function south(key,floor) {
    const item = row(key), width = Math.max(2,item.unitArea/10);
    if (rowPositions[floor]+width>73.00001) throw new Error(`Programme exceeds south strip on ${floor}/F: ${key}`);
    allocated(key,floor,rowPositions[floor],15,width,item.unitArea/width);
    rowPositions[floor]+=width;
  }
  for (let floor=0;floor<6;floor++) {
    add('COR','Access gallery','circulation',floor,12,12,92,3);
    add('STAIR','West escape stair','circulation',floor,12,4,5,8,{stack:'west-stair'});
    add('STAIR','East escape stair','circulation',floor,98,4,6,8,{stack:'east-stair'});
    add('WC','Boys toilet','service',floor,76,7,5,5,{stack:'boys'});
    add('WC','Girls toilet','service',floor,81,7,5,5,{stack:'girls'});
    add('AWC','Accessible toilet','service',floor,86,9,3,3,{stack:'accessible'});
    add('SWC','Staff toilet','service',floor,89,9,3,3,{stack:'staff-wc'});
    add('CLEAN','Cleaner store','service',floor,92,10,2,2,{stack:'cleaner'});
    add('LIFT','Accessible lift','circulation',floor,94,8,4,4,{stack:'lift'});
    if (floor) {
      for (let index=0;index<6;index++) allocated('PC',floor,20+index*8.375,4,8.375,8);
      south('MPA',floor);
    }
  }
  let northX = 20;
  for (const key of ['STAFF','GO','HEAD','DEPUTY','DISC','MED','PRINT']) {
    const item = row(key), width = Math.max(2,item.unitArea/8);
    allocated(key,0,northX,12-item.unitArea/width,width,item.unitArea/width);
    northX+=width;
  }
  for (const key of ['GUID','INT','GSTORE','SGO','PANTRY','PE','CHANGE','CHANGE','TUCK','STORE','BARRACK','CARE']) south(key,0);
  for (const [floor,keys] of [[1,['LIB','CAL','CALPREP']],[2,['SGT','SGT','LANG']],[3,['MUS','ART','GS']]]) for (const key of keys) south(key,floor);
  add('COR','Arrival gallery','circulation',0,12,15,4,40);
  add('LOBBY','Entrance lobby','circulation',0,8,43,4,8);
  let westDepth = 27;
  for (const key of ['CONF','MPR','SAC','COMMON']) {
    const item = row(key), length = item.unitArea/16;
    allocated(key,0,16,westDepth,16,length);
    westDepth+=length;
  }
  allocated('CPG',0,76,27,28,766/28);
  add('COR','Playground gallery','circulation',0,73,15,3,39.4);
  add('COR','Hall approach gallery','circulation',1,73,15,3,39.4);
  add('COR','Roof-play approach gallery','circulation',3,73,15,3,15);
  add('COR','Roof-play bridge','circulation',3,76,27,4,3);
  add('COR','Hall foyer','circulation',1,76,27,3,27.4,{height:heights[1]+heights[2]});
  let hallDepth = 27;
  for (const key of ['HALL','STAGE','HSTORE']) {
    const item = row(key), length = item.unitArea/25;
    allocated(key,1,79,hallDepth,25,length,{height:heights[1]+heights[2]});
    hallDepth+=length;
  }
  const edges = [];
  for (const [index,first] of rooms.entries()) for (const second of rooms.slice(index+1)) {
    if (first.floor===second.floor && sharedEdge(first,second)>=1.5-1e-6) edges.push({source:first.id,target:second.id,type:'wall_sharing'});
    if (first.stack && first.stack===second.stack && Math.abs(first.floor-second.floor)===1) edges.push({source:first.id,target:second.id,type:'floor_sharing'});
  }
  const bubbles = [
    ['arrival','Arrival',8,47,'administration','Controlled entry / west frontage'],
    ['admin','Staff + administration',46,8,'administration','268 m2 staff room / ground floor'],
    ['learning','30 classrooms',46,17,'learning','6 classrooms per floor / 1-5F'],
    ['resource','Learning resources',42,24,'learning','Library / specialist / small-group teaching'],
    ['community','Shared facilities',24,39,'community','Conference / activity / multi-purpose'],
    ['court','Open play court',53,40,'outdoor','Ground-level play / courtyard supervision'],
    ['hall','Hall + covered play',90,39,'community','766 m2 covered playground / hall above'],
    ['service','Service access',48,58,'service','Retained gate / indicative vehicle route']
  ].map(([id,name,x,depth,group,detail])=>({id,name,x,depth,group,detail}));
  return {id:'HK-01',name:'Courtyard school',status:'exploratory',assumption_dependent:true,boundary,heights,rooms,edges,programme,bubbles,
    bubbleEdges:[['arrival','admin'],['arrival','community'],['arrival','court'],['admin','learning'],['learning','resource'],['resource','court'],['court','community'],['court','hall'],['service','hall']],
    siteArea:7030.6,gfaTarget:11503,coverageLimit:.4497,
    pedestrian:[[-1.239,-47.309],[5,-47]],vehicle:[[6.244,-66.544],[6.5,-64]],
    eva:[[6.5,64],[15,59],[45,58.5],[68,56.5]],evaWidth:7.3,
    court:{x:36,depth:30,width:32,length:19},roofCourt:{x:80,depth:28,width:22,length:22,base:12.905},
    notes:[
      'Exploratory reference-based redesign, not a statutory compliance or construction model.',
      'User-approved basis: EDB November 2017 30-classroom schedule; missing teaching items informed by SoA_8446 approved NOFA (16 January 2018), not its as-provided areas.',
      "SoA_8446 is a Queen's Hill precedent, not an approved Anderson Road brief. The 30 classrooms at 67 m2, two small-group rooms and five multi-purpose areas are proposed subdivisions of its area totals.",
      'Boundary and gate centre points retained from OPT-C. Gate positions are existing design assumptions; dimensions, separation and connection to the public street are unverified.',
      'Registered area 7,030.6 m2 governs ratios. The simplified polygon is about 7,101 m2. Formation levels, slope, setbacks and absolute height datum remain TBC.',
      'Floor-to-floor stack totals 23.81 m. Parapets, roof fencing, structure and service plant require height and structural checks; no mPD compliance claim.',
      'Hall above covered play follows the reference typology; its double-height space spans 1/F and 2/F. Ground-only hall placement in legacy generator rules is not adopted for this exploratory redesign.',
      'Toilets, stairs, lift and circulation are provisional allowances, not fixture-count or fire-code verification. Hall and roof-play escape provision needs specialist review.',
      'Vehicle route is indicative only, not validated EVA: full-width containment, swept paths, gradients, hardstanding and pedestrian separation remain unresolved.',
      'Programme polygons are net space allocations, not wall-adjusted rooms or statutory GFA. General studies preparation and chair-store/dressing-room subdivisions remain unresolved.',
      "Roof play is a multi-use deck, not a regulation basketball court. The single ground court does not assert the standard's two basketball courts are fulfilled."
    ]};
}

export const HKSchool = {create,rectangle,sharedEdge,colors};
export default HKSchool;
