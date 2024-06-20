# Files

<lively-import src="_navigation.html"></lively-import>

<style>
  lively-script {
    display: inline-block
  }
</style>

<script>
  import FileIndex from "src/client/fileindex.js"
  let button = <button click={async () => {
    await FileIndex.current().addDirectory(lively4url + "/src/client/", 5)
    await FileIndex.current().addDirectory(lively4url + "/templates/", 5)
    await FileIndex.current().addDirectory(lively4url + "/src/components/", 5)
    await FileIndex.current().addDirectory(lively4url + "/src/parts/", 5)
    await FileIndex.current().addDirectory(lively4url + "/doc/", 5)    
    await FileIndex.current().addDirectory(lively4url + "/demos/", 5)    
    await FileIndex.current().addDirectory(lively4url + "/test/", 5) }}>update file cache</button>; 
  button
</script>


<script>
  let button2 = <button>analyse</button>;
  button2.addEventListener("click", async () => {
    await FileIndex.current().update()
    lively.show("finished analysis")
  });
  button2
</script>


<script>
  let markdown = lively.query(this, "lively-markdown");
  let button3 = document.createElement("button");

    button3.addEventListener("click", () => {
      var table = markdown.get("#table").get("lively-table")
      if (table) {
        table.setFromJSO(table.asJSO().sortBy(ea => Number(ea.versions)).reverse())
      }      
    });
    button3.innerHTML = "sortx";
  button3
</script>


<script>
  var container = lively.query(this, "lively-container");
  
  var table = await lively.create("lively-table")
  var files = (await FileIndex.current().db.files.toArray());

  var button4 = document.createElement("button");

  button4.addEventListener("click", () => {

    if (table) {
      table.setFromJSO(table.asJSO().sortBy(ea => Number(ea.versions)).reverse())
    }      
  });
  button4.innerHTML = "sort";


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
  div.appendChild(button4)
  div.appendChild(table)
  div
</script>
