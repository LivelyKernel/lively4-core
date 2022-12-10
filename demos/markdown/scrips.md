# Scripts in Markdown


<script>

var container = lively.query(this, "lively-container")
var url = container.getURL().toString()

"this: " + this + " container: " + container + " url: " + url



</script>

## Script with Async Content


<script>

(async function() {
  
  await lively.sleep(1000)
  
  return <div>Done</div>

})()
</script>