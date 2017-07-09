import authGithub from "src/client/auth-github.js"
import Strings from "src/client/strings.js"


export default class Github {
  
  static current(force) {
    if (!this._current || force) {
      this._current = new Github()
    }
    return this._current
  }
  
  constructor() {
    this.user = "LivelyKernel"
    this.repo = "lively4-core"
  }

  token() {
    return new Promise(resolve => {
      if (this._token) {
        return resolve(this._token)
      }
      authGithub.challengeForAuth(Date.now(), async (token) => {
          this._token = token
          resolve(this._token)
      })
    })
  }
  
  async issueByTitle(searchInTitle) {
    var issues = await this.issues()
    return issues.find(ea => ea.title.match(searchInTitle))
  }
  
  async issueByNumber(number) {
    var issues = await this.issues()
    return issues.find(ea => ea.number == number)
  }
  
  
  async create(title, body) {
    if (!title) throw new Error("title is missing") 
    if (!body) throw new Error("body is missing") 
    return fetch("https://api.github.com/repos/" 
        + this.user+ "/" + this.repo + "/issues", {
        method: "POST",
        body: JSON.stringify({
          title: title,
          body: body
        }),
        headers: {
          Authorization: "token " + await this.token(),
          'Content-Type': 'application/json'
        }
      }).then(r => r.json())
  }
  
  tokenSync() {
    return this._token
  }
  
  async issues(force) {
    var token = this.tokenSync();
    if (!token) token = await this.token();
    
    if (!this._issues || force) {
      this._issues = await fetch("https://api.github.com/repos/" 
        + this.user+ "/" + this.repo + "/issues", {
        method: "GET",
        headers: {
          Authorization: "token " + token
        }
      }).then(r => r.json())
    }
    return this._issues
  }
  
  parseMarkdownStories(source) {
    var lines = source.split(/\r?\n/)
    var stories = lines.map((ea, index) => {
      var result =  Strings.matchDo(/^## +(.*)/, ea, title => ({project: title}))
      if (!result) result = Strings.matchDo(/^(- )(.*)/, ea, (prefix, issue) => {
        var title, rest;
        Strings.matchDo(/ ((#|(?:[0-9]+P)|(?:\?+P)).*)$/, issue, (a) => {
          rest = a
        })
        if (!title) title = issue.replace(rest, "")
        var number;
        if (rest) {
          Strings.matchDo(/(#([0-9]+))/, rest, (a,b) => {
            rest = rest.replace(a,"") 
            number = b
          })
          }
        return   {
          title: title, 
          rest: rest && rest.replace(/ *$/,""),
          number: number ? parseInt(number) : undefined,
          items: []
        }
      })
      if (!result) result = Strings.matchDo(/^ +(- .*)/, ea, item => ({item: item}))
    
      if (!result) result = {comment: ea}
      return result
    })
    
    // now, make sense of the parsing...
    var lastProject
    var lastStory
    stories.forEach(ea => {
      if (ea.project) lastProject = ea;
      if (ea.title) lastStory = ea
      if (ea.title && lastProject) lastStory.project = lastProject.project
      if (ea.item && lastStory) {
        lastStory.items.push(ea)
      }
    })
    return stories
  }
  
  stringifyMarkdownStoriesDebug(stories) {
    return stories.map(ea => JSON.stringify(ea)).join("\n")
  }
  
  stringifyMarkdownStories(stories) {
    return stories.map(ea => {
      if (ea.title  != undefined) 
        return "- " + ea.title + (ea.rest ? " " + ea.rest : "") + (ea.number ? " #" + ea.number : "");
      if (ea.comment != undefined) return  ea.comment;
      if (ea.project  != undefined) return "## " + ea.project;
      
        
      if (ea.item) return "  " + ea.item;
      throw new Error("Could not stringify parsed line: " + JSON.stringify(ea))
    }).join("\n")
  }
}