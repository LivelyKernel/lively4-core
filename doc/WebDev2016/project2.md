# Project 2 -- RDF: Semantic Web Scripting
Daniel Stolpe, Yannis Kommana

![Screenshot](https://drive.google.com/uc?export=download&id=0B4ixDwTSrrqUNThwSy1qTEJuc0U)

## Abstract:
Library for providing an RDFa-Viewer to easily display and store RDFa data on a website and an RDFa-API to load data and query that data.
Sample application for defining ratings for movies from IMDB and rottentomatoes and merging duplicates with data from wikidata.

### Links
* Repo-Link: https://github.com/LivelyKernel/lively4-core/tree/rdfa
* Sample page: https://lively-kernel.org/lively4/lively4-rdfa/start.html?load=https://lively-kernel.org/lively4/lively4-rdfa/draft/TestRDFa.html
* Screencast: https://drive.google.com/open?id=0B8pjqiBNg5DUSTJQSG5lMEtCdVk
* Screenshot: https://drive.google.com/file/d/0B4ixDwTSrrqUNThwSy1qTEJuc0U/view
* Final presentation: https://drive.google.com/open?id=169-RWWad1Ey_K9OPi8PR0HrrCV9hlqUK0Gq24pd2DqM


## Background: 
- Websites provide semantic information about displayed content

## Idea: 
- Reify semantic information and make them progammable

## Example: 
- ~~Personal interactive ScrapMap for vacation using tripadvisor, wikipedia, eventim~~

You can access an example page with some RDFa data about the HPI [here](https://lively-kernel.org/lively4/lively4-rdfa/start.html?load=https://lively-kernel.org/lively4/lively4-rdfa/draft/TestRDFa.html)
Press Cmd+Right click to open the context menu and select 'RDFa wiewer'.

## Goal: 
- Extract RDFa Data, ~~Microformats~~
– Embed UI for Publish/Share

## Related Work: 
- https://developers.google.com/structured-data/testing-tool/
- https://github.com/alexmilowski/green-turtle
- https://github.com/IKS/VIE
- http://createjs.org/

## Implementation
The relevant files are
* src
 * rdfa
    * RdfaTriple.js
    * **rdfa-api.js**
    * rdfa-graph-factory.js
* templates
 * lively-rdfa-movie-db.html
 * lively-rdfa-viewer.html
 * classes
    * RdfaMovieDb.js
    * RdfaViewer.js

[GreenTurtle](https://github.com/alexmilowski/green-turtle) is used to parse the document and to obtain the GreenTurtleGraph.

Data is persisted using [Firebase](https://firebase.google.com/).

#Knowledgebase

## RDFa (Resource Description Framework in Attributes)
- https://de.wikipedia.org/wiki/RDFa
- https://www.w3.org/TR/xhtml-rdfa-primer/#the-basics-of-rdfa-rdfa-lite
- "RDFa is a way of expressing RDF-style relationships using simple attributes in existing markup languages such as HTML"(https://www.w3.org/TR/xhtml-rdfa-primer/#bib-rdfa-core)

## RDF
-  "the W3C's standard for interoperable machine-readable data"
- https://www.w3.org/TR/rdf11-primer/
- "RDF graph" = "Triple Store" = "Graph Store".
- "An RDF graph is made up of triples consisting of a subject, predicate and object."

## RDFa API
- https://www.w3.org/TR/rdfa-api/
- get the full structure: `document.data.rdfa.query()[0]`
- print the structure: `document.data.getProperties().forEach(p => console.log(p + " => " + document.data.getValues(document.data.getSubjects()[0], p))`

## RDFa parser
- https://github.com/alexmilowski/green-turtle
- (https://github.com/IKS/VIE)
- https://code.google.com/archive/p/rdfquery/

## RDFa-enriched test pages
- https://www.w3.org/2006/07/SWD/RDFa/impl/js/rdfa-calendar.html

## Turtle Language
- A Turtle document allows writing down an RDF graph in a compact textual form. 
- https://www.w3.org/TR/turtle/

## Ontologie
- https://de.wikipedia.org/wiki/Ontologie_(Informatik)