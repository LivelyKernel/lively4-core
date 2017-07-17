# User Stories #BrainDump

## Meta

Story Estimation in relative points: 1P, 2P, ... ?P (simple to unknown)
What to do with this list?

1. take the first, implement it and repeat.
2. Extract suitable seminar/master thesis topics
3. Bring it to github and sync establish bidirectional connection via issue tag #123

<lively-script>
import github from "src/client/github.js"
var div = document.createElement("div")
var button = document.createElement("button")
button.textContent = "update"
var container = this.parentElement.parentElement
var url = container.getURL(url)
button.onclick = async () => {
  await github.current().updateMarkdownFile(url)
  await container.followPath(""  + url)
  lively.notify("finished")
}
div.appendChild(button)
var button2 = document.createElement("button")
button2.textContent = "inspect"
button2.onclick = async () => {
  var source  = await lively.files.loadFile(url)
  var stories = github.current().parseMarkdownStories(source, true)
  var topLevelStories = stories.filter( ea => ea.isStory)
  var labels = _.uniq(topLevelStories.reduce((sum, ea) => 
      ea.labels ? sum.concat(ea.labels) : sum, []))
        .filter(ea => ea.match(/comp: /)).sort()
  lively.openInspector(stories)
}
div.appendChild(button2)
div
</lively-script>

## Lively Base System

- Load lively from external web pages #feature #open #41
- Caching too strict on imported modules #HelpWanted #feature #open #51
- Remove underscore.js #feature #open #73
- Replace jQuery with html5 features #feature #open #74
- see what lively was back in time back in time #feature #open #88
- Update focalStorage #easy #FollowUp #important #chore #open #91
- find a module system system for external dependencies...?P  #open #180
  - (unpkg npm, bower, and all the rest)
  - how to write it in JavaScript and module configuration per project needed? 
  - right granularity is difficult
  - deployment vs. development
  - minimized vs. debuggability
  - RW: lively-packages (Robert Krahn)
- Fast COP #LivelyScripting #open #187
- event system / bindings are missing (use lively bindings again) current: new CustomEvent(...)  #open #190

## Lively UI
- halo scale proportional  #open #201
- save as selection 1P #easy #closed #115
- save img/png not as html but as files (e.g. resolves data urls)  #closed #112
- fix position on grab and drop 2P #Issue #open #116
- lively.prompt dialog missing 3P  #closed #117
- paste directly into container 2P  #open #118
- rename halo item with inplace input field  #open #119
- create global file/content search widget #feature #open #44
- Properly reset overflow style attribute when maximizing multiple windows #bug #open #54
- Distinguish between error end info popups  #open #55
- [application-bar] make it optionally loadable  #open #83
- [connection] implement first draft #feature #closed #85
- UI editor for web components (prototype based editing)  #open #184

## Lively UX
- benchmark all startup times local storage? 1P  #open #120
- detailed benchmark loading times incl. service worker, compilation, component loading etc  #open #121
- benchmark lively UI .. dragging / menu open / how much content on a page etc...  #open #122
- benchmark: 10.000 Morphs, 60fps  #open #181
- Undo for content editing  #open #177
- Offline first  #open #178
  - be abler to load lively without internet
  - work for a while
  - synchronize with repository
  - idea: JavaScript github client | or just files... 
- Pen-based handwriting recognition  #open #182
- white boardf on surface hub (multiple user one device scenario) ?P  #open #183

## Lively Tools
- all tools should be opend first globally 0.5P #bug #LivelyClient #open #123
- Refactor juicy-ace-editor to code-mirror #refactor #open #124
  - make Hashtags navigateable (all text and source code)
  - autocompletion of import packages
  - preview / hide image tags and specially img tags with data url in markdown/html/javascript
  - allow inlide lively svg handwritten notes in markdown/html/javascript
- create style editor for text and other objects...  #open #125
- sort properties in inspector to private / html element / custom ... to find your data faster #Inspector #open #126
- Inspector missing/make ObjectEditor better #feature #open #38
- Change History of methods  #open #186
- Diffing and merging  (object/graph/heap vs. text/tree/document) #FutureWork #Lively #open #194

## Lively Content
- fast rich(er) text editing #feature #open #127
- change font size in halo and style editor  #open #128
- auto-shrinking of text? #feature #open #129
- refactor container  #open #130
  - extract navigation pane 3P
  - extract multple content type viewer (without editing) 3P
- push back edits markdown files (inplace) from rendered HTML back to Markdown source  #open #131
  - fix markdown issues e.g. lists under lists
- make halo grabbed/dropped content lively-content  #open #132
- connectors disappear when 90deg #TODO #closed #133
- write multiple "lively-scripts" in one document #BUG #open #134
- Reimplement object editor  #open #185
- Collaborative Lively Session (Synchronous) RW: Webstrates  #open #188
- Annotations for classes/methods (public/private)  #open #189
- persist connector stroke withd and color  #open #202

## Lively Chrome Extension
- upload latest version to google app store  #open #135
- update stable version  #open #136
- write document supporting extensions  #open #137
  - Disable Content-Security-Policy 1.0.6
  - Ignore X-Frame headers 1.1
- Update browser plugin(s) #plugin #important #chore #medium #plugin #open #200

