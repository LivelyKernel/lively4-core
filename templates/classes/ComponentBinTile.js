'use strict'

import Morph from './Morph.js';
import * as componentLoader from '../../src/client/morphic/component-loader.js';
import * as preferences from '../../src/client/preferences.js';

export default class ComponentBinTile extends Morph {
  initialize() {
    this.addEventListener('click', (evt) => {
      var comp = componentLoader.createComponent(this.htmlTag);
      if (this.componentBin.inWindow()) {
        componentLoader.openInWindow(comp);
      } else {
        componentLoader.openInBody(comp);
      }
    });
  }

  configure(config) {
    this.setComponentName(config.name);
    this.setThumbnail(preferences.getBaseURL() + "/templates/" + (config.thumbnail || "thumbnails/default-placeholder.png"));
    this.setTooltip(config.description);

    this.htmlTag = config["html-tag"];
  }

  setThumbnail(path) {
    var img = this.getSubmorph('img');
    img.src = path;
  }

  setTooltip(string) {
    var img = this.getSubmorph('img');
    img.title = string;
  }

  setComponentName(name) {
    var text = this.getSubmorph('p');
    text.innerHTML = name;
  }

  setBin(componentBin) {
    this.componentBin = componentBin;
  }
}
