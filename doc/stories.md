# User Stories #BrainDump

Story Estimation in relative points: 1P, 2P, ... ?P (simple to unknown)
What to do with this list?

1. take the first, implement it and repeat.
2. Extract suitable seminar/master thesis topics
3. Bring it to github and sync establish bidirectional connection via issue tag #123

<lively-script>
import github from "src/client/github.js"
var button = document.createElement("button")
button.textContent = "update"
var container = this.parentElement.parentElement
var url = container.getURL(url)
button.onclick = async () => {
  await github.current().updateMarkdownFile(url)
  container.followPath(""  + url)
}
button
</lively-script>

## Lively UI

- save as selection 1P #open #115
- save img/png not as html but as files (e.g. resolves data urls) #open #112
- fix position on grab and drop 2P #Issue #open #116
- lively.prompt dialog missing 3P #open #117
- paste directly into container 2P #open #118
- rename halo item with inplace input field #open #119

## Lively UX

- benchmark all startup times local storage? 1P #open #120
- detailed benchmark loading times incl. service worker, compilation, component loading etc #open #121
- benchmark lively UI .. dragging / menu open / how much content on a page etc... #open #122

## Lively Tools

- all tools should be opend first globally 0.5P #BUG #open #123
- Refactor juicy-ace-editor to code-mirror #Refactoring #open #124
  - make Hashtags navigateable (all text and source code)
  - autocompletion of import packages
  - preview / hide image tags and specially img tags with data url in markdown/html/javascript
  - allow inlide lively svg handwritten notes in markdown/html/javascript
- create style editor for text and other objects... #open #125
- sort properties in inspector to private / html element / custom ... to find your data faster #Inspector #open #126

## Lively Content

- fast rich(er) text editing #open #127
- change font size in halo and style editor #open #128
- auto-shrinking of text? #open #129
- refactor container #open #130
  - extract navigation pane 3P
  - extract multple content type viewer (without editing) 3P
- push back edits markdown files (inplace) from rendered HTML back to Markdown source #open #131
  - fix markdown issues e.g. lists under lists
- make halo grabbed/dropped content lively-content #open #132
- connectors disappear when 90deg #TODO #open #133
- write multiple "lively-scripts" in one document #BUG #open #134

## Lively Chrome Extension

- upload latest version to google app store #open #135
- update stable version #open #136
- write document supporting extensions #open #137
  - Disable Content-Security-Policy 1.0.6
  - Ignore X-Frame headers 1.1

## Lively Client 

- provide code <-> ast functionality (lively.code) 2P #Feature #open #138
  - build Smalltalk-like Source Code Browser that edits methods #Features (showcase for code are not just  characters in a file) simple #ProjectionalEditor
- access github issues through workspace / API 5P #open #139
- make github stories a filesystem 16P #open #140
  - format for file
  - delete/create file
  - what is filename?  What is id?
- allow links to github stories tags   e.g. useable in this list #open #123
  - the repository should be defined in the context and not the link
  - explicit global links should be possible
- use story tags in commit messages #open #141

## Lively Container


## Student Projects

- build a gallery 10P #open #142
- was there anything more? #open #143
- new topics? 8P #open #144

## Lively Service Worker

