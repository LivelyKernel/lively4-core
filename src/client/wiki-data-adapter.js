import * as wdk from '../external/wikidata-sdk.js';

export default function rotten2imdb(rottenId="m/spectre_2015") {
  var sparql = `
  PREFIX wdt: <http://www.wikidata.org/prop/direct/>

  SELECT ?obj ?imdb_id
  WHERE
  {
      ?obj wdt:P345 ?imdb_id.
      ?obj wdt:P1258 ${rottenId}.
  }
  `;
  var url = wdk.sparqlQuery(sparql);
  $.get(url)
  .then(wdk.simplifySparqlResults)
  .then((simplifiedResults) => {
    console.log(simplifiedResults);
  });
}
