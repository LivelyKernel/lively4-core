


export async function onrequest(msg) {  
  if (msg.name === "sum") {
    var array = msg.arguments
    let result = array[0] + array[1]
    
    return result
  }
  throw new Error("request not understood: " + msg)
}


// export function onmessage(evt) {
//   if(evt.data && evt.data.message === "systemjs-worker-request") {
//     if (evt.data.name === "sum") {
//       var array = evt.data.arguments
//       let result = array[0] + array[1]
//       // console.log("ON MESSAGE result " + result)
//       return postMessage({message: "systemjs-worker-response", name: evt.data.name, id: evt.data.id, response: result})  
//     }
//     return postMessage({error: "unhandled systemjs-worker-request " + evt})
//   }
//   return postMessage({error: "could not handle message " + evt})
// }