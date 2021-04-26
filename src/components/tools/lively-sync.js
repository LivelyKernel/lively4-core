import Morph from 'src/components/widgets/lively-morph.js';
import Filter from "src/external/ansi-to-html.js";
import Strings from "src/client/strings.js";


/*MD # Github Sync Tool
![](lively-sync.png){width=500px}

MD*/




export default class Sync extends Morph {
  
  
  initialize() {
    var container = this.get(".container");
    this.registerButtons();
    lively.html.registerInputs(this);
    lively.html.registerKeys(this);
    lively.html.registerAttributeObservers(this)  
    
    this.updateLoginStatus();
    
    if (window.__karma__) {
      console.log("exit early... due to karma");
      return;
    }
    var repo = this.getAttribute("gitrepository") || lively4url.replace(/.*\//,"")
    this.get('#gitrepository').value = repo;
    this.get('#gitrepository').addEventListener("change", evt => this.onGitrepositoryInputChange(evt))
    this.get('#serverUrl').addEventListener("change", evt => this.onServerUrlInputChange(evt))
    
    this.updateWindowTitle()
    this.updateServerURL()
  }

  onKeyDown(evt) {
    const char = String.fromCharCode(evt.keyCode || evt.charCode);
    const ctrl = evt.ctrlKey || evt.metaKey;

    if (evt.repeated) {
      lively.notify("Key rep! " + char)
      return;
    }
    if (!ctrl) { return; }
    
    if (char === "S") {
      this.onSyncButton();
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    if(char === "Q") {
      this.onSquashButton();
    
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }
  }
  
  log(s) {
    this.get("#log").innerHTML += s
    // var editor = this.get("#log").editor;
    // if (editor) {
    //   editor.setValue(editor.getValue() + "\n" + s);
    //   // editor.session.setScrollTop(1000000); // #TODO find scroll to bottom method in ace
    // }
  }
  
  async loadCredentials() {
    // this.updateLoginStatus()
    var token = await this.loadValue("githubToken")
    this.get("#loginButton").innerHTML = 
        token ? "logout" : "login";
    var login = token ? true : false;
    this.loggedin = login;

    this.get("#gitusername").value = 
      await this.loadValue("githubUsername");
    this.get("#gitemail").value = 
      await this.loadValue("githubEmail");
    
    var value = await this.loadValue("githubRepository") 
    if (value) this.get("#gitrepository").value = value;
  }
  


  githubApi(path, token) {
    return fetch("https://api.github.com" + path, {headers: new Headers({
      Authorization: "token " + token
    })}).then(r => r.json());
  }
  
  async login() {
    this.loadValue("githubToken").then((result) => {
      if (result) return result;
      return new Promise((resolve, reject) => {
        lively.authGithub.challengeForAuth(Date.now(), async (token) => {
          console.log("authenticated");
          var user = await this.githubApi("/user", token);
          var username = user.login;
          var emails =  await this.githubApi("/user/emails", token);
          var email = emails.find(ea => ea.primary).email;

          console.log("username: " + username);
          console.log("email: " + email);

          
          this.storeValue("githubUsername", username);
          this.storeValue("githubEmail", email);
          this.storeValue("githubToken", token);
          this.updateLoginStatus();
          resolve(token);
    });
      });
    }).then((token) => {
      this.log("Logged in");
    });
  }
  
  
  /*MD ## Sync  MD*/
  

  async gitControl(cmd, eachCB, optHeaders={}) {
    this.clearLog()
    return new Promise(async (resolve) => {
      var headers =  await this.getHeaders()
      for(var key in optHeaders) {
        headers.set(key, optHeaders[key])
      }
      let commandURL = this.getServerURL() +"/_git/" + cmd;
      lively.files.fetchChunks(fetch(commandURL, {
              headers: headers
            }), (eaChunk) => {
          if (eachCB) 
            eachCB(eaChunk)
          else
            this.log(this.linkifyFiles(new Filter().toHtml(eaChunk.replace(/</g,"&lt;"))))
        }, resolve)
    })
  }
  
  async sync() {
    var syncResult = await this.gitControl("sync");
    
    this.log("invalidate local caches")
    window.lively4invalidateFileCaches && window.lively4invalidateFileCaches() // global variable set in boot
  }

  logout() {
    this.clearLog()
    this.storeValue("githubToken", null)
    this.storeValue("githubUsername", null)
    this.storeValue("githubEmail", null)
    this.updateLoginStatus()
    window.lively4github = null // used by #Fetch proxy
    this.log("")
  }

  /*MD ## Getter / Setter MD*/
  
  get storagePrefix() {
    return "LivelySync_"
  }
  
  get repositoryBlacklist() {
    return ["lively4-core", "lively4-stable"]
  }
  
  async getHeaders() {
    return new Headers({
      "gitusername":          this.get("#gitusername").value,
      "gitpassword":          await this.loadValue("githubToken"), 
      "gitemail":             this.get("#gitemail").value,
      "gitrepositoryurl":     this.get("#gitrepositoryurl").value,
      "gitrepository":        this.getRepository(),
      "gitrepositorybranch":  this.get("#gitrepositorybranch").value,
      "gitcommitmessage":     this.get("#gitcommitmessage").value,
      "dryrun":               this.get("#dryrun").checked
    })
  }
  
  defaultServerURL() {
    return lively4url.match(/(.*)\/([^\/]+$)/)[1]
  }

  getServerURL() {
    return this.getAttribute("serverurl") || this.defaultServerURL()
  }

  setServerURL(url) {
    lively.notify("set server url: " + url )
    this.setAttribute("serverurl", url)
    this.updateWindowTitle()
    this.updateRepositoryList()
    this.updateServerURL()
  }
  
  setRepository(name) {
    this.setAttribute("gitrepository", name) 
    this.get("#gitrepository").value = name
  }
  
  getRepository() {
     return this.get("#gitrepository").value
  }
  
  getBranch() {
     return this.get("#gitrepositorybranch").value.replace(/^ */,"")
  }


  async getGitRepositoryNames() {
    var json = await lively.files.statFile(this.getServerURL()).then( JSON.parse)
    if (!json || !json.contents) return []
    return json.contents.filter(ea => ea.type == "directory").map(ea => ea.name)
  }
  
  
  /*MD ## Helper MD*/
  
  async storeValue(key, value) {
    return  lively.focalStorage.setItem(this.storagePrefix + key, value)
  }
  
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key)
  }
  
