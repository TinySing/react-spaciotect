// Three.js r160 UMD build vendored from the SPACIOTECT mockups so the React
// port renders identically. The UMD factory assigns to globalThis.THREE when
// loaded as an ES module (no CommonJS/AMD context), so re-export that object.
import './three.min.js';

const THREE = globalThis.THREE;
export default THREE;
