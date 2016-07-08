import Morph from './Morph.js';
import Files from "src/client/files.js";
import * as search from "src/client/search/search.js";


export default class IndexManager extends Morph {

  initialize() {
    this.windowTitle = "Index Manager";
    this.serverList = this.getSubmorph("#server-list");
    this.dropboxList = this.getSubmorph("#dropbox-list");

    $(this.getSubmorph(".container")).on("click", ".refresh-button", evt => {
      let target = evt.currentTarget;
      this.refreshIndex(target.parentElement.parentElement.dataset.type, target.dataset.path);
    });

    $(this.getSubmorph(".container")).on("click", ".create-button", evt => {
      let target = evt.currentTarget;
      this.createIndex(target.parentElement.parentElement.dataset.type, target.dataset.path);
    });

    let mountRequest = new Request("https://lively4/sys/mounts");
    Promise.all([
      fetch(mountRequest).then(resp => {
        return resp.json();
      }).then(mounts => {
        this.appendDropboxes(mounts.filter(m => { return m.name === "dropbox" }));
      }),
      this.appendServerRepos()
    ]).then(() => {
      let availableMounts = search.getAvailableMounts();
      Object.keys(availableMounts.dropbox).forEach(path => {
        this.refreshIndex("dropbox", path);
      });
      this.refreshIndex("server", "/" + window.location.pathname.split("/")[1]);
    });


  }

  appendDropboxes(mounts) {
    mounts.forEach(mount => {
      this.dropboxList.innerHTML += this.getEntryFor(mount.path);
    });
  }

  appendServerRepos() {
    return Files.statFile(lively4url + "/..").then(res => {
    	return JSON.parse(res);
    }).then(jsonRes => {
    	return jsonRes.contents.filter(file => {
    		return file.type === "directory";
    	}).map(dir => {
    		return "/" + dir.name;
    	}).forEach(path => {
    	  this.serverList.innerHTML += this.getEntryFor(path);
    	});
    });
  }

  getEntryFor(path) {
    return `<p>
        ${path}:
        <i id=${path.slice(1)}-status>unknown</i>
        <button data-path=${path} class="refresh-button"><i class="fa fa-refresh" aria-hidden="true"></i></button>
        <button data-path=${path} class="create-button"><i class="fa fa-plus" aria-hidden="true"></i></button>
      </p>`
  }

  createIndex(mountType, path) {
    console.log("create index at", mountType, path);
    let statusText = this.getSubmorph(`#${path.slice(1)}-status`);
    statusText.innerHTML = "waiting...";
    search.loadIndex(mountType, path).then(() => {
      this.refreshIndex(mountType, path);
    });
  }

  refreshIndex(mountType, path) {
    let statusText = this.getSubmorph(`#${path.slice(1)}-status`);
    statusText.innerHTML = "waiting...";
    console.log("refresh index at", mountType, path);
    search.getStatus(mountType, path).then(status => {
      statusText.innerHTML = status;
    });
  }

}
