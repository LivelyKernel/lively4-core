'use strict';

import files from "./files.js"


export default class External {

  static copyFile(fromURL, toURL) {
    return files.loadFile(fromURL)
      .then(r => files.saveFile(toURL, r)).then( () => toURL);
  }
  
  static copy(fromDir, toDir) {
    return this.copyFile(fromDir + name, toDir + name)
      .then( () => lively.notify("updated " + name));
  }
  
  static updateExternalModules() {
    External.copy( "https://lively-kernel.org/lively4/ContextJS/Layers.js", lively4url + "/src/external/ContextJS.js")
    External.copy( "https://d3js.org/d3.v3.js", lively4url + "/src/external/d3.v3.js")
  }

}
