# Image Generation

<script>
import OpenAI from "demos/openai/openai.js"


async function generate() {
  let prompt =  {
          "model": "dall-e-3", 
           "prompt": input.value,
      "n": 1,
      "size": "1024x1024"
    }


  async function imageGeneration(prompt) {
      const apiKey = await OpenAI.ensureSubscriptionKey();
      const url = "https://api.openai.com/v1/images/generations";

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(prompt)
      };
      return fetch(url, requestOptions);
    }

  let start = performance.now()
  let response = await imageGeneration(prompt)

  let json = await response.json()
  result.innerHTML = ""
  result.appendChild(<div>time {performance.now() - start}ms</div>)
  result.appendChild(<div>{json.data[0].revised_prompt}</div>)
  img.src = json.data[0].url 

}

let img = <img></img>
let input = <input value="a white siamese cat"></input>
let result = <div></div>

let pane = <div>
  {input}
  <button click={() => generate()}>generate</button>
  {result}
  {img}
</div>

pane
</script>

