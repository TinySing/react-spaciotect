// Site-context helpers, ported from the mockup's studio-site-context.js
// (ai-spaciotect-site-massing.html). The mockup version ran as a DOM
// MutationObserver enhancement pass; React pages call these helpers directly
// while rendering, so only the pure transforms plus the 3D/compass utilities
// are ported here.

import * as THREE from 'three';
import andersonData, { adapted } from '../adapters/hkSchoolAdapter.js';

export function siteData(option = 'C') {
  return option === 'C' ? adapted.site : andersonData[`site_design_geo_OPT-${option}.json`];
}

export function projectFor(boundary,width=960,height=610){
  const xs=boundary.map(point=>point[0]),ys=boundary.map(point=>point[1]);
  const minX=Math.min(...xs)-18,maxX=Math.max(...xs)+8,minY=Math.min(...ys)-9,maxY=Math.max(...ys)+10;
  const scale=Math.min((width-100)/(maxX-minX),(height-100)/(maxY-minY));
  return ([east,north])=>[(width-(maxX-minX)*scale)/2+(east-minX)*scale,50+(maxY-north)*scale];
}

export function contextMarkup(site,project){
  const boundary=site.site_boundary,points=boundary.map(point=>project(point).join(',')).join(' ');
  const xs=boundary.map(point=>point[0]),ys=boundary.map(point=>point[1]);
  const west=Math.min(...xs)-8,north=Math.max(...ys),south=Math.min(...ys);
  const street=[project([west,north]),project([west,south])];
  const gates=[['pedestrian_entrance_lines','Pedestrian gate','#b64d45'],['vehicular_entrance_lines','Vehicle gate','#b28136']];
  return `<g class="studio-site-context" pointer-events="none"><polygon points="${points}" fill="#f1f4ef" stroke="#67766f" stroke-width="2" stroke-dasharray="7 3"/><path d="M${street[0]} L${street[1]}" stroke="#d8dfe0" stroke-width="18"/><text x="${street[0][0]-14}" y="${(street[0][1]+street[1][1])/2}" transform="rotate(-90 ${street[0][0]-14} ${(street[0][1]+street[1][1])/2})" text-anchor="middle" fill="#6d7776" font-size="10">Street connection · indicative</text>${gates.map(([key,label,color])=>{
    const raw=site[key]||[],lines=typeof raw[0]?.[0]==='number'?[raw]:raw;
    return lines.map(line=>{if(!line.length)return '';const start=project(line[0]),end=project(line[line.length-1]);return `<path d="M${start} L${end}" stroke="${color}" stroke-width="5"/><circle cx="${start[0]}" cy="${start[1]}" r="4" fill="${color}"><title>${label} · retained assumption</title></circle>`;}).join('');
  }).join('')}${(site.EVA_road_centerline||[]).map(line=>`<polyline points="${line.map(point=>project(point).join(',')).join(' ')}" fill="none" stroke="#b28136" stroke-width="2" stroke-dasharray="5 5"/>`).join('')}</g>`;
}

function centroid(polygons,fallback){
  const points=(polygons||[]).flat();
  return points.length?[points.reduce((total,point)=>total+point[0],0)/points.length,points.reduce((total,point)=>total+point[1],0)/points.length]:fallback;
}

export function sitePositions(site,project){
  const model=site.concept_model,gate=key=>{const raw=site[key]||[];return typeof raw[0]?.[0]==='number'?raw[0]:raw[0]?.[0];};
  const center=centroid([site.site_boundary],[50,-30]);
  const position={SCH01:center,CLA01:centroid(site.other_floor_building_footprints?.[0],center),ASS01:centroid(site.hall_footprint,center),BAS01:centroid(site.basketball_court_open_area,center),LOA01:centroid(site.loading_unloading_spaces,gate('vehicular_entrance_lines')||center),PED01:gate('pedestrian_entrance_lines')||center,VEH01:gate('vehicular_entrance_lines')||center};
  if(model){
    const bubbles=Object.fromEntries(model.bubbles.map(bubble=>[bubble.id,[bubble.x,-bubble.depth]]));
    position.SCH01=bubbles.resource;position.CLA01=[46,-8];position.ASS01=bubbles.hall;position.BAS01=bubbles.court;position.LOA01=bubbles.service;
  }
  position.DAI01=[position.VEH01[0]+12,position.VEH01[1]+4];
  position.EVA01=centroid(site.EVA_road_centerline,position.LOA01);
  position.STR01=[Math.min(...site.site_boundary.map(point=>point[0]))-8,Math.max(...site.site_boundary.map(point=>point[1]))-16];
  return Object.fromEntries(Object.entries(position).map(([key,point])=>[key,project(point)]));
}

