// HK School adapter, ported from the mockup's data-inlined-from="hk-school-adapter.js"
// script (ai-spaciotect-site-massing.html). Unlike the original prototype, this
// adapter never mutates the imported fixture: callers choose the adapted OPT-C
// model explicitly so mock data remains safe to reuse beside API data.

import andersonData from '../data/andersonData.json';
import { HKSchool } from '../data/hkSchoolModel.js';

export function build(model) {
  const categories = {PC:'primary classroom',COR:'hallway',LOBBY:'lobby',STAIR:'stair',LIFT:'lift',WC:'student toilet',AWC:'accessible toilet',SWC:'staff toilet',CLEAN:'cleaning equipment room'};
  const spaces = model.rooms.map(room => ({
    Name:room.id, Category:categories[room.key] || room.name.toLowerCase(), ProgrammeKey:room.key,
    Geometry:{Curve:{ControlPoints:room.polygon.map(([X,Y])=>({X,Y,Z:room.base}))},Direction:{X:0,Y:0,Z:room.height},Capped:true}
  }));
  const graph = {
    nodes:model.rooms.map((room,index)=>({globalId:room.id,name:room.name,spaceType:spaces[index].Category,spaceCategory:room.group,floorLevel:room.floor+1})),
    relationships:model.edges.map(edge=>({source:edge.source,target:edge.target,type:'ADJACENT_TO',adjacencyType:edge.type}))
  };
  const floors = model.heights.map((height,floor)=>model.rooms.filter(room=>room.floor===floor).map(room=>room.polygon));
  const areas = model.heights.map((height,floor)=>model.rooms.filter(room=>room.floor===floor).reduce((total,room)=>total+room.area,0));
  return {
    rooms:{Spaces:spaces,design_id:model.id,soa_check:{complete:false,status:'exploratory',notes:model.notes}},graph,
    site:{design_id:model.id,concept_model:model,site_boundary:model.boundary,pedestrian_entrance_lines:model.pedestrian,vehicular_entrance_lines:model.vehicle,
      nr_floors:model.heights.length,f2f_height:model.heights,ground_floor_building_footprint:floors[0],other_floor_building_footprints:floors.slice(1),
      ground_floor_footprint_area:areas[0],upper_floor_footprint_area:areas.slice(1),hall_footprint:[],
      basketball_court_open_area:[HKSchool.rectangle(model.court.x,model.court.depth,model.court.width,model.court.length)],
      loading_unloading_spaces:[],EVA_road_centerline:[model.eva.map(([x,depth])=>[x,-depth])]}
  };
}

const model = HKSchool.create();
const adapted = build(model);

// The mockup's getRooms consulted window.__roomLayoutEditor for draft rooms; the
// React layout editor registers its state here instead (see roomLayoutEditor.js).
let layoutEditorState = null;
export function setLayoutEditorState(state) { layoutEditorState = state; }

function getRooms(option) {
  if (layoutEditorState?.option===option) return layoutEditorState.rooms;
  return andersonData[`room-validation-asd-stacker_OPT-${option}.json`] || (option==='C'?adapted.rooms:null);
}

const programmeKeys = new Set(model.programme.map(row=>row.key));
const modelOnly = [...new Map(model.rooms.filter(room=>!programmeKeys.has(room.key)).map(room=>[room.key,room])).values()];
const scheduleDefinitions = [...model.programme.map(row=>[row.name,row.group[0].toUpperCase()+row.group.slice(1),row.quantity,row.unitArea,[...new Set(adapted.rooms.Spaces.filter(space=>space.ProgrammeKey===row.key).map(space=>space.Category))]]),
  ...modelOnly.map(room=>[room.key==='WC'?'Student toilets':room.name,room.group[0].toUpperCase()+room.group.slice(1),null,null,[...new Set(adapted.rooms.Spaces.filter(space=>space.ProgrammeKey===room.key).map(space=>space.Category))]])];

export const HKSchoolStudio = {build, model, getRooms, scheduleDefinitions};
export const legacyGraph = andersonData['stack_graph.json'];
export { model as schoolModel, adapted };
export default andersonData;
