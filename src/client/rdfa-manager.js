import * as rdfa from '../external/RDFa.js';

export default class RdfaManager {

  static generateTableRows(table) {
    this.iterateRdfaNodes((s, p, v) => {
      table.append(
        $('<tr>')
          .append($('<td>').text(s))
          .append($('<td>').text(p))
          .append($('<td>').text(v)))
    })
  }

  static makeLocationsClickable() {
    this.iterateRdfaNodes((s, p, v) => {
      document.data.getValueOrigins(s, p).forEach((valueOrigin) => {
        if (this.isGeoLocation(s, p, v)) {
          if (valueOrigin.origin.style) {
            valueOrigin.origin.style.outline = '1px solid red';
            lively.addEventListener('click', valueOrigin.origin, 'click', evt => {
              this.openMapsFrame(evt, valueOrigin.value);
            }, true);
          }
        }
      });
    })
  }

  static openMapsFrame(evt, value) {
    var comp = document.createElement("iframe");
    lively.components.openInWindow(comp).then((w) => {
      lively.setPosition(w, lively.pt(evt.pageX, evt.pageY));
      if (comp.windowTitle) {
        w.setAttribute("title", "Map" + comp.windowTitle);
      }
    });
    var addressString = "";
    if (Array.isArray(value)) {
      value = value[0];
    }
    if (value.startsWith("_:")) {
      // value is a subject
      var isFirst = true; // skip the first value since this is the parent node
      document.data.getProperties(value).forEach(p => {
        if (isFirst) {
          isFirst = false;
          return;
        }
        addressString += document.data.getValues(value, p)[0] + " ";
      });
    } else {
      addressString = value;
    }
    var apiKey = "AIzaSyBLZknKBi39WOdlmZMYd7y0l7HU9zMFBB0";
    var mapsLink = "https://www.google.com/maps/embed/v1/search?key="
      + apiKey
      + "&q="
      + addressString;
    comp.src = mapsLink;
  }

  static isGeoLocation(subject, property, value) {
    var locationTags = [
      "http://schema.org/address",
      "http://schema.org/geo"
    ];

    return locationTags.indexOf(property) >= 0;
  }

  static iterateRdfaNodes(visitor) {
    document.data.getSubjects().forEach(s => {
      document.data.getProperties(s).forEach(p => {
        var v = document.data.getValues(s, p);
        visitor(s, p, v);
      });
    });
  }
}
