import Morph from 'src/components/widgets/lively-morph.js';
import components from "src/client/morphic/component-loader.js";
import MarkdownIt from "src/external/markdown-it.js"
import MarkdownItHashtag from "src/external/markdown-it-hashtag.js"
import MarkdownItTasks from "src/external/markdown-it-tasks.js"
import MarkdownItAttrs from "src/external/markdown-it-attrs.js"

// import MarkdownItContainer from "src/external/markdown-it-container.js"
// see https://www.npmjs.com/package/markdown-it-container

import highlight from 'src/external/highlight.js';
import persistence from 'src/client/persistence.js';
import Strings from 'src/client/strings.js';
import Upndown from 'src/external/upndown.js';

export default class LivelyMarkdown extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMarkdown";
    this.registerButtons();
    await this.updateView();

    if (this.getAttribute("mode") == "presentation") {
      this.startPresentation()
    }
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
  
  async updateView() {
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

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
      }
    });  
    md.use(MarkdownItHashtag)
    md.use(MarkdownItTasks)
    md.use(MarkdownItAttrs)
    
    // md.use(MarkdownItContainer)
    
    md.renderer.rules.hashtag_open  = function(tokens, idx) {
      var tagName = tokens[idx].content 
      if(tagName.match(/^[A-Za-z][A-Za-z0-9]+/))
        // return `<a href="javascript:lively.openSearchWidget('#${tagName}')" class="tag">`;
        return `<a href="search://#${tagName}" class="tag">`;
      else
        return `<a href="javascript:lively.openIssue('${tagName}')" class="issue">`;

    }
    var content = await this.getContent()
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
    htmlSource = htmlSource
      .replace(/<script>/g,"<lively-script><script>")
      .replace(/<\/script>/g,"</script></lively-script>")
    
    var root = this.get("#content")
    root.innerHTML = htmlSource;

    var dir = this.getDir()
    if (dir) {
      lively.html.fixLinks([root], this.getDir(), path => this.followPath(path));
    }
    
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
    
    await components.loadUnresolved(root);
    
    await persistence.initLivelyObject(root)
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
      return fetch(src).then(r => r.text())
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