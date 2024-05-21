# Image Generation

```javascript
import OpenAI from "demos/openai/openai.js"


let prompt =  {
        "model": "dall-e-3", 
         "prompt": "a white siamese cat",
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


let response = await imageGeneration(prompt)


reso

let json = await response.json()


json.data[0].url 

```

<script>

let img = <img src="https://oaidalleapiprodscus.blob.core.windows.net/private/org-MPQoSTR6cnoOYKKoexRQqilJ/user-jSdR6BwdMFDIgdYmJiwmPPyY/img-5tGP5Ewc7Ro54jL8nqRNwhHC.png?st=2024-05-14T15%3A39%3A06Z&se=2024-05-14T17%3A39%3A06Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-05-14T15%3A40%3A46Z&ske=2024-05-15T15%3A40%3A46Z&sks=b&skv=2021-08-06&sig=VyLOR1dYBJBs0z7KzG/n/XXIk2lXWQ%2BJ4B29xSB5HZQ%3D"></img>


img
</script>
