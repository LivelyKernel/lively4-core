# Literature

Lively4 contains a set of components dealing with literature studies and bibliographies.



```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: neutral
---
classDiagram
  class LiteratureGraph {
    initialize()
    onWheel()
    connectedCallback()
    customProperties() [set]
    customProperties() [get]
    nodeFor()
    addGraphNode()
    addGraphEdge()
    analyzeGraph()
    getDotNodes()
    getDotEdges()
    getPaperDotNodes()
    getPaperDotEdges()
    getKeywordDotNodes()
    getKeywordDotEdges()
    getEngine()
    getTooltip()
    getEdgeTooltip()
    dotSource()
    ensureNode()
    onClick()
    getEdgeTooltipByTitle()
    parseEdgeTitle()
    showEdgeTooltip()
    hideEdgeTooltip()
    updateTooltipPosition()
    updateView()
    onContextMenu()
    livelyMigrate()
    livelyPrepareSave()
  }
  Morph <|-- LiteratureGraph

  class LiteratureKeywordsGraph {
    initialize()
    getLabel()
    getTooltip()
    getEdgeTooltip()
    nodeFor()
    ensureNode()
    onClick()
    getEngine()
    dotSource()
  }
  LiteratureGraph <|-- LiteratureKeywordsGraph

  class LiteratureListing {
    initialize()
    connectedCallback()
    container() [get]
    container() [set]
    base() [get]
    base() [set]
    bibliographyBase() [get]
    bibliographyBase() [set]
    updateFileIndex()
    updateFiles()
    updateEntries()
    getFilesGroup()
    updateNavbar()
    sortAndFilterByAuthors()
    sortAndFilterByKeywords()
    createFilter()
    applyFilter()
    setCurrentLiteratureFiles()
    log()
    updateView()
    updateFilterAndSelection()
    createNavbarItem()
    renameFile()
    openFrame()
    cleanQueryString()
    googleScholar()
    updateLiteratureFileAfterRename()
    updateLiteratureFile()
    renderLiteratureFile()
    renderCollection()
    onLiteratureFileClick()
    livelyMigrate()
    livelyInspect()
    livelyExample()
  }
  Morph <|-- LiteratureListing

  class LiteraturePaper {
    initialize()
    id() [get]
    id() [set]
    type() [get]
    type() [set]
    authorId() [get]
    authorId() [set]
    scholarId() [get]
    scholarId() [set]
    scholarPaper() [get]
    scholarPaper() [set]
    alexId() [get]
    alexId() [set]
    alexAuthorId() [get]
    mode() [get]
    mode() [set]
    searchQuery() [get]
    authorSearchQuery() [get]
    searchQuery() [set]
    fields()
    ensureData()
    ensurePaper()
    updateView()
    renderPaper()
    fixLinks()
    searchURLOffsetURL()
    getPDFs()
    renderLong()
    loadReferences()
    loadRerferencedBy()
    loadRelated()
    renderAuthor()
    renderSearch()
    renderAuthorSearch()
    renderNoPaper()
    renderShort()
    renderCitationKey()
    renderAuthorsLinks()
    renderPaperList()
    renderYear()
    renderTitle()
    renderDOI()
    renderPDFs()
    renderPublication()
    renderJournalSnippet()
    renderConferenceSnippet()
    renderCitationCount()
    papersToShortEntriesList()
    openIFrame()
    livelyExample()
  }
  Morph <|-- LiteraturePaper

  class LiteratureQuery {
    initialize()
    queryString() [get]
    queryString() [set]
    baseURL() [get]
    baseURL() [set]
    details() [get]
    updateView()
    close()
    findBibtex()
    findBibtexSearch()
    findPapersQuery()
    livelyExample()
  }
  Morph <|-- LiteratureQuery

  class LiteratureSearch {
    initialize()
    mode() [get]
    mode() [set]
    queryString() [get]
    queryString() [set]
    literatureListing() [get]
    literatureListing() [set]
    renameURL() [get]
    renameURL() [set]
    baseURL() [get]
    baseURL() [set]
    details() [get]
    updateView()
    close()
    findBibtex()
    findBibtexSearch()
    findBibtexEntriesAlex()
    findBibtexEntriesLocal()
    findBibtexEntriesFuzzy()
    bibtexComponentForEntry()
    livelyMigrate()
    livelyExample()
  }
  Morph <|-- LiteratureSearch

  class LiteratureWorksGraph {
    initialize()
    getLabel()
    getTooltip()
    getEdgeTooltip()
    onClick()
    dotSource()
    livelyExample()
  }
  LiteratureGraph <|-- LiteratureWorksGraph
```

![](literature.drawio)


## Issues

- Since we index all markdown files, all converted papers are in full text cached in our IndexDB too. This this clunks our normal search, we have take them out there. But since we have them lying around in our index any way, we could also make use of them. E.g. by providing a local literature search that explicitly search in "_marker/" and then not only links them to the markdown file, but also the original pdf, and the also showing the right bib entry. 
- The literature-listings currently load a fresh directory listing every time, to see if files changed or get deleted, this takes a reasonably long time, because it is recursively and also includes the markdown and jpeg files etc that are not needed for building up the index. We could therefore:
  - [ ] only request pdfs, this would require a new feature in the server, e.g. find with a filter
  - [ ] always show the cached version first, but then proceed in update what is need. Most of the time there will not be many updates. 
