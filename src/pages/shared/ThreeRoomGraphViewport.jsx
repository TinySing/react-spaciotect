import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { addRoomSiteContext } from './RoomSiteContext3D';

const COLORS = { learning: 0x91ae99, occupiable: 0x91ae99, circulation: 0xc3a858, community: 0xc18470, administration: 0x789e9f, service: 0xa8a2ad, 'm&e': 0x7b8580 };
const floorName = floor => floor === 1 ? 'G' : `${floor - 1}`;

function dispose(object) {
  object.traverse(item => {
    item.geometry?.dispose();
    if (Array.isArray(item.material)) item.material.forEach(material => material.dispose());
    else item.material?.dispose();
  });
}

function labelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 70;
  const context = canvas.getContext('2d');
  context.font = '700 24px Segoe UI, sans-serif';
  context.fillStyle = '#26322c';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.length > 25 ? `${text.slice(0, 24)}…` : text, 210, 35);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(18, 3.75, 1);
  return sprite;
}

export function ThreeRoomGraphViewport({ graph, spaces = [], site, floor, selected, onSelect, tool = 'Select', zoom = 1, resetKey = 0 }) {
  const host = useRef(null);
  const runtimeRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const toolRef = useRef(tool);
  const selectedRef = useRef(selected);
  onSelectRef.current = onSelect;
  toolRef.current = tool;
  selectedRef.current = selected;

  useEffect(() => {
    const stage = host.current;
    if (!stage || !graph?.nodes?.length) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    stage.replaceChildren(renderer.domElement);

    const keyOf = node => (node.spaceType || node.name || node.spaceCategory || 'room').toLowerCase();
    const groups = [...graph.nodes.reduce((map, node) => {
      const key = `${node.floorLevel}|${keyOf(node)}`;
      if (!map.has(key)) map.set(key, { key, floor: node.floorLevel, name: keyOf(node), category: node.spaceCategory || 'occupiable', nodes: [] });
      map.get(key).nodes.push(node);
      return map;
    }, new Map()).values()];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 500);
    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc8cfcc, 2.5));
    const positions = new Map();
    const roomCenters = new Map();
    const allPoints = spaces.flatMap(space => space.Geometry?.Curve?.ControlPoints || []);
    const siteCenter = allPoints.length ? {
      x: (Math.min(...allPoints.map(point => point.X)) + Math.max(...allPoints.map(point => point.X))) / 2,
      z: -((Math.min(...allPoints.map(point => point.Y)) + Math.max(...allPoints.map(point => point.Y))) / 2),
    } : { x: 0, z: 0 };
    spaces.forEach(space => {
      const points = space.Geometry?.Curve?.ControlPoints || [];
      if (!points.length) return;
      roomCenters.set(space.Name, {
        x: (Math.min(...points.map(point => point.X)) + Math.max(...points.map(point => point.X))) / 2 - siteCenter.x,
        z: -((Math.min(...points.map(point => point.Y)) + Math.max(...points.map(point => point.Y))) / 2) - siteCenter.z,
      });
    });
    const levels = [...new Set(groups.map(group => group.floor))].sort((a, b) => a - b);
    const levelGap = 16;
    const graphContext = addRoomSiteContext(scene, site, siteCenter);
    if (graphContext) graphContext.position.y = -(levels.length - 1) / 2 * levelGap - 5;
    levels.forEach((level, index) => {
      const y = (index - (levels.length - 1) / 2) * levelGap;
      const onFloor = groups.filter(group => group.floor === level);
      const circulation = onFloor.filter(group => group.category === 'circulation');
      const programme = onFloor.filter(group => group.category !== 'circulation');
      const grid = new THREE.GridHelper(82, 10, 0xd3d9d5, 0xe8ebe9);
      grid.position.y = y - 4;
      grid.material.transparent = true;
      grid.material.opacity = .42;
      scene.add(grid);
      const label = labelSprite(`${floorName(level)}/F`);
      label.position.set(-46, y, 0);
      label.scale.set(10, 3, 1);
      scene.add(label);
      circulation.forEach((group, itemIndex) => positions.set(group.key, new THREE.Vector3((itemIndex - (circulation.length - 1) / 2) * 10, y, 0)));
      programme.forEach((group, itemIndex) => {
        const angle = -Math.PI / 2 + itemIndex * Math.PI * 2 / Math.max(1, programme.length);
        positions.set(group.key, new THREE.Vector3(Math.cos(angle) * 30, y + Math.sin(itemIndex * 1.7), Math.sin(angle) * 20));
      });
    });
    groups.forEach(group => {
      const centers = group.nodes.map(node => roomCenters.get(node.globalId)).filter(Boolean);
      if (!centers.length) return;
      const position = positions.get(group.key);
      position.x = centers.reduce((sum, center) => sum + center.x, 0) / centers.length;
      position.z = centers.reduce((sum, center) => sum + center.z, 0) / centers.length;
    });
    const groupForId = new Map(graph.nodes.map(node => [node.globalId, `${node.floorLevel}|${keyOf(node)}`]));
    const seen = new Set();
    graph.relationships.forEach(edge => {
      const source = groupForId.get(edge.source);
      const target = groupForId.get(edge.target);
      const pair = [source, target].sort().join('|');
      if (!source || !target || source === target || seen.has(pair)) return;
      seen.add(pair);
      const geometry = new THREE.BufferGeometry().setFromPoints([positions.get(source), positions.get(target)]);
      const vertical = edge.adjacencyType === 'floor_sharing';
      root.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: vertical ? 0xd92837 : 0x8e9793, transparent: true, opacity: vertical ? .82 : .42 })));
    });
    const spheres = groups.map(group => {
      const radius = Math.min(4.6, 2.5 + Math.sqrt(group.nodes.length) * .55);
      const baseColor = new THREE.Color(COLORS[group.category] || COLORS.occupiable);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: .96 }));
      mesh.position.copy(positions.get(group.key));
      mesh.userData = { ids: group.nodes.map(node => node.globalId), baseColor };
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), new THREE.LineBasicMaterial({ color: 0x3f4743, transparent: true, opacity: .45 })));
      const label = labelSprite(`${group.nodes.length > 1 ? `${group.nodes.length} · ` : ''}${group.name.toUpperCase()}`);
      label.position.set(0, radius + 1.4, 0);
      mesh.add(label);
      root.add(mesh);
      return mesh;
    });
    const bounds = new THREE.Box3();
    spheres.forEach(mesh => bounds.expandByPoint(mesh.position));
    bounds.expandByScalar(7);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const orbit = { theta: -.72, phi: .82, radius: 1, target: bounds.getCenter(new THREE.Vector3()) };
    const fittedRadius = () => {
      const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
      const vertical = THREE.MathUtils.degToRad(camera.fov);
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
      return sphere.radius / Math.sin(Math.min(vertical, horizontal) / 2) * .92 / zoom;
    };
    const render = () => {
      const sin = Math.sin(orbit.phi);
      camera.position.set(orbit.target.x + orbit.radius * sin * Math.sin(orbit.theta), orbit.target.y + orbit.radius * Math.cos(orbit.phi), orbit.target.z + orbit.radius * sin * Math.cos(orbit.theta));
      camera.lookAt(orbit.target);
      renderer.render(scene, camera);
    };
    const reset = () => { orbit.theta = -.72; orbit.phi = .82; orbit.radius = fittedRadius(); render(); };
    const applySelection = selectedId => {
      spheres.forEach(mesh => {
        const chosen = Boolean(selectedId && mesh.userData.ids.includes(selectedId));
        mesh.material.color.copy(chosen ? new THREE.Color(0xff3445) : mesh.userData.baseColor);
        mesh.material.opacity = selectedId ? (chosen ? 1 : .2) : .96;
      });
      render();
    };
    const runtime = { applySelection };
    runtimeRef.current = runtime;
    applySelection(selectedRef.current);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let drag = null;
    const onDown = event => {
      if (event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, theta: orbit.theta, phi: orbit.phi, target: orbit.target.clone(), moved: false };
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add('is-orbiting');
    };
    const onMove = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved ||= Math.abs(dx) + Math.abs(dy) > 4;
      if (toolRef.current !== 'Move') {
        orbit.theta = drag.theta - dx * .009;
        orbit.phi = Math.max(.25, Math.min(1.48, drag.phi + dy * .007));
      }
      if (toolRef.current === 'Move') {
        const pan = orbit.radius * .00135;
        orbit.target.copy(drag.target).add(new THREE.Vector3(-dx * pan, dy * pan, 0));
      }
      render();
    };
    const onEnd = event => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(spheres, false)[0];
        if (hit) onSelectRef.current?.(hit.object.userData.ids[0]);
      }
      drag = null;
      renderer.domElement.classList.remove('is-orbiting');
    };
    const onWheel = event => { event.preventDefault(); const fit = fittedRadius(); orbit.radius = Math.max(fit * .45, Math.min(fit * 2.2, orbit.radius + event.deltaY * fit * .001)); render(); };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onEnd);
    renderer.domElement.addEventListener('pointercancel', onEnd);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    const observer = new ResizeObserver(() => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      reset();
    });
    observer.observe(stage);
    reset();
    return () => {
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onEnd);
      renderer.domElement.removeEventListener('pointercancel', onEnd);
      renderer.domElement.removeEventListener('wheel', onWheel);
      dispose(scene);
      renderer.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
      stage.replaceChildren();
    };
  }, [graph, spaces, site, floor, zoom, resetKey]);

  useEffect(() => {
    runtimeRef.current?.applySelection(selected);
  }, [selected]);

  return <div className="three-room-graph" ref={host} aria-label="Interactive all-floor 3D room relationship graph. Drag to orbit, scroll to zoom, and click a group to select it." />;
}
