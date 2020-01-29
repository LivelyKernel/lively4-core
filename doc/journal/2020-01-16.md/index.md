## 2020-01-16
*Author: @JensLincke*


## update FileIndex for some files...

```javascript
import FileIndex from "src/client/fileindex.js"


var result = []

FileIndex.current().db.files.each(ea => {
  if(ea.name.match("\.bib$")) result.push(ea) 
})

result.forEach(ea => {
  FileIndex.current().addFile(ea.url, ea.name, ea.type, parseInt(ea.size), ea.modified)
})
```