#  Scripts with Async Content


<script>

(async function() {
  
  await lively.sleep(1000)
  
  return <div>Done</div>

})()
</script>