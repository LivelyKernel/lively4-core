# Lively4 Development Journal

<lively-import src="../_navigation.html"></lively-import>

<script>
import moment from "src/external/moment.js"
import github from "src/client/github.js"


// #TODO how to do instance-specific behabior here?
let createEntry = async () => {
  await github.current().loadCredentials()
  let username = github.current().username
  let container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  let path = "" + container.getPath();
  let dir = path.replace(/[^/]*$/,"");
  
  let dateStr = moment(new Date()).format("YYYY-MM-DD")
  let filename =  dateStr + ".md"
  
  let dirURL = dir   + filename + "/"
  let url = dirURL + "index.md" 

  lively.notify("create " + url)
  if (await lively.files.existFile(dirURL)) {
    lively.notify("Could not create " + dirURL + ", because it already exists!")
  } else {
    let src = "## " + dateStr + "\n" + "*Author: @" + username + "*\n\n"
    
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
let button = document.createElement("button")
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
  let container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  let path = "" + container.getPath();
  let dir = path.replace(/[^/]*$/,"")
  let opts = JSON.parse(await lively.files.statFile(dir))
  let list = document.createElement("ul")

  let stats = _.sortBy(opts.contents, ea => ea.name)
    .reverse()
    .filter(ea => ea.name.match(/\d\d\d\d-\d\d-\d\d\.((html)|(md))$/))
  
  for(let ea of stats) {
    let li = document.createElement("li")
    let a = document.createElement("a")
    let name = ea.name
    a.innerHTML =  name.replace(/\.md/,"")
    if (ea.type === "directory") {
      name = name + "/index.md"
    }

    a.href = name
    let url = dir  + name

    a.onclick = (evt) => {
      evt.preventDefault()
      container.followPath(url)
      return true
    }

    li.appendChild(a)

    FileCache.current().db.files.get(url).then(file => {
      if (file) {
        let span = document.createElement("span")
        span.style.width = "40px"
        span.style.marginLeft = "5px"
        span.style.display = "inline-block"
        span.innerHTML =  file.size
        li.appendChild(span)
        let titleSpan = document.createElement("span")
        titleSpan.style.width = "40px"
        titleSpan.innerHTML = " " + (file.title ? file.title.replace(/\d\d\d\d-\d\d-\d\d,? ?/,"").replace(/</g,"&lt;") : "")
        li.appendChild(titleSpan)
      }
    })

    list.appendChild(li)
  }
  return list
})()
</script>




