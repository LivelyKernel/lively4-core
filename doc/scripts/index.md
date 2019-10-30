# Example Scripts

Useful scripts and examples to put into a Markdown file.


<script>
import FileCache from "src/client/fileindex.js"
(async () => {
  var container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  var path = "" + container.getPath();
  var dir = path.replace(/[^/]*$/,"")
  var opts = JSON.parse(await lively.files.statFile(dir))
  var list = document.createElement("ul")
  var allFiles = []
  await FileCache.current().db.files.each(file => {
    allFiles.push(file) // materialize it... 
  })
  
  _.sortBy(opts.contents, ea => ea.name)
    .reverse()
    .filter(ea => ea.name.match(/.*.((md))$/))
    .filter(ea => ea.name != "index.md")
    .forEach(ea => {
      var li = document.createElement("li")
      var a = document.createElement("a")
      var name = ea.name
      a.innerHTML =  name.replace(/\.md/,"")
      if (ea.type === "directory") {
        name = name + "/index.md"
      }
    
      a.href = name
      var url = dir  + name
      
      a.onclick = (evt) => {
        evt.preventDefault()
        container.followPath(url)
        return true
      }
      
      li.appendChild(a)
      // #TODO #Refactor this is awfully slow... since random access into IndexDB seems to be broken until somebody tells me what I did wrong....
      var file = allFiles.find(ea => ea.url === url)
      if (file) {
        var span = document.createElement("span")
        span.style.width = "40px"
        span.style.marginLeft = "5px"
        span.style.display = "inline-block"
        span.innerHTML =  file.size
        li.appendChild(span)
        var span = document.createElement("span")
        span.style.width = "40px"
        span.innerHTML = " " + (file.title ? file.title.replace(/\d\d\d\d-\d\d-\d\d,? ?/,"").replace(/</g,"&lt;") : "")
        li.appendChild(span)        
      }
      
      list.appendChild(li)
    })
  return list
})()
</script>




