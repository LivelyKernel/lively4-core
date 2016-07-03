import * as wdk from '../external/wikidata-sdk.js';

export function rotten2imdb(rottenId) {
  var sparql = `
  PREFIX wdt: <http://www.wikidata.org/prop/direct/>

  SELECT ?imdb_id
  WHERE
  {
      ?obj wdt:P345 ?imdb_id.
      ?obj wdt:P1258 "${rottenId}".
  }
  `;
  
  return wikiDataQuery(sparql);
}

export function imdb2rotten(imdbId) {
  var sparql = `
  PREFIX wdt: <http://www.wikidata.org/prop/direct/>

  SELECT ?rotten_id
  WHERE
  {
      ?obj wdt:P345 "${imdbId}".
      ?obj wdt:P1258 ?rotten_id.
  }
  `;
  return wikiDataQuery(sparql);
}

function wikiDataQuery(sparql) {
  var url = wdk.sparqlQuery(sparql);
  return new Promise((resolve, reject) => {
    $.get(url)
      .then(wdk.simplifySparqlResults)
      .then(resolve)
      .fail(reject);
  });
}



// sample code
/*

import * as wda from 'src/client/wiki-data-adapter.js';

wda.rotten2imdb("m/spectre_2015");
wda.imdb2rotten("tt2379713");

*/
