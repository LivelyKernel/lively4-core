import Morph from 'src/components/widgets/lively-morph.js';
import { sortAlphaNum } from 'src/client/sort.js';
import TreeViewNode from 'src/components/tools/lively-tree-view-node.js';

export default class TreeView extends Morph {
  async initialize() {
    this.resetConfig();
  }

  async setRoot(target) {
    this.root = await TreeViewNode.create(null, target);
    this.root.view = this;
    this.root.parent = null;
    this.append(this.root);
    this.root.isExpanded = true;
    this.render();
  }

  resetConfig() {
    this.renderCallbacks = {default: () => {}};
    this.queryCallbacks = {default: () => []};
    this.typeResolve = () => null;
    this.handlers = {};
  }
  
  render() {
    if (this.root) this.root.render();
  }

  renderNode(node) {
    const type = this.getNodeType(node);
    const fn = this.getRenderCallback(type);
    fn(node, this);
    node.attachHandlers(this.handlers);
    node.renderChildren();
  }

  queryNode(node) {
    const type = this.getNodeType(node);
    const fn = this.getQueryCallback(type);
    return fn(node.target, this);
  }

  getNodeType(node) {
    const type = this.typeResolve(node.target, this);
    return type == null ? "default" : type;
  }

  getRenderCallback(type) {
    return this.renderCallbacks[type];
  }

  setRenderCallback(type, fn) {
    if (typeof fn !== "function") return console.error(fn, "must be a function");
    this.renderCallbacks[type] = fn;
  }

  getQueryCallback(type) {
    return this.queryCallbacks[type];
  }

  setQueryCallback(type, fn) {
    if (typeof fn !== "function") return console.error(fn, "must be a function");
    this.queryCallbacks[type] = fn;
  }

  setConfig(config) {
    this.resetConfig();
    function getTypes(str) { return str.split("|"); }
    if ("type" in config) this.typeResolve = config.type;
    if ("handlers" in config) this.handlers = config.handlers;
    if ("query" in config) {
      for (const [types, fn] of Object.entries(config.query)) {
        getTypes(types).forEach(type => this.setQueryCallback(type, fn));
      }
    }
    if ("render" in config) {
      for (const [types, fn] of Object.entries(config.render)) {
        getTypes(types).forEach(type => this.setRenderCallback(type, fn));
      }
    }
  }

  get templates() {
    //TODO
    return {
      expansionIndicator(kind) {
        let symbol;
        if (kind === true) {
          symbol = "\u25bc";
        } else if (kind === false) {
          symbol = "\u25b6";
        } else {
          symbol = kind;
        }
    
        return <span class='syntax'>
          <a class='expand'>
            <span style='font-size:9pt'>{symbol}</span>
          </a>
        </span>;
      },
      label(content) {
        return <a id='tagname' class='tagname expand'>
            {content}
          </a>
      },
      key(node) {
        const key = node.key;
        if (key == null) return <span></span>;
        let cssClass = 'attrName expand';
        return <span class={cssClass}>
          {key}
          <span class="syntax">:</span> 
        </span>;
      },
      content() {
        return <span id='content'></span>;
      },
      summary(content) {
        return <span class='expand more'>
            {content}
          </span>
      }
    }
  }
  
  async livelyExample() {
    this.setConfig({
      "type"(target) {
        if (target == null) return "Value";
        if (Array.isArray(target)) return target.length > 0 ? "Array" : "EmptyArray";
        if (typeof target === "object" || typeof target === "function") return "Object";
        return "Value";
      },
      "handlers": {
        ".expand"(element, node) {
          element.onclick = () => node.toggleExpansion();
        }
      },
      "query": {
        "Object": (obj) => {
          return Object.entries(obj).sort(([a], [b]) => sortAlphaNum(a, b));
        },
        "Array": (arr) => {
          return arr.entries();
        },
        "Value|EmptyArray": () => {
          return [];
        }
      },
      "render": {
        "Object": (node, {templates}) => {
          node.append(templates.expansionIndicator(node.isExpanded));
          node.append(templates.key(node));
          if (!node.isExpanded) {
            node.append(
              <span class="syntax">&#123;</span>,
              templates.summary(String.toString(node.target)),
              <span class="syntax">&#125;</span>,
            );
          } else {
            const content = templates.content();
            node.treeChildNodes.forEach(node => {
              return content.append(node)
            });
            node.append(content);
          }
        },
        "Array": (node, {templates}) => {
          node.append(templates.expansionIndicator(node.isExpanded));
          node.append(templates.key(node));
          if (!node.isExpanded) {
            node.append(templates.summary(`[${node.target.length} elements]`));
          } else {
            const content = templates.content();
            node.treeChildNodes.forEach(node => content.append(node));
            node.append(content);
          }
        },
        "Value|EmptyArray": (node, {templates}) => {
          const json = JSON.stringify(node.target);
          node.append(templates.expansionIndicator("\u2002"));
          node.append(templates.key(node));
          node.append(<span class='attrValue'>{json}</span>);
        }
      },
    });
    this.setRoot({
      a: [1, 2, 3, 4],
      b: {c: 5, d: {e: {f: 6}}},
      g: 3
    })
  }
}