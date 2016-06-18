'use strict';

import Morph from './Morph.js';
import rdfaManager from '../../src/client/rdfa-manager.js'

export default class RdfaViewer extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
  }

  /*
   * Initialization
   */
  setup() {
    rdfaManager.reloadData();
    this.table = $(this.shadowRoot.querySelector('#rdfaTable'));
    this.generateJSONTableRows(false);
    this.registerTreeToggle();
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
          .append($('<td>').attr("colspan", 3)
            .append($('<i>').addClass("fa").addClass("fa-minus-square").addClass("treeToggle").attr('aria-hidden', true))
            .append(" ")
            .append(projection._data_.subject)
          )
        );
        let properties = projection._data_.properties;
        for (let property in properties) {
          this.table.append(
            $('<tr>').attr('data-depth', 1).addClass("collapse")
              .append($('<td>'))
              .append($('<td>').text(property))
              .append($('<td>').text(properties[property])));
        }
      });
    });
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

}
