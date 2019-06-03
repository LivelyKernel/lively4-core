import authGithub from "src/client/auth-github.js"
import Strings from "src/client/strings.js"

export class Issue {
  constructor(props) {
    for(var ea in props) {
      this[ea] = props[ea]
    }
  }
}

export class Project extends Issue {
  toString() {
    return "Project: " + this.project
  }
}

export class Story extends Issue {
  toString() {
    return "Story: " + this.title
  }
}

export class Item extends Issue {
  toString() {
    return "Items: " + this.item
  }
}

export class Comment extends Issue {
  toString() {
    return "Comment: " + this.comment
  }
}


export default class Github {
  
  static current(force) {
    if (!this._current || force) {
      this._current = new Github()
    }
    return this._current
  }
  
  constructor(user= "LivelyKernel", repo= "lively4-core") {
    this.user = user
    this.repo = repo
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
  
  async ensureBranch(name, original="master") {
    var info = await this.getBranch(name)
    if (info.ref) return info
    
    var originalInfo = await this.getBranch(original)
    if (!originalInfo.ref) throw new Error("Could not find original branch " + original)
    
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/git/refs`, {
      method: "POST",
      headers: {
       Authorization: "token " + await this.token() 
      },
      body: JSON.stringify({
        "ref": `refs/heads/${name}` ,
        "sha": originalInfo.object.sha
      })
    }).then(r => r.json())
  }
  
  async getBranch(name) {
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/git/refs/heads/${name}`, {
      headers: {
       Authorization: "token " + await this.token() 
      }
    }).then(r => r.json())
  }

