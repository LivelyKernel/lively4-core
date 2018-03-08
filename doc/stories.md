# User Stories

<lively-import src="_navigation.html"></lively-import>

[Issues on Github](https://github.com/LivelyKernel/lively4-core/issues/)

<!-- .*#[c]losed.* -->

## Meta

Story Estimation in relative points: 1P, 2P, ... ?P (simple to unknown)
What to do with this list?

1. take the first, implement it and repeat.
2. Extract suitable seminar/master thesis topics
3. Bring it to github and sync establish bidirectional connection via issue tag #123

<script>
import github from "src/client/github.js"
import { uniq } from "utils"
var div = document.createElement("div")
var button = document.createElement("button")
button.textContent = "update"
var container = lively.query(this, "lively-container")
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
  var labels = (topLevelStories.reduce((sum, ea) => 
      ea.labels ? sum.concat(ea.labels) : sum, []))
        ::uniq()
        .filter(ea => ea.match(/comp: /)).sort()
  lively.openInspector(stories)
}
div.appendChild(button2)
div
</script>

[uncategorized github issues](https://github.com/LivelyKernel/lively4-core/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aopen%20-label%3A%22type%3A%20feature%22%20-label%3A%22type%3A%20refactor%22%20-label%3A%22type%3A%20performance%22%20-label%3A%22type%3A%20documentation%22%20%20-label%3A%22comp%3A%20write%20a%20paper%22%20-label%3A%22type%3A%20bug%22%20-label%3A%22type%3A%20refactor%22%20-label%3A%22type%3A%20chore%22%20)
[estimate stories](https://github.com/LivelyKernel/lively4-core/issues?utf8=%E2%9C%93&q=is%3Aopen%20-label%3A%22effort1%3A%20easy%20%28hour%29%22%20%20-label%3A%22effort2%3A%20medium%20%28day%29%22%20-label%3A%22effort3%3A%20hard%20%28week%29%22%20)

## Lively Base System

- Load lively from external web pages #feature #BaseSystem #open #41
- Caching too strict on imported modules #HelpWanted #feature #BaseSystem #open #51
- Remove underscore.js #feature #BaseSystem #open #73
- Replace jQuery with html5 features #feature #BaseSystem #open #74
- see what lively was back in time back in time #feature #BaseSystem #open #88
- Update focalStorage #easy #FollowUp #important #chore #BaseSystem #open #91
- find a module system system for external dependencies...?P #feature #BaseSystem #open #180
  - (unpkg npm, bower, and all the rest)
  - how to write it in JavaScript and module configuration per project needed? 
  - right granularity is difficult
  - deployment vs. development
  - minimized vs. debuggability
  - RW: lively-packages (Robert Krahn)
- Fast COP #LivelyScripting #performance #BaseSystem #open #187
- event system / bindings are missing (use lively bindings again) current: new CustomEvent(...) #feature #BaseSystem #open #190

## Lively UI
- halo scale proportional #feature #easy #ui #open #201
- fix position on grab and drop 2P #Issue #feature #ui #closed #116
- rename halo item with inplace input field #feature #ui #closed #119
- create global file/content search widget #feature #ui #open #44
- Properly reset overflow style attribute when maximizing multiple windows #bug #ui #open #54
- Distinguish between error end info popups #feature #ui #open #55
- [application-bar] make it optionally loadable #feature #ui #open #83
- UI editor for web components (prototype based editing) #feature #ui #open #184

## Lively UX
- benchmark all startup times local storage? 1P #performance #ux #open #120
- detailed benchmark loading times incl. service worker, compilation, component loading etc #performance #ux #open #121
- benchmark lively UI .. dragging / menu open / how much content on a page etc... #performance #ux #open #122
- Undo for content editing #feature #ux #open #177
- Offline first #feature #ServiceWorker #hard #FollowUp #required #ux #open #178
  - be abler to load lively without internet
  - work for a while
  - synchronize with repository
  - idea: JavaScript github client | or just files... 
- Pen-based handwriting recognition #feature #hard #HelpWanted #required #ux #open #182
- white boardf on surface hub (multiple user one device scenario) ?P #feature #ux #open #183

## Lively Tools
- Refactor juicy-ace-editor to code-mirror #refactor #feature #tools #open #124
  - make Hashtags navigateable (all text and source code)
  - autocompletion of import packages
  - preview / hide image tags and specially img tags with data url in markdown/html/javascript
  - allow inlide lively svg handwritten notes in markdown/html/javascript
- create style editor for text and other objects... #feature #tools #open #125
- sort properties in inspector to private / html element / custom ... to find your data faster #Inspector #feature #tools #open #126
- Inspector missing/make ObjectEditor better #feature #tools #open #38
- Change History of methods #medium #feature #tools #open #186
- Diffing and merging  (object/graph/heap vs. text/tree/document) #FutureWork #Lively #hard #feature #tools #open #194

## Lively Content
- fast rich(er) text editing #feature #content #open #127
- change font size in halo and style editor #feature #content #open #128
- auto-shrinking of text? #feature #content #open #129
- refactor container #refactor #LivelyContainer #medium #urgent #container #content #open #130
  - extract navigation pane 3P
  - extract multple content type viewer (without editing) 3P
- push back edits markdown files (inplace) from rendered HTML back to Markdown source #feature #content #open #131
  - fix markdown issues e.g. lists under lists
- make halo grabbed/dropped content lively-content #bug #content #closed #132
- write multiple "lively-scripts" in one document #BUG #bug #content #closed #134
- Collaborative Lively Session (Synchronous) RW: Webstrates #feature #content #open #188
- Annotations for classes/methods (public/private) #feature #content #open #189

## Lively Chrome Extension
- upload latest version to google app store #chore #ChromeExtension #open #135
- update stable version #chore #ChromeExtension #open #136
- write document supporting extensions #documentation #ChromeExtension #documentation #open #137
  - Disable Content-Security-Policy 1.0.6
  - Ignore X-Frame headers 1.1
- Update browser plugin(s) #plugin #important #chore #medium #ChromeExtension #plugin #open #200

## Lively Client 
- provide code <-> ast functionality (lively.code) 2P #Feature #LivelyClient #feature #client #open #138
  - build Smalltalk-like Source Code Browser that edits methods #Features (showcase for code are not just  characters in a file) simple #ProjectionalEditor
- make github stories a filesystem 16P #LivelyClient #feature #client #open #140
  - format for file
  - delete/create file
  - what is filename?  What is id?
  - the repository should be defined in the context and not the link
  - explicit global links should be possible

## Lively Container
- Webcomponents do not update when internal components change #HtmlTemplates #NiceToHave #feature #container #open #101
- [lively-container] search bar in left bar #feature #container #open #42
- Update all module dependents when reloading a single module /Discussion/Question #RFC #discussion #feature #container #open #71

## Lively Component Bin 
- Preview for Component Bin #HtmlTemplates #HelpWanted #NiceToHave #feature #medium #LivelyComponentBin #ComponentBin #open #199
- [lively-container] same file name, different file extension #bug #LivelyComponentBin #ComponentBin #closed #56

## Student Projects
- build a gallery 10P #documentation #documentation #open #142
- was there anything more? #documentation #documentation #open #143
- new topics? 8P #documentation #documentation #open #144

## Lively Service Worker
- make booting it fast #performance #ServiceWorker #open #145
- make booting it reliable (don't let the browser handle your requests) #performance #ServiceWorker #open #146
- user caching for getting and putting resources (see offline first) #feature #ServiceWorker #open #147
- make local storage file system #ServiceWorker #feature #open #176

## Lively Services
- put lively services into sandbox (use heroku) and create usable example 10 #feature #open #148
- quick lively termeinal (example usecase) #feature #open #149
- deploy lively4-server as lively-service #feature #open #150
- playback local media center #Hobby #Jens #Example #feature #open #151

## Lively Server
- remove absolute urls / paths #refactor #server #open #152
- remove dependency on bash scripts? Or make it explicit (e.g. linux subsystem for windows is needed) #feature #server #open #153

## Lively Debugger
- revisit lively debugger 10P #feature #debugger #open #154
  - (main issue: starting time to long and fragile)
  - publish chrome extensiosn 2P
- Blink DevTools show old source content #medium #NiceToHave #bug #debugger #open #96

## Lively Sync
- Trasher-like splitting of commits #feature #hard #NiceToHave #SyncTool #open #155
- [lively-sync] replace merge button with dropdown button #feature #SyncTool #open #46

## Lively Scripting
- use "firebase" as cloud variables #feature #scripting #open #45
- Import and Handling User-defined Code #feature #scripting #open #64

## Lively PDF
- make pdf work again 3P #LivelyDebugger #bug #debugger #pdf #closed #156
- create link that opens lively-pdf when pasting pdf urls 1P #feature #pdf #open #157
- allow to persistently anntate pdfs (have a look at Hypothesis) ??P #feature #pdf #open #158
- write back anntations into file ??P #feature #pdf #open #159

## Lively Drag and Drop
- create links (and optionally open container) for arbitrary browser drag and drop API ?P #feature #DragAndDrop #closed #160
- provide hooks ourselve that can be dragged and drop (onDragStart, onDrag, onDragEnd) ?P #feature #DragAndDrop #closed #161

## Misc Issues
- to many green helper lines : #feature #open #162
- no backup of local lively content combined with auto-save can make an explosive mixture : #feature #open #163
- data-urls in markdown are broken : #LivelyDebugger #bug #debugger #closed #165
  - side effect of "fixing" links
  - remove absolute positioning 

## Text Editor
- We need rich text editor #feature #open #166
- We neee spelling-corrector everywhere #feature #open #167
- Recognize too large files in editor #FollowUp #NiceToHave #feature #medium #open #197
- make code mirror default editor #feature #open #94
- add spell checking to editor #feature #open #95

## Lively Tag and Search
- Connect all content via  and search... #tags #feature #TagAndSearch #open #168
- Make structured search  possible #feature #TagAndSearch #open #169
  - Methods, Classes, Modules
  - Headlines, Text, Nodes
  - Handwriting
- fast through caching content and meta-information (prototyped with  and [TODO pages](../todo.html) #Dexie #feature #TagAndSearch #open #170

## Lively Graffle
- provide a graffle like whiteboard feeling text/shape/connectors #WIP #feature #graffle #open #171

## Write a Paper
- what was/is our motivation?  #open #172
- document our design desciions  #open #173
- evaluate our design decisions  #open #174
- what is open? Where do we want to go?  #open #175
- write paper (section) about: heap vs document persistens #Lively #hard #open #191

## Html Templates
- [templates] allow external repositories/applications to define their own templates in a different location #duplicate #medium #important #feature #closed #82
- Support template loading from non-core repositories #medium #important #feature #closed #89

## Lively Sync
- Commits have wrong author #bug #SyncTool #open #48
- Cannot use "/" in commit messages #bug #SyncTool #open #52
- Make git commit author name and e-mail configurable #feature #SyncTool #open #76
- [sync] autocommits use wrong author #bug #SyncTool #open #87

## Module System
- Support Circular Dependencies #hard #required #feature #open #93

## Examples
- Lively Software Viz Current: Only Module #Examples #feature #medium #open #192
- Energy Simulation #Examples #feature #hard #open #193

## Transpilation
- bind (::) operator #transpilation #easy #FollowUp #NiceToHave #feature #closed #100
- do expressions #transpilation #easy #NiceToHave #feature #medium #closed #99
- fuction parsing is broken #bug #open #53
- target.new not working #bug #open #66
- Allow await on top level in Workspace #transpilation #hard #important #feature #open #97
- boundEval of "a string" returns undefined #transpilation #medium #NiceToHave #feature #open #98
- Source Code transformation on Syntax level ?P #feature #open #179

## Stories only in Github
<!--NoProject-->
- changes global content in lively is slowed down due to mutation observer #LivelyBaseSystem #performance #BaseSystem #open #204
- electron dependency breaks on travis  #closed #259
- dropbox does not allow overwrite  #closed #258
- var recorder break module binding semantic #NiceToHave #ModuleSystem #transpilation #medium #open #257
- Dropbox access does not support files names that have to be url-encoded #required #ServiceWorker #easy #bug #open #255
- Add versioning support to dropbox #NiceToHave #ServiceWorker #medium #feature #open #254
- add read, write and metadata caching #important #ServiceWorker #medium #feature #open #253
- Add acceptance tests for googledrive #NiceToHave #ServiceWorker #medium #refactor #open #252
- Clean up dropbox and googledrive code #NiceToHave #ServiceWorker #medium #refactor #closed #251
- Dropbox and GoogleDrive API broken #critical #blocker #ServiceWorker #medium #HelpWanted #bug #closed #249
- __unloadModule__ hook to clean up reloaded js modules #important #ModuleSystem #medium #feature #closed #248
- Context Preservation Rewriting does not allow circular dependencies #required #ModuleSystem #transpilation #medium #HelpWanted #bug #open #247
- Web component hook before livelyMigrate #HtmlTemplates #discussion #open #246
- expose should remember order of last usage of lively-windows #NiceToHave #ux #easy #feature #open #245
- provide and link up all files in repo for tern.js #important #TextEditor #feature #open #244
- tern.js should be used to navigate across files in container #NiceToHave #TextEditor #ux #hard #feature #open #243
- tern.js rename variable closes too early #NiceToHave #TextEditor #easy #bug #open #242
- Merge tern.js autocompletion with our own #NiceToHave #TextEditor #medium #feature #open #241
- z-Index resets sometimes #required #ui #ux #bug #open #240
- Modifying Preferences.js resets your Preferences #important #BaseSystem #easy #bug #open #239
- Window Manager #important #ux #hard #discussion #feature #open #238
- Enable a set of default syntax plugins for every babel transformation #NiceToHave #ModuleSystem #transpilation #easy #refactor #open #236
- source code maps in ast explorer are sometimes off #NiceToHave #tools #medium #bug #open #235
- Shortcut to close current window #NiceToHave #ux #easy #feature #closed #232
- Booting Service Worker conflicts with booting lively #required #ServiceWorker #medium #bug #open #231
- Unicode Encoding #urgent #medium #bug #open #230
- Expose feature broken #required #ui #ux #medium #bug #open #229
- Subtree Configuration Tool #required #server #SyncTool #medium #feature #open #228
- Update imports in workspaces when modules change #NiceToHave #ModuleSystem #transpilation #medium #feature #open #227
- this is not bound in lively-script correctly #important #HtmlTemplates #easy #bug #open #225
- Highlighting code in .md with markdownJS does not work #NiceToHave #TextEditor #easy #bug #open #224
- Remove remaining underscore references #NiceToHave #easy #chore #open #223
- Better tool support for import #NiceToHave #TextEditor #medium #feature #closed #220
- Show unused imports and variables #NiceToHave #TextEditor #medium #HelpWanted #feature #open #219
- toggle fullscreen in container should do that  #open #217
- should we allow tested nepositories under https://lively-kernel.org/lively4/ #server #refactor #open #215
- how can we detect indirect movement of objects #BaseSystem #feature #open #214
- halo should not close when clicking into workspace #ux #feature #refactor #open #213
- all scripts in markdown become lively-scripts... maybe we don't want that?  #open #212
- halo does not move with target #ui #bug #open #206
- Refactor mount tool #open #298
- Fix Github mount #open #297
- Close button for window list in context menu #open #295
- lint support for our syntax #open #293
- Upgrade to latest version of webcomponents #open #292
- editing a new files process 500 Errors on PUT #open #291
- Beginners Guide #open #290
- Make Web Component lookup adaptable #open #289
- Selectable Folder for Web Component Generator #open #288
- Improve Template for Web Components #open #287
- jsx creation of svg elements does  not work #open #286
- File browser shows directory as file #open #285
- Inspector does not allow to manipulate objects graphically #open #284
- WebComponents do not live-update on save #open #283
- META better github history #open #282
- SWX performance bug of using focalStorage #open #281
- Support external sources in offline mode #open #280
- Support bind operator for ESLint #open #279
- Show windows feature blocks typing '@' #open #277
- Commit author is "null" #open #274
- find a UI for formatting buttons in halo or similoar #open #273
- fix connector handle #open #272
- Testcases without a suite accumulate in TestRunner #open #270
- Security issues when dragging to desktop using data-urls #open #262
- GoogleDrive API broken #open #261