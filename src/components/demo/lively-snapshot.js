"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Rasterize, { CloneDeepHTML } from 'src/client/rasterize.js';
import domtoimage from 'https://raw.githubusercontent.com/tsayen/dom-to-image/master/dist/dom-to-image.min.js';

export default class LivelySnapshot extends Morph {
  async initialize() {
    this.windowTitle = "LivelySnapshot";
    this.registerButtons();
  }

  rasterize(target) {
    return ;
  }

  plain(target) {
    target.innerHTML = ''
    target.appendChild(<canvas id="canvas" style="border:2px solid black;" width="500" height="500"></canvas>

    // ---


    );var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    //
    // import * as rasterizeHTML from 'https://cburgmer.github.io/rasterizeHTML.js/rasterizeHTML.allinone.js'
    // rasterizeHTML.drawDocument( that, canvas); 1;
    //END
    var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' + '<foreignObject width="100%" height="100%">' + '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' + that.outerHTML + '</div>' + '</foreignObject>' + '</svg>';

    var DOMURL = window.URL || window.webkitURL || window;

    var img = new Image();
    var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    var url = DOMURL.createObjectURL(svg);

    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
    };

    img.src = url;
  }
  async onSnapshotButton() {
    const target = that;
    this.domToImage(target);
  }

  // this method is automatically registered as handler through ``registerButtons``

  async domToImage(target) {
    if (target instanceof HTMLElement) {
      // const image = await Rasterize.asImage(target);
      const container = this.get('#imageContainer');
      container.innerHTML = ''; // clear contents
      // container.appendChild(image);
      // const clone = CloneDeepHTML.deepCopyAsHTML(target);
      await domtoimage.toPng(target).then(function (dataUrl) {
        var img = document.createElement("img");
        container.appendChild(img);
        img.src = dataUrl;
      }).catch(function (error) {
        console.error('oops, something went wrong!', error);
      });
      domtoimage.toJpeg(target, { quality: 0.95 }).then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = 'my-image-name.jpeg';
        link.href = dataUrl;
        link.click();
      });
      // container.appendChild(clone);
    }
  }

  onPlusButton() {
    Rasterize.elementToCanvas();
    this.get("#textField").value = parseFloat(this.get("#textField").value) + 1;
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty;
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray";
    this.someJavaScriptProperty = 42;
    this.appendChild(<div>This is my content</div>);
  }

}