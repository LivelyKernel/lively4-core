### 2024-01-23 Playing around with #Screeps
*Author: @JensLincke*


```javascript
 
import pako from "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"

let screepsToken = localStorage.getItem("screeps_token")
let memory = await fetch(" https://screeps.com/api/user/memory?shard=shard3&room=W49S53&_token=" + screepsToken).then(r => r.json())

let data = memory.data.replace(/^gz:/, "")
let decodedBinaryData = atob(data)

const uint8Array = new Uint8Array(decodedBinaryData.length);
for (let i = 0; i < decodedBinaryData.length; i++) {
    uint8Array[i] = decodedBinaryData.charCodeAt(i);
}

let inflatedData = pako.inflate(uint8Array, { to: 'string' })

const jsonData = JSON.parse(inflatedData);

Object.keys(jsonData.creeps)

```
