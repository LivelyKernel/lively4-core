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


# Some nice git snippets

        git remote add onsetsu git://github.com/onsetsu/lively4-coren
        git fetch onsetsu 
        git merge onsetsu/master 
        git diff
        git stash
        git merge onsetsu/master 
        git stash apply
        git diff
        git lg
        git log
        git log --graph

# Webwerkstatt like auto commit

        git pull --no-edit; git commit -m "draft ace editor" .; git push
