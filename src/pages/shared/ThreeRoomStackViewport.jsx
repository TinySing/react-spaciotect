import React, { useEffect, useRef } from 'react';
import THREE from '../../vendor/three.js';
import { addRoomSiteContext } from './RoomSiteContext3D';

const ANDERSON_COLORS = {
  learning: 0x91ae99,
  occupiable: 0xb6c4b2,
  circulation: 0xc3a858,
  community: 0xc18470,
  administration: 0x789e9f,
  service: 0xa8a2ad,
  'm&e': 0x7b8580,
};

const floorLevel = name => {
  const floor = name.split('-').pop();
  return floor === 'G' ? 1 : Number(floor) + 1;
};

function roomColor(category = '') {
  const value = category.toLowerCase();
  if (/classroom|science|art|computer|music|stem|teaching|library/.test(value)) return ANDERSON_COLORS.learning;
  if (/assembly|dining|playground|multi-purpose/.test(value)) return ANDERSON_COLORS.community;
  if (/office|staff|meeting|reception|support/.test(value)) return ANDERSON_COLORS.administration;
  if (/hallway|lobby|stair|corridor/.test(value)) return ANDERSON_COLORS.circulation;
  if (/plant/.test(value)) return ANDERSON_COLORS['m&e'];
  return ANDERSON_COLORS.service;
}

function getBounds(spaces) {
  const points = spaces.flatMap(space => space.Geometry.Curve.ControlPoints);
  const xs = points.map(point => point.X);
  const zs = points.map(point => -point.Y);
  return {
    center: {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      z: (Math.min(...zs) + Math.max(...zs)) / 2,
    },
    span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)),
  };
}

function roomShape(points, center) {
  const shape = new THREE.Shape();
  points.slice(0, -1).forEach((point, index) => {
    const x = point.X - center.x;
    const z = point.Y + center.z;
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

function dispose(object) {
  object.traverse(child => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
    else child.material?.dispose();
  });
}

export function ThreeRoomStackViewport({ spaces, site, floor, selected, onSelect, representation = '3D', zoom = 1, resetKey = 0, orbitEnabled = true, interaction = 'Select' }) {
  const host = useRef(null);
  const runtimeRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const interactionRef = useRef(interaction);
  const orbitEnabledRef = useRef(orbitEnabled);
  const selectedRef = useRef(selected);
  onSelectRef.current = onSelect;
  interactionRef.current = interaction;
  orbitEnabledRef.current = orbitEnabled;
  selectedRef.current = selected;

  useEffect(() => {
    const target = host.current;
    const valid = spaces.filter(space => space.Geometry?.Curve?.ControlPoints?.length > 3);
    if (!target || !valid.length) return undefined;

    const { center, span } = getBounds(valid);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    target.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 1000);
    const group = new THREE.Group();
    group.rotation.y = -.12;
    scene.add(group);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb7bdb9, 2.3));
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.1);
    sunlight.position.set(-70, 120, 80);
    scene.add(sunlight);

    const rooms = [];
    valid.forEach(space => {
      const points = space.Geometry.Curve.ControlPoints;
      const base = points[0].Z || 0;
      const height = space.Geometry.Direction?.Z || 3.6;
      const geometry = new THREE.ExtrudeGeometry(roomShape(points, center), { depth: height, bevelEnabled: false, curveSegments: 1 });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, base, 0);
      const level = floorLevel(space.Name);
      const baseColor = new THREE.Color(roomColor(space.Category));
      const chosen = Boolean(selectedRef.current && space.Name === selectedRef.current);
      const material = new THREE.MeshLambertMaterial({
        color: chosen ? 0xc21725 : baseColor,
        transparent: true,
        opacity: selectedRef.current ? (chosen ? 1 : .22) : level === floor ? 1 : .88,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = space.Name;
      mesh.userData = { roomId: space.Name, category: space.Category, baseColor, level };
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 18),
        new THREE.LineBasicMaterial({ color: chosen ? 0xc21725 : 0x63796c, transparent: true, opacity: selected ? (chosen ? .95 : .12) : .45 }),
      );
      mesh.add(edges);
      rooms.push(mesh);
      group.add(mesh);
    });
    addRoomSiteContext(group, site, center);

    group.updateMatrixWorld(true);
    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    const isPlan = representation === 'Plan';
    const orbit = { theta: isPlan ? 0 : 1.55, phi: isPlan ? .001 : .68, radius: 1, target: sphere.center.clone() };
    const defaultRadius = () => {
      const aspect = target.clientWidth / Math.max(1, target.clientHeight);
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      return sphere.radius / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * aspect))) * .9 / zoom;
    };
    const render = () => {
      const sin = Math.sin(orbit.phi);
      camera.position.set(orbit.radius * sin * Math.sin(orbit.theta), orbit.radius * Math.cos(orbit.phi), orbit.radius * sin * Math.cos(orbit.theta));
      camera.position.add(orbit.target);
      camera.lookAt(orbit.target);
      renderer.render(scene, camera);
    };
    const applySelection = selectedId => {
      rooms.forEach(mesh => {
        const selectedRoom = Boolean(selectedId && mesh.userData.roomId === selectedId);
        mesh.material.color.copy(selectedRoom ? new THREE.Color(0xc21725) : mesh.userData.baseColor);
        mesh.material.opacity = selectedId ? (selectedRoom ? 1 : .22) : mesh.userData.level === floor ? 1 : .88;
        mesh.children.forEach(child => {
          if (!child.isLineSegments) return;
          child.material.color.setHex(selectedRoom ? 0xc21725 : 0x63796c);
          child.material.opacity = selectedId ? (selectedRoom ? .95 : .12) : .45;
        });
      });
      render();
    };
    const runtime = { applySelection };
    runtimeRef.current = runtime;

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
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (!isPlan && interactionRef.current === 'Move') {
        const pan = orbit.radius * .00135;
        orbit.target.copy(drag.target).add(new THREE.Vector3(-dx * pan, 0, dy * pan));
      } else if (!isPlan && orbitEnabledRef.current) {
        orbit.theta = drag.theta - dx * .008;
        orbit.phi = Math.max(.2, Math.min(1.45, drag.phi + dy * .006));
      }
      render();
    };
    const onEnd = event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(rooms, false)[0];
        if (hit) onSelectRef.current?.(hit.object.userData.roomId);
      }
      drag = null;
      renderer.domElement.classList.remove('is-orbiting');
    };
    const onWheel = event => {
      event.preventDefault();
      orbit.radius = Math.max(defaultRadius() * .35, Math.min(defaultRadius() * 3, orbit.radius + event.deltaY * .12));
      render();
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onEnd);
    renderer.domElement.addEventListener('pointercancel', onEnd);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    const resize = () => {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.far = Math.max(2000, defaultRadius() * 5);
      camera.updateProjectionMatrix();
      orbit.radius = defaultRadius();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    resize();
    applySelection(selectedRef.current);

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
      target.replaceChildren();
    };
  }, [spaces, site, floor, representation, zoom, resetKey]);

  useEffect(() => {
    runtimeRef.current?.applySelection(selected);
  }, [selected]);

  return <div className="three-room-stack" ref={host} aria-label="Interactive 3D room massing. Drag to orbit, scroll to zoom, and click a room to select it." />;
}
