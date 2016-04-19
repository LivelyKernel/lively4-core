'use strict';

export default class Sync extends HTMLDivElement {
 
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
