'use strict';

import Morph from './Morph.js';

export default class Treeview extends Morph {
  attachedCallback() {
    var that = this;

    this.activeLeaf = null;

    // expand/collapse subtrees
    $(this).on('click', '.node > .leaf', function() {
      $(this).parent().toggleClass('collapsed');
    });
    
    // activate/deactivate leaves
    $(this).on('click', 'li:not(.node) .leaf', function() {
      var active = !$(this).hasClass('active');
      $('.active', that).removeClass('active');
      $(this).toggleClass('active', active);
      
      that.activeLeaf = active ? this : null;
      
      // fire change event
      var event = new Event('change');
      that.dispatchEvent(event);
    });
  }
  
  selectLeaf(target) {
    $('.active', this).removeClass('active');
    $(target).click();
  }
  
  removeLeaf(target) {
    $(target).parent().remove();
  }
}