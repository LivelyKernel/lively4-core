import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js";

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

var ids = [2161052636, 2040278798, 1499121368, 2159678344, 2171955640, 2189036493, 2139374478, 2122401044]

//var papier = "2144114063"
var allPapers = ids.map(id => ""+id)
var currentPapers = allPapers

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

currentPapers = [...new Set(array)]
currentPapers.length

var counts = {}
allPapers.forEach(function(x) { counts[x] = (counts[x] || 0)+1; })

Object.entries(counts).filter(count => count[1] >= 30).sort((left, right) => right[1] - left[1])

// interessante Paper finden
// refPapers für jedes interessante Paper finden
// refPapers für diese refPapers finden
// auf CC schauen und Vorkommen der Paper zählen
