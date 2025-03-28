# QRCode Test

- only supports a single qrcode

<script>
import jsQR from 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
</script>

<script>
import cv from 'https://lively-kernel.org/lively4/aexpr/src/external/opencv/opencv-4.5.0.js'
</script>

<div id='log'>starting</div>;

<!-- <canvas id='canvasInput' width='320' height='240'></canvas>
<canvas id="outputCanvas" width='320' height='240' style='border: red 1px solid;'></canvas>
<canvas id="outputRect" width='320' height='240' style='border: red 1px solid;'></canvas> -->

<canvas id="output" width='320' height='240' style='border: red 1px solid;'></canvas>

<!-- ![hello](https://lively-kernel.org/lively4/aexpr/demos/stefan/webxr/schierke.png){id=turtok}
<canvas id="turtokOut" width='320' height='240' style='border: red 1px solid;'></canvas> -->

<video id='videoInput' autoplay style='border: blue 1px solid;position: relative; display: inline-block;'></video>

<script>
async function run() {
  const get = id => lively.query(this, '#' + id)

  let video = get("videoInput"); // video is the id of video tag
  let canvasInput = get("canvasInput"); // canvasInput is the id of <canvas>
  let outputCanvas = get('outputCanvas')
  let matchesDebugRenderingOutputCanvas = get('output')

  let videoAccess;
  videoAccess = navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
    video.srcObject = stream;
    video.play();
  })
    .catch(function(err) {
    console.log("An error occurred! " + err);
  });

  const turtok = get('turtok');
  const turtokOut = get('turtokOut');

  await cv['onRuntimeInitialized'];
  await videoAccess.then(() => lively.sleep(1000))

  const log = get('log')

  const canvas = matchesDebugRenderingOutputCanvas
const context = canvas.getContext('2d');
  
  // loop the vid capture
  const processVideo = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      log.innerText = `HAVE_ENOUGH_DATA`
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

      if (code) {
        drawBoundingBox(code.location, code.data);
        console.log("QR Code detected: ", code.data);
      }
    }

    if(!lively.allParents(lively.query(this, '*'), [], true).includes(document.body)) {
      lively.warn('BREAK')
    } else {
      requestAnimationFrame(processVideo);
    }
  }
function drawBoundingBox(location, text) {
    context.beginPath();
    context.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    context.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    context.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    context.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    context.lineTo(location.topLeftCorner.x, location.topLeftCorner.y);
    context.lineWidth = 4;
    context.strokeStyle = 'red';
    context.stroke();

     // Render the text below the QR code
    context.font = '18px Arial';
    context.fillStyle = 'red';
    context.fillText(text, location.bottomLeftCorner.x, location.bottomLeftCorner.y + 20);
}
  requestAnimationFrame(processVideo);
}

run.call(this)
</script>

