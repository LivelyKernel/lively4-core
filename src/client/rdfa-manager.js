import * as rdfa from '../external/RDFa.js';

export default class RdfaManager {
  
  static loadFirebaseConfig() {
    return {
      apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
      authDomain: "webdev16-rdfa.firebaseapp.com",
      databaseURL: "https://webdev16-rdfa.firebaseio.com",
      storageBucket: "webdev16-rdfa.appspot.com",
    };
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
  
  static buildJSONRdfaDataStructure(fromFirebase = false) {
    return new Promise((resolve, reject) => {
      if (fromFirebase) {
        this.readDataFromFirebase().then((jsonWrapper) => {
          resolve(JSON.parse(jsonWrapper.val()));
        })
      } else {
        resolve(JSON.parse(this.getRdfaAsJson()));
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

  static getRdfaAsJson() {
    var json = JSON.stringify(
      document.data.rdfa.query(),
      function(key, val) {
        if (key == 'owner' && typeof val == 'object') return;
        return val;
      }
    );
    return json;
  }
  
  static initializeFirebase() {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(this.loadFirebaseConfig());
    }
  }
  
  static storeDataToFirebase(path) {
    firebase.database().ref("rdfa/" + path).set(this.getRdfaAsJson());
  }
  
  static readDataFromFirebase(path) {
    return firebase.database().ref("rdfa/" + path).once('value') // returns a Promise
  }
}

RdfaManager.initializeFirebase();