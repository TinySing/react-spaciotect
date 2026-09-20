// SVG view-rotation hook, ported from the mockup's studio-view-rotation.js.
// The mockup attached pointer listeners to `.massing-svg` / `.room-graph-svg` etc.
// and set a CSS transform; this hook exposes the same transform + handlers for a
// React-rendered <svg>. `spatial` selects the massing/room-stack variant
// (rotateX/rotateY, perspective 1000, scale .9) over the plan variant
// (rotateX/rotateZ, perspective 1200, scale .92).

import { useCallback, useRef, useState } from 'react';

export function useViewRotation({ spatial = false } = {}) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  const style = spatial
    ? { transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(.9)` }
    : { transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateZ(${rotation.y}deg) scale(.92)` };

  const onPointerDown = event => {
    if (event.button !== 0) return;
    setRotation(current => {
      dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: current.x, startY: current.y };
      return current;
    });
    movedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    setRotation({
      x: Math.max(spatial ? -55 : -18, Math.min(spatial ? 55 : 18, drag.startX - dy * .28)),
      y: drag.startY + dx * .32
    });
  };

  const finish = event => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return;
    dragRef.current = null;
  };
  const onPointerUp = finish;
  const onPointerCancel = finish;

  // A drag that moved is not a click — keep it from selecting nodes underneath.
  const onClickCapture = event => {
    if (movedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      movedRef.current = false;
    }
  };

  const reset = useCallback(() => setRotation({ x: 0, y: 0 }), []);

  return { rotation, style, reset, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture } };
}
