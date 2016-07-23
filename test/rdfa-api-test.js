"use strict";
import {expect} from '../node_modules/chai/chai.js';
import * as rdfa from '../src/external/RDFa.js';
import rdfaApi from '../src/client/rdfa/rdfa-api.js';
import graphFactory from '../src/client/rdfa/rdfa-graph-factory.js';
import {newRdfaMovieGraph} from './rdfa-api-fixtures.js';


let it = window.it;

describe('RDFa api', () => {

  it('should return a blank node string matching the blank node pattern',  () => {
    expect(rdfaApi.newBlankNodeId()).to.match(graphFactory.blankNodePattern());
  });

});

describe('RDFa querying api', () => {
  let data;

  before(() => {
    let graph = newRdfaMovieGraph();
    data = GreenTurtle.implementation.createDocumentData("http://example.org");
    data.merge(graph.subjects, {
      prefixes: graph.prefixes,
      mergeBlankNodes: true
    });
  });

  it('should return have one projection with rottentomatoes url',  () => {
    let query = {
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : "http://schema.org/Movie"
    };
    let template = {
      "url" : "http://schema.org/url"
    };
    let projections = rdfaApi.queryResolved(data, query, template);
    expect(projections).to.have.length(1);
    let projection = projections[0];
    expect(projection.url).to.equal("www.rottentomatoes.com/m/spectre_2015");
  });
});
/*
{
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : "http://schema.org/Movie"
      }, {
        "url" : "http://schema.org/url",
        "name" : "http://schema.org/name",
        "review" : [ "http://schema.org/Review", {
            "author" : [ "http://schema.org/Author", {
                "name" : "http://schema.org/name" } ],
            "reviewRating" : [ "http://schema.org/reviewRating", {
                "ratingValue" : "http://schema.org/ratingValue" } ]
          }
        ]
      }*/
