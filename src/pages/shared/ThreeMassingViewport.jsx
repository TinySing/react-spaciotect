import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLORS = { learning: 0xd6dfd8, community: 0xe8dbcc, mixed: 0xd7dfd9, outdoor: 0xa9cdc8, service: 0xd9cd9b, site: 0xf7f8f2, line: 0x798b80 };

function parts(value) {
  if (!Array.isArray(value) || !value.length) return [];
  if (typeof value[0]?.[0] === 'number') return [value];
  if (typeof value[0]?.[0]?.[0] === 'number') return value;
  return value.flatMap(parts);
}

function cleanPoints(points) {
  const clean = (points || []).map(([x, y]) => [x, -y]);
  if (clean.length > 1 && clean[0][0] === clean.at(-1)[0] && clean[0][1] === clean.at(-1)[1]) clean.pop();
  return clean;
}

function shapeFrom(points, center) {
  const shape = new THREE.Shape();
  cleanPoints(points).forEach(([x, z], index) => index ? shape.lineTo(x - center.x, z - center.z) : shape.moveTo(x - center.x, z - center.z));
  shape.closePath();
  return shape;
}

function boundsOf(site) {
  const points = site.site_boundary || [];
  const xs = points.map(point => point[0]);
  const zs = points.map(point => -point[1]);
  return {
    center: { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2 },
    span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)),
  };
}

function addEdges(mesh, color = COLORS.line) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 22), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .25 }));
  mesh.add(edges);
}

function addExtrusion(group, points, base, height, color, name, center) {
  if (!points?.length || height <= 0) return;
  const geometry = new THREE.ExtrudeGeometry(shapeFrom(points, center), { depth: height, bevelEnabled: false, curveSegments: 1 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, base, 0);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .82, side: THREE.DoubleSide }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  addEdges(mesh);
  group.add(mesh);
}

function addPlane(group, points, elevation, color, name, center, opacity = 1) {
  if (!points?.length) return;
  const geometry = new THREE.ShapeGeometry(shapeFrom(points, center));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, elevation, 0);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .9, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity === 1 }));
  mesh.receiveShadow = true;
  mesh.name = name;
  group.add(mesh);
}

function addLine(group, points, elevation, color, center, dashed = true) {
  if (!points?.length) return;
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y]) => new THREE.Vector3(x - center.x, elevation, -y - center.z)));
  const line = new THREE.Line(geometry, dashed ? new THREE.LineDashedMaterial({ color, dashSize: 3, gapSize: 2, transparent: true, opacity: .9 }) : new THREE.LineBasicMaterial({ color, transparent: true, opacity: .9 }));
  if (dashed) line.computeLineDistances();
  group.add(line);
}

function addContextMassing(group, x1, y1, x2, y2, height, name, center) {
  const geometry = new THREE.ExtrudeGeometry(shapeFrom([[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], center), { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, .03, 0);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xbdc7c0, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: .3, depthWrite: false }));
  mesh.name = name;
  addEdges(mesh, 0x9baa9e);
  group.add(mesh);
}

function addMassingContext(group, site, center) {
  const boundary = site.site_boundary || [];
  if (boundary.length < 3) return;
  const xs = boundary.map(point => point[0]);
  const ys = boundary.map(point => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), frontageY = Math.max(...ys);
  addPlane(group, [[minX - 12, frontageY + 12], [maxX + 12, frontageY + 12], [maxX + 12, frontageY + 4], [minX - 12, frontageY + 4]], -.08, 0xdce3e0, 'Street NW frontage', center);
  parts(site.pedestrian_entrance_lines).forEach(points => addLine(group, points, .12, 0xe36534, center, false));
  parts(site.vehicular_entrance_lines).forEach(points => addLine(group, points, .12, 0xe36534, center, false));
  addContextMassing(group, minX + 10, frontageY + 18, maxX - 28, frontageY + 34, 10, 'Conceptual frontage massing', center);
  addContextMassing(group, maxX + 10, minY + 16, maxX + 32, frontageY - 18, 14, 'Conceptual east massing', center);
  addContextMassing(group, minX - 30, minY + 14, minX - 10, frontageY - 28, 8, 'Conceptual west massing', center);
  addContextMassing(group, minX + 28, minY - 30, maxX - 24, minY - 12, 11, 'Conceptual south massing', center);
}

