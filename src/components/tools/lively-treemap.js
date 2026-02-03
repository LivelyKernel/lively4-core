"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import FileIndex from "src/client/fileindex.js";
import { debounce } from 'utils';
import {
  gloperate,
  Configuration,
  initialize as initializeCanvas,
  Renderer,
  Visualization
} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export const VisualizationType = {
  VISUALIZATION_2D: 0,
  VISUALIZATION_3D: 1
};

//TODO maybe move directly into parameter list?
export const DataParameter = {
  data: undefined,
  weightAttributeName: undefined,
  heightAttributeName: undefined,
  colorAttributeName: undefined,
  childrenAttriuteName: undefined,
  labelAttributeName: undefined
}

//TODO rename; split into qualitative and quantitative, remove diverging?
export const TreemapColorSchemes = {
  Spectral: 'Spectral',
  RdYlGn: 'RdYlGn',
  RdBu: 'RdBu',
  PiYG: 'PiYG',
  PRGn: 'PRGn',
  RdYlBu: 'RdYlBu',
  BrBG: 'BrBG',
  RdGy: 'RdGy',
  PuOr: 'PuOr',
  Set2: 'Set2',
  Accent: 'Accent',
  Set1: 'Set1',
  Set3: 'Set3',
  Dark2: 'Dark2',
  Paired: 'Paired',
  Pastel2: 'Pastel2',
  Pastel1: 'Pastel1',
  OrRd: 'OrRd',
  PuBu: 'PuBu',
  BuPu: 'BuPu',
  Oranges: 'Oranges',
  BuGn: 'BuGn',
  YlOrBr: 'YlOrBr',
  YlGn: 'YlGn',
  Reds: 'Reds',
  RdPu: 'RdPu',
  Greens: 'Greens',
  YlGnBu: 'YlGnBu',
  Purples: 'Purples',
  GnBu: 'GnBu',
  Greys: 'Greys',
  YlOrRd: 'YlOrRd',
  PuRd: 'PuRd',
  Blues: 'Blues',
  PuBuGn: 'PuBuGn',
  magma: 'magma',
  inferno: 'inferno',
  plasma: 'plasma',
  viridis: 'viridis'
}

export default class LivelyTreemap extends Morph {

  setData(dataParameter) {
    this.treemapRenderer.setData(dataParameter);
  }

  setColorScheme(treemapColorScheme) {
    this.treemapRenderer.setColorScheme(treemapColorScheme);
  }

  setColorSteps(numberOfSteps) {
    this.treemapRenderer.setColorSteps(numberOfSteps);
  }

  highlightByID(nodeIDs) {
    this.treemapRenderer.highlightByID(nodeIDs);
  }

  removeHighlightsByID(nodeIDs) {
    this.treemapRenderer.removeHighlightsByID(nodeIDs);
  }

  highlightByLabel(nodeLabels) {
    this.treemapRenderer.highlightByLabel(nodeLabels);
  }

  removeHighlightsByLabel(nodeLabels) {
    this.treemapRenderer.removeHighlightsByLabel(nodeLabels);
  }

  removeHighlights() {
    this.treemapRenderer.removeHighlights();
  }

  setHighlightColor(hexCode) {
    this.treemapRenderer.setHighlightColor(hexCode);
  }

  setColorMapping(colorAttributeName) {
    this.treemapRenderer.setColorMapping(colorAttributeName);
  }

  setWeightMapping(weightAttributeName) {
    this.treemapRenderer.setWeightMapping(weightAttributeName);
  }

  setHeightMapping(heightAttributeName) {
    this.treemapRenderer.setHeightMapping(heightAttributeName);
  }

  setChildrenMapping(childrenAttributeName) {
    this.treemapRenderer.setChildrenMapping(childrenAttributeName);
  }

  setLabelMapping(labelAttributeName) {
    this.treemapRenderer.setLabelAttribute(labelAttributeName);
  }

  showTopWeightLabels(n) {
    this.treemapRenderer.showTopWeightLabels(n);
  }

