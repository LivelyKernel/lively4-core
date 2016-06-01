import * as rdfa from '../external/RDFa.js';

class Property {
  constructor(name, value) {
    this.name = name;
    this.value = value;
    this.origins = [];
  }
}

class Subject {
  constructor(name) {
    this.name = name;
    this.properties = [];
  }
}

export default class RdfaManager {

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
    this.data = {subjects: []};
    document.data.getSubjects().forEach(subjectName => {
      var subject = this.getOrCreateSubject(subjectName);
      document.data.getProperties(subjectName).forEach((propertyName) => {
        //TODO for multiple values
        var value = document.data.getValues(subjectName, propertyName)[0];
        value = this.resolveSubject(value);
        var property = new Property(propertyName, value);
        document.data.getValueOrigins(subjectName, propertyName).forEach((valueOrigin) => {
          property.origins.push(valueOrigin.origin);
        });
        var nameParts = propertyName.split('/');
        var simpleName = nameParts[nameParts.length - 1];
        subject.properties.push(property);
      });
    });
  }

  static resolveSubject(value) {
    if (value.startsWith('_:')) {
      return this.getOrCreateSubject(value);
    }
    return value;
  }

  static getOrCreateSubject(value) {
    var subject = this.data.subjects.find(subject => {return subject.name == value});
    if (!subject) {
      subject = new Subject(value);
      this.data.subjects.push(subject);
    }
    return subject;
  }

}
