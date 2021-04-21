# Bibliography 

<script>
import {hideHiddenElements, toggleLayer, showVariable, runExampleButton} from "src/client/essay.js";
</script>

<script>runExampleButton("run", this, ["Example1", "Example2"]);</script>

### Accessing Papers from Microsoft Academics in local IndexDB



```javascript  {.Example1}
import Literature from "src/client/literature.js";
Literature.db.papers.where("key").equals("Sorensen2017SLL").toArray()
```


### Loading Bibtex Entries from a File

```javascript  {.Example2}
(async () => {
  let bibURL = "http://localhost:9005/Dropbox/Thesis/Literature/_test.bib"
  var view = await (<lively-bibtex></lively-bibtex>)
  view.src = bibURL
  return <div style="position:relative; top:0px">{view}</div>
})()
```
