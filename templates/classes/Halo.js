import lively from 'src/client/lively.js'
import Morph from './Morph.js'

import selecting from 'src/client/morphic/selecting.js'


/*
 * Halo, the container for HaloItems
 */

export default class Halo extends Morph {

  initialize() {
    Halo.halo = $(this)
    Halo.halo.hide()
    window.HaloService = Halo
    
    // lively.addEventListener("Halo", document.body, 'drag', 
    //   (evt) => this.handleSelect(evt), true)
  }
  
  static showHalos(target, path) {
    this.target = $(target);
    // var offset = $target.offset();

    var bounds = target.getBoundingClientRect()
    var offset = {
      top: bounds.top +  $(document).scrollTop(), 
      left: bounds.left +  $(document).scrollLeft()}

    // viewport coordinates
    var scrollTop = Math.abs($(document).scrollTop());
    var scrollLeft = Math.abs($(document).scrollLeft());

    // make sure halo respects left and top viewport boundary
    var offsetTop = Math.max(offset.top - 30, scrollTop);
    var offsetLeft = Math.max(offset.left - 30, scrollLeft);
    var offsetTopDiff = offsetTop - offset.top;
    var offsetLeftDiff = offsetLeft - offset.left;
    offset.top = offsetTop;
    offset.left = offsetLeft;

    // make sure halo respects right and bottom viewport boundary
    var width = this.target.outerWidth() - offsetLeftDiff + 30;
    var height = this.target.outerHeight() - offsetTopDiff + 30;
    var offsetBottom = Math.min(offset.top + height, scrollTop + $(window).height());
    var offsetRight = Math.min(offset.left + width, scrollLeft + $(window).width());
    width = offsetRight - offsetLeft;
    height = offsetBottom - offsetTop;

    // set position and dimensions of halo
    this.halo.show();
    this.halo.offset(offset);
    this.halo.outerWidth(width);
    this.halo.outerHeight(height);
  }
  
  static hideHalos() {
    if (this.areHalosActive())
      this.halosHidden = Date.now()
    this.halo.offset({left:0, top: 0});
    this.halo.hide()
  }

  static areHalosActive() {
    return this.halo && this.halo.is(":visible");
  }
}
