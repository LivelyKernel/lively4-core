# Lively4 Modules (Browser)

<style>

h1 {
  margin-top: 5px;
  margin-bottom: 5px;
}

h3 {
  margin-top: 0px;
  margin-bottom: 0px;
}

ul, ol {
  margin-top: 5px;
  margin-bottom: 5px;
}

a  {
  font-size: 14pt;
}

li {
  font-size: 10pt;

}

a.tag {
  color: gray;
  font-size: 10pt;

}

</style>

### #Boot
1. → [*start.html*](../../start.html)
2. [**boot.js**](boot.js), loads systemjs/babel, not a module itself
   - [bootlog.js](bootlog.js),  optionally benchmark and log boot whole boot process

### Base System
- [**lively.js**](lively.js) #KitchenSink #CircularDepency #Refactor to submodules
  - [interactive.js](interactive.js)
  - [lively.css](lively.css)
- [**contextmenu.js**](contextmenu.js)
  - [info.js](info.js)
  - [layout.js](layout.js)
- [fileindex.js](fileindex.js)
- [persistence.js](persistence.js) 
- [preferences.js](preferences.js) 
- [messaging.js](messaging.js) #Deprecated
- [script-manager.js](script-manager.js) #Rename #Refactor

### Workflows
- [graffle.js](graffle.js)
- [essay.js](essay.js)
- [js-beautify/](js-beautify/)
- [triples/](triples/)
- [vivide/](vivide/)

### UI  
- [morphic/](morphic/)
  - [component-creator.js](morphic/component-creator.js)
  - [dragbehavior.js](morphic/dragbehavior.js)
  - [**component-loader.js**](morphic/component-loader.js) #Refactor
  - [event-helpers.js](morphic/event-helpers.js) #Deprecated
  - [events.js](morphic/events.js)
  - [node-helpers.js](morphic/node-helpers.js)
  - [snapping.js](morphic/snapping.js)
  - [selecting.js](morphic/selecting.js)
- [expose.js](expose.js)
- [**clipboard.js**](clipboard.js)
- [viewnav.js](viewnav.js)
  - [grid.svg](grid.svg)
- [draganddrop.js](draganddrop.js)

### Authentication 

- [auth.js](auth.js)
  - [auth-dropbox.js](auth-dropbox.js)
  - [auth-github.js](auth-github.js)
  - [auth-googledrive.js](auth-googledrive.js)

### Workspace
- [bound-eval.js](bound-eval.js)
  - [workspaces.js](workspaces.js)
- [workspace-loader.js](workspace-loader.js)
- #CodeMirror
  - [stablefocus.js](stablefocus.js)
  - [syntax.js](syntax.js)

### Libraries 
- [utils.js](utils.js)
- [files.js](files.js)
- [graphics.js](graphics.js)
- [sort.js](sort.js)
- [strings.js](strings.js)
- [keys.js](keys.js) #Events
- [crayoncolors.js](crayoncolors.js)
- [lodash-bound.js](lodash-bound.js)
  - [lodash-bound-generate.js](lodash-bound-generate.js)  
- [html.js](html.js)
- [paths.js](paths.js)
- [rasterize.js](rasterize.js)
- [svg.js](svg.js)
- [github.js](github.js)
- [mimetypes.js](mimetypes.js)
- [command-history.js](command-history.js) #Pattern

### Language
- [ContextJS/](ContextJS/)
- [lang/](lang/)
- [poid.js](poid.js) #PolymorphicIdendifier
  - [protocols/](protocols/)
- [patches.js](patches.js) #MonkeyPatch 
- [reactive/](reactive/)
- [scoped-scripts.js](scoped-scripts.js)
  - [container-scoped-d3.js](container-scoped-d3.js)

### Draft
- [pen-editor/](pen-editor/) 
- [rename_obj.js](rename_obj.js) #SeminarProject
- [signature-db.js](signature-db.js) #SeminarProject
- [github-explorer.js](github-explorer.js) #SeminarProject
- [about.js](about.js) #Delete
- [external.js](external.js) #Delete

### Deprecated
- [search.js](search.js) #SeminarProject
- [tracer.js](tracer.js)
  
### *META*
<script>
import Files from "src/client/files.js"
var md = lively.query(this, "lively-markdown");
Files.generateMarkdownFileListing(md.shadowRoot)
</script>
