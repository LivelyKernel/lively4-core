import * as rdfa from '../external/RDFa.js';

class Property {
  constructor(name, value) {
    this.name = name;
    this.value = value;
    this.origins = [];
    var parts = name.split("/");
    this.simpleName = parts[parts.length - 1];
  }
}

class Subject {
  constructor(name) {
    this.name = name;
    this.properties = [];
  }
}

export default class RdfaManager {

  static generateTableRows(div) {
    div[0].style.overflow = "auto";
    var table = div.append($('<table>'));
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
            .append($('<td>').text(p.simpleName))
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
          valueOrigin.rdfaData = property;
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
    if (property.value.constructor.name == "Subject") {
      var isFirst = true; // skip the first value since this is the parent node
      property.value.properties.forEach(p => {
        if (isFirst) {
          isFirst = false;
          return;
        }
        addressString += p.value + " ";
      });
    } else {
      addressString = property.value;
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
          if (valueOrigin.origin) {
            valueOrigin.origin.rdfaData = property;
            property.origins.push(valueOrigin.origin);
          }
        });
        subject.properties.push(property);
      });
    });
  }

  static resolveSubject(value) {
    if (value && typeof value == 'string' && value.startsWith('_:')) {
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

  static reloadData() {
    GreenTurtle.attach(document);
  }

  static storeData() {
    var json = JSON.stringify(document.data.rdfa.query(), function(key, val) {
        if (key == 'owner' && typeof val == 'object') return;
        return val;
      });
    localStorage.setItem("rdfa", json);
    return json;
  }
  
  static initializeFirebase() {
     var config = {
        apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
        authDomain: "webdev16-rdfa.firebaseapp.com",
        databaseURL: "https://webdev16-rdfa.firebaseio.com",
        storageBucket: "webdev16-rdfa.appspot.com",
      };
      firebase.initializeApp(config);
  }
  
  static storeDataToFirebase() {
    firebase.database().ref("rdfa").set(this.storeData());
  }
  
  static readDataFromFirebase() {
    firebase.database().ref("rdfa").once('value').then(rdfa => console.log(rdfa.val()))
  }
}