  showTopHeightLabels(n) {
    this.treemapRenderer.showTopHeightLabels(n);
  }

  showTopColorLabels(n) {
    this.treemapRenderer.showTopColorLabels(n);
  }

  showLabels(labels) {
    this.treemapRenderer.showLabels(labels);
  }

  showAllLabels() {
    this.treemapRenderer.showAllLabels();
  }

  removeLabels() {
    this.treemapRenderer.removeLabels();
  }

  setNodeEnterFunction(nodeEnterFunction) {
    this.treemapRenderer.setNodeEnterFunction(nodeEnterFunction);
  }

  setNodeLeaveFunction(nodeLeaveFunction) {
    this.treemapRenderer.setNodeLeaveFunction(nodeLeaveFunction);
  }

  setNodeSelectFunction(nodeSelectFunction) {
    this.treemapRenderer.setNodeSelectFunction(nodeSelectFunction);
  }

  //setVisualizationType(visualizationType) {
  /*this.treemapRenderer.uninitialize();
  this.treemapRenderer = new TreemapRenderer(
    this.get("#treemap-canvas"),
    visualizationType);*/
  //}

  async initialize() {
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); }));

    this.treemapRenderer = new TreemapRenderer(
      this.get("#treemap-canvas"),
      VisualizationType.VISUALIZATION_3D);

    // Code for testing
    /*const weight = "size";
    const height = "size";
    const color = "size";
    const label = "name";
    const componentData = await Files.fileTree("src/components");
    const toolsData = await Files.fileTree("src/components/tools");
    
    
    this.setData({
      data: toolsData,
      weightAttributeName: weight,
      heightAttributeName: height,
      colorAttributeName: color,
      labelAttributeName: label
    });
    this.displayTopWeightLabels(5);
    this.displayTopHeightLabels(5);
    this.displayTopColorLabels(5);
    this.setHighlightColor("ff0000");
    this.highlightByLabel(["lively-treemap.js"]);
    this.displayExplicitLabels(["lively-treemap.js"]);
    this.highlightByID([5]);*/

    /*const allClasses = await FileIndex.current().db.classes.toArray();
    const classData = allClasses.filter(ea => ea.url.startsWith(lively4url));
    

    const weightAttribute = "loc";
    const heightAttribute = "nom";
    const labelAttribute = "name";
    const colorAttribute = "loc";

    this.setData({
      data: classData.slice(0, 10),
      weightAttributeName: weightAttribute,
      heightAttributeName: heightAttribute,
      colorAttributeName: colorAttribute,
      labelAttributeName: labelAttribute
    });

    //this.setHighlightColor('#40a820');
    this.setColorScheme(TreemapColorSchemes.YlOrBr);
    this.highlightNodesByLabel(['TreemapRenderer']);*/
    //this.setColorSteps(4);
    /*this.treemapRenderer.displayTopWeightLabels(20);*/


  }

  onExtentChanged() {
    this.treemapRenderer.resize();
  }

  //TODO lively migrate visualization._renderer._camera

}

class TreemapRenderer extends gloperate.Initializable {

  constructor(htmlCanvasElement, visualizationType) {
    super();
    this.initialize(htmlCanvasElement, visualizationType);
  }

  initialize(htmlCanvasElement, visualizationType) {
    this.visualizationType = visualizationType;
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization(this.visualizationType);
    this.renderer = this.visualization.renderer;
    this.canvas.renderer = this.renderer;
    this._setupConfig();
    this.visualization.configuration = this.config;
    this._initialized = true;

    this.updateView();

    console.log("state after initialization");
    console.log({
      inner: [window.innerWidth, window.innerHeight],
      css: [this.canvas._element.clientWidth, this.canvas._element.clientHeight],
      backing: [this.canvas._element.width, this.canvas._element.height],
      dr: window.devicePixelRatio
    });
    console.log(this.canvas._element.getBoundingClientRect())

    return true;
  }

  //TODO: this should be called to get rid of old WebGL Contexts
  uninitialize() {
    this.canvas.dispose();
    this.renderer.uninitialize();
  }

