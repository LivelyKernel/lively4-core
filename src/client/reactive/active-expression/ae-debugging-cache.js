import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import diff from 'src/external/diff-match-patch.js';
import { getAEDataForFile, getHooksInFile } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js'

export default class AEDebuggingCache {

  constructor() {
    this.registeredDebuggingViews = [];
    this.debouncedUpdateDebuggingViews = _.debounce(this.updateDebggingViews, 100);
    this.changedFiles = new Set();
  }
  /*MD ## Registration MD*/
  async registerFileForAEDebugging(url, context, aeDataCallback) {
    const callback = async () => {
      if (context && (!context.valid || context.valid())) {
        aeDataCallback((await this.getAEDataForFile(url)));
        return true;
      }
      return false;
    };
    this.registeredDebuggingViews.push({ callback, url });

    aeDataCallback((await this.getAEDataForFile(url)));
  }
  
  getAEDataForFile(url) {
    //Currently only supports RewritingAEs
    return getAEDataForFile(url);
  }

  /*MD ## Caching MD*/

  /*MD ## Code Change API MD*/
  async updateFile(url, oldCode, newCode) {
    AExprRegistry.fileSaved(url)
    try {
      const lineMapping = this.calculateMapping(oldCode, newCode);
      for (const ae of AExprRegistry.getLocationCache().getAEsInFile(url)) {
        const location = ae.meta().get("location");
        this.remapLocation(lineMapping, location);
      }
      for (const hook of await getHooksInFile(url)) {
        hook.getLocations().then(locations => {
          for (const location of locations) {
            this.remapLocation(lineMapping, location);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  remapLocation(lineMapping, location) {
    let [diff, lineChanged] = lineMapping[location.start.line];

    if (diff === -1) {
      location.start.line = 0;
    } else {
      location.start.line = diff;
    }

    let [diff2, lineChanged2] = lineMapping[location.end.line];

    if (diff2 === -1) {
      location.end.line = 0;
    } else {
      location.end.line = diff2;
    }
    if (lineChanged || lineChanged2) {
      lively.notify("Changed AE code for existing AE. There are outdated expressions in the system");
      //ToDo: Check if the content is similar enough, mark AEs as outdated
    }
  }

  calculateMapping(oldCode, newCode) {
    const mapping = []; //For each line of oldCode: new Line in newCode if existing, changedContent if the line no longer exists but can be mapped to a newCode line
    var dmp = new diff.diff_match_patch();
    var a = dmp.diff_linesToChars_(oldCode, newCode);
    var lineText1 = a.chars1;
    var lineText2 = a.chars2;
    var lineArray = a.lineArray;
    var diffs = dmp.diff_main(lineText1, lineText2, false);

    let originalLine = 0;
    let newLine = 0;
    let recentDeletions = 0;
    let recentAdditions = 0;
    for (let [type, data] of diffs) {
      if (type === 0) {
        recentDeletions = 0;
        recentAdditions = 0;
        for (let i = 0; i < data.length; i++) {
          mapping[originalLine] = [newLine, false];
          originalLine++;
          newLine++;
        }
      } else if (type === 1) {
        if (recentDeletions > 0) {
          const matchingLines = Math.max(recentDeletions, data.length);
          for (let i = 0; i < matchingLines; i++) {
            mapping[originalLine - matchingLines + i] = [newLine, true];
            newLine++;
          }
          data = data.substring(matchingLines);
        }
        if (data.length > 0) {
          newLine += data.length;
          recentAdditions += data.length;
        }
      } else {
        if (recentAdditions > 0) {
          const matchingLines = Math.max(recentAdditions, data.length);
          for (let i = 0; i < matchingLines; i++) {
            mapping[originalLine] = [newLine - matchingLines + i, true];
            originalLine++;
          }
          data = data.substring(matchingLines);
        }
        recentDeletions += data.length;
        for (let i = 0; i < data.length; i++) {
          mapping[originalLine] = [-1, false];
          originalLine++;
        }
      }
    }

    dmp.diff_charsToLines_(diffs, lineArray);

    return mapping;
  }
  
  updateFiles(files) {
    if (!files) return;
    files.forEach(file => {
      if(file) {
        this.changedFiles.add(file)
      }
    });
    this.debouncedUpdateDebuggingViews();
  }

  async updateDebggingViews() {
    for (let i = 0; i < this.registeredDebuggingViews.length; i++) {
      if (![...this.changedFiles].some(file => file.includes(this.registeredDebuggingViews[i].url))) continue;
      if (!(await this.registeredDebuggingViews[i].callback())) {
        this.registeredDebuggingViews.splice(i, 1);
        i--;
      }
    }
    this.changedFiles = new Set();
  }

}

export const DebuggingCache = new AEDebuggingCache();