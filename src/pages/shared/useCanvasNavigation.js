import { useRef, useState } from 'react';

export function useCanvasNavigation({ minScale = .7, maxScale = 1.8 } = {}) {
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button, [role="button"], input, select, textarea')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, viewport };
  };
  const onPointerMove = event => {
    if (!dragRef.current) return;
    const start = dragRef.current;
    setViewport(current => ({ ...current, x: start.viewport.x + event.clientX - start.x, y: start.viewport.y + event.clientY - start.y }));
  };
  const onPointerEnd = () => { dragRef.current = null; };
  const onWheel = event => {
    event.preventDefault();
    setViewport(current => ({ ...current, scale: Math.max(minScale, Math.min(maxScale, current.scale - event.deltaY * .001)) }));
  };
  const zoomIn = () => setViewport(current => ({ ...current, scale: Math.min(maxScale, Number((current.scale + .1).toFixed(2))) }));
  const zoomOut = () => setViewport(current => ({ ...current, scale: Math.max(minScale, Number((current.scale - .1).toFixed(2))) }));
  const resetViewport = () => setViewport({ x: 0, y: 0, scale: 1 });
  return {
    viewportStyle: { transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`, transformOrigin: 'center center' },
    navigationHandlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onWheel },
    zoomIn,
    zoomOut,
    resetViewport,
  };
}
