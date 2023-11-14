

export function onmessage(evt) {
  let result = evt.data[0] + evt.data[1]

  postMessage(result)
}