import Morph from "src/components/widgets/lively-morph.js"
import FileMenu from "src/client/file-menu.js"

export default class FileBrowser extends Morph {
  initialize() {
    if (!this._path) {
      // initialize is called after the created callback was invoked, which
      // is why path might be already set
      // this.path = lively4url;
    }

    let location = this.get('#location')
    location.addEventListener('keypress', (evt) => {
      if(evt.keyCode !== 13) {
        return;
      }
      this.path = evt.target.value;
    })

    this.get('#up').addEventListener('click', (evt) => {
      if (!this.path) return;
      evt.preventDefault();
      this.path = this.path + '/..';
    })

    this.get('#home').addEventListener('click', (evt) => {
      evt.preventDefault()
      this.path = lively4url;
    })
    
    if (this.getAttribute("toolbar") == "false") {
      this.hideToolbar()
    }
    
    this.addEventListener('contextmenu', (evt) => {
      if (!evt.shiftKey) {
          this.onContextMenu(evt)
          evt.stopPropagation();
          evt.preventDefault();
          return true;
        }
    }, false);
  }
  
  selectFile(evt, file) {
    if (!evt.shiftKey && this.currentItem === file.item) {
      if (this.mainAction) {
        this.mainAction(file.url);
      } else {
        lively.openBrowser(file.url);
      }        
    } else {
      if (evt.shiftKey) {
        lively.notify("shift " + file.name)
        if (file.item.classList.contains("selected")) {
            file.item.classList.remove("selected")
            this.currentItem = null
        } else {
            file.item.classList.add("selected")
            this.currentItem = file.item
        }
      } else {
        this.items.forEach(ea => ea.classList.remove("selected"))
        this.currentItem = file.item
        this.currentItem.classList.add("selected")          
      }
    }
  }

  getSelection() {
    return this.items.filter(ea => ea.classList.contains("selected")).map(ea => this.getRoot() + ea.name)
  }
  
  getRoot(url) {
    url = url || this.url;
    return url.toString().replace(/\/[^/]+$/,"/") 
  }
  
  onContextMenu(evt, otherUrl=this.getRoot()) {
    (new FileMenu(this)).onContextMenu(evt, otherUrl)
  }

  set path(value) {
    if (lively.files.isURL(value)) {
      // lively.notify("set path: " + value)
      this._path = [value];
      this.updateURL(value);
    } else {
      let source = value.split(/\/+/).filter((str) => str.length > 0);
      let target = [];
  
      if(value.charAt(0) !== '/')
        target = target.concat(this._path);
  
      for(let token of source) {
        if(token === '..') {
          target.pop();
        } else if(target !== '' && target !== '.') {
          target.push(token);
        }
      }
      this._path = target;
      this.updateURL('https://lively4' + this.path);
    }
  }

  /** Pluging API  
    - use it it to replace behavior of browsing direcotries and files 
  */
  setMainAction(cb) {
    this.mainAction = cb;
  }

  setMainDirectoryAction(cb) {
    this.mainDirectoryAction = cb;
  }

  /** Path  API */
  get path() {
    if (!this._path) return "/";
    return (this._path && this._path[0] && lively.files.isURL(this._path[0]) ? "" : '/') 
      + this._path.join('/');
  }

  get url() {
    return this.getURL();
  }

  updateURL(url) {
    this.setAttribute("url", ""+url);
    this._update();
  }

  /** URL API */
  async setURL(url) {
    this.path = url ? url.toString() : "/"
    return  Promise.resolve(url);
  }

  getURL() {
    return new URL(this.getAttribute("url"));
  }

  hideToolbar() {
    this.setAttribute("toolbar", "false")
    this.shadowRoot.querySelector("#toolbar").style.display = "none";
  }

  
  get items() {
    return Array.from(this.get("#contents").querySelectorAll("lively-file-browser-item"))
  }
  
  _update() {
    let path = this.path;

    this.get('#location').value = path;
    this.get('#error').classList.remove('visible');

    fetch(this.getURL(), {method: 'OPTIONS'}).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        return response.json()
          .catch((err) => {
            throw new Error(response.statusText + ' (' + response.status + ')');
          })
          .then((json) => {
            if(json.message)
              throw new Error(json.message);
            else
              throw new Error(response.statusText + ' (' + response.status + ')');
          });
      }
    }).then((json) => {
      if(Array.isArray(json.contents) /* && json.type === 'directory' */) {
        return json;
      } else {
        console.log(json);
        throw new Error('Invalid JSON response content. Not a directory?');
      }
    }).then(async (json) => {
      let contents = this.shadowRoot.querySelector('#contents');

      if(path !== this.path) {
        console.log('Path already changed. Skip update.');
        return;
      }

      // clear contents
      while(contents.firstChild) {
        contents.removeChild(contents.firstChild);
      }
      
      for (let file of json.contents) {
        let item = await (<lively-file-browser-item mode="list"></lively-file-browser-item>);

        item.type = file.type;
        item.name = file.name;
        item.size = file.size;

        item.addEventListener('click', (evt) => {
          var newPath = path + '/' + file.name;
          var baseURL = lively.files.isURL(newPath)? "" : 'https://lively4'; 
          var newURL = new URL(baseURL + newPath);

          if(file.type === 'directory') {
            if (this.mainDirectoryAction)
              this.mainDirectoryAction(newURL)
            else
              this.path = newPath;
          } else {
            let file = {
              path: newPath,
              url: newURL,
              item: item
            }
            this.selectFile(evt, file);
            
          }
        });
        item.addEventListener('contextmenu', (evt) => {
          if (!evt.shiftKey) {
            let otherUrl = this.url + item.name
            this.onContextMenu(evt, otherUrl)
            evt.stopPropagation();
            evt.preventDefault();
            return true;
          }
        }, false)
        contents.appendChild(item);
      }
    }).then(() => {
      // remove old errors
      this.get('#error').innerHTML = "";
      this.get('#error').classList.remove('visible');
    }).catch((err) => {
      console.error(err);
      this.get('#error').innerHTML = err.toString();
      this.get('#error').classList.add('visible');
    });
  }
  
  livelyMigrate(other) {
    this.path = other.path
    this.mainAction = other.mainAction
  }
}
