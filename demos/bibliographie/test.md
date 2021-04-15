<script>
import BibtexParser from "src/external/bibtexParse.js"


var bibURL1 = `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/hirschfeld.bib`
var bibURL2 = `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib`
//.bib in eine JSON Parsen

var source;

async Parser (){
  constructor(URL){this.URL = URL}
  source = await fetch(URL).then( resp => resp.text())
  bib = BibtexParser.toJSON(source, false)
  return bib
}

var bib1 = Parser(bibURL1);
var bib2 = Parser(bibURL2);



/*
Abgleich _ vergleiche bib mit dem Output -> zeige Einträge die einzigartig sind

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


  for(var eaA of a) {
    var found = b.find(eaB => comp(eaB) == comp(eaA))
    if (found) {
      inAandB.push(eaA)
    } else {
      onlyInA.push(eaA)
    }
  }


  for(var eaB of b) {
    var found = a.find(eaA => comp(eaA) == comp(eaB))
    if (!found) {
      onlyInB.push(eaB)
    }
  }
  return {
    inAandB, onlyInA, onlyInB
  }  
}
compareLists(bib1,bib2,ea => ea.title)

function mergeLists(a,b){
  compareLists(bib1,bib2,ea => ea.title)
}
</script>