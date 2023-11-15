
export async function onrequest(name, a, b) {  
  // do nothing... we timeout
  await new Promise(resolve => setTimeout((resolve, 1000)))
  return "Hello"
}