  updateView() {
    //clone config to ensure invalidation of every attribute   
    let config = new Configuration();
    config.topology = this.config.topology;
    config.layout = this.config.layout;
    config.buffers = this.config.buffers;
    config.bufferViews = this.config.bufferViews;
    config.colors = this.config.colors;
    config.geometry = this.config.geometry;
    config.labels = this.config.labels;

    this.config = config;

    //TODO Why the hell do I need this line?
    this.visualization.configuration = this.config;

    this.visualization.update();
    this.renderer.invalidate();

  }

  resize() {
    // TODO: this should be called automatically when the html canvas resizes
    this.canvas.resize();
    this.canvas.element.width = this.canvas.size[0];
    this.canvas.element.height = this.canvas.size[1];
    this.visualization.update();
    this.renderer.invalidate();
    //this.renderer.navigation.invalidate();
  }

  setData(dataParameter) {

    if (dataParameter.data) this.data = dataParameter.data;

    if (dataParameter.weightAttributeName) this.weightAttribute = dataParameter.weightAttributeName;
    if (dataParameter.heightAttributeName) this.heightAttribute = dataParameter.heightAttributeName;
    if (dataParameter.colorAttributeName) this.colorAttribute = dataParameter.colorAttributeName;
    if (dataParameter.childrenAttributeName) this.childrenAttribute = dataParameter.childrenAttributeName;
    if (dataParameter.labelAttributeName) this.labelAttribute = dataParameter.labelAttributeName;

    if (!this.data) {
      return;
    }

    if (!this.weightAttribute) this.weightAttribute = 'weight';
    if (!this.heightAttribute) this.heightAttribute = 'height';
    if (!this.colorAttribute) this.colorAttribute = 'color';
    if (!this.childrenAttribute) this.childrenAttribute = 'children';
    if (!this.labelAttribute) this.labelAttribute = 'label';

    this.labelToID = new Map();

    if (Array.isArray(this.data)) {
      lively.warn(
        "Expected a hierarchical data object. Created an artificial root. Is your children attribute name correct?"
        );
      this.data = this._rootData(this.data);
    }

    const topologyData = [];
    const weightData = [];
    const heightData = [];
    const labelData = [];
    const colorData = [];
    let indexID = 0;

    //read JSON using BFS
    const queue = [{ nodeData: this.data, parentID: undefined }]

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (currentNode == undefined) continue;
      const currentID = indexID;
      indexID++;

      if (currentNode.parentID !== undefined) {
        topologyData.push(currentNode.parentID, currentID);
      }

      const nodeWeight = Number(
        (currentNode.nodeData[this.weightAttribute]) ?
        currentNode.nodeData[this.weightAttribute] :
        1);
      const nodeHeight = Number(
        (currentNode.nodeData[this.heightAttribute]) ?
        currentNode.nodeData[this.heightAttribute] :
        0);
      const nodeColor = Number(
        (currentNode.nodeData[this.colorAttribute]) ?
        currentNode.nodeData[this.colorAttribute] :
        0);
      const nodeLabel = currentNode.nodeData[this.labelAttribute] ?
        currentNode.nodeData[this.labelAttribute] :
        '';

      weightData.push(nodeWeight);
      heightData.push(nodeHeight);
      colorData.push(nodeColor);
      labelData.push([currentID, nodeLabel]);
      this.labelToID.set(nodeLabel, currentID);

      if (!currentNode.nodeData[this.childrenAttribute]) continue;
      for (const child of currentNode.nodeData[this.childrenAttribute]) {
        queue.push({ nodeData: child, parentID: currentID });
      }
    }

    this.config.topology.edges = topologyData;
    this.config.buffers[0].data = weightData;
    this.config.buffers[1].data = heightData;
    this.config.buffers[2].data = colorData;
    this.config.labels.names = Object.fromEntries(labelData);

