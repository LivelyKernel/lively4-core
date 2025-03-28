# OpenAI-powered Recognition

- no continuous mode

<video id='videoInput' autoplay style='border: blue 1px solid;position: relative; display: inline-block;'></video>

<div id='log'>starting</div>;

<canvas id="output" width='320' height='240' style='border: red 1px solid;'></canvas>

<script>
import OpenAI from "demos/openai/openai.js"
  
async function cardNamesFromFoto(url) {
  let prompt =  {
    "model": "gpt-4o", 
    "max_tokens": 256,
    "temperature": 1,
    "top_p": 1,
    "n": 1,
    "stream": false,
    // "stop": "VANILLA",
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "messages": [
      { "role": "system", "content": `You are a special-purpose recognition software that recognizes card from an upcoming trading card game in fotos. Cards have their name in the top, however, cards may have rotated or be skewed in the foto.

Given a foto, only answer with the list of names you detected. Print only one name each line.` },
      { "role": "user", "content":  [
        {
          "type": "image_url",
          "image_url": {
            "url": url,
            "detail": "low" // high
          }
        }
      ]}
    ]
  }

  let json = await OpenAI.openAIRequest(prompt).then(r => r.json())
  return json.choices[0].message.content
}
</script>

<script>
async function run() {
  const get = id => lively.query(this, '#' + id)
  
  const log = get('log')
  let video = get("videoInput"); // video is the id of video tag

  const canvas = get('output')
  const context = canvas.getContext('2d');
  
  let videoAccess;
  let stream;
  const captureVideo = () => {
    videoAccess = navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment"
        }
      },
      audio: false
    })
      .then(function(s) {
      stream = s
      video.srcObject = s;
      video.play();
    })
      .catch(function(err) {
      console.log("An error occurred! " + err);
    });
  };
  captureVideo()
  
  await videoAccess.then(() => lively.sleep(1000))

  const stopVideo = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      stream = null;
    }
    
    video.pause()
    video.srcObject = null; // Stop the video element
  };

  const askOpenAI = async () => {
    const dataURL = canvas.toDataURL('image/png');
    const nameString = await cardNamesFromFoto(dataURL)
    log.innerText = nameString
  };

  video.addEventListener('click', async evt => {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      lively.error('HAVE NOT ENOUGH DATA')
      return
    }

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopVideo()
    
    await askOpenAI()
    
    captureVideo()
  })

  const stopOnDetach = () => {
    if(!lively.allParents(lively.query(this, '*'), [], true).includes(document.body)) {
      stopVideo()
      lively.warn('BREAK')
    } else {
      requestAnimationFrame(stopOnDetach);
    }
  }
  requestAnimationFrame(stopOnDetach);
}

run.call(this)
</script>

