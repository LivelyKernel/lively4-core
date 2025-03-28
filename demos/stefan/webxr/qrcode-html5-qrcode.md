# QRCode with html5-qrcode

<script>
import ZXing from 'https://unpkg.com/@zxing/browser@latest'
// ZXing
// const codeReader = new ZXing.BrowserCodeReader().decodeFromCanvas
// const codeReader2 = new ZXing.BrowserMultiFormatReader();
// codeReader2.decodeFromImage(imageData)
</script>

<div id='log'>starting</div>;

<canvas id="output" width='320' height='240' style='border: red 1px solid;'></canvas>

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

  await videoAccess.then(() => lively.sleep(1000))

  const log = get('log')

  // Initialize ZXing code reader
const codeReader = new ZXing.BrowserQRCodeReader();
  
  const canvas = matchesDebugRenderingOutputCanvas
const context = canvas.getContext('2d');
  
  // loop the vid capture
  const processVideo = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      
      codeReader.decodeOnceFromVideoElement(video)
        .then(result => {
      debugger
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        log.innerText = `results: ${result.length}`
        
        result.forEach(code => {
          const location = code.resultPoints;
          drawBoundingBox(location, code.text);
          console.log("QR Code detected: ", code.text);
        });
      })
        .catch(err => {
        console.error(err);
      });
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

