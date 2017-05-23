import authGithub from 'src/client/auth-github.js'
import authDropbox from 'src/client/auth-dropbox.js'
import authGoogledrive from 'src/client/auth-googledrive.js'

import Morph from './Morph.js';

export default class LivleyFilesystems extends Morph { 

  initialize() {
      var container = $(this.shadowRoot).find(".container")[0];

      this.windowTitle = "Lively Mounts";
      // #TODO refactor to "connections"


      $(this.getSubmorph('#githubLoginButton')).click(() => {
      });
        
      $(this.getSubmorph('#githubLogoutButton')).click(() => {
        this.logoutGitHub()});

      $(this.getSubmorph('#dropboxLoginButton')).click(() => {
        this.loginDropbox()});
        
      $(this.getSubmorph('#dropboxLogoutButton')).click(() => {
        this.logoutDropbox()});

      $(this.getSubmorph('#googledriveLoginButton')).click(() => {
        this.loginGoogledrive()})
      $(this.getSubmorph('#googledriveLogoutButton')).click(() => {
        this.logoutGoogledrive()})

      $(this.getSubmorph('#httpMountButton')).click(() => {
        this.mountHttp()})

      $(this.getSubmorph('#updateMountList')).click(() => {
        this.updateMountList()})

      this.updateMountList()

      container.dispatchEvent(new Event("initialized"))
  }
  
  getMountURL() {
    return "https://lively4/sys/fs/mount"
  }
    
  loginGitHub() {
    console.log("login")
    var mountPath = this.shadowRoot.querySelector('#githubMount').value
    var repo = this.shadowRoot.querySelector('#githubRepo').value
    var branch = this.shadowRoot.querySelector('#githubBranch').value

    authGithub.challengeForAuth(Date.now(), (token) => {
      console.log('We are authenticated with the Token: ' + token)
      var mountGithub = {
        "path": mountPath,
        "name": "github",
        "options": {
          "repo":  repo,
          "branch": branch,
          "token": token
        }
      }
      console.log("mount: " + this.getMountURL())
      $.ajax({
        url: this.getMountURL(),
        type: 'PUT',
        data: JSON.stringify(mountGithub),
        success: function(text) {
          console.log("mounted github")
        },
        error: function(xhr, status, error) {
          console.log("could not mount gitub " + error)
        }
      });
    })
  }
  
  logoutGitHub() {
    authGithub.logout();
    console.log('logged out of github')
    var unmountGithub = {
      "path": "/",
      "name": "github",
      "options": {
        "repo": "LivelyKernel/lively4-core",
        "branch": "gh-pages"
         // No token, so we mount it read-only
      }
    }
    $.ajax({
      url: this.getMountURL(),
      type: 'PUT',
      data: JSON.stringify(unmountGithub),
      success: (text) => {
        console.log("unmounted github")
        this.updateMountList()
      },
      error: function(xhr, status, error) {
        console.log("could not unmount github " + error)
      }
    });
  }

  loginDropbox() {
    console.log("login dropbox")

    // #FutureWork -> make object lookup look nicer
    var mountPath = this.shadowRoot.querySelector('#dropboxMountPath').value
    var subfolder = this.shadowRoot.querySelector('#dropboxSubfolder').value

    lively.authDropbox.challengeForAuth(Date.now(), (token) => {
        console.log('We are authenticated with the Token: ' + token)
        var mount = {
          "path": mountPath,
          "name": "dropbox",
          "options": {
            "token": token,
            "subfolder": subfolder
          }
        }
        console.log("mount: " + this.getMountURL())
        $.ajax({
          url: this.getMountURL(),
          type: 'PUT',
          data: JSON.stringify(mount),
          success: (text) => {
            console.log("mounted dropbox")
            this.updateMountList()
          },
          error: function(xhr, status, error) {
            console.log("could not mount dropbox " + error)
          }
        });
    })
}   

  logoutDropbox() {
    authDropbox.logout();
    lively.notify('logged out of dropbox');
  }
      
  loginGoogledrive() {
    console.log("login googledrive")

    var mountPath = this.shadowRoot.querySelector('#googledriveMountPath').value
    var subfolder = this.shadowRoot.querySelector('#googledriveSubfolder').value

    lively.authGoogledrive.challengeForAuth(Date.now(), (token) => {
        console.log('We are authenticated with the Token: ' + token)
        var mount = {
          "path": mountPath,
          "name": "googledrive",
          "options": {
            "token": token,
            "subfolder": subfolder
          }
        }
        console.log("mount: " + this.getMountURL())
        $.ajax({
          url: this.getMountURL(),
          type: 'PUT',
          data: JSON.stringify(mount),
          success: (text) => {
            console.log("mounted googledrive")
            this.updateMountList()
          },
          error: function(xhr, status, error) {
            console.log("could not mount googledrive " + error)
          }
        });
    })
  } 
  
  logoutGoogledrive() {
    lively.authGoogledrive.logout();
    lively.notify('logged out of googledrive')
  }

  mountHttp() {
    console.log("mount http")

    var mountPath = this.shadowRoot.querySelector('#httpMountPath').value
    var httpUrl = this.shadowRoot.querySelector('#httpUrl').value

    var mount = {
      "path": mountPath,
      "name": "http",
      "options": {
        "base": httpUrl
      }
    }
    
    $.ajax({
      url: this.getMountURL(),
      type: 'PUT',
      data: JSON.stringify(mount),
      success: (text) => {
        console.log("mounted http")
        this.updateMountList()
      },
      error: function(xhr, status, error) {
        console.log("could not mount http " + error)
      }
    });
  }
     
  unmountPath(path) {
    console.log("unmountPath: " + path)
    $.ajax({
      url: "https://lively4/sys/fs/umount",
      type: 'PUT',
      data: JSON.stringify({path: path}),
      success: (text) => {
        console.log("unmounted path: " + path)
        this.updateMountList()
      },
      error: function(xhr, status, error) {
        alert("could not unmount path: "  + path +  error)
      }
    });
  }
    
  updateMountList() {
    $.ajax({
      url: "https://lively4/sys/mounts",
      type: 'GET',
      success: (text) => {
        console.log("show mounts...")
        var list = this.shadowRoot.querySelector('#listOfMountPoints')
        var mounts = JSON.parse(text)
        console.log(mounts)

        list.innerHTML = ""
        mounts.forEach(ea => {
          let listItem = document.createElement("li")
          listItem.innerHTML = ea.path + " (" + ea.name +") "

          let button = document.createElement("button")
          button.innerHTML="unmount"
          button.onclick = () => { this.unmountPath(ea.path)}
          button.setAttribute("class","unmount")
          listItem.appendChild(button)

          let browseButton = document.createElement("button")
          browseButton.innerHTML="browse"
          browseButton.onclick = () => {
            var browser = lively.components.createComponent("lively-file-browser");
            lively.components.openInWindow(browser).then(() => {
              browser.path = ea.path
            });
          }
          browseButton.setAttribute("class","browse")
          listItem.appendChild(browseButton)
          list.appendChild(listItem)
        })
      },
      error: function(xhr, status, error) {
        console.log("could not get list of mounts: " + error)
      }
    });
  }
}