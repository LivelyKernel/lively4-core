'use strict';

import files from "./files.js"


export default class External {

  static copyFile(fromURL, toURL) {
    return files.loadFile(fromURL)
      .then(r => files.saveFile(toURL, r));
  }
  
  static updateModule(name, fromDir, toDir) {
    return this.copyFile(fromDir + name, toDir + name)
      .then( () => lively.notify("updated " + name));
  }
  
  static updateExternalModules() {
    this.updateModule("lively.modules-with-lively.vm.js", 
      "https://lively-kernel.org/lively4/lively.modules/dist/", lively4url + "/src/external/");
  }

}
