# Files

<lively-import src="_navigation.html"></lively-import>

<style>
  lively-script {
    display: inline-block
  }
</style>

<script>
  import FileIndex from "src/client/fileindex.js"
</script>

<script>
  (async (container) => {
    var button = document.createElement("button");
    button.addEventListener("click", async () => {
      await FileIndex.current().addDirectory(lively4url + "/src/client/", 5)
      await FileIndex.current().addDirectory(lively4url + "/templates/", 5)
      await FileIndex.current().addDirectory(lively4url + "/src/components/", 5)
      await FileIndex.current().addDirectory(lively4url + "/src/parts/", 5)
      await FileIndex.current().addDirectory(lively4url + "/doc/", 5)    
      await FileIndex.current().addDirectory(lively4url + "/demos/", 5)    
      await FileIndex.current().addDirectory(lively4url + "/test/", 5)    

      // FileIndex.current().addDirectory("https://lively4/thesis/notes", 5)
      // FileIndex.current().addDirectory("https://lively4/Notes", 5)
      // FileIndex.current().addDirectory("https://lively4/thesis/WriteFirst", 5)
    });
    button.innerHTML = "update file cache";
    return button;
  })(this.parentElement)
</script>


<script>
  (async (container) => {
    var button = document.createElement("button");
    button.addEventListener("click", async () => {
      await FileIndex.current().update()
      lively.show("finished analysis")
    });
    button.innerHTML = "analyse";
    return button;
  })(this.parentElement)
</script>


<script>
  var markdown = lively.query(this, "lively-markdown");
  (async (container) => {
    var button = document.createElement("button");

    button.addEventListener("click", () => {
      var table = markdown.get("#table").get("lively-table")
      if (table) {
        table.setFromJSO(table.asJSO().sortBy(ea => Number(ea.versions)).reverse())
      }      
    });
    button.innerHTML = "sortx";
    return button;
  })(this.parentElement)
</script>


<script>
  var container = lively.query(this, "lively-container");
  (async () => {
    var table = await lively.create("lively-table")
    var files = (await FileIndex.current().db.files.toArray());
    
    var button = document.createElement("button");

    button.addEventListener("click", () => {
      
      if (table) {
        table.setFromJSO(table.asJSO().sortBy(ea => Number(ea.versions)).reverse())
      }      
    });
    button.innerHTML = "sort";
    
    table.setFromJSO(
      files
        .filter(ea => ea.url.match(lively4url)) // only show local files...
        .map(ea => {
          return {
            file: ea.url.replace(lively4url, "") + '</a> ', 
            size: ea.size,
            versions: ea.versions && ea.versions.length,
            title: ea.title && ea.title.slice(0,100).replace(/</g,"&gt;"),
            tags: ea.tags && ea.tags.sort(), // Array.from(new Set(ea.tags))

          }
          // li.querySelector("a").onclick = (evt) => {
          //   container.followPath(ea.url)
          //   evt.preventDefault()
          // }
      }))
    var div = document.createElement("div")
    div.appendChild(button)
    div.appendChild(table)
    return div
  })()
</script>
