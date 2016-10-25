'use strict';

import Morph from './Morph.js';

export default class Sync extends Morph {
  initialize() {
    this.windowTitle = "GitHub Sync"
    var container = this.q(".container");
    lively.html.registerButtons(this)
    lively.html.registerInputs(this)
    this.updateLoginStatus()
    
    if (window.__karma__) {
      console.log("exit early... due to karma")
      return 
    }
    
    this.getSubmorph('#gitrepository').value = lively4url.replace(/.*\//,"")
    
    var travis = this.shadowRoot.querySelector("#travisLink")
    travis.onclick = () => {
      window.open(travis.getAttribute("href"))
      return false
    } 
  }

  // #TODO pull into Morph?  
  q(selector) {
    return this.shadowRoot.querySelector(selector)
  }
  
  // #TODO into Morph or Tool
  clearLog(s) {
    var editor= this.q("#log").editor
    if (editor) editor.setValue("")
  }

  log(s) {
    var editor = this.q("#log").editor
    if (editor) editor.setValue(editor.getValue() + "\n" + s)
  }

  async updateLoginStatus() {
    if (window.__karma__) return; // no lively4-server active
    
    // this.updateLoginStatus()
    var token = await this.loadValue("githubToken")
    this.q("#loginButton").innerHTML = 
        token ? "logout" : "login";
    var login = token ? true : false;
    this.loggedin = login;
    

    this.q("#gitusername").value = 
      await this.loadValue("githubUsername");
    this.q("#gitemail").value = 
      await this.loadValue("githubEmail");
    
    var value = await this.loadValue("githubRepository") 
    if (value)this.q("#gitrepository").value = value;
    
    this.updateContextSensitiveButtons();
    this.updateRepositoryList();
    this.updateBranchesList();
  }

  githubApi(path, token) {
    return fetch("https://api.github.com" + path, {headers: new Headers({
      Authorization: "token " + token
    })}).then(r => r.json())
  }
  
  async login() {
    this.loadValue("githubToken").then((result) => {
      if (result) return result
      return new Promise((resolve, reject) => {
        lively.authGithub.challengeForAuth(Date.now(), async (token) => {
          console.log("authenticated")
          var user = await this.githubApi("/user", token)
          var username = user.login
          var emails =  await this.githubApi("/user/emails", token)
          var email = emails.find(ea => ea.primary).email

          console.log("username: " + username )
          console.log("email: " + email )

          
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

  async getHeaders() {
    return new Headers({
      "gitrepository":        this.q("#gitrepository").value, 
      "gitusername":          this.q("#gitusername").value,
      "gitpassword":          await this.loadValue("githubToken"), 
      "gitemail":             this.q("#gitemail").value,
      "gitrepositoryurl":     this.q("#gitrepositoryurl").value,
	    "gitrepository":        this.q("#gitrepository").value,
	    "gitrepositorybranch":  this.q("#gitrepositorybranch").value,
	    "gitcommitmessage":     this.q("#gitcommitmessage").value,
	    "dryrun":               this.q("#dryrun").checked
    })
  }

  getServerURL() {
      return this.serverURL || lively4url.match(/(.*)\/([^\/]+$)/)[1]
  }

  setServerURL(url) {
      this.serverURL = url
  }
  
  setRepository(name) {
     this.q("#gitrepository").value = name
  }
  
  getRepository(name) {
     return this.q("#gitrepository").value
  }

  async gitControl(cmd, eachCB) {
    this.clearLog()
    return new Promise(async (resolve) => {
      lively.files.fetchChunks(fetch(this.getServerURL() +"/_git/" + cmd, {
              headers: await this.getHeaders()
            }), (eaChunk) => {
          if (eachCB) 
            eachCB(eaChunk)
          else
            this.log("" + eaChunk)
        }, resolve)
    })
  }

  onSyncButton() {
    this.sync()
  }

  sync() {
    return this.gitControl("sync")  
  }

  async onLoginButton() {
    this.clearLog()
    if (await this.loadValue("githubToken")) { 
      this.logout() 
    } else { 
      this.login()
    }
  }

  onBranchButton() {
    this.gitControl("branch")  
  }

  onStatusButton() {
    this.gitControl("status")  
  }
  
  onDiffButton() {
    this.gitControl("diff")  
  }

  async onCloneButton(){
    if (window.confirm("Do you want to clone into " + 
        this.q("#gitrepository").value)) {
      this.q("#cloneButton").disabled= true
      await this.gitControl("clone")
      this.updateContextSensitiveButtons()
      this.updateRepositoryList()
    }
  }

  onNpmInstallButton() {
    this.gitControl("npminstall")
  }

  onResolveButton() {
    this.gitControl("resolve")
  }

  onChangelogButton() {
   this.gitControl("log");
  }
  
  onCommitButton() {
    // return lively.notify("Commit is not implemented yet")  
    this.gitControl("commit");
  }
  
  onDeleteButton() {
    if (window.confirm("Do you want to delete " + this.q("#gitrepository").value + " repository?")) {
      this.gitControl("delete");
    }
  }
  
  onMergeButton() {
    if (window.confirm("Do you want to merge "
      + this.q("#gitrepositorybranch").value 
      +" into " + this.q("#gitrepository").value 
      + " repository?")) {
      this.gitControl("merge");
    }
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

  logout() {
    this.clearLog()
  	this.storeValue("githubToken", null)    
  	this.storeValue("githubUsername", null)    
  	this.storeValue("githubEmail", null)
    this.updateLoginStatus()
    this.log("")
  }

  async getGitRepositoryNames() {
    var json = await lively.files.statFile(this.getServerURL()).then( JSON.parse)
    return json.contents.filter(ea => ea.type == "directory").map(ea => ea.name)
  }

  async updateUpstreamURL() {
    var url = await this.gitControl("remoteurl")
    url = url.replace(/\n/,"")
    this.shadowRoot.querySelector("#gitrepositoryurl").value = url
  }
  
  async onGitrepositoryChanged(value) {
    this.updateContextSensitiveButtons()
  }
  
  async updateRepositoryList() {
    var list = await this.getGitRepositoryNames()
    this.shadowRoot.querySelector("#gitrepositories").innerHTML = 
      list.map(ea => "<option>" + ea).join("\n")
  }

  async updateBranchesList() {
    var branches = await this.gitControl("branches", ()=>{})
    branches = branches.split("\n")
    var currentRegex = /^ *\*/
    var currentBranch = _.detect(branches, ea => ea.match(currentRegex))
    if(!currentBranch) {
      return
    }
    currentBranch = currentBranch.replace(currentRegex,"")
    this.q("#gitrepositorybranch").value = currentBranch
    
    var remoteRegEx = /^remotes\/origin\//
    branches = branches
      .map(ea => ea.replace(/^\*? */,"")) // trim
      .filter(ea => ea.match(remoteRegEx))
      .filter(ea => ! ea.match("HEAD "))
      .map(ea => ea.replace(remoteRegEx,""))
    this.q("#gitbranches").innerHTML = branches.map(ea => "<option>" + ea).join("\n")
    console.log("branches: " + branches)
  }

  get repositoryBlacklist() {
    return ["lively4-core", "lively4-stable"]
  }
  
  async updateContextSensitiveButtons() {
    
    var repository = this.q("#gitrepository").value
    var list = await this.getGitRepositoryNames()
    var exists = _.include(list, repository)
    
    console.log("delete " + this.q("#deleteButton").disabled)

    if (exists) {
      
      this.updateUpstreamURL()
      this.updateBranchesList() 
    }

    _.each(this.shadowRoot.querySelectorAll(".repo"), ea => 
      ea.disabled= !this.loggedin || !exists)

    _.each(this.shadowRoot.querySelectorAll(".branch"), ea => 
      ea.disabled= !this.loggedin)
      
    _.each(this.shadowRoot.querySelectorAll(".clone"), ea => 
      ea.disabled= !this.loggedin || exists)
      
    _.each(this.shadowRoot.querySelectorAll(".login"), ea => 
      ea.disabled= this.loggedin)

    if (_.include(this.repositoryBlacklist, repository))
      this.q("#deleteButton").disabled = true
  }
}
