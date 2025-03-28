![](./turtok.png){id=turtok}

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from './../libs/stats/stats.module.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { Clock, MathUtils } from 'three';

import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
import { NURBSSurface } from 'three/addons/curves/NURBSSurface.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

// text
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { ARButton } from "three/addons/webxr/ARButton.js";
ARButton
</script>

<script>
import * as THREE from 'three';


const { devicePixelRatio, innerHeight, innerWidth } = window;
// Create a new WebGL renderer and set the size + pixel ratio.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
  
// Enable XR functionality on the renderer.
renderer.xr.enabled = true;

// Add it to the DOM.
document.body.appendChild( renderer.domElement );

// Create the AR button element, configure our XR session, and append it to the DOM.
ARButton.createButton(
  renderer,
  { requiredFeatures: ["hit-test"] },
)

</script>

    <div id='msg' async>hello</div>
    <button id='btn' onclick='start()'>start webxr</button>
    <script>
      document.body.insertAdjacentText('beforeend', 'hello23')

      async function start() {
        btn.remove()
        try {
          const img = document.getElementById('turtok');
          const imgBitmap = await createImageBitmap(img);

          var a = await navigator.xr.isSessionSupported('inline');
          var b = await navigator.xr.isSessionSupported('immersive-ar');
          var c = await navigator.xr.isSessionSupported('immersive-vr');

      document.body.insertAdjacentText('beforeend', 'a: ' + a)

          const session3 = await navigator.xr.requestSession("inline", {
  // requiredFeatures: ["depth-sensing"],
  // depthSensing: {
  //   usagePreference: ["cpu-optimized", "gpu-optimized"],
  //   dataFormatPreference: ["luminance-alpha", "float32"],
  // },
});
          
          
      document.body.insertAdjacentText('beforeend', 'b')

//           const session = await navigator.xr.requestSession('immersive-ar', {
//   requiredFeatures: ['image-tracking'],
//   trackedImages: [
//     {
//       image: imgBitmap,
//       widthInMeters: 0.05
//     }
//   ]
// });
// session

          msg.innerHTML = 'world' + a + b + c + typeof createImageBitmap;
        } catch (error) {
          msg.innerHTML = error;
        }
      }
    </script>



const button = ARButton.createButton( renderer, {
	requiredFeatures: [ 'image-tracking' ],
	trackedImages: [
		{
			image: imgBitmap,
			widthInMeters: 0.2
		}
	]
} );