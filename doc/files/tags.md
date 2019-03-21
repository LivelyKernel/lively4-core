# Tags

<lively-import src="_navigation.html"></lively-import>

Auto-generated list of taggedFiles found in (browser-local) files data-base.

<script>
  import FileCache from "src/client/fileindex.js"
</script>

<script>
(async () => {
  var taggedFiles = {}
  var files = await FileCache.current().db.files.filter(ea =>  ea.tags && ea.tags.length > 0).toArray();
  files
    .filter(ea => ea.url.match(lively4url)) // only show local files...
    .forEach(ea => {
      ea.tags.forEach(tag => {
        if(!taggedFiles[tag]) taggedFiles[tag] = [];
        taggedFiles[tag].push(ea)
      })
    })

  var lastLi 
  function showFiles(li,tag) {
    if (lastLi) lastLi.querySelectorAll("ul").forEach(ea => ea.remove());
    if (lastLi == li) {
      lastLi = null
      return
    }
    lastLi = li
    var ul2 = document.createElement("ul")
    _.uniq(taggedFiles[tag]).forEach(ea => {
      ea.content.split("\n").filter(ea => ea.match(tag)).forEach(line => {
        var li2 = document.createElement("li")
        li2.innerHTML = '<a href="' +ea.url + '">'+ea.name + '</a> ' + line.replace(/</g,"&lt;") 
        li2.querySelector("a").onclick = (evt) => {
          evt.preventDefault()
          lively.openBrowser(ea.url, true, line)
        }
        ul2.appendChild(li2)
      })


      // var li2 = document.createElement("li")
      //     li2.innerHTML = '<a href="' +ea.name + '">'+ ea.name + '</a> '
      //     li2.querySelector("a").onclick = (evt) => {
      //       evt.preventDefault()
      //       // lively.openBrowser(ea.url, true, line)
      //     }
      //     ul2.appendChild(li2)
    })


    li.appendChild(ul2)
  }

  var ul = document.createElement("ul")
  _.sortBy(Object.keys(taggedFiles), ea => taggedFiles[ea].length).reverse().forEach(tag => {
    var links = taggedFiles[tag]
    var li = document.createElement("li")
        li.innerHTML = '<a href="' +tag + '">'+ tag + '</a> ' + links.length 
        li.querySelector("a").onclick = (evt) => {
          evt.preventDefault()
          showFiles(li, tag)
          // lively.openBrowser(ea.url, true, line)
        }
        ul.appendChild(li)

        if (tag == "#window") {
            showFiles(li, tag)
        }
  })    


  return ul
})()
</script>