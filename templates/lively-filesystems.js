import authGithub from 'src/client/auth-github.js'
import authDropbox from 'src/client/auth-dropbox.js'
import authGoogledrive from 'src/client/auth-googledrive.js'

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivleyFilesystems extends Morph { 

  initialize() {
      var container = $(this.shadowRoot).find(".container")[0];

      this.windowTitle = "Lively Mounts";
      // #TODO refactor to "connections"

      this.get('#githubLoginButton').addEventListener('click', () => {});
      this.get('#githubLogoutButton').addEventListener('click', () => this.logoutGitHub());
      this.get('#dropboxLoginButton').addEventListener('click', () => this.loginDropbox());
      this.get('#dropboxLogoutButton').addEventListener('click', () => this.logoutDropbox());
      this.get('#googledriveLoginButton').addEventListener('click', () => this.loginGoogledrive());
      this.get('#googledriveLogoutButton').addEventListener('click', () => this.logoutGoogledrive());
      this.get('#httpMountButton').addEventListener('click', () => this.mountHttp());
      this.get('#updateMountList').addEventListener('click', () => this.updateMountList());

      this.updateMountList();

      container.dispatchEvent(new Event("initialized"));
  }
  
  getMountURL() { return "https://lively4/sys/fs/mount"; }
    
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
      success: text => {
        console.log("mounted http")
        this.updateMountList()
      },
      error: (xhr, status, error) => {
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

        list.innerHTML = "";
        mounts.forEach(ea => {
          let remotePoint = ea.options ? '> ' + (ea.options.base || ea.options.branch || ea.options.subfolder || '') : '';
          
          list.appendChild(<li>
            {ea.path} {remotePoint} ({ea.name})
            <button class="unmount" click={() => {
              this.unmountPath(ea.path);
            }}>unmount</button>
            <button class="browse" click={() => {
              lively.openBrowser("https://lively4" + ea.path);
            }}>browse</button>
           </li>);
        });
      },
      error: (xhr, status, error) => {
        console.log("could not get list of mounts: " + error)
      }
    });
  }
}