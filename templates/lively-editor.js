
import Morph from './Morph.js';
import moment from "src/external/moment.js";

export default class Editor extends Morph {

  initialize() {
    var container = this.get(".container");
    lively.html.registerButtons(this);
    var input = this.get("#filename");
    $(input).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this.onFilenameEntered(input.value);
      }
    });
    container.dispatchEvent(new Event("initialized"));
  }

  onSaveButton() {
    this.saveFile();
  }
  
  onLoadButton() {
    this.loadFile();
  }
  
  onVersionsButton() {
    this.toggleVersions();
  }
  
  onLoadVersionButton() {
    this.loadFile(this.currentVersion());
  }

  onCloseVersionsButton() {
    this.get("#versionControl").style.display = "none";
  }

  currentVersion() {
    var selection = this.get("#versions").selection;
    if (selection) return selection.version;
  }
  
  onFilenameEntered() {
    this.loadFile();
  }

  getMountURL() {
    return "https://lively4/sys/fs/mount";
  }

  currentEditor() {
    return this.getSubmorph('juicy-ace-editor').editor;
  }

  getURL() {
    var filename = $(this.getSubmorph('#filename')).val();
    return new URL(filename);
  }

  setURL(urlString) {
    var url = new URL(urlString);
    this.getSubmorph("#filename").value = url.href;
  }

  setText(text) {
    this.getSubmorph("juicy-ace-editor").editor.setValue(text);
    this.updateAceMode();
  }

  updateAceMode() {
    var url = this.getURL();
    var editorComp = this.getSubmorph("juicy-ace-editor");
    editorComp.changeModeForFile(url.pathname);
  }

  loadFile(version) {
    this.lastVersion = version
    var url = this.getURL();
    console.log("load " + url);
    this.updateAceMode();

    lively.files.loadFile(url, version).then(
      (text) => {
        this.lastText = text
        this.currentEditor().setValue(text);
        this.currentEditor().resize();
        console.log("file " + url + " read.");
        console.log("content: " + text);
      },
      (err) => {
        lively.notify("Could not load file " + url +"\nMaybe next time you are more lucky?");
      });
  }

  saveFile() {
    var url = this.getURL();
    console.log("save " + url + "!");
    var data = this.currentEditor().getValue();
    return lively.files.saveFile(url, data).then(() => {
        console.log("edited file " + url + " written.");
      }).then( (sourceCode) => {
          lively.notify("saved file", url );
        }, (err) => {
           lively.notify("Could not save file" + url +"\nMaybe next time you are more lucky?");
        }
      ); // don't catch here... so we can get the error later as needed...
  }

  hideToolbar() {
    this.getSubmorph("#toolbar").style.display = "none";
  }

  toggleVersions() {
    var versionControl = this.shadowRoot.querySelector("#versionControl");
    if (versionControl.style.display == "block") {
      versionControl.style.display = "none";
    } else {
      versionControl.style.display = "block";
      versionControl.querySelector("#versions").showVersions(this.getURL());
    }
  }

  livelyMigrate(obj) {
    this.setURL(obj.getURL());
    this.loadFile();
  }
}