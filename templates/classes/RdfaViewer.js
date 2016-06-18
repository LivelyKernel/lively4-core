'use strict';

import Morph from './Morph.js';
import rdfaManager from '../../src/client/rdfa-manager.js'

const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locater

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
    rdfaManager.reloadData().then(() => {
      this.table = $(this.shadowRoot.querySelector('#rdfaTable'));
      this.generateJSONTableRows(false);
      this.registerTreeToggle();
      this.registerFirebaseButton();
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  generateJSONTableRows(remote = false) {
    rdfaManager.buildJSONRdfaDataStructure(remote).then((data) => {
      data.forEach((projection) => {
        this.table.append($('<tr>').attr('data-depth', 0).addClass("collapse")
          .append($('<td>').attr("colspan", 3).attr("id", projection._data_.subject)
            .append($('<i>').addClass("fa").addClass("fa-minus-square").addClass("treeToggle").attr('aria-hidden', true))
            .append(" ")
            .append(this.processUrl(projection._data_.subject))
          )
        );
        let properties = projection._data_.properties;
        for (let property in properties) {
          let propertyString = properties[property][0];
          this.table.append(
            $('<tr>').attr('data-depth', 1).addClass("collapse")
              .append($('<td>'))
              .append($('<td>').append(this.processUrl(property)))
              .append($('<td>').append(this.isSubject(propertyString) ? this.processSubject(propertyString) : this.processUrl(propertyString))));
        }
      });
    });
  }
  
  isSubject(string) {
    if (string && typeof string == 'string') {
      var pattern = new RegExp("^_:(\\d)+$")
      return pattern.test(string);  
    }
    return false;
  }
  
  processSubject(value) {
    let link = $('<a>').addClass('rdfa-subject').attr('target', '_blank').text(value);
    link.on('click', () => {
      let elem = $(this.shadowRoot.querySelector("[id='" + value + "']"));
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
      let simpleName = this.getSimpleName(string);
      simpleName = simpleName == "" ? string : simpleName;
      let link = $('<a>').attr('href', string).attr('target', '_blank').text(simpleName);
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
      rdfaManager.storeDataToFirebase();
    })
  }

}
