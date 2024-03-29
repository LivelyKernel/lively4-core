import jQuery from 'src/external/jquery.js';
import jstree from 'src/external/jstree/jstree.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import ContextMenu from 'src/client/contextmenu.js';
import { pluralize } from 'utils';

export default class AExprOverview {

  constructor(htmlElement) {
    this.ready = false;
    this.htmlElement = htmlElement;
    this.jQueryElement = jQuery(htmlElement);
    this.jQueryElement.jstree({
      "plugins": ["wholerow", "checkbox"],
      "checkbox": {
        "keep_selected_style": false
      },
      'core': {
        "themes": { "icons": false }
      }
    });
    //Register to overview selection changes
    this.tree = this.jQueryElement.jstree(true);
    this.jQueryElement.on("changed.jstree", (e, data) => {
      this.selectionChanged();
    });
    this.jQueryElement.one("ready.jstree", (e, data) => {
      this.ready = true;
    });
    this.jQueryElement.on("contextmenu.jstree", ".jstree-anchor", (e, data) => {
      e.preventDefault();
      e.stopPropagation();
      const bounds = e.target.getBoundingClientRect();
      const node = this.tree.get_node(e.currentTarget);
      this.contextMenu(node, bounds);
    });
  }

  contextMenu(node, bounds) {
    const menuItems = [];

    const file = this.determineFile(node);
    const line = this.determineLine(node);
    const isFile = node.parent === '#';
    const isAE = node.children.isEmpty();
    const isLine = !isFile && !isAE;

    const aeNodes = this.collectAEs(node);
    menuItems.push(["Dispose " + pluralize(aeNodes.length, "AE"), () => {
      aeNodes.forEach(aeNode => {
        this.aexprs[aeNode.id - 1].dispose();
      });
    }]);
    
    const toggleText = "Toggle tracking " + (isFile ? "in file" : (isLine ? "in line" : "for AE"));
    menuItems.push([toggleText, () => {
      if(isAE) {
        this.aexprs[node.id - 1].toggleLogging();
      } else {
        AExprRegistry.toggleLoggingLocation(file, line);
      }
      this.recomputeTree();
    }]);
    ContextMenu.openIn(document.body, { clientX: bounds.left, clientY: bounds.bottom }, undefined, document.body, menuItems);
  }

  determineFile(node) {
    if (node.parent === '#') {
      return node.id;
    }
    return this.determineFile(this.tree.get_node(node.parent));
  }

  determineLine(node) {
    if (node.parent === '#') {
      return undefined;
    } else if(node.children.isEmpty()) {
      return this.determineLine(this.tree.get_node(node.parent));
    } else {
      return parseInt(node.id.split(":")[1]);
    }
  }

  collectAEs(node) {
    if (!node.children || node.children.isEmpty()) return [node];
    return node.children.flatMap(c => this.collectAEs(this.tree.get_node(c)));
  }

  onChange(callback) {
    this.callback = callback;
  }

  selectionChanged() {
    this.callback && this.callback();
  }

  filterToAEs(aes) {
    this.tree.deselect_all();
    if (this.ready) {
      for (const ae of aes) {
        this.tree.select_node(this.idMap.get(ae));
      }
    } else {
      //This is not the best workaround, but the event callbacks do not work reliably
      setTimeout(() => {
        for (const ae of aes) {
          this.tree.select_node(this.idMap.get(ae));
        }
      }, 100);
    }
  }

  setAexprs(aexprs) {
    this.aexprs = aexprs;
    this.idMap = new Map();
    for (let i = 0; i < aexprs.length; i++) {
      this.idMap.set(aexprs[i], i + 1);
    }
    this.recomputeTree();
  }

  recomputeTree() {
    this.tree.settings.core.data = this.generateOverviewJSON(this.aexprs);
    this.tree.refresh(true);
  }

  async ensureSelected(ae, secondTry = false) {
    if (!this.tree.is_selected(this.idMap.get(ae))) {
      if (!this.ready) {
        await new Promise((resolve, reject) => {
          setTimeout(_ => resolve(), 100);
        });
      }
      if (!secondTry) {
        this.tree.select_node(this.idMap.get(ae));
        setTimeout(() => this.ensureSelected(ae, true), 200);
      }
      return false;
    }
    return true;
  }

  getSelectedAEs() {
    const checkedIndices = this.tree.get_bottom_selected();
    return checkedIndices.map(i => this.aexprs[i - 1]).filter(ae => ae);
  }

  locationGrouping() {
    let locationID = string => string.substring(0, string.lastIndexOf("#"));
    return each => locationID(each.meta().get('id'));
  }

  fileGrouping() {
    let fileName = string => string.substring(0, string.lastIndexOf("@"));
    return each => fileName(each.meta().get('id'));
  }

  generateOverviewJSON(aexprs) {
    let json = [];
    let files = aexprs.groupBy(this.fileGrouping());
    for (const file of Object.keys(files)) {
      let locations = files[file].groupBy(this.locationGrouping());
      const children = Object.keys(locations).map(location => {
        
        const aes = locations[location];
        const line = parseInt(location.substring(location.lastIndexOf("@") + 1));
        let identifier = "" 
        try {
          identifier += aes[0].getIdentifier()
        } catch(e) {
          debugger
          identifier = "ERROR " + e
        }
        return {
          "id": file + ":" + line, //We just assume all AEs in that line to be the same type (code & RPC type)
          "text": aes[0].getTypeShort() + " in line " + line + " - " + identifier,
          "children": aes.map(ae => {
            let additionalInfo = "";
            if(ae.isILA()) {
              additionalInfo = " " + "(" + (ae.getLayer().isGlobal() ? "active" : "inactive") + ")";
            }
            return {
              "id": this.idMap.get(ae),
              "text": ae.getSymbol() + additionalInfo
            };
          })
        };
      });
      json.push({
        "text": file.substring(file.lastIndexOf("/") + 1),
        "id": file,
        "children": children
      });
    }
    return json;
  }

  getTree() {
    return this.tree;
  }
}