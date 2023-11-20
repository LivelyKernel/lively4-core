


export async function onrequest(name) {  
  if (name === "sum") {
    let result = await postRequest("a") + await postRequest("b")
    
    return result
  }
  throw new Error("request not understood: " + arguments)
}

