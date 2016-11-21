import Morph from "./Morph.js"

export default class FileBrowser extends Morph {
  initialize() {
    if (!this._path) {
      // initialize is called after the created callback was invoked, which
      // is why path might be already set
      this.path = '/';
    }

    let location = this.get('#location')
    location.addEventListener('keypress', (event) => {
      if(event.keyCode !== 13)
        return

      this.path = event.target.value
    })

    this.get('#up').addEventListener('click', (event) => {
      event.preventDefault()
      this.path = this.path + '/..'
    })

    this.get('#home').addEventListener('click', (event) => {
      event.preventDefault()
      this.path = '/'
    })
    this.addEventListener('file-select', (event) => {
      lively.notify("file select")
      if (this.mainAction) {
        this.mainAction(event.file.url);
      } else {
        lively.openFile(event.file.url);
      }
    });
  }

  set path(value) {
    if (value.match(/^https?:\/\//)) {
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
    return (this._path && this._path[0] && this._path[0].match(/^https?:\/\//) ? "" : '/') 
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
    this.shadowRoot.querySelector("#toolbar").style.display = "none";
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
      if(Array.isArray(json.contents) && json.type === 'directory') {
        return json;
      } else {
        console.log(json);
        throw new Error('Invalid JSON response content. Not a directory?');
      }
    }).then((json) => {
      let contents = this.shadowRoot.querySelector('#contents');

      if(path !== this.path) {
        console.log('Path already changed. Skip update.');
        return;
      }

      // clear contents
      while(contents.firstChild) {
        contents.removeChild(contents.firstChild);
      }
      
      json.contents.forEach((file) => {
        let item = document.createElement('lively-file-browser-item');

        item.type = file.type;
        item.name = file.name;
        item.size = file.size;

        item.addEventListener('click', (event) => {
          var newPath = path + '/' + file.name;
          var baseURL = newPath.match(/https?:\/\//) ? "" : 'https://lively4'; 
          var newURL = new URL(baseURL + newPath);

          if(file.type === 'directory') {
            if (this.mainDirectoryAction)
              this.mainDirectoryAction(newURL)
            else
              this.path = newPath;
          } else {
            let event = new Event("file-select");
            event.file = Object.assign({}, file, {
              path: newPath,
              url: newURL
            });
            this.dispatchEvent(event);
          }
        });
        contents.appendChild(item);
      });
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
}
