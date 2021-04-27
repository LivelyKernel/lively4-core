import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js";

MicrosoftAcademicEntities.generateSchema('paper')
// paper [Id] was referenced by papers...
lively.openBrowser("academic://expr:RId=2144114063")



async function findCitations(papers) {
  var references = await papers.map( async p => {
    var jsonEntries = await lively.files.loadJSON(`academic://expr:Id=` + p)
    var json = jsonEntries[0] // HIER?
    var paper = new Paper(json)
    var refPapers = await paper.resolveReferences()
    return refPapers.map(ref => ref.value.Id)
  })
  return references
}

var papier = "2144114063"
var allPapers = [papier]
var currentPapers = [papier]

async function nextPapers() {
  array = []
  var currentReferences = await findCitations(currentPapers)
  currentReferences.forEach(promise => promise.then(a => array = array.concat(a)))
}
var array = []

nextPapers()

array.length

allPapers = allPapers.concat(array)
allPapers.length

currentPapers = array
currentPapers.length

allPapers[1] 
currentPapers[2]

lively.files.loadJSON(`academic://$academic://expr:RId=2165258820`)
2054436867
2165258820
2149609916

2149609916 
2165258820

var counts = {}
allPapers.forEach(function(x) { counts[x] = (counts[x] || 0)+1; })
Object.entries(counts).filter(count => count[1] > 5).sort((left, right) => right[1] - left[1])

// interessante Paper finden
// refPapers für jedes interessante Paper finden
// refPapers für diese refPapers finden
// auf CC schauen und Vorkommen der Paper zählen
