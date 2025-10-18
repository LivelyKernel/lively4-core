import {updateEditors, updateLivelyIFrames} from "utils";

export default class LivelyChanges {
  
  static async calculateContentHash(content) {
    // Use SHA-1 like git
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  static initializeHashCache() {
    // Initialize global hash cache if not exists
    if (!lively.fileChangeHashes) {
      lively.fileChangeHashes = new Map();
    }
  }
  
  static shouldSkipUpdate(url, contentHash, force) {
    this.initializeHashCache();
    const urlString = url.toString();
    const storedHash = lively.fileChangeHashes.get(urlString);
    
    console.log(`Content hash: ${contentHash.slice(0,8)}..., stored hash: ${storedHash?.slice(0,8) || 'none'}`);
    
    // Check if we should skip this update (same hash, not forced)
    if (!force && storedHash === contentHash) {
      console.log(`Skipping duplicate update for ${urlString} (same hash: ${contentHash.slice(0,8)}...)`);
      return true;
    }
    
    console.log(`Proceeding with updates for ${urlString}`);
    return false;
  }
  
  static recordHash(url, contentHash) {
    this.initializeHashCache();
    const urlString = url.toString();
    lively.fileChangeHashes.set(urlString, contentHash);
    console.log(`Recorded hash for ${urlString}: ${contentHash.slice(0,8)}...`);
  }
  
  static getFileType(url) {
    const pathname = url.pathname || url.toString();
    
    if (pathname.match(/\.css$/)) return 'css';
    if (pathname.match(/\.html$/)) return 'template';
    if (pathname.match(/\.md$/)) return 'markdown';
    if (pathname.match(/\.((js)|(ts))$/)) return 'module';
    
    return 'other';
  }
  
  static isTestFile(url) {
    const pathname = url.pathname || url.toString();
    const testRegexp = /((test\/.*)|([.-]test)|([.-]spec))\.((js)|(ts))/;
    return pathname.match(testRegexp);
  }
  
  static async updateCSSFile(container, url, sourceCode) {
    if (container.isLiveEvalEnabled()) {
      container.updateCSS();
    }
  }
  
  static async updateTemplateFile(container, url, sourceCode) {
    if (await container.isTemplate(url) && container.isLiveEvalEnabled()) {
      lively.notify("update template");
      await lively.updateTemplate(sourceCode, url.toString());
    }
  }
  
  static async updateMarkdownFile(container, url, sourceCode) {
    var m = sourceCode.match(/markdown-config .*latex\=([^ ]*)/);
    if (m) {
      var dir = container.normalizeURL(container.getDir() + m[1]);
      var m2 = sourceCode.match(/markdown-config .*pdf\=([^ ]*)/);
      if (m2) {
        var pdf = container.normalizeURL(container.getDir() + m2[1]);
      }
      container.buildLatex(dir, pdf);
    }
  }
  
  static async updateModuleFile(container, url, sourceCode) {
    var moduleName = container.getURL().pathname.match(/([^/]+)\.((js)|(ts))$/);
    if (!moduleName) return;
    
    moduleName = moduleName[1];

    if (container.lastLoadingFailed) {
      console.log("last loading failed... reload");
      await container.reloadModule(url);
    } else if (LivelyChanges.isTestFile(container.getURL())) {
      await container.loadTestModule(url);
    } else if (container.isLiveEvalEnabled()) {
      await container.loadModule("" + url);
      console.log("START DEP TEST RUN");
      var dependentTests = (await lively.findDependentModules("" + url))
        .filter(ea => LivelyChanges.isTestFile({pathname: ea}));
      if (dependentTests.length > 0) {
        container.loadTestModule(...dependentTests);
      }
      console.log("END DEP TEST RUN");
    } else {
      lively.notify("ignore module " + moduleName);
    }
  }
  
  static async updateOtherContainers(url, excludeContainer = null) {
    await lively.sleep(100); // save is async...
    
    // Update editors and iframes
    const excludeEditor = excludeContainer ? excludeContainer.get("lively-editor") : null;
    updateEditors(url, excludeEditor ? [excludeEditor] : []);
    updateLivelyIFrames(url);
  
    // Update other containers showing the same file
    document.body.querySelectorAll('lively-container').forEach(ea => {
      if (ea !== excludeContainer && !ea.isEditing()
        && ("" + ea.getURL()).match(url.toString().replace(/\.[^.]+$/,""))) {
        console.log("update container content: " + ea);
        ea.setPath(ea.getURL() + "");        
      }
    });
  }
  
  
  static async applyContainerChanges(container, url, sourceCode, force = false) {
    console.log(`applyChanges called for ${url}, force=${force}, container=${!!container}, sourceCode provided=${!!sourceCode}`);
    
    // If no sourceCode provided, get it from container (container required in this case)
    if (!sourceCode) {
      if (!container) {
        throw new Error('Either sourceCode or container must be provided');
      }
      sourceCode = container.getSourceCode();
    }
    
    // Calculate content hash (like git uses SHA-1)
    const contentHash = await LivelyChanges.calculateContentHash(sourceCode);
    
    // Check if we should skip this update based on hash
    if (LivelyChanges.shouldSkipUpdate(url, contentHash, force)) {
      return;
    }
    // lively.notify("!!!saved " + url)
    window.LastURL = url
    
    const fileType = LivelyChanges.getFileType(url);
    
    // Apply file-type specific updates
    switch (fileType) {
      case 'css':
        if (container) {
          await LivelyChanges.updateCSSFile(container, url, sourceCode);
        }
        break;
      case 'template':
        if (container) {
          await LivelyChanges.updateTemplateFile(container, url, sourceCode);
        } else {
          // Can update templates without container
          if (url.toString().match(/\.html/)) {
            await lively.updateTemplate(sourceCode, url.toString());
          }
        }
        break;
      case 'markdown':
        if (container) {
          await LivelyChanges.updateMarkdownFile(container, url, sourceCode);
        }
        break;
      case 'module':
        if (container) {
          await LivelyChanges.updateModuleFile(container, url, sourceCode);
        } else {
          // Could potentially reload modules without container in future
          console.log(`Module detected but no container: ${url}`);
        }
        break;
    }
    
    // Record hash after applying all changes (guard against future duplicates)
    LivelyChanges.recordHash(url, contentHash);
    
    // Update other containers/editors showing the same file
    await LivelyChanges.updateOtherContainers(url, container);
    
    // Apply remaining container-specific UI updates if container is provided
    if (container) {
      // container.showNavbar();
      container.updateNavbarDetails();
      container.runWorkflows();
    }
  }
  
  
}