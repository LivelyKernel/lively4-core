/*MD # Markdown 

[architecture](browse://doc/architecture/markdown.md)

MD*/


import Markdown from "src/client/markdown.js"

import Morph from 'src/components/widgets/lively-morph.js';
import components from "src/client/morphic/component-loader.js";
import MarkdownIt from "src/external/markdown-it.js"

import MarkdownItHashtag from "src/external/markdown-it-hashtag.js"
import MarkdownItTasks from "src/external/markdown-it-tasks.js"
import MarkdownItAttrs from "src/external/markdown-it-attrs.js"
import MarkdownItSourcemap from "src/external/markdown-it-sourcemap.js"

// import MarkdownItContainer from "src/external/markdown-it-container.js"
// see https://www.npmjs.com/package/markdown-it-container

import 'src/external/highlight.js';
import persistence from 'src/client/persistence.js';
import Strings from 'src/client/strings.js';
import Upndown from 'src/external/upndown.js';

import {pt} from 'src/client/graphics.js';

import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.js';
// ELK renderer was moved to external package in Mermaid v11
import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.2.0/dist/mermaid-layout-elk.esm.min.mjs';

import FileIndex from 'src/client/fileindex.js'

export default class LivelyMarkdown extends Morph {
  async initialize() {
    
    // all scripts are evaluated
    this.evaluated = new Promise(resolve => {
      this.resolveEvaluated = resolve
    })
    this.windowTitle = "LivelyMarkdown";
    this.registerButtons();
    
    if (this.getAttribute("parameters")) {
      try {
        this.parameters = JSON.parse(this.getAttribute("parameters"))
      } catch(e) {
         lively.warn("[markdown] could not restore parameters", this.getAttribute("parameters")) 
      }
    }
    if (!this.parameters) {
      this.parameters = {}
    }
    
    
    this.updateView().then(() => {
      if (this.getAttribute("mode") == "presentation") {
        this.startPresentation()
      }
    })
    this._attrObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName))
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });      
  }
  
  attributeChangedCallback(attr, oldVal, newVal) {
    var method = "on" + Strings.toUpperCaseFirst(attr) + "Changed"
    if (this[method]) this[method](newVal, oldVal)
  }
  
  onContenteditableChanged(value, oldVal) {
    this.get("#content").setAttribute("contenteditable", value)
  }

  set parameters(value) {
    this._parameters = value
    try {
      this.setAttribute("parameters", JSON.stringify(value))
    } catch(e) { 
      lively.warn("[markdown] could not persist parameters", e)
    }
  }
  
  get parameters() {
    return this._parameters
  }
   
  
  async renderMarkdown(root, content) {
    var md = new MarkdownIt({
      html:         true,        // Enable HTML tags in source
      xhtmlOut:     false,        // Use '/' to close single tags (<br />).
                                  // This is only for full CommonMark compatibility.
      breaks:       false,        // Convert '\n' in paragraphs into <br>
      langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
                                  // useful for external highlighters.
      linkify:      false,        // Autoconvert URL-like text to links
    
      // Enable some language-neutral replacement + quotes beautification
      typographer:  false,
    
      
      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      highlight:  function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            hljs.configure({tabReplace: '  '})
            return hljs.highlight(lang, str, true).value
          } catch (__) {}
        }

        // For unrecognized languages, preserve the language class
        const langClass = lang ? ` class="language-${lang}"` : '';
        return '<pre class="hljs"><code' + langClass + '>' + md.utils.escapeHtml(str) + '</code></pre>';
      }
    });  
    md.use(MarkdownItHashtag)
    md.use(MarkdownItTasks)
    md.use(MarkdownItAttrs)
    md.use(MarkdownItSourcemap)
    
    // md.use(MarkdownItContainer)
    
    md.renderer.rules.hashtag_open  = function(tokens, idx) {
      var tagName = tokens[idx].content 
      if(tagName.match(/^[A-Za-z][A-Za-z0-9]+/))
        // return `<a href="javascript:lively.openSearchWidget('#${tagName}')" class="tag">`;
        return `<a href="search://#${tagName}" class="tag">`;
      else
        return `<a href="javascript:lively.openIssue('${tagName}')" class="issue">`;

    }
    if (!content) return;
    if (content.match(/markdown-config .*presentation=true/)) {
      var configPresentation = true 
    }
    
    content = content
      .replace(/<lively-script><script>/g,"<script>")
      .replace(/<\/script><\/lively-script>/g,"</script>")
      .replace(/<lively-script>/g,"<script>")
      .replace(/<\/lively-script>/g,"</script>")

    // var enhancedMarkdown = lively.html.enhanceMarkdown(content);
    // var htmlSource = md.render(enhancedMarkdown);
    var htmlSource = md.render(content);
    // replace only scripts, that are actual scripts
    htmlSource = htmlSource.replace(/<script(.*?)>((:?\n|.)*?)<\/script>/gm, (original, args, content) =>          
          args.match(`type=`) ? original : `<lively-script${args}><script>${content}</script></lively-script>`)
    
    var tmpDiv = document.createElement("div")
    tmpDiv.innerHTML = htmlSource // so we still have some control over it
    
    await this.replaceImageTagsWithSpecificTags(tmpDiv)
    
    var dir = this.getDir()
    if (dir) {
      lively.html.fixLinks([tmpDiv], this.getDir(), path => this.followPath(path));
    }
    
    this.beatifyInplaceHashtagNavigation(tmpDiv)
    
    root.innerHTML = "";
    tmpDiv.childNodes.forEach(ea => {
      root.appendChild(ea)
    })
    
    
    root.querySelectorAll("input[type=checkbox]").forEach(ea => {
      ea.disabled = false;
      ea.addEventListener("click", evt => {
        if ( ea.checked) {
          ea.setAttribute("checked", "true")
        } else {
          ea.removeAttribute("checked")
        }
      })
    })
    
    
    if (configPresentation)
      this.startPresentation()

    // #TODO: fixme
    //root.querySelectorAll("pre code").forEach( block => {
    //  highlight.highlightBlock(block);
    //});
    
    var container = lively.query(this, "lively-container")
    root.hidden = true
    await lively.fillTemplateStyles(root, "", container && container.getDir())
    root.hidden = false
    
    // custom lively modifications... second round of parsing content in the DOM
    Markdown.parseAndReplaceLatex(root)
    
    // Process mermaid diagrams
    await this.processMermaidDiagrams(root)
    
    await components.loadUnresolved(root, true, "lively-markdown.js", true);    
    await persistence.initLivelyObject(root)
    
    // for using markdown content as tools
    var allScripts = lively.queryAllDeep(root, "lively-script")
    var allPromises = allScripts.map(ea => ea.evaluated)
    await Promise.all(allPromises)
    // lively.notify("[markdown] scripts evaluated: " + allScripts.length + "promises: " + allPromises)
    this.resolveEvaluated()
  }
  
  async updateView() {
    return this.renderMarkdown(this.get("#content"), await this.getContent())
  }

  async replaceImageTagsWithSpecificTags(tmpDiv) {
    
    for(let imgTag of tmpDiv.querySelectorAll("img")) {
      var noFileEnding = !imgTag.src.match(/\.[A-Za-z0-9]+$/) 
      if (noFileEnding || imgTag.src.match(/\.drawio$/) ) {
        // we have to guess or look what img could have been meant
        // (a) lets see if is a drawio figuure
        // #TODO check if there is actually an pdf
        var figure = await (<lively-drawio></lively-drawio>)
        
        for(let attr of imgTag.attributes) {
          if (attr.name == "src") {
            // use attributes to retain RAW data
            let src = imgTag.getAttribute("src")  + (noFileEnding ? ".drawio" : "")
            // console.log("REPLACE DRAWIO: " + src)
            figure.setAttribute("src",  src)
          } else {
            figure.setAttribute(attr.name, attr.value)
          }
        }
        figure.update() 
        imgTag.parentElement.insertBefore(figure, imgTag)
        imgTag.remove()
      } else if (noFileEnding || imgTag.src.match(/\.html$/) ) {
        // console.log("[lively-markdown] create lively-import")
        var importElement = await (<lively-import></lively-import>)
        for(let attr of imgTag.attributes) {
          if (attr.name == "src") {
            let src = imgTag.getAttribute("src")
            importElement.setAttribute("src",  src)
          } else {
            importElement.setAttribute(attr.name, attr.value)
          }
        }
        imgTag.parentElement.insertBefore(importElement, imgTag)
        imgTag.remove()
      }
      
    }
  }
  
  beatifyInplaceHashtagNavigation(tmpDiv) {
    /* Beatify Inplace Hashtag Navigation #TODO #Refactor #MoveToBetterPlace */
    tmpDiv.querySelectorAll("a.tag").forEach(eaLink => {
      // #Example for absolute CSS positioning #Hack: 
      // (1) the relative "span" itself is positioned through the dynamic layout without taking space itself
      // (2) the absolute "div" element than has total freedom to posiiton itself relative to (1)
      var searchContainerAnchor  = <span style="position:relative; width: 0; height: 0"></span>
      var searchContainer = <div style="width:500px; height:200px; overflow: auto; background-color:lightgray; z-index:1000"></div>
      lively.setPosition(searchContainer,pt(0,0)) // make absolute...
      searchContainerAnchor.appendChild(searchContainer)
      
      var shadow = searchContainer.attachShadow({mode: 'open'});     
      var lastEntered
      var lastLeft
      eaLink.addEventListener("mouseenter", async () => {
        lastEntered = Date.now()

        var root = lively4url
        var roots = [root].concat(lively.preferences.get("ExtraSearchRoots"))
        var result = ""
        var searchString = eaLink.href.replace("search://","")
        await Promise.all([FileIndex.current().db.files.each(file => {
          if (roots.find(eaRoot => file.url.startsWith(eaRoot)) && file.content) {
            var m = file.content.match(searchString)
            if (m) {
               result += `<li><a href="${file.url}#${searchString.replace(/#/g,"")}">${file.url.replace(lively4url,"")}</a></li>`
            }
          }
        }), lively.sleep(100)])

        if (lastLeft > lastEntered) return

        // document.body.appendChild(searchContainer)
        eaLink.appendChild(searchContainerAnchor)        
        
        // lively.setClientPosition(searchContainer, lively.getClientPosition(eaLink).addPt(pt(0,15)))
        
        // lively.setPosition(searchContainer, pt(0,0), "relative")
        searchContainer.style.overflow = "visible"
        
        // #Continue here!!! getPosition does not work on non absolute objects...
        // lively.setPosition(searchContainer, lively.getBounds(eaLink).topLeft().addPt(pt(0,15)))
        searchContainer.innerHTML = "search"
        // searchContainer.isMetaNode = true
        searchContainer.id = "lively-search-container"
        shadow.innerHTML = ""
        
        // ok, lets try some eye candy
        searchContainer.style.opacity = 0
        searchContainer.style.transition = "opacity 0.5s ease-in-out";
        searchContainer.style.opacity = 0.8
        
        shadow.innerHTML = `<ol style="font-size:12pt">${result}<ol>`
        lively.html.fixLinks(shadow.childNodes, this.getDir(), path => this.followPath(path))
      })
      
      eaLink.addEventListener("mouseleave", async () => {
        lastLeft = Date.now()
        await lively.sleep(500)
        if (lastEntered > lastLeft) return // we came back

        searchContainer.style.transition = "opacity 0.5s ease-in-out";
        searchContainer.style.opacity = 0
        
        await lively.sleep(1000)
        searchContainerAnchor.remove()
      })
    })
  }
  
  async processMermaidDiagrams(root) {
  
    // Find mermaid code blocks by language class (now properly preserved by highlighter)
    const mermaidBlocks = root.querySelectorAll('code.language-mermaid');
    
    if (mermaidBlocks.length === 0) return;

    console.log(`[lively-markdown] Processing ${mermaidBlocks.length} mermaid diagrams`);
    console.log(`[lively-markdown] Mermaid version:`, mermaid.version || 'unknown');

    // Register ELK layout engine (required for flowchart-elk in Mermaid v11+)
    try {
      console.log('[lively-markdown] ELK layouts to register:', elkLayouts);
      await mermaid.registerLayoutLoaders(elkLayouts);
      console.log('[lively-markdown] ELK layout registered successfully');
    } catch (err) {
      console.warn('[lively-markdown] Failed to register ELK layout:', err);
    }

    // Initialize mermaid with ELK renderer for orthogonal edges
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      flowchart: {
        defaultRenderer: 'elk'
      }
    });

    // Process each mermaid block
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      
      // Skip if already processed
      if (block.dataset.processed) continue;
      block.dataset.processed = 'true';

      const content = block.textContent.trim();
      const id = 'mermaid-diagram-' + Date.now() + '-' + i;

      // Get target element before we start
      const targetElement = block.parentElement.tagName === 'PRE' ? block.parentElement : block;
      
      try {
        // Add visual feedback that we're processing
        targetElement.style.border = '2px solid orange';
        targetElement.style.opacity = '0.7';
        
        // Create container for the diagram
        const container = document.createElement('div');
        container.id = id;
        container.className = 'mermaid-diagram language-mermaid';
        container.style.cssText = 'margin: 1em 0; text-align: center;';
        container.style.border = `1px solid green`;

        // Render the mermaid diagram - passes content with %%{init}%% directive intact
        const {svg} = await mermaid.render(id + '-svg', content);
        container.innerHTML = svg;
        
        // Only replace after successful rendering
        targetElement.parentNode.replaceChild(container, targetElement);
        
        console.log(`[lively-markdown] Successfully rendered mermaid diagram ${i}`);
      } catch (err) {
        lively.error(`[lively-markdown] Mermaid render error for block ${i}:`, err);
        
        // Keep original block but style it to show error
        targetElement.style.border = '2px dashed red';
        targetElement.style.opacity = '1';
        targetElement.style.backgroundColor = '#ffe6e6';
        
        // Add error message after the code block
        const errorContainer = document.createElement('div');
        errorContainer.className = 'mermaid-error language-mermaid';
        errorContainer.style.cssText = 'color: red; border: 1px solid red; padding: 10px; margin: 5px 0; background: #ffe6e6; font-size: 0.9em;';
        errorContainer.innerHTML = `<strong>Mermaid Error:</strong> ${err.message}`;
        
        // Insert error message after the original block
        targetElement.parentNode.insertBefore(errorContainer, targetElement.nextSibling);
      }
    }
  }
  
  followPath(path) {
    lively.notify("follow " + path)
    window.open(path)
  }

  async setContent(content) {
    this.textContent = content
    return this.updateView()
  }
  
  async getContent() {
    var src = this.getAttribute("src")
    if (src) {
      var text = await lively.files.loadFile(src)
      return text
    }
    return this.textContent
  }
  
  setDir(dir) {
    this.setAttribute("dir", dir) 
  }
  
  getDir() {
    return this.getAttribute("dir")
  }
  
  async setSrc(src) {
    this.setAttribute("src", src);
    return this.updateView()
  }
  
  async htmlAsMarkdownSource() {
    var htmlSource = this.get("#content").innerHTML
    var markdownConverter = new Upndown()
    markdownConverter.tabindent = "  "
    markdownConverter.bullet = "- "
    
    var source = await markdownConverter.convert(htmlSource, {
      keepHtml: true,
    })
    return source
  }
  
  getSrc() {
    return this.getAttribute("src")
  }

  async print() {
    lively.printWithSavedWorld(async () => {
      const livelyWindow = lively.findParent(this, e => e.localName === 'lively-window', { deep: true })
      document.title = livelyWindow?.title ||  `markdown document`
      
      const originalPos = lively.memorizeElementDOMPosition(this);
      
      document.body.replaceChildren(this)
      
      // await lively.sleep(1000)
      window.print()
      
      lively.restoreElementDOMPosition(this, originalPos)
    })
  }
  
  onPresentationButton() {
    lively.notify("presentation: " + this.getAttribute("mode"))
    if (this.getAttribute("mode") == "presentation") {
      this.stopPresentation()      
    } else {
      this.startPresentation()
    }
    
  }
  
  async startPresentation() {
    this.setAttribute("mode", "presentation")
    if (this.parentElement && this.parentElement.tagName == "LIVELY-CONTAINER") {
      this.parentElement.setAttribute("mode", "presentation")
    }
    if (this.get("lively-presentation")) {
      return this.get("lively-presentation")
    }
    
    var comp = document.createElement("lively-presentation")
    await lively.components.openIn(this.get("#content"), comp)
    comp.convertSiblings()
    comp.start();

    // if (this.get("#presentationButton"))
    //   this.get("#presentationButton").remove()

    return comp
  }

  async stopPresentation() {
    this.setAttribute("mode", "")
    if (this.parentElement.tagName == "LIVELY-CONTAINER") {
      this.parentElement.setAttribute("mode", "")
    }
    this.updateView()
    
  }

  
  livelyExample() {
    this.setDir(lively4url + "/docs/")
    return this.setContent(`
# a script

<script>
lively.notify("scripts still run")
</script>

\`\`\`javascript {.foo}
function foo() {
  var a = "hello"
  return a + a
}
\`\`\`

## Foo {.blub style="background-color:yellow"}

This is a #Hashtag and

It goes on an on!

![](https://lively-kernel.org/lively4/lively4-jens/demos/sample.drawio)

`)
  }
  
  async livelyExample3() {
    await this.setSrc(lively4url + "/README.md")
    
  }
 
  livelyExample2() {
    this.setDir(lively4url + "/docs/")
    return this.setContent(`
# Hello World

- list item 1 [a link]("markdown.md")
- list item 2


`)
  }

 
  
}