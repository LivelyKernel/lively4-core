# Files

<lively-import src="_navigation.html"></lively-import>
<style>
  lively-script {
    display: inline-block
  }
</style>

<lively-script><script>
import FileCache from "src/client/filecache.js"
(async (container) => {
  var button = document.createElement("button");
  button.addEventListener("click", () => {
    FileCache.current().addDirectory(lively4url + "/src/client/", 5)
    FileCache.current().addDirectory(lively4url + "/templates/", 5)
    FileCache.current().addDirectory(lively4url + "/src/components/", 5)
    FileCache.current().addDirectory(lively4url + "/src/parts/", 5)
    FileCache.current().addDirectory(lively4url + "/doc/", 5)    
    FileCache.current().addDirectory(lively4url + "/demos", 5)    
    FileCache.current().addDirectory(lively4url + "/tests", 5)    

    // FileCache.current().addDirectory("https://lively4/thesis/notes", 5)
    // FileCache.current().addDirectory("https://lively4/Notes", 5)
    // FileCache.current().addDirectory("https://lively4/thesis/WriteFirst", 5)
  });
  button.innerHTML = "update file cache";
  return button;
})(this.parentElement)
</script></lively-script>
<lively-script><script>
import FileCache from "src/client/filecache.js"
(async (container) => {
  var button = document.createElement("button");
  button.addEventListener("click", () => {
    FileCache.current().clear()
  });
  button.innerHTML = "clear file cache";
  return button;
})(this.parentElement)
</script></lively-script>



<lively-script><script>
import FileCache from "src/client/filecache.js"
var container = lively.query(this, "lively-container");
(async () => {
  var table = await lively.create("lively-table", this)
  var files = (await FileCache.current().db.files.toArray());
  table.setFromJSO(
    files.map(ea => {
        return {
          file: ea.url.replace(lively4url, "") + '</a> ', 
          size: ea.size,
          title: ea.title.slice(0,100).replace(/</g,"&gt;"),
          tags: ea.tags.sort(), // Array.from(new Set(ea.tags))
          
        }
        // li.querySelector("a").onclick = (evt) => {
        //   container.followPath(ea.url)
        //   evt.preventDefault()
        // }
    }))
  return table
})()
</script></lively-script>