export function add3D(group,site,center){
  if(!site)return null;
  const context=new THREE.Group();context.name='Indicative site context';group.add(context);
  const addLine=(points,color,dashed=false)=>{
    const geometry=new THREE.BufferGeometry().setFromPoints(points.map(([east,north])=>new THREE.Vector3(east-center.x,-.3,-north-center.z)));
    const material=dashed?new THREE.LineDashedMaterial({color,dashSize:2,gapSize:1}):new THREE.LineBasicMaterial({color});
    const line=new THREE.Line(geometry,material);if(dashed)line.computeLineDistances();context.add(line);
  };
  addLine(site.site_boundary,0x65776b);
  (site.EVA_road_centerline||[]).forEach(points=>addLine(points,0xb28136,true));
  for(const key of ['pedestrian_entrance_lines','vehicular_entrance_lines']){const raw=site[key]||[];const lines=typeof raw[0]?.[0]==='number'?[raw]:raw;lines.forEach(points=>addLine(points,0xb64d45));}
  const west=Math.min(...site.site_boundary.map(point=>point[0]))-8,ys=site.site_boundary.map(point=>point[1]);
  addLine([[west,Math.min(...ys)],[west,Math.max(...ys)]],0xadb8b9);
  return context;
}

export function roomCenter(ids,spaces){
  const points=spaces.filter(space=>ids.includes(space.Name)).flatMap(space=>space.Geometry?.Curve?.ControlPoints?.slice(0,-1)||[]);
  if(!points.length)return null;
  return [points.reduce((sum,point)=>sum+point.X,0)/points.length,points.reduce((sum,point)=>sum+point.Y,0)/points.length];
}

export function spaceRoomBubbles(groups,positions){
  const anchors=Object.fromEntries(groups.map(group=>[group.name,[...positions[group.name]]]));
  for(let iteration=0;iteration<160;iteration++){
    for(let firstIndex=0;firstIndex<groups.length;firstIndex++){
      const first=positions[groups[firstIndex].name];
      for(let secondIndex=firstIndex+1;secondIndex<groups.length;secondIndex++){
        const second=positions[groups[secondIndex].name],dx=second[0]-first[0],dy=second[1]-first[1],distance=Math.hypot(dx,dy),minimum=66;
        if(distance>=minimum)continue;
        const angle=distance?Math.atan2(dy,dx):secondIndex*2.4,push=(minimum-distance)/2;
        first[0]-=Math.cos(angle)*push;first[1]-=Math.sin(angle)*push;second[0]+=Math.cos(angle)*push;second[1]+=Math.sin(angle)*push;
      }
    }
    for(const group of groups){const point=positions[group.name],anchor=anchors[group.name];point[0]=Math.max(240,Math.min(800,point[0]+(anchor[0]-point[0])*.006));point[1]=Math.max(135,Math.min(430,point[1]+(anchor[1]-point[1])*.006));}
  }
}

export function compass(runtime,host,rotation=0){
  if(!runtime?.renderer||!host||host.querySelector('.studio-north'))return;
  const element=document.createElement('div');element.className='studio-north';element.title='Provisional north: model +Y; surveyed bearing TBC';
  element.innerHTML='<span class="north-pointer">↑</span><b>N</b><small>provisional</small>';host.appendChild(element);
  const render=runtime.renderer.render.bind(runtime.renderer);
  runtime.renderer.render=function(scene,camera){
    const result=render(scene,camera);
    const direction=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),rotation).transformDirection(camera.matrixWorldInverse);
    element.querySelector('.north-pointer').style.transform=`rotate(${Math.atan2(direction.x,direction.y)*180/Math.PI}deg)`;
    return result;
  };
  runtime.renderer.render(runtime.scene,runtime.camera);
}
