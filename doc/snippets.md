# Snippets

How can we store/reuse such tiny snippets of code or regular expressions?

## Mediawiki links to markdown
```
REPLACE: \[(http.*?) (.*)\]
WITH: [$2]($1)
```


## PDF.js

See also [the example on github](https://mozilla.github.io/pdf.js/examples/)

```
import "src/external/pdf.js"

PDFJS.workerSrc = lively4url + "/src/external/pdf.worker.js"
let url = "https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf",
  doc = PDFJS.getDocument(url),
	pdf = await doc,
	page = await pdf.getPage(1),
	text = await page.getTextContent();
	
text.items.map(ea => ea.str).join(" ")
```