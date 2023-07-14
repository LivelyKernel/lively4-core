# Lively4 Development Journal

<lively-import src="../_navigation.html"></lively-import>

<script>
import moment from "src/external/moment.js"
import github from "src/client/github.js"


// #TODO how to do instance-specific behabior here?
var createEntry = async () => {
  await github.current().loadCredentials()
  var username = github.current().username
  var container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  var path = "" + container.getPath();
  var dir = path.replace(/[^/]*$/,"");
  
  var dateStr = moment(new Date()).format("YYYY-MM-DD")
  var filename =  dateStr + ".md"
  
  var dirURL = dir   + filename + "/"
  var url = dirURL + "index.md" 

  lively.notify("create " + url)
  if (await lively.files.existFile(dirURL)) {
    lively.notify("Could not create " + dirURL + ", because it already exists!")
  } else {
    var src = "## " + dateStr + "\n" + "*Author: @" + username + "*\n\n"
    
    await lively.files.saveFile(dirURL, src)
    await lively.files.saveFile(url, src)
  }
  container.followPath(url)
  await container.editFile(url)
  container.focus()
  // container.getAceEditor().editor.selection.moveCursorDown()
  // container.getAceEditor().editor.selection.moveCursorDown()
  // container.getAceEditor().editor.selection.clearSelection()

}
var button = document.createElement("button")
button.addEventListener("click", () => {createEntry()})
button.innerHTML = "new"
button
</script>

## Interesting
- [2019-06-07.md drawio (source code editor)](2019-06-07.md/index.md)

## Entries
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
    .filter(ea => ea.name.match(/\d\d\d\d-\d\d-\d\d\.((html)|(md))$/))
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




