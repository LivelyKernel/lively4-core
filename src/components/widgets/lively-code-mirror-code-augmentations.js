export default class CodeMirrorCodeAugmentations {

  constructor(astCapabilities, codeMirror) {
    this.astCapabilities = astCapabilities;
    this.codeMirror = codeMirror;
    this.updateColorPickers();
  }

  codeChanged() {
    this.updateColorPickers();
  }
  /*MD ## Color Picker MD*/

  updateColorPickers() {
    const colorLiterals = this.astCapabilities.getColorLiterals();
    if (!colorLiterals) {
      return;
    }
    var red = "#800080";
    const old = this.codeMirror.getAllMarks();
    old.forEach(marker => {
      if (marker.type === "bookmark") {
        marker.clear();
      }
    });
    colorLiterals.forEach(path => {
      const location = { line: path.node.loc.end.line - 1, ch: path.node.loc.end.column };
      var picker = document.createElement("input");
      picker.type = "color";
      picker.value = path.node.value;
      picker.height = "15";
      picker.width = "15";
      const bookmark = this.codeMirror.setBookmark(location, picker);
      picker.addEventListener('change', event => {
        const currentLocation = bookmark.find();
        this.astCapabilities.updateColor(currentLocation, event.target.value);
      });
    });
  }
}