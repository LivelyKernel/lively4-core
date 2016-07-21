'use strict';

import Morph from './Morph.js';
import rdfa from '../../src/client/rdfa/rdfa-api.js';

const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_:]*)?$','i'); // fragment locater

const listenerSampleCode = 
`import rdfa from 'src/client/rdfa/rdfa-api.js';';

rdfa.addRdfaEventListener(
  {
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : "{{type}}"
  },
  (graph) => {
    lively.notify("RDFa {{type}} detected");
    console.log(graph);
  }
)`

export default class RdfaViewer extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
    this.windowTitle = "RDFa data";
  }

  /*
   * Initialization
   */
  setup() {
      this.table = $(this.shadowRoot.querySelector('#rdfaTable'));
      this.registerFirebaseButton();
      this.registerReloadRdfaButton();
      this.loadRdfaDataAndFillTable();
  }

  loadRdfaDataAndFillTable() {
    rdfa.reloadData().then((data) => {
      this.createTableHeader();
      this.generateJSONTableRows(data);
      this.registerTreeToggle();
    });
  }

  /*
   * Window methods
   */
  render() {

  }

  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Subject"))
        .append($('<th>').text("Property"))
        .append($('<th>').text("Value"))
      )
  }

  generateJSONTableRows(data) {
    data.getSubjects().forEach((subjectName) => {
      this.table.append($('<tr>').attr('data-depth', 0).addClass("collapse")
        .append($('<td>').attr("colspan", 3).attr("id", subjectName)
          .append($('<i>').addClass("fa").addClass("fa-minus-square").addClass("treeToggle").attr('aria-hidden', true))
          .append(" ")
          .append(this.processUrl(subjectName))
        )
      );
      data.getProperties().forEach((predicateName) => {
        data.getValues(subjectName, predicateName).forEach((value) => {
          this.table.append(
            $('<tr>').attr('data-depth', 1).addClass("collapse")
              .append($('<td>').append(this.addRdfaListenerSample(predicateName, value)))
              .append($('<td>').append(this.processUrl(predicateName)))
              .append($('<td>').append(this.isSubject(value) ? this.processSubject(value) : this.processUrl(value)))
          );
        });
      });
    });
  }

  isSubject(value) {
    return typeof value == 'object';
  }

  processSubject(subject) {
    let link = $('<a>').addClass('rdfa-subject').attr('target', '_blank').text(subject.id);
    link.on('click', () => {
      let elem = $(this.shadowRoot.querySelector("[id='" + subject.id + "']"));
      elem.scrollintoview({complete: () => {
        elem.animate({
          opacity: "0.2"
        }, 250, function() {
          elem.animate({
            opacity: "1"
          }, 250);
        });
      }});
    })
    return link;
  }

  processUrl(string) {
    if (typeof string == 'string' && this.isUrl(string)) {
      let fullUrl = string.match(/^https?:/) ? string : 'http://' + string;
      let simpleName = this.getSimpleName(string);
      simpleName = simpleName == "" ? string : simpleName;
      let link = $('<a>').attr('href', fullUrl).attr('target', '_blank').text(simpleName);
      return link;
    }
    else {
      return string;
    }
  }

  getSimpleName(name) {
    if (!name) return "";
    let nameParts = name.split('?');
    let firstPart = nameParts[0];
    nameParts = firstPart.split('/');
    let lastPart = nameParts[nameParts.length - 1];
    nameParts = lastPart.split('#');
    return nameParts[nameParts.length - 1];
  }

  isUrl(string) {
    let potentialUrl = string.split('?')[0];
    return urlPattern.test(potentialUrl);
  }
  
  addRdfaListenerSample(property, value) {
    if (property === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
      return $('<i>').addClass("fa").addClass("fa-bug").attr('aria-hidden', true).addClass("listenerSample")
        .on('click', (evt) => {
          lively.openWorkspace(listenerSampleCode.replace(/{{type}}/g, value));
        }
      )
    }
    return "";
  }

  registerTreeToggle() {
    let rdfaViewer = this;
    this.table.on('click', '.treeToggle', function (evt) {
      //Gets all <tr>'s  of greater depth
      //below element in the table
      var findChildren = function (tr) {
          var depth = tr.data('depth');
          return tr.nextUntil(rdfaViewer.table.find("tr").filter(function () {
              return $(this).data('depth') <= depth;
          }));
      };
      var el = $(this);
      var tr = el.closest('tr'); //Get <tr> parent of toggle button
      var children = findChildren(tr);

      //Remove already collapsed nodes from children so that we don't
      //make them visible.
      //(Confused? Remove this code and close Item 2, close Item 1
      //then open Item 1 again, then you will understand)
      var subnodes = children.filter('.expand');
      subnodes.each(function () {
          var subnode = $(this);
          var subnodeChildren = findChildren(subnode);
          children = children.not(subnodeChildren);
      });

      //Change icon and hide/show children
      if (tr.hasClass('collapse')) {
          tr.removeClass('collapse').addClass('expand');
          $(tr).find('.fa-minus-square').removeClass('fa-minus-square').addClass("fa-plus-square");
          children.hide();
      } else {
          tr.removeClass('expand').addClass('collapse');
          $(tr).find('.fa-plus-square').removeClass('fa-plus-square').addClass("fa-minus-square");
          children.show();
      }
      return children;
    });
  }

  registerFirebaseButton() {
    $(this.shadowRoot.querySelector("#save-button")).on('click', () => {
      this.saveButtonPressed();
    })
    this.updateBucketList();
  }
  
  saveButtonPressed() {
    let bucketName = this.shadowRoot.querySelector("#bucketNameInput").value;
    if (!bucketName) {
      bucketName = window.prompt("Into which bucket do you want to store the data?");
    }
    if (bucketName) {
      rdfa.storeRDFaTriplesToFirebase(bucketName);
      this.updateBucketList();
    }
  }
  
  updateBucketList() {
    const bucketList = this.shadowRoot.querySelector("#bucketlist");
    bucketList.innerHTML = "";
    
    rdfa.getBucketListFromFirebase().then(buckets => {
      buckets.forEach(bucket => {
        const option = document.createElement("option");
        option.value = bucket;
        bucketList.appendChild(option);
      });
    })
  }

  registerReloadRdfaButton() {
    $(this.shadowRoot.querySelector("#reload-button")).on('click', () => {
      this.table.empty();
      this.loadRdfaDataAndFillTable();
    })
  }

}
