
import authGithub from "src/client/auth-github.js"
import Strings from "src/client/strings.js"
import Files from "src/client/files.js"

const LivelyWebhookService = "https://lively-kernel.org/lively4/_webhook/signal"

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

export default class GitHub {
   
  static current(force) {
    if (!this._current || force) {
      this._current = new GitHub()
    }
    return this._current
  }
  
  get storagePrefix() {
    return "LivelySync_"
  }
  
  
  async storeValue(key, value) {
    return  lively.focalStorage.setItem(this.storagePrefix + key, value)
  }
  
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key)
  }
  
  githubApi(path, token) {
    return fetch("https://api.github.com" + path, {
      headers: new Headers({
        Authorization: "token " + token
    })}).then(r => r.json());
  }
  
  async loadCredentials() {
    // this.updateLoginStatus()
    this.token = await this.loadValue("githubToken")
    if (!this.token) {
       this.token = await new Promise((resolve, reject) => {
          authGithub.challengeForAuth(Date.now(), async (token) => {
              var user = await this.githubApi("/user", token);
              var username = user.login;
              var emails =  await this.githubApi("/user/emails", token);
              var email = emails.find(ea => ea.primary).email;
              this.storeValue("githubUsername", username);
              this.storeValue("githubEmail", email);
              this.storeValue("githubToken", token);
              resolve(token);
        });
       })
    }
    this.username = await this.loadValue("githubUsername");
    this.email = await this.loadValue("githubEmail");
  }
  
  
  constructor(user= "LivelyKernel", repo= "lively4-core") {
    this.user = user
    this.repo = repo
    this.loaded = this.loadCredentials()
  }

  async getToken() {
    if (!this.token ) {
      this.loaded = this.loadCredentials()
      await this.loaded
    }
    return this.token
  }
  
  async ensureBranch(name, original="master") {
    await this.loaded
    
    var info = await this.getBranch(name)
    if (info.ref) return info
    
    var originalInfo = await this.getBranch(original)
    if (!originalInfo.ref) throw new Error("Could not find original branch " + original)
    
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/git/refs`, {
      method: "POST",
      headers: {
       Authorization: "token " + this.token 
      },
      body: JSON.stringify({
        "ref": `refs/heads/${name}` ,
        "sha": originalInfo.object.sha
      })
    }).then(r => r.json())
  }
  
  async apiFetch(api, options={}) {
    await this.loaded
    var baseHeaders =  {
      Authorization: "token " + this.token
    }
    var baseOptions = {
      method: "GET"
    }
    var composedOptions = Object.assign(baseOptions, options)
    composedOptions.headers = Object.assign(baseHeaders, options.headers || {})
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}` + api, composedOptions).then(r => r.json())
  }
  
  
  async getBranch(name) {
    return this.apiFetch(`/git/refs/heads/${name}`)
  }

  async getFile(path, branch) {
    await this.loaded
    var result = await fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}` 
                 + (branch  ? `?ref=${branch}` : ""), {
      headers: {
       Authorization: "token " + this.token 
      }
    }).then(r => r.json())
    return result
  }
  
  async listWebhooks() {
    var hooks = await this.apiFetch(`/hooks`)
    return hooks
  }  

  async ensureWebhook(url=LivelyWebhookService) {
    var hooks = await this.listWebhooks()
    if (!hooks || !hooks.find) return
    var found = hooks.find(ea => ea.config.url == url)
    if (found) {
      return found
    } else {
      return this.createWebhook(url)
    }
  }

  async createWebhook(url=LivelyWebhookService) {
    return await this.apiFetch(`/hooks`, {
      method: "POST",
      body: JSON.stringify({
        "name": "web",
        "active": true,
        "events": [
          "push"
        ],
        "config": {
          "url": url,
          "content_type": "json",
          "insecure_ssl": "0"
        }
      })
    })
  }
  
  fixPath(path) {
   return path && path.replace(/^\//,"") // do not start with /
  }

  async setFile(path, branch, content, message="LIVELY COMMIT") {
    path = this.fixPath(path) 
    await this.loaded
    var file = await this.getFile(path, branch)
    var body = {
        "message": message,
        "committer": {
          "name": this.user,
          "email": this.email
        },
        "content": Files.b64EncodeUnicode(content),
        
      }
    if (file.sha)  body.sha = file.sha
    if (branch) body.branch = branch
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`, {
      method: "PUT",
      headers: {
       Authorization: "token " + this.token 
      }, 
      body: JSON.stringify(body)
    }).then(r => r.json())
  }
  
  async deleteFile(path, branch, message="LIVELY COMMIT DELETE") {
    await this.loaded
    var file = await this.getFile(path, branch)
    if (!file.sha) throw new Error("File not found")
    
    var body = {
        "message": message,
        "committer": {
          "name": this.user,
          "email": this.email
        },
      }
    body.sha = file.sha
    if (branch) body.branch = branch
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`, {
      method: "DELETE",
      headers: {
       Authorization: "token " + this.token 
      }, 
      body: JSON.stringify(body)
    }).then(r => r.json())
  }

  async getContent(path, branch) {
    var file = await this.getFile(path, branch)
    if (file.content) return Files.b64DecodeUnicode(file.content)
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
    await this.loaded
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
          Authorization: "token " + this.token,
          'Content-Type': 'application/json'
        }
      }).then(r => r.json())
  }
  
  async patch(number, issuePatch) {
    await this.loaded
    if (!number) throw new Error("number is missing") 
    if (!issuePatch) throw new Error("issuePatch is missing") 

    return fetch("https://api.github.com/repos/" 
        + this.user+ "/" + this.repo + "/issues/" + number, {
        method: "PATCH",
        body: JSON.stringify(issuePatch),
        headers: {
          Authorization: "token " + this.token,
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
  

  async getURLAuthorized(url, force) {
    // force not used...
    await this.loaded
    return fetch(url, {
        method: "GET",
        headers: {
          Authorization: "token " + this.token
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
    var stories = lines.map((ea) => {
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
  
  
  // Example: AnnotationSet.getGitMergeBase("https://lively-kernel.org/lively4",  "lively4-dummyA", "HEAD", "fd956")
  async getGitMergeBase(serverURL, repositoryName, versionA, versionB) {
    var headers = new Headers({
      "gitusername":          this.username,
      "gitpassword":          this.token, 
      "gitemail":             this.email,
      "gitrepository":        repositoryName,
      gitversiona: versionA,
      gitversionb: versionB,
    })

    return fetch(serverURL + "/_git/mergebase", {
      headers: headers
    }).then(r => r.text())    
  }
  
}