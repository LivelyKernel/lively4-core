import Morph from './Morph.js';
import components from "src/client/morphic/component-loader.js";
import MarkdownIt from "src/external/markdown-it.js"
import MarkdownItHashtag from "src/external/markdown-it-hashtag.js"
import highlight from 'src/external/highlight.js';


export default class LivelyMarkdown extends Morph {
  async initialize() {
    this.windowTitle = "LivelyMarkdown";
    
    this.updateView()
  }

  ensureLivelyScriptSource(element) {
    var scriptElements = []
    if (element.tagName && element.tagName.toLowerCase() == "lively-script") {
        scriptElements.push(element)
    }
    if (element.querySelectorAll) {
      element.querySelectorAll("lively-script").forEach(script => scriptElements.push(script))
    }
    scriptElements.forEach(script => {
      script.textContent = script.innerHTML; // do not parse HTML inside lively-script
    })
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
      highlight: function (/*str, lang*/) { return ''; }
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
      .replace(/<script>/g,"<lively-script>")
      .replace(/<\/script>/g,"</lively-script>")

    // setting innerHTML directly will strip "script"-tags, so we parse it and append in manually
    var html = $.parseHTML(htmlSource); // #TODO get rid of jQuery... any HTML parser we could use?
    // We cannot use "innerHMTL = something " here directly, because it will not interpret "script" tags due to security concerns... preventing code injection
    
    var dir = this.getDir()
    if (dir) {
      lively.html.fixLinks(html, this.getDir(), (path) => this.followPath(path));
    }
    
    // console.log("html", html);
    var root = this.get("#content")
    if (html) {
      html.forEach((ea) => {
        this.ensureLivelyScriptSource(ea)
        
        root.appendChild(ea); 
        if (ea.querySelectorAll) {
          ea.querySelectorAll("pre code").forEach( block => {
            highlight.highlightBlock(block);
          });
        }
      });
    }
    components.loadUnresolved(root);
 
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


  livelyExample() {
 this.setDir(lively4url + "/docs/")
    this.setContent(`
# a script

<script>
lively.notify("scripts still run")
</script>

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