  async getFile(path, branch) {
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}` 
                 + (branch  ? `?ref=${branch}` : ""), {
      headers: {
       Authorization: "token " + await this.token() 
      }
    }).then(r => r.json())
  }

  async setFile(path, branch, content) {
    var file = await this.getFile(path, branch)
    var body = {
        "message": "LIVELY COMMIT " + path,
        "committer": {
          "name": "Lively",
          "email": "lively@lively-kernel.org"
        },
        "content": btoa(content),
        
      }
    if (file.sha)  body.sha = file.sha
    if (branch) body.branch = branch
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`, {
      method: "PUT",
      headers: {
       Authorization: "token " + await this.token() 
      }, 
      body: JSON.stringify(body)
    }).then(r => r.json())
  }
  
  async deleteFile(path, branch) {
    var file = await this.getFile(path, branch)
    if (!file.sha) throw new Error("File not found")
    
    var body = {
        "message": "LIVELY COMMIT DELETE " + path,
        "committer": {
          "name": "Lively",
          "email": "lively@lively-kernel.org"
        },
      }
    body.sha = file.sha
    if (branch) body.branch = branch
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`, {
      method: "DELETE",
      headers: {
       Authorization: "token " + await this.token() 
      }, 
      body: JSON.stringify(body)
    }).then(r => r.json())
  }

  async getContent(path, branch) {
    var file = await this.getFile(path, branch)
    if (file.content) return atob(file.content)
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
  
  async patch(number, issuePatch) {
    if (!number) throw new Error("number is missing") 
    if (!issuePatch) throw new Error("issuePatch is missing") 

    return fetch("https://api.github.com/repos/" 
        + this.user+ "/" + this.repo + "/issues/" + number, {
        method: "PATCH",
        body: JSON.stringify(issuePatch),
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
  /*
   * source    ... stories in markdown list item syntax 
   * recursive ... items are only referenced in their parent projects, otherwise it is a flat list
   */
  parseMarkdownStories(source, recursive) {
    var lines = source.split(/\r?\n/)
    var stories = lines.map((ea, index) => {
      var result =  Strings.matchDo(/^## +(.*)/, ea, title => 
        new Project({isProject: true, project: title, stories: [], comments: []}))
      if (!result) result = Strings.matchDo(/^(- )(.*)/, ea, (prefix, issue) => {
        var title, rest, state;
        Strings.matchDo(/ ((#|(?:[0-9]+P)|(?:\?+P)).*)$/, issue, (a) => {
          rest = a
        })
        if (!title) title = issue.replace(rest, "")
        var number;
        var labels = []
        var tags = []
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
        if (rest) {
          // lively.notify("rest " + rest)
          Strings.matchAllDo(/(#[A-Za-z]+)/, rest, (tag) => {
            var label = this.tagToLabel(tag)
            if (label && !labels.includes(label)) {
              labels.push(label)
            }
            tags.push(tag)

          })
          tags.forEach(tag => {
            // lively.notify("replace tag " + tag)
            rest = rest.replace(new RegExp(" ?" + tag, "g"),"")
          })

        }

        return   new Story({
          isStory: true,
          title: title.replace(/ *$/,""), 
          rest: rest && rest.replace(/ *$/,""),
          number: number ? parseInt(number) : undefined,
          state: state,
          labels: labels,
          items: []
        })
      })
      if (!result) result = Strings.matchDo(/^ +(- .*)/, ea, item => 
        new Item({isItem: true, item: item}))
    
      if (!result) result = new Comment({isComment: true, comment: ea})
      return result
    })
    
    // now, make sense of the parsing...
    var lastProject
    var lastStory
    
    stories.forEach(ea => {
      if (ea.isProject) {
        lastProject = ea;
        lastStory = null;
      }
      if (ea.isStory) {
        lastStory = ea
      }
      if (ea.isStory && lastProject) {
        lastProject.stories.push(ea)
        lastStory.project = lastProject.project
      }
      if (ea.isItem && lastStory) {
        ea.story = lastStory; // it is not a tree any more...
        lastStory.items.push(ea)
      }
      if (ea.isComment && lastProject) {
        ea.project = lastProject
        lastProject.comments.push(ea)
      }
      if (ea.comment == "<!--NoProject-->") {
        ea.project = undefined;
        lastProject = undefined
      }
    })
    if (recursive) {
      stories = stories.filter(ea => 
        ea.isProject ||
          (ea.isStory && !ea.project) ||
          (ea.isItem && !ea.story) ||
          ea.isComment && !ea.project
      ); // get rid of the global itmes
    }
    return stories
  }
  
  stringifyMarkdownStoriesDebug(stories) {
    return stories.map(ea => JSON.stringify(ea)).join("\n")
  }
  
  labelToTag(l) {
    var tag = l
        .replace("type: ", "")
        .replace(/P[0-9]\: /, "")
        .replace(/effort[0-9]\: /, "")
        .replace(/ \(hour\)/, "")
        .replace(/ \(day\)/, "")
        .replace(/ \(week\)/, "")
        .replace("RFC / discussion / question", "discussion")
        .replace(/comp\: /, "")
    if (tag.match(" ")) {
      tag = Strings.toUpperCaseFirst(Strings.toCamelCase(tag, " "))
    }
    return "#" + tag
  }
  
  tagToLabel(tag) {
    if (!tag) return 
    var label = tag.replace("#", "")
    if (label == "bug") return "type: bug"
    if (label == "chore") return "type: chore"
    if (label == "feature") return "type: feature"
    if (label == "performance") return "type: performance"
    if (label == "refactor") return "type: refactor"
    if (label == "discussion") return "type: RFC / discussion / question"
    
    if (label == "easy") return "effort1: easy (hour)"
    if (label == "medium") return "effort2: medium (day)"
    if (label == "hard") return "effort3: hard (week)"
     
    if (label == "critical") return "P0: critical"
    if (label == "critical") return "P0: critical"
    if (label == "critical") return "P0: critical"
    if (label == "critical") return "P0: critical"
    if (label == "critical") return "P0: critical"
    
    if (label == "urgent") return "P1: urgent"
    if (label == "required") return "P2: required"
    if (label == "important") return "P3: important"
    if (label == "NiceToHave") return "P4: nice to have"


    if (label == "duplicate") return "duplicate"
    if (label == "FollowUp") return "follow up"
    if (label == "HelpWanted") return "help wanted"

    if (label.match(/[A-Z][a-z]+[A-Z]/)) 
      return "comp: " + label.split(/(?=[A-Z])/).map(ea => ea.toLowerCase()).join(" ")
    return label
  }
  
  stringifyMarkdownStories(stories, recursive) {
    return stories.map(ea => {
      if (ea.title  !== undefined) 
        return "- " + ea.title + 
          (ea.rest ? " " + ea.rest : "") + 
          (ea.labels ? " " +ea.labels
            .filter(l => l !== ("comp: " + ea.project).toLowerCase())
            .map(l => this.labelToTag(l)).join(" ")  : "") + 
          (ea.state ? " #" + ea.state : "") + 
          (ea.number ? " #" + ea.number : "") +
          (recursive && ea.items && ea.items.length > 0 ? 
            "\n" + this.stringifyMarkdownStories(ea.items, true) : "")
      if (ea.comment !== undefined) return  ea.comment;
      if (ea.project  !== undefined) 
        return "## " + ea.project + 
          (recursive && ea.comments && ea.comments.length > 0 ? 
            "\n" + this.stringifyMarkdownStories(ea.comments, true) : "") + 
          (recursive && ea.stories && ea.stories.length > 0 ? 
            "\n" + this.stringifyMarkdownStories(ea.stories, true) : "")
          
      if (ea.item) return "  " + ea.item;
      throw new Error("Could not stringify parsed line: " + JSON.stringify(ea))
    }).join("\n")
  }
  
  async syncMarkdownStories(stories) {
    var issues = await this.issues(true)
    // lively.notify("found " + issues.length + " issues")
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
        
        if (ea && issue && issue.labels) {
          if (!ea.labels) ea.labels = []; 
          issue.labels.forEach(l => {
            if (!ea.labels.includes(l.name)) {
              
              // lively.notify("add " + l.name)
              ea.labels.push(l.name)
            }
          })
          if (ea.project) {
            var projectLabel = "comp: "+ ea.project.trim().replace(/[^A-Za-z0-9 ]/g,"").toLowerCase()
            if (!issue.labels.find(ea => ea.name.toLowerCase() == projectLabel)) {
              lively.notify("labeled " + issue.number  + " as " + projectLabel )
              var patch = {labels: issue.labels.map(ea => ea.name).concat([projectLabel])};
              var result = await this.patch(issue.number, patch)
              
            }
          }
          
          // local labels are thrown away... ?
          // #TODO what about labels that are not in github?
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