# Rescue Desktop

How to recover content from browser local "desktops"? We can load it in other "worlds"

<script>
  // this is a bug
  var world = <div id="target" style="background-color: lightgray; position: absolute; overflow: scroll; width:1000px; height: 1000px"></div>

  var urlInput = <input id="url" style="width:400px"></input>
  urlInput.value  = lively.persistence.current.defaultURL()
  
  
  var loadButton = <button click={evt => {
    world.innerHTML = ""
    world.innerHTML = "" + Date.now()
    lively.showElement(world)
     lively.persistence.current.loadLivelyContentForURL(urlInput.value, world)
  }}>load</button>
  var saveButton = <button click={evt => lively.persistence.current.storeLivelyContentForURL(urlInput.value, world)}>save</button>

  var result = <div>
      {loadButton} {saveButton} {urlInput}
      {world}
  </div>
  
  result
</script>



