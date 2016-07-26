import lively from 'src/client/lively.js'
import Morph from './Morph.js'

/*
 * Halo, the container for HaloItems
 */

export default class Halo extends Morph {

  initialize() {
    System.import(lively4url + "/src/client/morphic/selecting.js")
    
    var $halos = $(this)
    $halos.hide()
    window.HaloService = {
      showHalos: function (target, path) {
    
        var $target = $(target);
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
        var width = $target.outerWidth() - offsetLeftDiff + 30;
        var height = $target.outerHeight() - offsetTopDiff + 30;
        var offsetBottom = Math.min(offset.top + height, scrollTop + $(window).height());
        var offsetRight = Math.min(offset.left + width, scrollLeft + $(window).width());
        width = offsetRight - offsetLeft;
        height = offsetBottom - offsetTop;
    
        // set position and dimensions of halo
        $halos.show();
        $halos.offset(offset);
        $halos.outerWidth(width);
        $halos.outerHeight(height);
      },
    
      hideHalos: function () {
        if (this.areHalosActive())
          this.halosHidden = Date.now()
        $halos.offset({left:0, top: 0});
        $halos.hide()
      },
    
      areHalosActive: function () {
        return $halos.is(":visible");
      }
    }
  }
}