function addEntranceMarker(group, lines, center) {
  const first = parts(lines)[0];
  if (!first || first.length < 2) return;
  const approach = first[0];
  const arrival = first.at(-1);
  const direction = new THREE.Vector3(arrival[0] - approach[0], 0, approach[1] - arrival[1]).normalize();
  const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
  const position = new THREE.Vector3(arrival[0] - center.x, .2, -arrival[1] - center.z);
  const marker = new THREE.Group();
  const accent = new THREE.MeshBasicMaterial({ color: 0xe61e2a });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, .08, 32), new THREE.MeshBasicMaterial({ color: 0xffc4ca, transparent: true, opacity: .95, depthWrite: false }));
  pad.position.copy(position);
  marker.add(pad);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.5, 3, 32), accent);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, .27, position.z);
  marker.add(ring);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 6.5, 10), accent);
  shaft.position.copy(position).addScaledVector(direction, -3.25);
  shaft.position.y = .65;
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  marker.add(shaft);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 4), accent);
  arrow.position.copy(position).addScaledVector(direction, -.45);
  arrow.position.y = .7;
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  marker.add(arrow);
  [-1, 1].forEach(side => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.23, .28, 5.4, 12), accent);
    post.position.copy(position).addScaledVector(perpendicular, side * 2.1);
    post.position.y = 2.7;
    marker.add(post);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.7, .35, .35), accent);
  beam.position.set(position.x, 5.25, position.z);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), perpendicular);
  marker.add(beam);
  const labelCanvas = document.createElement('canvas');
  const context = labelCanvas.getContext('2d');
  if (context) {
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    context.fillStyle = '#e61e2a';
    context.beginPath();
    context.roundRect(8, 8, 496, 112, 18);
    context.fill();
    context.fillStyle = '#fff';
    context.font = '700 42px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('MAIN ENTRANCE', 256, 66);
    const texture = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
    label.position.set(position.x, 7, position.z);
    label.scale.set(15, 3.75, 1);
    marker.add(label);
  }
  group.add(marker);
}

function dispose(object) {
  object.traverse(child => { child.geometry?.dispose(); if (Array.isArray(child.material)) child.material.forEach(material => material.dispose()); else child.material?.dispose(); });
}

function applyMassingEdit(group, edit, selected) {
  const type = edit?.type;
  if (type === 'Extrude') group.scale.y = 1.18;
  if (type === 'Bend') group.rotation.y = .1;
  if (type === 'Chamfer') group.scale.set(.9, 1, .9);
  if (type === 'Subtract') group.scale.set(.76, .72, .76);
  if (type === 'Offset') group.position.set(4, 0, 3);
  if (type === 'Clip') group.scale.y = .55;
  if (type === 'Merge') group.scale.set(1.08, 1, 1.08);
  group.traverse(child => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => {
      if (!material) return;
      if (type === 'Subtract') { material.transparent = true; material.opacity = .56; }
      if (selected && material.emissive) material.emissive.setHex(0x180000);
    });
  });
}

