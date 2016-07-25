import Morph from './Morph.js';
import Files from "src/client/files.js";
import * as search from "src/external/lively4-search/client/search.js";


export default class IndexManager extends Morph {

  initialize() {
    this.windowTitle = "Index Manager";
    this.serverList = this.getSubmorph("#server-table");
    this.dropboxList = this.getSubmorph("#dropbox-table");

    $(this.getSubmorph(".container")).on("click", ".refresh-button", evt => {
      let target = evt.currentTarget;
      this.refreshIndex(target.dataset.mountType, target.dataset.path);
    });

    $(this.getSubmorph(".container")).on("click", ".create-button", evt => {
      let target = evt.currentTarget;
      this.createIndex(target.dataset.mountType, target.dataset.path);
    });

    $(this.getSubmorph(".container")).on("click", ".remove-button", evt => {
      let target = evt.currentTarget;
      this.removeIndex(target.dataset.mountType, target.dataset.path);
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

      for (let type in availableMounts) {
        if (type !== "server" && type !== "dropbox") {
          continue;
        }
        for (let path in availableMounts[type]) {
          this.refreshIndex(type, path);
        }
      }
    });


  }

  appendDropboxes(mounts) {
    mounts.forEach(mount => {
      this.dropboxList.innerHTML += this.getEntryFor("dropbox", mount.path);
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
    	  this.serverList.innerHTML += this.getEntryFor("server", path);
    	});
    });
  }

  getEntryFor(mountType, path) {
    return `<tr>
        <td>${path}</td>
        <td><i id=${path.slice(1)}-status>unknown</i></td>
        <td>
          <button data-path=${path} data-mount-type=${mountType} class="refresh-button" title="Refresh status"><i class="fa fa-refresh" aria-hidden="true"></i></button>
          <button data-path=${path} data-mount-type=${mountType} class="create-button" title="Load or create index"><i class="fa fa-plus" aria-hidden="true"></i></button>
          <button data-path=${path} data-mount-type=${mountType} class="remove-button" title="Remove index"><i class="fa fa-trash" aria-hidden="true"></i></button>
        </td>
      </tr>`
  }

  createIndex(mountType, path) {
    console.log("create index at", mountType, path);
    let statusText = this.getSubmorph(`#${path.slice(1)}-status`);
    statusText.innerHTML = `<i class="fa fa-spinner fa-pulse fa-fw"></i>`;
    search.prepareForSearch(mountType, path).then(() => {
      this.refreshIndex(mountType, path);
    });
  }

  refreshIndex(mountType, path) {
    let statusText = this.getSubmorph(`#${path.slice(1)}-status`);
    statusText.innerHTML = `<i class="fa fa-spinner fa-pulse fa-fw"></i>`;
    console.log("refresh index at", mountType, path);
    search.getStatus(mountType, path).then(status => {
      statusText.innerHTML = status;
    });
  }

  removeIndex(mountType, path) {
    console.log("remove index at", mountType, path);
    let statusText = this.getSubmorph(`#${path.slice(1)}-status`);
    statusText.innerHTML = `<i class="fa fa-spinner fa-pulse fa-fw"></i>`;
    search.removeIndex(mountType, path).then(() => {
      this.refreshIndex(mountType, path);
    });
  }

}
