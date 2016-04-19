'use strict';

export default class Sync extends HTMLDivElement {
   initialize() {
    var container = $(this.shadowRoot).find(".container")[0];
    lively.html.registerButtons(this)
    this.updateLoginStatus()
    console.log("install..")
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
    this.shadowRoot.querySelector("#syncButton").disabled = 
      token ? false : true;
    this.shadowRoot.querySelector("#gitusername").value = 
      await lively.focalStorage.getItem("githubUsername")
    this.shadowRoot.querySelector("#gitemail").value = 
      await lively.focalStorage.getItem("githubEmail")
    
    
    var value =await lively.focalStorage.getItem("githubRepository") 
    if (value)
      this.shadowRoot.querySelector("#gitrepository").value = value
      
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
      this.log("TOKEN: " + token)
    })
  }

  async getHeaders() {
    return new Headers({
      "gitrepository": this.shadowRoot.querySelector("#gitrepository").value, 
      "gitusername":  this.shadowRoot.querySelector("#gitusername").value,
      "gitpassword":  await lively.focalStorage.getItem("githubToken"), 
      "gitemail": this.shadowRoot.querySelector("#gitemail").value,
      "gitrepositoryurl": this.shadowRoot.querySelector("#gitrepositoryurl").value,
	    "gitrepositorytarget": this.shadowRoot.querySelector("#gitrepositorytarget").value,
    })
  }

  async gitControl(cmd) {
    this.clearLog()
    var serverURL = lively4url.match(/(.*)\/([^\/]+$)/)[1]
     lively.files.fetchChunks(fetch(serverURL +"/_git/" + cmd, {
            headers: await this.getHeaders()
          }), (eaChunk) => {
        this.log("" + eaChunk)
      }, (done) => {
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

  onCloneButton(){
    this.gitControl("clone")
    this.shadowRoot.querySelector("#gitrepository").value =  this.shadowRoot.querySelector("#gitrepositorytarget").value
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
  
  logout() {
    this.clearLog()
  	lively.focalStorage.setItem("githubToken", null)    
    this.updateLoginStatus()
    this.log("")
  }
}
