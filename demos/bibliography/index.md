# Bibliography 

<script>
import {hideHiddenElements, toggleLayer, showVariable, runExampleButton} from "src/client/essay.js";
</script>

<script>runExampleButton("run", this, ["Imports", "Example"]);</script>

### *Imports*

```javascript  {.Imports}
import FileIndex from "src/client/fileindex.js";
import Literature from "src/client/literature.js";

```

### Query Bibliography Entries from IndexDB

```javascript  {.Example .async}
var entries = await FileIndex.current().db.bibliography
  .filter(ea => ea.key).toArray();
var byKey = _.groupBy(entries, ea => ea.key)

return "unique entries found: " + Object.keys(byKey).length  
```

### Query File Entries with Bibkey from IndexDB

```javascript  {.Example .async}
var entries = await FileIndex.current().db.files
  .filter(ea => ea.bibkey).toArray();
return "Files with bibkey: " + entries.length  
```


### Accessing Papers from Microsoft Academics in local IndexDB

<script>runExampleButton("run", this, ["Imports", "Example2"]);</script>
```javascript  {.Example2 .async}
var papers;
papers = await Literature.db.papers.toArray()
return "papers in indexDB: " + papers.length    
```


### Loading Bibtex Entries from a File

```javascript  {.Example .async}
let bibURL = "http://localhost:9005/Dropbox/Thesis/Literature/_test.bib"
var view = await (<lively-bibtex></lively-bibtex>)
view.src = bibURL
return <div style="position:relative; top:0px">{view}</div>
```



