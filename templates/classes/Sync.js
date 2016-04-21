'use strict';

import Morph from './Morph.js';

export default class Sync extends Morph {
  initialize() {
    this.windowTitle = "Github Sync"
    var container = $(this.shadowRoot).find(".container")[0];
    lively.html.registerButtons(this)
    lively.html.registerInputs(this)
    this.updateLoginStatus()
    console.log("install..")
    
    var travis = this.shadowRoot.querySelector("#travisLink")
    travis.onclick = () => {
      window.open(travis.getAttribute("href"))
      return false
    } 
    
  }
  clearLog(s) {
    // this.shadowRoot.querySelector("#log").innerHTML = "" + s
    var editor= this.shadowRoot.querySelector("#log").editor
    if (editor) editor.setValue("")
  }

  log(s) {
    var editor = this.shadowRoot.querySelector("#log").editor
    if (editor) editor.setValue(editor.getValue() + "\n" + s)
  }

  async updateLoginStatus() {
    var token = await lively.focalStorage.getItem("githubToken")
    this.shadowRoot.querySelector("#loginButton").innerHTML = 
        token ? "logout" : "login"
    var login = token ? true : false
    this.loggedin = login
  
    this.shadowRoot.querySelector("#gitusername").value = 
      await lively.focalStorage.getItem("githubUsername")
    this.shadowRoot.querySelector("#gitemail").value = 
      await lively.focalStorage.getItem("githubEmail")
    
    var value =await lively.focalStorage.getItem("githubRepository") 
    if (value)
      this.shadowRoot.querySelector("#gitrepository").value = value
    
    this.updateContextSensitiveButtons()
    this.updateRepositoryList()
  
  }

  login() {
    lively.focalStorage.getItem("githubToken").then((result) => {
      if (result) return result
      return new Promise((resolve, reject) => {
        lively.authGithub.challengeForAuth(Date.now(), (token) => {  
      	  lively.focalStorage.setItem("githubUsername", 
      	    this.shadowRoot.querySelector("#gitusername").value)
      	  lively.focalStorage.setItem("githubEmail", 
      	    this.shadowRoot.querySelector("#gitemail").value)   
      	  lively.focalStorage.setItem("githubToken", token)
      	  this.updateLoginStatus()
      	  resolve(token)
        })
      })
    }).then((token) => {
      this.log("Logged in")
    })
  }

  async getHeaders() {
    return new Headers({
      "gitrepository": this.shadowRoot.querySelector("#gitrepository").value, 
      "gitusername":  this.shadowRoot.querySelector("#gitusername").value,
      "gitpassword":  await lively.focalStorage.getItem("githubToken"), 
      "gitemail": this.shadowRoot.querySelector("#gitemail").value,
      "gitrepositoryurl": this.shadowRoot.querySelector("#gitrepositoryurl").value,
	    "gitrepository": this.shadowRoot.querySelector("#gitrepository").value,
	    "gitrepositorybranch": this.shadowRoot.querySelector("#gitrepositorybranch").value
    })
  }

  async gitControl(cmd) {
    this.clearLog()
    var serverURL = lively4url.match(/(.*)\/([^\/]+$)/)[1]
    return new Promise(async (resolve) => {
      lively.files.fetchChunks(fetch(serverURL +"/_git/" + cmd, {
              headers: await this.getHeaders()
            }), (eaChunk) => {
          this.log("" + eaChunk)
        }, resolve)
    })
  }

  onSyncButton() {
    this.gitControl("sync")  
  }

  async onLoginButton() {
    this.clearLog()
    if (await lively.focalStorage.getItem("githubToken")) { 
      this.logout() 
    } else { 
      this.login()
    }
  }
  
  onStatusButton() {
    this.gitControl("status")  
  }
  
  onDiffButton() {
    this.gitControl("diff")  
  }

  async onCloneButton(){
    if (window.confirm("Do you want to clone into " + 
        this.shadowRoot.querySelector("#gitrepository").value)) {
      this.shadowRoot.querySelector("#cloneButton").disabled= true
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
   this.gitControl("log")
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
    var url = await that.gitControl("remoteurl")
    url = url.replace(/\n/,"")
    this.shadowRoot.querySelector("#gitrepositoryurl").value = url
  }
  
  // that.updateUpstreamURL
  
  async onGitrepositoryChanged(value) {
    this.updateContextSensitiveButtons()
    this.updateUpstreamURL()
  }
  
// that.shadowRoot.querySelector("#gitrepositories").innerHTML = "<option>bla" 

  async updateRepositoryList() {
    var list = await this.getGitRepositoryNames()
    this.shadowRoot.querySelector("#gitrepositories").innerHTML = 
      list.map(ea => "<option>" + ea).join("\n")
  }

  async updateContextSensitiveButtons() {
    var value = this.shadowRoot.querySelector("#gitrepository").value
    var list = await this.getGitRepositoryNames()
    var exists = _.include(list, value)

    _.each(this.shadowRoot.querySelectorAll(".repo"), ea => 
      ea.disabled= !this.loggedin || !exists)

    _.each(this.shadowRoot.querySelectorAll(".branch"), ea => 
      ea.disabled= !this.loggedin)
      
    _.each(this.shadowRoot.querySelectorAll(".clone"), ea => 
      ea.disabled= !this.loggedin || exists)
      
    _.each(this.shadowRoot.querySelectorAll(".login"), ea => 
      ea.disabled= this.loggedin)

  }
}
