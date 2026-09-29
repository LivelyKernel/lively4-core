/*MD
# Base class for architecture diagram renderers

Provides shared tree building from FileIndex and modification-time color coding
MD*/
import FileIndex from "src/client/fileindex.js";
import { getColoringMode, ownerOf } from "./coloring-modes.js";

export default class BaseRenderer {
  constructor(diagram) {
    this.diagram = diagram;
  }

  /**
   * Build directory tree hierarchy from flat class list.
   * Transforms: src/components/tools/lively-container.js → tree structure
   * Collapses single-child chain at the top to show only the common root.
   */
  async buildTree() {
    const tree = {
      name: "root",
      children: []
    };

    const nodesMap = new Map();

    // Helper to ensure a directory node exists
    const ensureNode = (path) => {
      if (path.length === 0) return tree;

      const key = path.join("/");
      let node = nodesMap.get(key);

      if (!node) {
        const [parentName, ...parentPath] = path;
        node = {
          name: parentName,
          url: lively4url + "/" + path.reverse().join("/"),
          children: []
        };
        nodesMap.set(key, node);

        const parent = ensureNode(parentPath);
        parent.children.push(node);
      }

      return node;
    };

    // Add each class to the tree
    const fileIndex = FileIndex.current();
    const classInfos = [];

    // Collect all classes from the diagram's modules
    for (const url of this.diagram._modules) {
      await fileIndex.db.classes.where("url").equals(url).each(classInfo => {
        classInfos.push(classInfo);
      });
    }

    // Build tree structure
    for (const classInfo of classInfos) {
      const relativePath = classInfo.url.replace(lively4url + "/", "");
      const pathParts = relativePath.split("/").reverse();
      const parent = ensureNode(pathParts);

      parent.children.push({
        name: classInfo.name,
        url: classInfo.url,
        classInfo: classInfo,
        start: classInfo.start,
        end: classInfo.end
      });
    }

    // Attach file index data for modification times
    const urlMap = new Map();
    const visit = (node, cb) => {
      cb(node);
      node.children && node.children.forEach(ea => visit(ea, cb));
    };

    visit(tree, node => urlMap.set(node.url, node));

    await fileIndex.db.files.each(fileData => {
      const node = urlMap.get(fileData.url);
      if (node) {
        node.index = fileData;
      }
    });

    // Collapse single-child chain at the top to find the common root.
    // e.g. root → src → components → [tools, widgets] becomes components → [tools, widgets]
    let commonRoot = tree;
    while (commonRoot.children && commonRoot.children.length === 1 && !commonRoot.classInfo) {
      commonRoot = commonRoot.children[0];
    }

    return commonRoot;
  }

  /**
   * Normalize a renderer node into the descriptor consumed by coloring strategies.
   * Works for both flextree nodes and d3-hierarchy nodes (both expose `.data`).
   */
  descriptorFor(node) {
    const data = (node && node.data) || {};
    const index = data.index || {};
    const url = data.url || (data.classInfo && data.classInfo.url) || '';
    const size = (node && node.value != null)
      ? node.value
      : (data.end != null && data.start != null ? data.end - data.start : 0);
    return { name: data.name, url, size, modified: index.modified, owner: ownerOf(url) };
  }

  /**
   * Fill color for a node according to the diagram's active coloring mode.
   * (Kept as `dataColor` for backward compatibility with existing renderers.)
   */
  dataColor(node) {
    return getColoringMode(this.diagram.coloringMode).color(this.descriptorFor(node));
  }

  dispose() {
    // Override in subclass if cleanup is needed
  }
}
