export default class LivelyChanges {
  
  static async applyContainerChanges(container, url, force = false, externalSourceCode = null) {
    console.log(`applyOutsideChanges called for ${url}, force=${force}, external=${!!externalSourceCode}`);
    
    var sourceCode;
    if (externalSourceCode !== null) {
      // Called from outside - use provided source code (from fresh file fetch)
      sourceCode = externalSourceCode;
    } else {
      // Called from internal save - use current editor content
      sourceCode = container.getSourceCode();
    }
    
    // Initialize global hash cache if not exists
    if (!lively.fileChangeHashes) {
      lively.fileChangeHashes = new Map();
    }
    
    // Calculate content hash (like git uses SHA-1)
    const contentHash = await container.calculateContentHash(sourceCode);
    const urlString = url.toString();
    
    console.log(`Content hash: ${contentHash.slice(0,8)}..., stored hash: ${lively.fileChangeHashes.get(urlString)?.slice(0,8) || 'none'}`);
    
    // Check if we should skip this update (same hash, not forced)
    if (!force && lively.fileChangeHashes.get(urlString) === contentHash) {
      console.log(`Skipping duplicate update for ${urlString} (same hash: ${contentHash.slice(0,8)}...)`);
      return;
    }
    
    console.log(`Proceeding with updates for ${urlString}`);
    // lively.notify("!!!saved " + url)
    window.LastURL = url
    // lively.notify("update file: " + container.getURL().pathname + " " + container.getURL().pathname.match(/css$/))
    if (container.getURL().pathname.match(/\.css$/)  && container.isLiveEvalEnabled()) {
      container.updateCSS();
    } else if (await container.isTemplate(url)  && container.isLiveEvalEnabled()) {
      lively.notify("update template")
      if (url.toString().match(/\.html/)) {
        // var templateSourceCode = await fetch(url.toString().replace(/\.[^.]*$/, ".html")).then( r => r.text())
        var templateSourceCode = sourceCode

        await lively.updateTemplate(templateSourceCode, url.toString());

      }
    } else if (container.getURL().pathname.match(/\.md$/)){
        var m = sourceCode.match(/markdown-config .*latex\=([^ ]*)/)
        if (m) {
          var dir = container.normalizeURL(container.getDir() + m[1])

          var m2 = sourceCode.match(/markdown-config .*pdf\=([^ ]*)/)
          if (m2) {
            var pdf = container.normalizeURL(container.getDir() + m2[1])          
          }
          container.buildLatex(dir, pdf)
        }
    }
    container.updateOtherContainers();

    var moduleName = container.getURL().pathname.match(/([^/]+)\.((js)|(ts))$/);
    if (moduleName) {
      moduleName = moduleName[1];

      const testRegexp = /((test\/.*)|([.-]test)|([.-]spec))\.((js)|(ts))/;
      if (container.lastLoadingFailed) {
        console.log("last loading failed... reload")
        await container.reloadModule(url); // use our own mechanism...
      } else if (container.getURL().pathname.match(testRegexp)) {
        await container.loadTestModule(url);
      } else if (container.isLiveEvalEnabled()) {
        // container.notify("load module " + moduleName)
        await container.loadModule("" + url)
        console.log("START DEP TEST RUN");
        var dependentTests = (await lively.findDependentModules("" + url))
          .filter(ea => ea.match(testRegexp))
        if (dependentTests.length > 0) {
          container.loadTestModule(...dependentTests);
        }
        
        console.log("END DEP TEST RUN")
      } else {
        lively.notify("ignore module " + moduleName)
      }
    }
    // container.showNavbar();
    container.updateNavbarDetails()
    container.runWorkflows()
    
    // Record hash after applying all changes (guard against future duplicates)
    lively.fileChangeHashes.set(urlString, contentHash);
    console.log(`Recorded hash for ${urlString}: ${contentHash.slice(0,8)}...`);
  }
  
  
}