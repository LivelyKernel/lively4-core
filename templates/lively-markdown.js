import Morph from './Morph.js';
import components from "src/client/morphic/component-loader.js";
import MarkdownIt from "src/external/markdown-it.js"
import MarkdownItHashtag from "src/external/markdown-it-hashtag.js"
import highlight from 'src/external/highlight.js';
import persistence from 'src/client/persistence.js';

export default class LivelyMarkdown extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMarkdown";
    
    this.updateView()
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
        debugger
        if (lang && hljs.getLanguage(lang)) {
          try {
            hljs.configure({tabReplace: '  '})
            return '<pre class="hljs"><code>' +
                   hljs.highlight(lang, str, true).value +
                   '</code></pre>';
          } catch (__) {}
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
      }
    });  
    md.use(MarkdownItHashtag)
    md.renderer.rules.hashtag_open  = function(tokens, idx) {
      var tagName = tokens[idx].content 
      if(tagName.match(/^[A-Za-z][A-Za-z0-9]+/))
        return `<a href="javascript:lively.openSearchWidget('#${tagName}')" class="tag">`;
      else
        return `<a href="javascript:lively.openIssue('${tagName}')" class="issue">`;

    }
    var content = await this.getContent()
    if (!content) return;
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

    // #TODO: fixme
    //root.querySelectorAll("pre code").forEach( block => {
    //  highlight.highlightBlock(block);
    //});
    
    components.loadUnresolved(root);
    
    persistence.initLivelyObject(root)
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
  
  getSrc() {
    return this.getAttribute("src")
  }

  async startPresentation() {
    var comp = document.createElement("lively-presentation")
    await lively.components.openIn(this.get("#content"), comp)
    comp.convertSiblings()
    comp.start();
  }
  
  livelyExample() {
 this.setDir(lively4url + "/docs/")
    this.setContent(`
# a script

<script>
lively.notify("scripts still run")
</script>

\`\`\`javascript
function foo() {
  var a = "hello"
  return a + a
}
\`\`\`


`)
  }
  
  livelyExample3() {
    this.setSrc(lively4url + "/README.md")
  }
 
  livelyExample2() {
    this.setDir(lively4url + "/docs/")
    this.setContent(`
# Hello World

- list item 1 [a link]("markdown.md")
- list item 2

`)
  }

 
  
}