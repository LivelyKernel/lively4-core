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
  
  
  parseLinkHeader(header) {
    var parts = header.split(',');
    var links = {};
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
  }
  
  tokenSync() {
    return this._token
  }
  async getURLAuthorized(url, force) {
    var token = this.tokenSync();
    if (!token || force) token = await this.token();
    return fetch(url, {
        method: "GET",
        headers: {
          Authorization: "token " + token
        }
      })
  }
  
  
  async issues(force) {
    if (!this._issues || force) {
      this._issues = []
      
      var url = "https://api.github.com/repos/" 
        + this.user+ "/" + this.repo + "/issues" + "?per_page=100&state=all"
      
      // retrieve all pages
      while(url) {
        var resp = await this.getURLAuthorized(url, force)
        var links = this.parseLinkHeader(resp.headers.get("link"))
        url = links["next"]
        this._issues = this._issues.concat(await resp.json())
      }

    }
    return this._issues
  }
  
  parseMarkdownStories(source) {
    var lines = source.split(/\r?\n/)
    var stories = lines.map((ea, index) => {
      var result =  Strings.matchDo(/^## +(.*)/, ea, title => ({project: title}))
      if (!result) result = Strings.matchDo(/^(- )(.*)/, ea, (prefix, issue) => {
        var title, rest, state;
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
        if (rest) {
          Strings.matchDo(/(#((open)|(closed)))/, rest, (a,b) => {
            rest = rest.replace(a,"") 
            state = b
          })
          }

        return   {
          title: title.replace(/ *$/,""), 
          rest: rest && rest.replace(/ *$/,""),
          number: number ? parseInt(number) : undefined,
          state: state,
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
        return "- " + ea.title + 
          (ea.rest ? " " + ea.rest : "") + 
          (ea.state ? " #" + ea.state : "") + 
          (ea.number ? " #" + ea.number : "");
      if (ea.comment != undefined) return  ea.comment;
      if (ea.project  != undefined) return "## " + ea.project;
      
        
      if (ea.item) return "  " + ea.item;
      throw new Error("Could not stringify parsed line: " + JSON.stringify(ea))
    }).join("\n")
  }
  
  async syncMarkdownStories(stories) {
    var issues = await this.issues(true)
    lively.notify("found " + issues.length + " issues")
    for(var ea of stories){
      var issue = null
      if (ea.title && ea.number === undefined) {
        issue = issues.find(issue => ea.title == issue.title)
        if (!issue) {
          issue = await this.create(ea.title, ea.body || "<no description>")
        }
        ea.number = issue.number;
        // #TODO add maybe github flags too?
      }
      if (ea.title) {
        if (!issue) {
          issue = issues.find(issue => ea.number == issue.number)
        }
        
        if (issue && issue.state) {

          ea.state = issue.state
        }
      }
    }
    for(var issue of issues) {
      if (issue.state == "open" && !stories.find(ea => ea.number == issue.number)) {
        var story = {title: issue.title, state: issue.state, body: issue.body, number: issue.number}; // Project, Tags?
        stories.push(story) // just append, #TODO find a proper place in the list? 
      }
    }
    return stories
  }
  
  async updateMarkdownFile(url) {
    var content = await lively.files.loadFile(url)
    var stories = this.parseMarkdownStories(content)
    await this.syncMarkdownStories(stories)
    var updateContent = this.stringifyMarkdownStories(stories)
    return lively.files.saveFile(url, updateContent)
  }
  
  
}