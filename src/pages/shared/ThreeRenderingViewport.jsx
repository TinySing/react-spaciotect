import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function dispose(object) {
  object.traverse(child => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
    else child.material?.dispose();
  });
}

const viewKey = value => ({ Overview: 'perspective', Arrival: 'arrival', Courtyard: 'courtyard', Roofscape: 'plan' }[value] || 'arrival');

export function ThreeRenderingViewport({ scene: model, viewpoint = 'Arrival', lightName = 'Daylight', shadows = true, resetToken = 0 }) {
  const host = useRef(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return undefined;

    if (!model?.rooms?.length) return undefined;
    const canvas = document.createElement('canvas');
    canvas.className = 'rendering-3d-canvas';
    container.replaceChildren(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xe9eff2);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lightName === 'Late afternoon' ? 1.15 : 1.1;
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-80, 80, 55, -55, .1, 1200);
    const content = new THREE.Group();
    scene.add(content);
    scene.add(new THREE.HemisphereLight(0xe4efff, 0x909581, 1.8));
    const sun = new THREE.DirectionalLight(lightName === 'Late afternoon' ? 0xffd2a0 : 0xffffff, lightName === 'Late afternoon' ? 2.6 : 2.15);
    sun.position.set(-45, lightName === 'Late afternoon' ? 45 : 100, 60);
    sun.castShadow = shadows;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 250 });
    sun.shadow.bias = -.0003;
    scene.add(sun);

    const orbit = { theta: .7, phi: .92, radius: 230, target: new THREE.Vector3(0, 6, 0) };
    const material = (color, opacity = 1) => new THREE.MeshStandardMaterial({ color, roughness: .85, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
    const box = (x, depth, width, length, base, height, color, name = '', opacity = 1) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), material(color, opacity));
      mesh.position.set(x + width / 2 - 52, base + height / 2, depth + length / 2 - 30);
      mesh.name = name;
      mesh.castShadow = opacity === 1;
      mesh.receiveShadow = true;
      content.add(mesh);
      return mesh;
    };
    const rounded = (x, depth, base, width, height, length, color, name = '') => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material(color));
      mesh.position.set(x - 52, base + height / 2, depth - 30);
      mesh.scale.set(width / 2, height / 2, length / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = name;
      content.add(mesh);
      return mesh;
    };
    const cylinder = (x, depth, base, radius, height, color, name = '') => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .85, radius, height, 10), material(color));
      mesh.position.set(x - 52, base + height / 2, depth - 30);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = name;
      content.add(mesh);
      return mesh;
    };
    const line = (points, color, dashed = false) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, depth, height]) => new THREE.Vector3(x - 52, height, depth - 30)));
      const stroke = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 1.4, gapSize: 1 }) : new THREE.LineBasicMaterial({ color });
      const result = new THREE.Line(geometry, stroke);
      if (dashed) result.computeLineDistances();
      content.add(result);
      return result;
    };
    const glazing = (x, depth, width, length, base, height, name) => {
      const pane = box(x, depth, width, length, base, height, '#567f89', name);
      pane.material.roughness = .2;
      pane.material.metalness = .38;
      return pane;
    };
    const sign = (text, x, depth, base, width, height) => {
      const label = document.createElement('canvas');
      label.width = 1024;
      label.height = 128;
      const drawing = label.getContext('2d');
      drawing.fillStyle = '#264c48';
      drawing.fillRect(0, 0, 1024, 128);
      drawing.fillStyle = '#ffffff';
      drawing.font = '500 54px sans-serif';
      drawing.textAlign = 'center';
      drawing.textBaseline = 'middle';
      drawing.fillText(text, 512, 64, 950);
      const texture = new THREE.CanvasTexture(label);
      texture.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: .8, side: THREE.DoubleSide }));
      mesh.position.set(x - 52, base + height / 2, depth - 30);
      mesh.name = 'School arrival sign';
      content.add(mesh);
    };
    const addFacade = () => {
      model.rooms.forEach(room => {
        if (room.group === 'circulation' || room.key === 'CPG') return;
        const neighbours = model.rooms.filter(other => other !== room && other.floor === room.floor);
        ['north', 'south', 'east', 'west'].forEach(side => {
          const horizontal = side === 'north' || side === 'south';
          const start = horizontal ? room.x : room.depth;
          const length = horizontal ? room.width : room.length;
          const edge = side === 'north' ? room.depth : side === 'south' ? room.depth + room.length : side === 'west' ? room.x : room.x + room.width;
          const outward = side === 'north' || side === 'west' ? -1 : 1;
          const blocked = neighbours.some(other => {
            const otherStart = horizontal ? other.x : other.depth;
            const otherEnd = otherStart + (horizontal ? other.width : other.length);
            const otherNear = horizontal ? other.depth : other.x;
            const otherFar = otherNear + (horizontal ? other.length : other.width);
            return Math.min(start + length, otherEnd) - Math.max(start, otherStart) > .3 && Math.abs((outward < 0 ? otherFar : otherNear) - edge) < .25;
          });
          if (blocked) return;
          const bays = Math.max(1, Math.floor(length / 2.4));
          const bay = length / bays;
          for (let index = 0; index < bays; index += 1) {
            const position = start + index * bay + .28;
            const width = bay - .56;
            const sill = room.base + .95;
            const height = Math.min(1.8, room.height - 1.5);
            const face = edge + outward * .075;
            glazing(horizontal ? position : face, horizontal ? face : position, horizontal ? width : .13, horizontal ? .13 : width, sill, height, 'Framed facade window');
            for (const elevation of [sill - .07, sill + height]) box(horizontal ? position - .06 : face - .04, horizontal ? face - .04 : position - .06, horizontal ? width + .12 : .21, horizontal ? .21 : width + .12, elevation, .08, '#e5e8e5', 'Window frame');
            for (const offset of [0, width / 2, width]) box(horizontal ? position + offset : face - .04, horizontal ? face - .04 : position + offset, horizontal ? .055 : .21, horizontal ? .21 : .055, sill, height, '#e5e8e5', 'Window mullion');
            box(horizontal ? position - .1 : edge - .4, horizontal ? edge - .4 : position - .1, horizontal ? width + .2 : .8, horizontal ? .8 : width + .2, sill + height + .16, .1, '#f3eee3', 'Facade sunshade');
          }
          if (room.floor === 0 && length > 4) {
            const position = start + length / 2 - .55;
            const face = edge + outward * .16;
            glazing(horizontal ? position : face, horizontal ? face : position, horizontal ? 1.1 : .15, horizontal ? .15 : 1.1, room.base + .15, 2.25, 'Entrance door');
          }
        });
      });
      sign('ANDERSON ROAD SCHOOL', 22, 53.4, 3.6, 11, .95);
      for (let x = 19; x < 29; x += 2.2) {
        const panel = glazing(x, 32, 1.8, 3.2, 5.65, .12, 'Roof solar array');
        panel.rotation.x = .16;
      }
    };
    const person = (x, depth, adult = false, variant = 0, base = -.14) => {
      const scale = adult ? 1 : .78;
      const skin = ['#c68f69', '#dab08b', '#956c52'][variant % 3];
      const clothes = adult ? '#4b706a' : ['#f5f3e9', '#dfeaf1', '#ece8df'][variant % 3];
      rounded(x, depth, base + .53 * scale, .43 * scale, .64 * scale, .26 * scale, clothes, 'School life');
      rounded(x, depth, base + 1.23 * scale, .24 * scale, .27 * scale, .25 * scale, skin, 'School life');
      rounded(x, depth - .025, base + 1.41 * scale, .25 * scale, .13 * scale, .25 * scale, '#323330', 'School life');
      [-.12, .12].forEach(offset => {
        cylinder(x + offset * scale, depth, base + .08 * scale, .065 * scale, .53 * scale, '#394856', 'School life');
        rounded(x + offset * scale, depth + .055, base, .15 * scale, .1 * scale, .29 * scale, '#343a3c', 'School life');
      });
      if (!adult) rounded(x, depth - .17, base + .63 * scale, .29 * scale, .4 * scale, .16 * scale, ['#cc815a', '#477487', '#638552'][variant % 3], 'Student backpack');
    };
    const tree = (x, depth, size = 1) => {
      cylinder(x, depth, -.16, .19 * size, 3.5 * size, '#7c7160', 'Tree trunk');
      for (let index = 0; index < 7; index += 1) {
        const angle = index * 2.4;
        const radius = index === 0 ? 0 : 1.1 * size;
        rounded(x + Math.cos(angle) * radius, depth + Math.sin(angle) * radius, 2.3 * size + (index % 3) * .32, 2.4 * size, 2.5 * size, 2.2 * size, ['#527451', '#6b8957', '#84965c'][index % 3], 'Landscape tree');
      }
    };
    const planter = (x, depth, width = 4, length = 1.3) => {
      box(x, depth, width, length, -.16, .76, '#c8c4b9', 'Concrete planter');
      box(x + .12, depth + .12, width - .24, length - .24, .6, .04, '#5b5445', 'Planter soil');
      for (let offset = .4; offset < width; offset += .65) rounded(x + offset, depth + length / 2, .63, .85, .6, length * .9, '#738456', 'Planter shrub');
    };
    const bench = (x, depth) => {
      [0, .17, .34, .51].forEach(offset => box(x, depth + offset, 2.2, .13, .5, .07, '#ac8762', 'Bench timber slat'));
      [.2, 1.8].forEach(offset => box(x + offset, depth + .1, .12, .45, -.16, .66, '#485551', 'Bench frame'));
      [.8, 1].forEach(height => box(x, depth, 2.2, .08, height, .13, '#ac8762', 'Bench backrest'));
    };
    const vehicle = (x, depth, bus = false, color = '#b4c2c5') => {
      const width = bus ? 2.5 : 1.85;
      const length = bus ? 8.8 : 4.3;
      box(x, depth, width, length, .43, bus ? 1.6 : .75, bus ? '#e8b74e' : color, bus ? 'Illustrative school bus' : 'Illustrative car');
      box(x + .06, depth + (bus ? .25 : 1), width - .12, bus ? length - .5 : 2.1, 1.15, bus ? 1.6 : .72, bus ? '#e9be58' : color, 'Vehicle body');
      glazing(x + .1, depth + length - .08, width - .2, .1, bus ? 1.65 : 1.15, bus ? .9 : .62, 'Vehicle windshield');
      for (const side of [x - .06, x + width + .06]) for (const offset of [1, length - 1.1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(bus ? .45 : .32, bus ? .45 : .32, .2, 16), material('#303537'));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side - 52, .48, depth + offset - 30);
        content.add(wheel);
      }
      if (bus) sign('SCHOOL BUS', x + width / 2, depth + length + .06, 2.55, 2, .28);
    };
    const deck = (court, base) => {
      box(court.x, court.depth, court.width, court.length, base, .18, '#e6d5b0', 'Play deck');
      box(court.x + 1, court.depth + 1, court.width - 2, court.length - 2, base + .18, .04, '#409a75', 'Multi-use play surface');
      const inset = 2;
      const centerX = court.x + court.width / 2;
      const centerY = court.depth + court.length / 2;
      line([[court.x + inset, court.depth + inset, base + .24], [court.x + court.width - inset, court.depth + inset, base + .24], [court.x + court.width - inset, court.depth + court.length - inset, base + .24], [court.x + inset, court.depth + court.length - inset, base + .24], [court.x + inset, court.depth + inset, base + .24]], '#f5f4e9');
      line([[centerX, court.depth + inset, base + .24], [centerX, court.depth + court.length - inset, base + .24]], '#f5f4e9');
      line(Array.from({ length: 49 }, (_, index) => [centerX + Math.cos(index / 48 * Math.PI * 2) * 2, centerY + Math.sin(index / 48 * Math.PI * 2) * 2, base + .24]), '#f5f4e9');
      if (base > 1) {
        [.8, 1.6, 2.6].forEach(height => line([[court.x, court.depth, base + height], [court.x + court.width, court.depth, base + height], [court.x + court.width, court.depth + court.length, base + height], [court.x, court.depth + court.length, base + height], [court.x, court.depth, base + height]], '#60736b'));
        for (let distance = 0; distance <= court.width; distance += 2) [court.depth, court.depth + court.length].forEach(depth => box(court.x + distance, depth, .08, .08, base, 2.6, '#60736b', 'Court fence'));
      }
    };
    const addShell = () => {
      model.rooms.forEach(room => {
        if (room.key === 'CPG') {
          for (let x = room.x; x <= room.x + room.width; x += 7) [room.depth, room.depth + room.length - .55].forEach(depth => box(x, depth, .55, .55, 0, 5.32, '#dedfda', 'Playground column'));
          box(room.x, room.depth, room.width, room.length, 0, .15, '#dfd3bb', 'Covered playground');
          box(room.x, room.depth, room.width, room.length, 5.05, .27, '#e2e5df', 'Community podium slab');
          return;
        }
        if (room.group === 'circulation' && !['STAIR', 'LIFT'].includes(room.key)) {
          box(room.x, room.depth, room.width, room.length, room.base, .22, '#e8e5d9', room.name);
          if (room.floor > 0) box(room.x, room.depth + room.length - .14, room.width, .14, room.base + .22, 1, '#bfcfc4', 'Gallery balustrade');
          return;
        }
        let color = room.group === 'learning' ? '#dce3df' : room.group === 'administration' ? '#d3dace' : room.group === 'community' ? '#d9d4cd' : '#bdc9c3';
        if (['STAIR', 'LIFT'].includes(room.key)) color = '#9dada6';
        box(room.x, room.depth, room.width, room.length, room.base, room.height - .2, color, room.name);
        box(room.x, room.depth, room.width, room.length, room.base + room.height - .2, .2, '#f0f0e8', 'Floor edge');
        if (room.key === 'PC') {
          box(room.x + .45, room.depth - .05, room.width - .9, .1, room.base + .9, 1.85, '#72969a', 'Classroom glazing');
          [2.4, 4.4, 6.4].forEach(offset => box(room.x + offset, room.depth - .12, .1, .18, room.base + .85, 1.95, '#dde3de', 'Window mullion'));
          box(room.x - .05, room.depth - .65, room.width + .1, .7, room.base + 2.85, .12, '#d5ded8', 'Solar canopy');
          box(room.x - .1, room.depth - .2, .2, .45, room.base, room.height, '#c2cfc7', 'Facade pier');
        }
        if (room.key === 'HALL') for (let depth = room.depth + 1; depth < room.depth + room.length - 1; depth += 2.5) box(room.x + room.width - .1, depth, .2, 1.5, room.base + 3, 2, '#829e9b', 'Hall clerestory');
      });
      deck(model.roofCourt, model.roofCourt.base);
      box(16, 27, 16, 26.25, 5.32, .2, '#d6e0cd', 'West community roof');
      box(11.5, 43, 5, 8, 4.6, .18, '#ccd6ce', 'Entrance canopy');
      for (let floor = 0; floor < 6; floor += 1) {
        const base = model.heights.slice(0, floor).reduce((sum, height) => sum + height, 0);
        for (let x = 18; x <= 101; x += 8) box(x, 14.7, .18, .18, base, model.heights[floor], '#b5c3b9', 'Gallery column');
      }
    };
    const landscape = () => {
      box(-16, -5, 134, 83, -.55, .25, '#dde1d7', 'Presentation ground');
      box(-12, -5, 8, 83, -.28, .13, '#626d70', 'Illustrative access road');
      box(-3.8, -5, 3, 83, -.16, .18, '#c9c9c0', 'Arrival pavement');
      for (let depth = -4; depth < 76; depth += 5) box(-8.15, depth, .13, 2.6, -.13, .015, '#efede1', 'Road centre marking');
      for (let depth = 45; depth < 51; depth += .85) box(-11.5, depth, 7, .38, -.13, .025, '#f1efe4', 'Pedestrian crossing');
      for (let depth = 0; depth < 76; depth += 3) line([[-3.7, depth, .035], [-.9, depth, .035]], '#a9afa8');
      box(4, 65, 31, 10, -.05, .1, '#747e7f', 'Illustrative carpark');
      for (let index = 0; index < 10; index += 1) {
        const x = 5 + index * 2.9;
        line([[x, 66, .08], [x, 71.2, .08], [x + 2.7, 71.2, .08]], '#f1eee2');
        if (index % 3 !== 1) vehicle(x + .35, 66.5, false, ['#dde2df', '#587c87', '#ab6660', '#82927b'][index % 4]);
      }
      vehicle(-11.2, 54, true);
      vehicle(-6.7, 17, false, '#f0eee5');
      [[1, 10, 1.1], [1, 23, 1], [1, 36, 1.15], [1, 58, 1], [40, 70, 1.2], [52, 68, 1.1], [73, 66, 1.3], [91, 65, 1], [109, 17, 1.2], [109, 35, 1], [109, 54, 1.25]].forEach(([x, depth, size]) => tree(x, depth, size));
      [[18, 55], [26, 55], [38, 53], [52, 53], [70, 53]].forEach(([x, depth]) => { planter(x, depth); bench(x, depth + 2); });
      for (let index = 0; index < 24; index += 1) person(37 + (index % 8) * 3.6, 33 + Math.floor(index / 8) * 5, index === 0 || index === 15, index, .3);
      for (let index = 0; index < 12; index += 1) person(4 + (index % 6) * 1.4, 49 + Math.floor(index / 6) * 1.8, index === 1, index);
      person(25, 54, true, 1);
      person(27, 55, false, 2);
      [12, 32, 55, 72].forEach(depth => { cylinder(-2.2, depth, .05, .07, 4.5, '#61716d', 'Path light'); box(-2.65, depth - .25, .9, .5, 4.5, .12, '#eef0e5', 'Path luminaire'); });
    };

    const boundary = new THREE.Shape();
    model.boundary.forEach(([x, y], index) => { if (index) boundary.lineTo(x - 52, y + 30); else boundary.moveTo(x - 52, y + 30); });
    const groundGeometry = new THREE.ShapeGeometry(boundary);
    groundGeometry.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeometry, material('#e5eadd'));
    ground.position.y = -.16;
    ground.receiveShadow = true;
    content.add(ground);
    deck(model.court, .02);
    addShell();
    addFacade();
    landscape();

    const render = () => {
      const offset = new THREE.Vector3(orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta), orbit.radius * Math.cos(orbit.phi), orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta));
      camera.position.copy(orbit.target).add(offset);
      camera.lookAt(orbit.target);
      renderer.render(scene, camera);
    };
    const reset = () => {
      const view = viewKey(viewpoint);
      orbit.theta = view === 'arrival' ? -.8 : view === 'courtyard' ? .15 : .7;
      orbit.phi = view === 'plan' ? .001 : view === 'arrival' || view === 'courtyard' ? 1.22 : .92;
      const bounds = new THREE.Box3().setFromObject(content);
      const sphere = bounds.getBoundingSphere(new THREE.Sphere());
      orbit.target.copy(sphere.center);
      orbit.radius = 250;
      camera.zoom = 1;
      render();
      const projected = [];
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) projected.push(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
      const minX = Math.min(...projected.map(point => point.x));
      const maxX = Math.max(...projected.map(point => point.x));
      const minY = Math.min(...projected.map(point => point.y));
      const maxY = Math.max(...projected.map(point => point.y));
      const aspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
      const halfHeight = Math.max((maxY - minY) / 2, (maxX - minX) / 2 / aspect) * 1.12;
      const halfWidth = halfHeight * aspect;
      camera.left = (minX + maxX) / 2 - halfWidth;
      camera.right = (minX + maxX) / 2 + halfWidth;
      camera.top = (minY + maxY) / 2 + halfHeight;
      camera.bottom = (minY + maxY) / 2 - halfHeight;
      camera.updateProjectionMatrix();
      render();
    };
    let drag = null;
    const onDown = event => {
      if (event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, theta: orbit.theta, phi: orbit.phi };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-orbiting');
    };
    const onMove = event => {
      if (!drag || drag.id !== event.pointerId) return;
      orbit.theta = drag.theta - (event.clientX - drag.x) * .009;
      orbit.phi = Math.max(.05, Math.min(1.55, drag.phi + (event.clientY - drag.y) * .006));
      render();
    };
    const onEnd = event => {
      if (!drag || drag.id !== event.pointerId) return;
      drag = null;
      canvas.classList.remove('is-orbiting');
    };
    const onWheel = event => {
      event.preventDefault();
      camera.zoom = Math.max(.5, Math.min(3, camera.zoom * Math.exp(-event.deltaY * .001)));
      camera.updateProjectionMatrix();
      render();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onEnd);
    canvas.addEventListener('pointercancel', onEnd);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      reset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => {
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onEnd);
      canvas.removeEventListener('pointercancel', onEnd);
      canvas.removeEventListener('wheel', onWheel);
      dispose(scene);
      renderer.dispose();
      container.replaceChildren();
    };
  }, [viewpoint, lightName, shadows, resetToken]);

  return <div ref={host} className="three-rendering-viewport" aria-label="Interactive architectural rendering. Drag to orbit and scroll to zoom." />;
}