export function ThreeMassingViewport({ site, visibleLayers = {}, visibleLevels = 6, shadows = true, context = true, representation = '3D', cameraMode = 'Perspective', resetKey = 0, activeTool = 'Select', selectedMassId, edits = {}, onMassPick }) {
  const host = useRef(null);
  const runtimeRef = useRef(null);
  const activeToolRef = useRef(activeTool);
  const onMassPickRef = useRef(onMassPick);
  const selectedMassRef = useRef(selectedMassId);
  activeToolRef.current = activeTool;
  onMassPickRef.current = onMassPick;
  selectedMassRef.current = selectedMassId;

  useEffect(() => {
    const target = host.current;
    if (!target || !site) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xe8eeea, 1);
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    target.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 1000);
    const root = new THREE.Group();
    const contextGroup = new THREE.Group();
    const landscapeGroup = new THREE.Group();
    const structureGroup = new THREE.Group();
    const accessGroup = new THREE.Group();
    root.add(contextGroup, landscapeGroup, structureGroup, accessGroup);
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xafb6a7, 2.4));
    const sun = new THREE.DirectionalLight(0xfff8ed, 3.2);
    sun.position.set(-65, 140, 55);
    sun.castShadow = shadows;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 1, far: 400 });
    sun.shadow.bias = -.0005;
    sun.shadow.normalBias = .05;
    scene.add(sun);

    const { center } = boundsOf(site);
    addMassingContext(contextGroup, site, center);
    addEntranceMarker(accessGroup, site.pedestrian_entrance_lines, center);
    addPlane(landscapeGroup, site.site_boundary, -.12, COLORS.site, 'Site boundary', center);
    parts(site.basketball_court_open_area).forEach((polygon, index) => addPlane(landscapeGroup, polygon, .05, COLORS.outdoor, `Basketball court ${index + 1}`, center));
    parts(site.loading_unloading_spaces).forEach((polygon, index) => addPlane(accessGroup, polygon, .08, COLORS.service, `Loading / unloading ${index + 1}`, center));
    parts(site.EVA_road_centerline).forEach(line => addLine(accessGroup, line, .1, COLORS.service, center));

    let elevation = 0;
    const floors = [site.ground_floor_building_footprint || [], ...(site.other_floor_building_footprints || [])];
    floors.forEach((floor, index) => {
      const floorGroup = new THREE.Group();
      floorGroup.userData.level = index;
      floorGroup.userData.mass = { id: `floor-${index}`, label: index === 0 ? 'Ground-floor massing' : `${index}/F teaching massing` };
      const height = site.f2f_height?.[index] || 3.6;
      parts(floor).forEach(polygon => {
        addExtrusion(floorGroup, polygon, elevation, height - .14, index === 0 ? COLORS.mixed : COLORS.learning, index === 0 ? 'Mixed ground floor' : `Learning floor ${index}`, center);
        addExtrusion(floorGroup, polygon, elevation + height - .14, .14, 0xf0f0e8, 'Floor edge', center);
      });
      structureGroup.add(floorGroup);
      elevation += height;
    });
    const hallGroup = new THREE.Group();
    hallGroup.userData.mass = { id: 'hall', label: 'Assembly hall massing' };
    parts(site.hall_footprint).forEach((polygon, index) => addExtrusion(hallGroup, polygon, .03, site.f2f_height?.[0] || 3.6, COLORS.community, `Assembly hall ${index + 1}`, center));
    if (hallGroup.children.length) structureGroup.add(hallGroup);
    root.rotation.y = -.16;

    contextGroup.visible = Boolean(context);
    landscapeGroup.visible = visibleLayers.Landscape !== false;
    accessGroup.visible = visibleLayers['Access / EVA'] !== false;
    structureGroup.visible = visibleLayers.Structure !== false;
    structureGroup.traverse(child => { if (child.type === 'LineSegments') child.visible = visibleLayers.Envelope !== false; });
    structureGroup.children.forEach(child => {
      if (Number.isInteger(child.userData.level)) child.visible = visibleLayers.Structure !== false && child.userData.level < visibleLevels;
      if (child.userData.mass) applyMassingEdit(child, edits[child.userData.mass.id], false);
    });

    root.updateMatrixWorld(true);
    const modelBounds = new THREE.Box3();
    [landscapeGroup, structureGroup, accessGroup].forEach(group => modelBounds.expandByObject(group));
    const sphere = modelBounds.getBoundingSphere(new THREE.Sphere());
    const initialView = representation === 'Plan' || cameraMode === 'Top' ? 'plan' : representation === 'Front' || cameraMode === 'Front' ? 'elevation' : 'perspective';
    const orbit = { theta: initialView === 'perspective' ? 2.4 : 0, phi: initialView === 'plan' ? .001 : initialView === 'elevation' ? Math.PI / 2 : .82, radius: 1, target: sphere.center.clone() };
    const defaultRadius = () => {
      const aspect = target.clientWidth / Math.max(1, target.clientHeight);
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      return sphere.radius / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * aspect))) * .82;
    };
    const render = () => {
      const sin = Math.sin(orbit.phi);
      camera.position.set(orbit.radius * sin * Math.sin(orbit.theta), orbit.radius * Math.cos(orbit.phi), orbit.radius * sin * Math.cos(orbit.theta));
      camera.position.add(orbit.target);
      camera.lookAt(orbit.target);
      renderer.render(scene, camera);
    };
    const applySelection = massId => {
      structureGroup.children.forEach(group => {
        const selected = group.userData.mass?.id === massId;
        group.traverse(child => {
          if (!child.isMesh) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => material?.emissive?.setHex(selected ? 0x180000 : 0x000000));
        });
      });
      render();
    };
    const runtime = { applySelection };
    runtimeRef.current = runtime;
    const reset = () => { orbit.theta = initialView === 'perspective' ? 2.4 : 0; orbit.phi = initialView === 'plan' ? .001 : initialView === 'elevation' ? Math.PI / 2 : .82; orbit.radius = defaultRadius(); render(); };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickMass = event => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(structureGroup.children, true)[0];
      let object = hit?.object;
      while (object && !object.userData.mass) object = object.parent;
      return object?.userData.mass;
    };
    let drag = null;
    const onDown = event => { if (event.button !== 0) return; drag = { id: event.pointerId, x: event.clientX, y: event.clientY, theta: orbit.theta, phi: orbit.phi }; renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.classList.add('is-orbiting'); };
    const onMove = event => { if (!drag || drag.id !== event.pointerId || initialView !== 'perspective') return; orbit.theta = drag.theta - (event.clientX - drag.x) * .008; orbit.phi = Math.max(.2, Math.min(1.45, drag.phi + (event.clientY - drag.y) * .006)); render(); };
    const onEnd = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const wasClick = Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5;
      drag = null;
      renderer.domElement.classList.remove('is-orbiting');
      if (wasClick) {
        const mass = pickMass(event);
        if (mass) onMassPickRef.current?.(mass, activeToolRef.current);
      }
    };
    const onWheel = event => { event.preventDefault(); orbit.radius = Math.max(defaultRadius() * .35, Math.min(defaultRadius() * 3, orbit.radius + event.deltaY * .12)); render(); };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onEnd);
    renderer.domElement.addEventListener('pointercancel', onEnd);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    const resize = () => { const { width, height } = target.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.far = Math.max(1000, defaultRadius() * 5); camera.updateProjectionMatrix(); reset(); };
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    resize();
    applySelection(selectedMassRef.current);
    return () => { if (runtimeRef.current === runtime) runtimeRef.current = null; observer.disconnect(); renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointermove', onMove); renderer.domElement.removeEventListener('pointerup', onEnd); renderer.domElement.removeEventListener('pointercancel', onEnd); renderer.domElement.removeEventListener('wheel', onWheel); dispose(scene); renderer.dispose(); target.replaceChildren(); };
  }, [site, visibleLayers, visibleLevels, shadows, context, representation, cameraMode, resetKey, edits]);

  useEffect(() => {
    runtimeRef.current?.applySelection(selectedMassId);
  }, [selectedMassId]);

  return <div className="three-massing-viewport" ref={host} aria-label="Interactive 3D site massing. Drag to orbit and scroll to zoom." />;
}
