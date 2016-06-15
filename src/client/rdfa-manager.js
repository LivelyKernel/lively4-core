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
  
  static showBox() {
    this.reloadData();
    let boxDiv = document.getElementById("rdfaBox");
    
    if (!boxDiv) {
      boxDiv = document.createElement("div");
      boxDiv.id = "rdfaBox";
      boxDiv.style.position = "fixed";
      boxDiv.style.background = "#aaa";
      boxDiv.style.right = 0;
      boxDiv.style.bottom = 0;
      boxDiv.style.width = "200px";
      boxDiv.style.height = "200px";
      
      document.body.appendChild(boxDiv);
    }
    
    let jQueryBox = $("#rdfaBox");
    jQueryBox.empty();
    RdfaManager.generateJSONTableRows(jQueryBox); 
  }

  static generateTableRows(div) {
    div[0].style.overflow = "auto";
    var table = $('<table>');
    div.append(table);
    this.buildRdfaDataStructure((s, p, v) => {});
    this.data.subjects.forEach((s) => {
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
  
  static generateJSONTableRows(div, remote) {
    div[0].style.overflow = "auto";
    var table = $('<table>');
    div.append(table);
    this.buildJSONRdfaDataStructure(remote).then((data) => {
      data.forEach((projection) => {
        table.append(
          $('<tr>')
            .append($('<td>').text(projection._data_.subject)));
        let properties = projection._data_.properties;
        for (let property in properties) {
          table.append(
            $('<tr>')
              .append($('<td>'))
              .append($('<td>').text(property))
              .append($('<td>').text(properties[property])));
        }
      });
    });
  }

  static makeLocationsClickable(property) {
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
  
  static buildJSONRdfaDataStructure(remote = false) {
    return new Promise((resolve, reject) => {
      if (remote) {
        this.readDataFromFirebase().then((jsonWrapper) => {
          resolve(JSON.parse(jsonWrapper.val()));
        })
      } else {
        resolve(JSON.parse(this.storeData()));
      }
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
    return firebase.database().ref("rdfa").once('value') // returns a Promise
  }
}

RdfaManager.showBox();
