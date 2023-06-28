#  Scripts with Async Content


<script>

(async function() {
  
  await lively.sleep(1000)
  
  return <div>Done</div>

})()
</script>



## And now without the function

<script>

var b = await Promise.resolve(3)

var c = <div>hello</div>

c
</script>