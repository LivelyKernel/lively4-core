import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js";

MicrosoftAcademicEntities.generateSchema('paper')
// paper [Id] was referenced by papers...
lively.openBrowser("academic://expr:RId=2144114063")



async function foo() {
  var jsonEntries = await lively.files.loadJSON(`academic://$academic://expr:RId=2144114063`)
  var paper;
  for(var json of jsonEntries) { paper = await new Paper(json) }
  return paper
}




var jsonEntries = lively.files.loadJSON(`academic://$academic://expr:RId=2144114063`)
var json
jsonEntries.then(j => { json = j[0] })
var paper = new Paper(json)

var references = undefined
paper.resolveReferences().then(r => { references = r })
// kurz warten
var refPapers = references.map(r => {
  return {
    title: r.value.Ti,
    id: r.value.Id,
    citations: r.value.CC,
  }
})

refPapers

// interessante Paper finden
// refPapers für jedes interessante Paper finden
// refPapers für diese refPapers finden
// auf CC schauen und Vorkommen der Paper zählen
