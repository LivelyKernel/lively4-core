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
            valueOrigin.origin.style.border = '1px solid red';
            lively.addEventListener('click', valueOrigin.origin, 'click', evt => {
              alert(v);
            }, true);
          }
        }
      });
    })
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
