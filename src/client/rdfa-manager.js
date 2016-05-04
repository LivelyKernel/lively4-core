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

  static highlightNodes(filterFunction) {
    this.iterateRdfaNodes((s, p, v) => {
      document.data.getValueOrigins(s, p).forEach((valueOrigin) => {
        if (!filterFunction || filterFunction(s, p, v)) {
          if (valueOrigin.origin.style) {
            valueOrigin.origin.style.border = '1px solid red'
          }
        }
      });
    })
  }

  static isGeoLocation(subject, property, value) {
    console.log(property);
    return true;
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
