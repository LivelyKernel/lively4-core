


export async function onrequest(name, a, b) {  
  if (name === "sum") {
    let result = a + b
    
    return result
  }
  throw new Error("request not understood: " + arguments)
}

