'use strict';

import Morph from './Morph.js';

export default class Sync extends Morph {
  initialize() {
    this.windowTitle = "Github Sync"
    var container = this.q(".container");
    lively.html.registerButtons(this)
    lively.html.registerInputs(this)
    this.updateLoginStatus()

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
    var token = await lively.focalStorage.getItem("githubToken")
    this.q("#loginButton").innerHTML = 
        token ? "logout" : "login";
    var login = token ? true : false;
    this.loggedin = login;

    this.q("#gitusername").value = 
      await lively.focalStorage.getItem("githubUsername");
    this.q("#gitemail").value = 
      await lively.focalStorage.getItem("githubEmail");
    
    var value = await lively.focalStorage.getItem("githubRepository") 
    if (value)this.q("#gitrepository").value = value;
    
    this.updateContextSensitiveButtons();
    this.updateRepositoryList();
    this.updateBranchesList();
  }
  
  
  // #TODO pull into tool?
  store(key, value) {
    return lively.focalStorage.setItem(key, value)
  }
  
  load(key) {
    return lively.focalStorage.getItem(key)
  }

  login() {
    lively.focalStorage.getItem("githubToken").then((result) => {
      if (result) return result
      return new Promise((resolve, reject) => {
        lively.authGithub.challengeForAuth(Date.now(), (token) => {  
      	  this.store("githubUsername", this.q("#gitusername").value);
      	  this.store("githubEmail", this.q("#gitemail").value);
      	  this.store("githubToken", token);
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
      "gitpassword":          await this.load("githubToken"), 
      "gitemail":             this.q("#gitemail").value,
      "gitrepositoryurl":     this.q("#gitrepositoryurl").value,
	    "gitrepository":        this.q("#gitrepository").value,
	    "gitrepositorybranch":  this.q("#gitrepositorybranch").value,
	    "gitcommitmessage":     this.q("#gitcommitmessage").value,
	    "dryrun":               this.q("#dryrun").checked
    })
  }


  async gitControl(cmd, eachCB) {
    this.clearLog()
    var serverURL = lively4url.match(/(.*)\/([^\/]+$)/)[1]
    return new Promise(async (resolve) => {
      lively.files.fetchChunks(fetch(serverURL +"/_git/" + cmd, {
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
    this.gitControl("sync")  
  }

  async onLoginButton() {
    this.clearLog()
    if (await this.load("githubToken")) { 
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
    return "LivelySyntax_"
  }
  
  async storeValue(key, value) {
    return  lively.focalStorage.setItem(this.storagePrefix + key, value)
  }
  
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key)
  }

  logout() {
    this.clearLog()
  	lively.focalStorage.setItem("githubToken", null)    
    this.updateLoginStatus()
    this.log("")
  }

  async getGitRepositoryNames() {
    var json = await lively.files.statFile(lively4url +'/../').then( JSON.parse)
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
      .replace(currentRegex,"")
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
