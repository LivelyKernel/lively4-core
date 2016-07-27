"use strict";
import {expect} from '../node_modules/chai/chai.js';
import rdfaApi from '../src/client/rdfa/rdfa-api.js';
import graphFactory from '../src/client/rdfa/rdfa-graph-factory.js';
import * as fixtures from './rdfa-api-fixtures.js';


let it = window.it;

describe('RDFa api', () => {

  it('should return a blank node string matching the blank node pattern',  () => {
    expect(rdfaApi.newBlankNodeId()).to.match(graphFactory.blankNodePattern());
  });

});

describe('RDFa querying api', () => {

  it('should have one projection with ogp type movie',  () => {
    let data = fixtures.rdfaDocumentDataSimple();
    let query = {
      "http://ogp.me/ns#type" : "video.movie"
    };
    let template = {
      "title" : "http://ogp.me/ns#title"
    };
    let projections = rdfaApi.queryResolved(data, query, template);
    expect(projections).to.have.length(1);
    let projection = projections[0];
    expect(projection.title).to.equal("Spectre");
  });

  it('should have one projection with rottentomatoes url',  () => {
    let data = fixtures.rdfaDocumentDataComplex();
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

  it('should resolve a hierarchical template',  () => {
    let data = fixtures.rdfaDocumentDataComplex();
    let query = {
      "http://ogp.me/ns#type" : "video.movie",
      "http://ogp.me/ns#title" : "Spectre"
    };
    let template = {
      "url" : "http://ogp.me/ns#url",
      "name" : "http://ogp.me/ns#title",
      "review" : [ "http://schema.org/Review", {
          "author" : [ "http://schema.org/Author", {
              "name" : "http://schema.org/name" } ],
          "reviewRating" : [ "http://schema.org/reviewRating", {
              "ratingValue" : "http://schema.org/ratingValue" } ]
        }
      ]
    };

    let projections = rdfaApi.queryResolved(data, query, template);
    expect(projections).to.have.length(1);
    let projection = projections[0];
    expect(projection.url).to.equal("https://www.rottentomatoes.com/m/spectre_2015/");
    expect(projection.name).to.equal("Spectre");
    expect(projection.review.author.name).to.equal("TestAuthor");
    expect(projection.review.reviewRating.ratingValue).to.equal('1');
  });
});
