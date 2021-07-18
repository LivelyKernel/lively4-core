import * as THREE from "three";

window.THREE = THREE;
require("three/examples/js/controls/OrbitControls.js");

let OrbitControls = THREE.OrbitControls;
export default THREE;
export { OrbitControls };
