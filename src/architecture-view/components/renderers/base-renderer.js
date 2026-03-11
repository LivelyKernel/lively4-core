/**
 * Base class for architecture diagram renderers
 * Provides shared tree building from FileIndex and modification-time color coding
 */
import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";
import FileIndex from "src/client/fileindex.js";

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
   * Calculate node color based on file modification time.
   * Works for both flextree nodes (node.data.index) and d3-hierarchy nodes (d.data.index).
   */
  dataColor(node) {
    if (!node.data || !node.data.index) return "gray";

    const now = moment(Date.now());
    const modified = moment(node.data.index.modified);
    const days = moment.duration(now.diff(modified)).asDays();

    const colorScale = d3.scaleLinear()
      .range(['#aaccff', '#808080'])
      .domain([10, 365])
      .interpolate(d3.interpolateHcl);

    return colorScale(days);
  }

  dispose() {
    // Override in subclass if cleanup is needed
  }
}
