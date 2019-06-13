# Classes

<lively-import src="_navigation.html"></lively-import>

Auto-generated list of taggedFiles found in (browser-local) files data-base.

<script>
  import FileCache from "src/client/fileindex.js"
</script>

<script>
(async () => {
  var methods = {}
  var classes = await FileCache.current().db.classes.toArray();
  classes = classes
    .filter(ea => ea.url.match(lively4url)) // only show local files...
    

  var lastLi 
  function showClass(li, aClass) {
  debugger
    if (lastLi) lastLi.querySelectorAll("ul").forEach(ea => ea.remove());
    if (lastLi == li) {
      lastLi = null
      return
    }
    lastLi = li
    var ul2 = document.createElement("ul")
    aClass.methods.forEach(ea => {
    debugger
      var li2 = document.createElement("li")
      li2.innerHTML = '<a href="' +ea.url + '">'+ea.name + '</a> '
      li2.querySelector("a").onclick = async (evt) => {
        evt.preventDefault()
        var container = await lively.openBrowser(aClass.url, true)
        var cm = (await container.getEditor())
      }
      ul2.appendChild(li2)
    })


    li.appendChild(ul2)
  }

  var ul = document.createElement("ul")
  classes.forEach(aClass => {
    var li = document.createElement("li")
        li.innerHTML = '<a href="' +aClass + '">'+ aClass.name + '</a> ' 
        li.querySelector("a").onclick = (evt) => {
          evt.preventDefault()
          showClass(li, aClass)
          // lively.openBrowser(ea.url, true, line)
        }
        ul.appendChild(li)

       
  })    


  return ul
})()
</script>