    this.updateView();

  }

  setColorScheme(preset) {
    if (!Object.values(TreemapColorSchemes).includes(preset)) {
      lively.warn("Unknown color scheme! Please use a TreemapColorScheme!");
      return;
    }
    this.config.colors[3].preset = preset;
    this.updateView();
  }

  setColorSteps(steps) {
    //TODO Range is defined by Color Svheme
    this.config.colors[3].steps = steps;
    this.updateView();
  }

  highlightByID(nodeIDs) {
    if (!Array.isArray(nodeIDs)) {
      lively.warn("Expected an array of IDs!");
      return;
    }
    for (const nodeID of nodeIDs) {
      if (this.config.geometry.emphasis.highlight.includes(nodeID)) continue;
      this.config.geometry.emphasis.highlight.push(nodeID);
    }
    this.updateView();
  }

  highlightByLabel(nodeLabels) {
    if (!Array.isArray(nodeLabels)) {
      lively.warn("Expected an array of labels!");
      return;
    }
    const nodeIDs = [];
    for (const nodeLabel of nodeLabels) {
      nodeIDs.push(this.labelToID.get(nodeLabel));
    }
    this.highlightByID(nodeIDs);
  }

  removeHighlightsByLabel(nodeLabels) {
    if (!Array.isArray(nodeLabels)) {
      lively.warn("Expected an array of labels!");
      return;
    }
    lively.notify(nodeLabels);
    const nodeIDs = [];
    for (const nodeLabel of nodeLabels) {
      nodeIDs.push(this.labelToID.get(nodeLabel));
    }
    this.removeHighlightsByID(nodeIDs);
  }

  removeHighlightsByID(nodeIDs) {
    if (!Array.isArray(nodeIDs)) {
      lively.warn("Expected an array of IDs!");
      return;
    }
    for (const nodeID of nodeIDs) {
      const index = this.config.geometry.emphasis.highlight.indexOf(nodeID);
      if (index < 0) continue;
      this.config.geometry.emphasis.highlight.splice(index, 1);
    }
    this.updateView();
  }

  removeHighlights() {
    this.config.geometry.emphasis.highlight = [];
    this.updateView();
  }

  setHighlightColor(hexCode) {
    //TODO regex check
    this.config.colors[0].value = hexCode;
    this.updateView();
  }

  setColorMapping(colorAttributeName) {
    this.setData({ colorAttributeName: colorAttributeName });
  }

  setWeightMapping(weightAttributeName) {
    this.setData({ weightAttributeName: weightAttributeName });
  }

  setHeightMapping(heightAttributeName) {
    this.setData({ heightAttributeName: heightAttributeName });
  }

  setChildrenMapping(childrenAttributeName) {
    this.setData({ childrenAttributeName: childrenAttributeName });
  }

  setLabelMapping(labelAttributeName) {
    this.setData({ labelAttributeName: labelAttributeName });
  }

  showTopWeightLabels(n) {
    if (isNaN(n)) {
      lively.warn("Expected a number of nodes to display!");
      return;
    }
    this.config.labels.numTopWeightNodes = n;
    this.updateView();
  }

  showTopHeightLabels(n) {
    if (isNaN(n)) {
      lively.warn("Expected a number of nodes to display!");
      return;
    }
    this.config.labels.numTopHeightNodes = n;
    this.updateView();
  }

  showTopColorLabels(n) {
    if (isNaN(n)) {
      lively.warn("Expected a number of nodes to display!");
      return;
    }
    this.config.labels.numTopColorNodes = n;
    this.updateView();
  }

  showLabels(labels) {
    if (!Array.isArray(labels)) {
      lively.warn("Expected an array of labels!");
      return;
    }
    const nodeIDs = [];
    for (const nodeLabel of labels) {
      nodeIDs.push(this.labelToID.get(nodeLabel));
    }
    this.config.labels.additionallyLabelSet = nodeIDs;
    this.updateView();
  }

  showAllLabels() {
    const maxNodeCount = this.config.topology.edges.length / 2;
    this.showTopWeightLabels(maxNodeCount);
    this.showTopHeightLabels(maxNodeCount);
    this.showTopColorLabels(maxNodeCount);
  }

  removeLabels() {
    this.showTopWeightLabels(0);
    this.showTopHeightLabels(0);
    this.showTopColorLabels(0);
    this.showLabels([]);
  }

  setNodeEnterFunction(nodeEnterFunction) {
    if (this.nodeEnterSubscription !== undefined) this.nodeEnterSubscription.unsubscribe();
    this.renderer.navigation.nodeEnter$.subscribe(event => nodeEnterFunction(event));
  }

  setNodeLeaveFunction(nodeLeaveFunction) {
    if (this.nodeLeaveSubscription !== undefined) this.nodeLeaveSubscription.unsubscribe();
    this.renderer.navigation.nodeLeave$.subscribe(event => nodeLeaveFunction(event));
  }

  setNodeSelectFunction(nodeSelectFunction) {
    if (this.nodeSelectSubscription !== undefined) this.nodeSelectSubscription.unsubscribe();
    this.renderer.navigation.nodeSelect$.subscribe(event => nodeSelectFunction(event));
  }

  _rootData(array) {
    const outputObject = {};
    outputObject[this.labelAttribute] = "source";
    outputObject[this.childrenAttribute] = []
    array.forEach(entry => {
      outputObject[this.childrenAttribute].push(entry);
    });
    return outputObject;
  }

  _setupConfig() {
    let config = new Configuration();

    config.topology = {
      edges: [0, 1, 0, 2],
      format: "interleaved",
      semantics: "parent-id-id"
    }

    config.layout = {
      algorithm: "strip",
      weight: "bufferView:weights",
      sort: {
        key: "bufferView:weights",
        algorithm: "keep"
      },
      parentPadding: {
        type: "relative",
        value: 0.05
      },
      siblingMargin: {
        type: "relative",
        value: 0.1
      },
      accessoryPadding: {
        type: "absolute",
        direction: "bottom",
        value: [
          0,
          0.02,
          0.01,
          0
        ],
        relativeAreaThreshold: 0.4,
        targetAspectRatio: 8
      }
    }

    config.buffers = [{
        identifier: "source-weights",
        type: "numbers",
        data: [0, 1, 1],
        linearization: "topology"
      },
      {
        identifier: "source-heights",
        type: "numbers",
        data: [0, 1, 1],
        linearization: "topology"
      },
      {
        identifier: "source-colors",
        type: "numbers",
        data: [0, 1, 0.5],
        linearization: "topology"
      }
    ];

    config.bufferViews = [{
        identifier: "weights",
        source: "buffer:source-weights",
        transformations: [{
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "propagate-up",
            operation: "sum"
          }
        ]
      },
      {
        identifier: "heights-normalized",
        source: "buffer:source-heights",
        transformations: [{
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "normalize",
            operation: "zero-to-max"
          }
        ]
      },
      {
        identifier: "colors-normalized",
        source: "buffer:source-colors",
        transformations: [{
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "normalize",
            operation: "zero-to-max"
          }
        ]
      }
    ];

    config.colors = [{
        identifier: "emphasis",
        colorspace: "hex",
        value: "#00b0ff"
      },                     
      {
        identifier: "auxiliary",
        colorspace: "hex",
        values: [
          "#00aa5e",
          "#71237c"
        ]
      },
      {
        identifier: "inner",
        colorspace: "hex",
        values: [
          "#e8eaee",
          "#eef0f4"
        ]
      },
      {
        identifier: "leaf",
        preset: "Blues",
        steps: 7
      }
    ];

    config.geometry = {
      parentLayer: { showRoot: false },
      leafLayer: {
        colorMap: "color:leaf",
        height: "bufferView:heights-normalized",
        colors: "bufferView:colors-normalized"
      },
      emphasis: {
        outline: [],
        highlight: []
      },
      heightScale: 0.5
    };

    config.labels = {
      "innerNodeLayerRange": [
        1,
        3
      ],
      "additionallyLabelSet": [],
      numTopInnerNodes: 50,
      numTopWeightNodes: 10,
      numTopHeightNodes: 10,
      numTopColorNodes: 10,
      names: {
        "1": "leaf 1",
        "2": "leaf 2"
      }
    };

    this.config = config;
  }
}
