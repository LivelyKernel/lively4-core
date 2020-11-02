import BibtexParser from "src/external/bibtexParse.js"


var bibURL1 = `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/hirschfeld.bib`
var bibURL2 = `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib`
//.bib in eine JSON Parsen

var source1;
var source2;
var bib1;
var bib2;
(async () => {
  source1 = await fetch(bibURL1).then( resp => resp.text())
  bib1 = BibtexParser.toJSON(source1, false)
  source2 = await fetch(bibURL2).then( resp => resp.text())
  bib2 = BibtexParser.toJSON(source2, false)
})()
/*
var Bib1byCitKey = {}
for (var ea1 of bib1){
  Bib1byCitKey[ea1.citationKey] = ea1
}

var Bib2byCitKey = {}
for (var ea2 of bib2){
  Bib2byCitKey[ea2.citationKey] = ea2
}
*/

function compareLists(a, b, comp= ea => ea) {
  var inAandB = []
  var onlyInA = []
  var onlyInB = []

var found
  for(var eaA of a) {
    found = b.find(eaB => comp(eaB) == comp(eaA))
    if (found) {
      inAandB.push(eaA)
    } else {
      onlyInA.push(eaA)
    }
  }


  for(var eaB of b) {
    found = a.find(eaA => comp(eaA) == comp(eaB))
    if (!found) {
      onlyInB.push(eaB)
    }
  }
  return {
    inAandB, onlyInA, onlyInB
  }  
}

compareLists(bib1,bib2,ea => ea.citationkey)
function mergeLists(a,b){
  var merged = [a]
  merged.push(compareLists(a,b,ea => ea.citationkey).onlyInB)
  return merged
}