  linkifyFiles(htmlString) {
    var base = this.getServerURL() + "/" + this.getRepository() + "/"
    return htmlString
      // .replace(/(<span style="color:#A00">(?:deleted\: *)?)([^<]*)(<\/span>)/g, (m,a,b,c) => 
      //     `${a}<a onclick="event.preventDefault(); fetch(this.href)" href="edit://${b}">${b}</a>${c}`)
      .replace(/(modified: *)([a-zA-Z0-9\-_/ .]*)/g, (m,a,b) => 
          `${a}<a onclick="event.preventDefault(); lively.openBrowser(this.href,true)" href="${base + b}">${b}</a>`)
      .replace(/((?:\+\+\+\s*b\/)|(?:\-\-\- a\/))([a-zA-Z-_0-9/ .]*)/g, (m,a,b) => 
          `${a}<a onclick="event.preventDefault(); lively.openBrowser(this.href,true)" href="${base + b}">${b}</a>`)
// 
  }
  
  /*MD ## Events MD*/
  
  onSyncButton() {
    this.gitControl("status").then((status) => { if (!status.match("AUTO-COMMIT-")) {
        this.sync()
        // lively.notify("sync directly")
      } else {
        if (window.confirm("Contains auto commits. Forgot to squash? Push them anyway? ")) {
          this.sync()
          // lively.notify("sync anyway")
        } else {
          // lively.notify("sync canceled")
        }
      }
    })
  }



  async onLoginButton() {
    window.lively4github = null // fetch will getg new auth info
    this.clearLog()
    if (await this.loadValue("githubToken")) { 
      this.logout() 
    } else { 
      this.login()
    }
  }

  getProtectedRepositories() {
    return ["lively4-jens", "lively4-core"]
  }
  
  onBranchButton() {
    if (this.getProtectedRepositories().includes(this.getRepository())) {
      return lively.warn("You are not allowed to branch on " + this.getRepository())
    }    
    this.gitControl("branch")  
  }

  onStatusButton() {
    this.gitControl("status")  
  }

  onResetHardButton() {
    
    if (window.confirm("Do you want revert all local commits and reset to your current branch?")) {
      this.gitControl("reset-hard");
    }
  }
  
  onDiffButton() {
    this.get("#log").setAttribute('mode', "text/x-diff")
    // text/x-diff
    
    this.gitControl("diff")  
  }

  async onCloneButton(){
    if (window.confirm("Do you want to clone into " + 
        this.get("#gitrepository").value)) {
      this.get("#cloneButton").disabled= true
      await this.gitControl("clone")
      this.updateContextSensitiveButtons()
      this.updateRepositoryList()
    }
  }

  onNpmInstallButton() {
    this.gitControl("npminstall")
  }

  onNpmTestButton() {
    this.gitControl("npmtest")
  }


  async onResolveButton() {
    if (await lively.confirm("DANGER! Do you want to FORCE a resolve with a hammer? Please consider, going to all files and solve the conflict through editing there! This is not the button you want to use.")) {
        this.gitControl("resolve")
    }
  }

  onChangelogButton() {
   this.gitControl("graph");
  }
  
  onChangesgraphButton() {
    lively.openMarkdown(lively4url + "/doc/files/changesgraph.md", 
      "Change Graph", {url: this.getServerURL() + "/" + this.getRepository() + "/"})
  }
  
  onCommitButton() {
    // return lively.notify("Commit is not implemented yet")  
    this.gitControl("commit");
  }
  
