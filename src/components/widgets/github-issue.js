import Morph from 'src/components/widgets/lively-morph.js';
import github from "src/client/github.js";

export default class GithubIssue extends Morph {
  async initialize(issue=this.issue) {
    
    this.issue = issue
    this.registerButtons()
    this.update()
  }

  onBrowse() {
    window.open(this.issue.html_url)
  }
  
  onDebug() {
    lively.openInspector(this.issue)
  }
  
  update() {
    
    if (!this.issue) return
    if (this.parentEleemnt) {
      this.parentElement.setAttribute("title", "Github Issue #" + this.issue.id )
    }

    this.get("#title").textContent = this.issue.title
    this.get("#body").setContent(this.issue.body)
  }
  
  livelyMigrate(other) {
    this.issue = other.issue
    this.update()
  }
  
  async livelyExample() {
    let issues = await github.current().issues(false)
    this.issue = issues[0]
    this.update()
  }
}
