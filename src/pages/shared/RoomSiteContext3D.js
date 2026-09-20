import THREE from '../../vendor/three.js';

export function addRoomSiteContext(parent, site, center) {
  if (!site?.site_boundary?.length) return null;
  const context = new THREE.Group();
  context.name = 'Indicative site context';
  parent.add(context);
  const point = ([east, north]) => new THREE.Vector3(east - center.x, -.3, -north - center.z);
  const addLine = (points, color, dashed = false) => {
    if (!points?.length) return;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.map(point)),
      dashed ? new THREE.LineDashedMaterial({ color, dashSize: 2, gapSize: 1 }) : new THREE.LineBasicMaterial({ color }),
    );
    if (dashed) line.computeLineDistances();
    context.add(line);
  };
  addLine(site.site_boundary, 0x65776b);
  (site.EVA_road_centerline || []).forEach(points => addLine(points, 0xb28136, true));
  ['pedestrian_entrance_lines', 'vehicular_entrance_lines'].forEach(key => {
    const raw = site[key] || [];
    const lines = typeof raw[0]?.[0] === 'number' ? [raw] : raw;
    lines.forEach(points => addLine(points, 0xb64d45));
  });
  const xs = site.site_boundary.map(point => point[0]);
  const ys = site.site_boundary.map(point => point[1]);
  addLine([[Math.min(...xs) - 8, Math.min(...ys)], [Math.min(...xs) - 8, Math.max(...ys)]], 0xadb8b9);
  return context;
}