  onDeleteButton() {
    if (window.confirm("Do you want to delete " + this.get("#gitrepository").value + " repository?")) {
      this.gitControl("delete");
    }
  }
  
  async onMergeButton() {
    if (this.getProtectedRepositories().includes(this.getRepository())) {
      return lively.warn("You are not allowed to merge on " + this.getRepository())
    }  
    if (await lively.confirm("Do you want to merge "
      + this.get("#gitrepositorybranch").value 
      +" into " + this.get("#gitrepository").value 
      + " repository?<br><b style='color:red'>DANGER: Do not 'Squash' commit before a new 'Sync'</b>")) {
      this.gitControl("merge");
    }
  }
  
  onSquashButton() {
    this.gitControl("squash");
  }

  async onResetButton(){
    const answer = await lively.confirm("This will hard reset to the current remote working index.");
    if(answer){
      this.gitControl("reset")
    }
  }
  
  onGitrepositoryInputChange(evt) {    
    var value = this.getRepository()
    lively.notify("input changed:" + value)
    this.setAttribute("gitrepository", value)
  }
  
  async onServerUrlInputChange(evt) { 
    var input = this.get("#serverUrl")
    var url = input.value
    try {
      var stats = await fetch(url, {
        method: "OPTIONS"
      }).then(r => r.json())
    } catch(e) {
      
    }
    
    
    // #TODO we could inform in the server that this is a proper base directory....
    if (stats && stats.type == "directory") {
      input.style.border = ""
      this.setServerURL(url)
    } else {
      input.style.border = "2px dashed red"
    }
    
    lively.notify("server url: " + url)
    
    this.get("#gitrepository").value = ""
    
    // var value = this.getRepository()
    // lively.notify("input changed:" + value)
    // this.setAttribute("gitrepository", value)
  }
  
  async onGitrepositoryChanged(value) {
    this.updateContextSensitiveButtons()
  }
  
  /*MD ## Update UI MD*/
  
  async updateRepositoryList() {
    var list = await this.getGitRepositoryNames()
    this.get("#gitrepository").setOptions(list)
  }

  async updateBranchesList() {
    lively.notify("update branches list")
    var branches = await this.gitControl("branches", ()=>{})
    branches = branches.split("\n")
    var currentRegex = /^ *\*/
    var currentBranch = branches.find(ea => ea.match(currentRegex));
    if(!currentBranch) {
      return
    }
    currentBranch = currentBranch.replace(currentRegex,"")
    this.get("#gitrepositorybranch").value = currentBranch
    
    var remoteRegEx = /^remotes\/origin\//
    branches = branches
      .map(ea => ea.replace(/^\*? */,"")) // trim
      .filter(ea => ea.match(remoteRegEx))
      .filter(ea => ! ea.match("HEAD "))
      .map(ea => ea.replace(remoteRegEx,""))
    this.get("#gitrepositorybranch").setOptions(branches)
    // console.log("branches: " + branches)
  }


  
  async updateContextSensitiveButtons() {
    lively.notify("updateContextSensitiveButtons")
    var repository = this.get("#gitrepository").value
    var list = await this.getGitRepositoryNames()
    var exists = list.includes(repository);
    
    // console.log("delete " + this.get("#deleteButton").disabled)

    if (exists) {
      
      await this.updateUpstreamURL()
      await this.updateBranchesList() 
    }

    this.shadowRoot.querySelectorAll(".repo").forEach(ea => 
      ea.disabled= !this.loggedin || !exists)

    this.shadowRoot.querySelectorAll(".branch").forEach(ea => 
      ea.disabled= !this.loggedin)
      
    this.shadowRoot.querySelectorAll(".clone").forEach(ea => 
      ea.disabled= !this.loggedin || exists)
      
    this.shadowRoot.querySelectorAll(".login").forEach(ea => 
      ea.disabled= this.loggedin)

    if (this.repositoryBlacklist.includes(repository))
      this.get("#deleteButton").disabled = true
  }
   
  updateServerURL() {
    this.get("#serverUrl").value = this.getServerURL()
    this.get("#serverUrl").setOptions(lively.files.getKnownServers()) 
  }
  
  async updateUpstreamURL() {
    var url = await this.gitControl("remoteurl")
    url = url.replace(/\n/,"")
    this.get("#gitrepositoryurl").value = url
  }
  
  updateWindowTitle() {
    var serverURL = this.getServerURL()
    this.windowTitle = "GitHub Sync " + ((serverURL == this.defaultServerURL()) ? "" : serverURL );    
  }
  
  async updateLoginStatus() {
    if (window.__karma__) return; // no lively4-server active
    
    await this.loadCredentials()
    
    await this.updateContextSensitiveButtons();
    await this.updateRepositoryList();
  }
  
    // #TODO into Morph or Tool
  clearLog(s) {
    this.get("#log").innerHTML = ""
    // var editor= this.get("#log").editor;
    // if (editor) editor.setValue("");
  }
  

}
