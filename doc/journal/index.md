# Lively4 Development Journal

<lively-import src="../_navigation.html"></lively-import>

<script>
  import Journal from "src/client/journal.js"

  let container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  let path = "" + container.getPath();
  let dir = path.replace(/[^/]*$/,"");

  let button = <button click={() => {
    Journal.createEntry(dir, container)    
        }}>new </button>
  button
</script>

## Interesting
- [2019-06-07.md drawio (source code editor)](2019-06-07.md/index.md)

## Entries
<script>
  import Journal from "src/client/journal.js"
  
  let container = lively.query(this, "lively-container");
  if (!container) return "no container found"
  let path = "" + container.getPath();
  let dir = path.replace(/[^/]*$/,"");

  Journal.listEntries(dir, container)
</script>




