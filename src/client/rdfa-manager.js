import * as rdfa from '../external/RDFa.js';

export default class RdfaManager {

  /*class Property {
    constructor(name, value) {
      this.name = name;
      this.value = value;
    }
  }

  class Subject {
    constructor(name) {
      this.name = name;
      this.properties = [];
    }
  }*/

  static generateTableRows(table) {
    this.buildRdfaDataStructure((s, p, v) => {});
    RdfaManager.data.subjects.forEach((s) => {
      table.append(
        $('<tr>')
          .append($('<td>').text(s.name)));
      s.properties.forEach((p) => {
        //var v = document.data.getValues(s, p);
        table.append(
          $('<tr>')
            .append($('<td>'))
            .append($('<td>').text(p))
            .append($('<td>').text(p.value)));
        RdfaManager.makeLocationsClickable(p);
      });
    });
  }

  static makeLocationsClickable(property) {
    this.buildRdfaDataStructure((s, p, v) => {});
    property.origins.forEach((valueOrigin) => {
      if (this.isGeoLocation(property)) {
        if (valueOrigin.style) {
          valueOrigin.onmouseover = function(){this.style.outline = "1px solid red";};
          valueOrigin.onmouseout = function(){this.style.outline = "";};
          lively.addEventListener('click', valueOrigin, 'click', (evt) => {
            this.openMapsFrame(evt, property);
          }, true);
        }
      }
    });
  }

  static openMapsFrame(evt, property) {
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

  static isGeoLocation(property) {
    var locationTags = [
      "address",
      "geo"
    ];

    return locationTags.indexOf(property.simpleName) >= 0;
  }

  static buildRdfaDataStructure(visitor) {
    RdfaManager.data = {subjects: []};
    document.data.getSubjects().forEach(s => {
      var subject = {name: s, properties: []};
      RdfaManager.data.subjects.push(subject);
      document.data.getProperties(s).forEach((p) => {
        var v = document.data.getValues(s, p);
        var origins = [];
        document.data.getValueOrigins(s, p).forEach((valueOrigin) => {
          origins.push(valueOrigin.origin);
        });
        var nameParts = p.split('/');
        var simpleName = nameParts[nameParts.length - 1];
        var property = {name: p, simpleName: p, value: v, origins: origins};
        subject.properties.push(property);
      });
    });
  }

}