## Lively Client 
- provide code <-> ast functionality (lively.code) 2P #Feature #LivelyClient #open #138
  - build Smalltalk-like Source Code Browser that edits methods #Features (showcase for code are not just  characters in a file) simple #ProjectionalEditor
- access github issues through workspace / API 5P #LivelyClient #closed #139
- make github stories a filesystem 16P #LivelyClient #open #140
  - format for file
  - delete/create file
  - what is filename?  What is id?
- allow links to github stories tags e.g. useable in this list #LivelyTools #LivelyClient #open #123
  - the repository should be defined in the context and not the link
  - explicit global links should be possible
- use story tags in commit messages #LivelyClient #open #141

## Lively Container
- Webcomponents do not update when internal components change #HtmlTemplates #NiceToHave #feature #open #101
- [lively-container] search bar in left bar #feature #open #42
- Update all module dependents when reloading a single module /Discussion/Question #RFC #discussion #open #71

## Lively Component Bin 
- Preview for Component Bin #HtmlTemplates #HelpWanted #NiceToHave #feature #medium #LivelyComponentBin #open #199
- [lively-container] same file name, different file extension #bug #LivelyComponentBin #open #56

## Student Projects
- build a gallery 10P  #open #142
- was there anything more?  #open #143
- new topics? 8P  #open #144

## Lively Service Worker
- make booting it fast  #open #145
- make booting it reliable (don't let the browser handle your requests)  #open #146
- user caching for getting and putting resources (see offline first)  #open #147
- make local storage file system #ServiceWorker #open #176

## Lively Services
- put lively services into sandbox (use heroku) and create usable example 10  #open #148
- quick lively termeinal (example usecase)  #open #149
- deploy lively4-server as lively-service  #open #150
- playback local media center #Hobby #Jens #Example #open #151

## Lively Server
- remove absolute urls / paths #refactor #open #152
- remove dependency on bash scripts? Or make it explicit (e.g. linux subsystem for windows is needed)  #open #153

## Lively Debugger
- revisit lively debugger 10P  #open #154
  - (main issue: starting time to long and fragile)
  - publish chrome extensiosn 2P
- Blink DevTools show old source content #medium #NiceToHave #bug #open #96

## Lively Sync
- Trasher-like splitting of commits  #open #155
- [lively-sync] replace merge button with dropdown button  #open #46

## Lively Scripting
- use "firebase" as cloud variables #feature #open #45
- Import and Handling User-defined Code  #open #64

## Lively PDF
- make pdf work again 3P  #open #156
- create link that opens lively-pdf when pasting pdf urls 1P  #open #157
- allow to persistently anntate pdfs (have a look at Hypothesis) ??P  #open #158
- write back anntations into file ??P  #open #159

## Lively Drag and Drop
- create links (and optionally open container) for arbitrary browser drag and drop API ?P  #open #160
- provide hooks ourselve that can be dragged and drop (onDragStart, onDrag, onDragEnd) ?P  #open #161

## Misc Issues
- to many green helper lines :  #open #162
- no backup of local lively content combined with auto-save can make an explosive mixture :  #open #163
- unwanted world scrolls (in panning code) :  #open #164
- data-urls in markdown are broken :  #open #165
  - side effect of "fixing" links
  - remove absolute positioning 

## Text Editor
- We need rich text editor  #open #166
- We neee spelling-corrector everywhere  #open #167
- Recognize too large files in editor #FollowUp #NiceToHave #feature #medium #open #197
- make code mirror default editor  #open #94
- add spell checking to editor  #open #95

## Lively Tag and Search
- Connect all content via  and search... #tags #open #168
- Make structured search  possible  #open #169
  - Methods, Classes, Modules
  - Headlines, Text, Nodes
  - Handwriting
- fast through caching content and meta-information (prototyped with  and [TODO pages](../todo.html) #Dexie #open #170

## Lively Graffle
- provide a graffle like whiteboard feeling text/shape/connectors #WIP #open #171

## Write a Paper
- what was/is our motivation?  #open #172
- document our design desciions  #open #173
- evaluate our design decisions  #open #174
- what is open? Where do we want to go?  #open #175
- write paper (section) about: heap vs document persistens #Lively #open #191

## Html Templates
- [templates] allow external repositories/applications to define their own templates in a different location #duplicate #medium #important #feature #open #82
- Support template loading from non-core repositories #medium #important #feature #open #89

## Lively Sync
- Commits have wrong author  #open #48
- Cannot use "/" in commit messages #bug #open #52
- Make git commit author name and e-mail configurable #feature #open #76
- [sync] autocommits use wrong author #bug #open #87

## Module System
- Support Circular Dependencies #hard #required #feature #open #93

## Examples
- Lively Software Viz Current: Only Module #Examples #open #192
- Energy Simulation #Examples #open #193

## Transpilation
- bind (::) operator #transpilation #easy #FollowUp #NiceToHave #feature #open #100
- do expressions #transpilation #easy #NiceToHave #feature #open #99
- fuction parsing is broken #bug #open #53
- target.new not working #bug #open #66
- Allow await on top level in Workspace #transpilation #hard #important #feature #open #97
- boundEval of "a string" returns undefined #transpilation #medium #NiceToHave #feature #open #98
- Source Code transformation on Syntax level ?P  #open #179

## Stories only in Github
<!--NoProject-->