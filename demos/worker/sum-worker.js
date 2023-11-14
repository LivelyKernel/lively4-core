
onmessage = function(e) {
  var array = e.data
  var sum = 0
  for(let ea of array) {
    sum += ea
  }
  postMessage(sum);
}