- make booting it fast #open #145
- make booting it reliable (don't let the browser handle your requests) #open #146
- user caching for getting and putting resources (see offline first) #open #147

## Lively Services

- put lively services into sandbox (use heroku) and create usable example 10 #open #148
- quick lively termeinal (example usecase) #open #149
- deploy lively4-server as lively-service #open #150
- playback local media center #Jens #Example #Hobby #open #151

## Lively4-server

- remove absolute urls / paths #Refactoring #open #152
- remove dependency on bash scripts? Or make it explicit (e.g. linux subsystem for windows is needed) #open #153

## Lively Debugger
- revisit lively debugger 10P #open #154
  - (main issue: starting time to long and fragile)
  - publish chrome extensiosn 2P

## Lively Sync

- Trasher-like splitting of commits #open #155
- [lively-sync] replace merge button with dropdown button #open #46

## Lively PDF

- make pdf work again 3P #open #156
- create link that opens lively-pdf when pasting pdf urls 1P #open #157
- allow to persistently anntate pdfs (have a look at Hypothesis) ??P #open #158
- write back anntations into file ??P #open #159


## Lively Drag and Drop
- create links (and optionally open container) for arbitrary browser drag and drop API ?P #open #160
- provide hooks ourselve that can be dragged and drop (onDragStart, onDrag, onDragEnd) ?P #open #161

## Misc Issues:
- to many green helper lines #open #162
- no backup of local lively content combined with auto-save can make an explosive mixture #TODO #open #163
- unwanted world scrolls (in panning code) #open #164
- data-urls in markdown are broken #open #165
  - side effect of "fixing" links
  - remove absolute positioning 

## Text Editor

- We need rich text editor #open #166
- We neee spelling-corrector everywhere #open #167

## Lively Tag and Search 

- Connect all content via #tags and search... #open #168
- Make structured search  possible #open #169
  - Methods, Classes, Modules
  - Headlines, Text, Nodes
  - Handwriting
- fast through caching content and meta-information (prototyped with #Dexie and [TODO pages](../todo.html) #open #170

## Lively Graffle

- provide a graffle like whiteboard feeling text/shape/connectors #WIP #open #171


## Write a #Lively4Paper

- what was/is our motivation? #open #172
- document our design desciions #open #173
- evaluate our design decisions #open #174
- what is open? Where do we want to go? #open #175

## Old Stories

- make local storage file system #ServiceWorker #open #176
- Undo for content editing #open #177
- Offline first #open #178
  - be abler to load lively without internet
  - work for a while
  - synchronize with repository
  - idea: JavaScript github client | or just files... 
- Source Code transformation on Syntax level ?P #open #179
- find a module system system for external dependencies...?P #open #180
  - (unpkg npm, bower, and all the rest)
  - how to write it in JavaScript and module configuration per project needed? 
  - right granularity is difficult
  - deployment vs. development
  - minimized vs. debuggability
  - RW: lively-packages (Robert Krahn)
- benchmark: 10.000 Morphs, 60fps #open #181
- Pen-based handwriting recognition #open #182
- white boardf on surface hub (multiple user one device scenario) ?P #open #183
- UI editor for web components (prototype based editing) #open #184
- Reimplement object editor #open #185
- Change History of methods #open #186
- Fast COP #open #187
- Collaborative Lively Session (Synchronous) RW: Webstrates #open #188
- Annotations for classes/methods (public/private) #open #189
- event system / bindings are missing (use lively bindings again) current: new CustomEvent(...) #open #190
- write paper (section) about: heap vs document persistens #Lively4Paper #open #191
- Lively Software Viz Current: Only Module #open #192
- Energy Simulation #open #193
- Diffing and merging  (object/graph/heap vs. text/tree/document) #Lively4Paper #FutureWork #open #194


# Stories in Github

- Webcomponents do not update when internal components change #open #101
- bind (::) operator #open #100
- do expressions #open #99
- boundEval of "a string" returns undefined #open #98
- Allow await on top level in Workspace #open #97
- Blink DevTools show old source content #open #96
- add spell checking to editor #open #95
- make code mirror default editor #open #94
- Support Circular Dependencies #open #93
- Update focalStorage #open #91
- Support template loading from non-core repositories #open #89
- see what lively was back in time back in time  #open #88
- [sync] autocommits use wrong author #open #87
- [connection] implement first draft #open #85
- [application-bar] make it optionally loadable #open #83
- [templates] allow external repositories/applications to define their own templates in a different location #open #82
- Make git commit author name and e-mail configurable #open #76
- Replace jQuery with html5 features #open #74
- Remove underscore.js #open #73
- Update all module dependents when reloading a single module #open #71
- target.new not working #open #66
- Import and Handling User-defined Code #open #64
- [lively-container] same file name, different file extension #open #56
- Distinguish between error end info popups #open #55
- Properly reset overflow style attribute when maximizing multiple windows #open #54
- fuction parsing is broken #open #53
- Cannot use "/" in commit messages #open #52
- Caching too strict on imported modules #open #51
- Commits have wrong author #open #48
- use "firebase" as cloud variables #open #45
- create global file/content search widget #open #44
- [lively-container] search bar in left bar  #open #42
- Load lively from external web pages #open #41
- Inspector missing/make ObjectEditor better #open #38