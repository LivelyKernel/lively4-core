"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import { debounce } from 'utils';
import {
  gloperate,
  Configuration,
  initialize as initializeCanvas,
  Renderer,
  Visualization
} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export default class LivelyTreemap extends Morph {
  
  setData(data = undefined, weightAttribute = undefined, heightAttribute = undefined, colorAttribute = undefined) {
    this.treemapRenderer.setData(data, weightAttribute, heightAttribute, colorAttribute);
  }
  
  setColorScheme(preset) {
   this.treemapRenderer.setColorScheme(preset); 
  }
  
  setColorSteps(steps) {
    this.treemapRenderer.setColorSteps(steps);
  }


  highlightNodesByID(nodeIDs) {
    this.treemapRenderer.highlightNodesByID(nodeIDs);
  }
  
  highlightNodesByLabel(nodeLabels) {
    this.treemapRenderer.highlightNodesByLabel(nodeLabels);
  }

  removeNodeHighlights(nodeIDs = undefined) {
    this.treemapRenderer.removeNodeHighlights(nodeIDs = undefined);
  }

  //TODO change mappings
  setColorAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  setWeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  setHeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  displayTopWeightLabels(n) {
    this.treemapRenderer.displayTopWeightLabels(n);
  }

  displayTopHeightLabels(n) {
    this.treemapRenderer.displayTopHeightLabels(n);
  }

  displayTopColorLabels(n) {
    this.treemapRenderer.displayTopColorLabels(n);
  }

  setVisualizationType(visualizationType) {
    this.treemapRenderer.setVisualizationType(visualizationType);
  }
  
  async initialize() {
    this.treemapRenderer = new TreemapRenderer(this.get("#treemap-canvas"));
    
    // Code for testing
    /*const weightAttributeName = "size";
    const heightAttributeName = "size";
    const colorAttributeName = "size";
    const componentData = await Files.fileTree("src/components");
    this.treemapRenderer.setData(componentData, weightAttributeName, heightAttributeName, colorAttributeName);
    
    this.treemapRenderer.setColorScheme("Reds");
    this.treemapRenderer.setColorSteps(7);
    this.treemapRenderer.highlightNodesByLabel(['lively-treemap.js']);

    this.treemapRenderer.displayTopWeightLabels(10);
    this.treemapRenderer.displayTopColorLabels(10);
    this.treemapRenderer.displayTopHeightLabels(10);*/

  }

  onExtentChanged() {
    this.treemapRenderer.resize();
  }

  //TODO lively migrate visualization._renderer._camera

}

const VisualizationType = {
  VISUALIZATION_2D: 0,
  VISUALIZATION_3D: 1
};

class TreemapRenderer extends gloperate.Initializable {

  constructor(htmlCanvasElement) {
    super();
    this.initialize(htmlCanvasElement);
  }

  initialize(htmlCanvasElement) {
    //TODO parameterize
    this.visualizationType = VisualizationType.VISUALIZATION_3D;
        
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization(this.visualizationType);
    this.renderer = this.visualization.renderer;
    this.canvas.renderer = this.renderer;
    this.setupConfig();
    this.visualization.configuration = this.config;
    this._initialized = true;

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
    //TODO: Doesn't work
    this.visualization.renderer.altered.alter("frameSize");
    this.updateView();
  }


  setData(data = undefined, weightAttribute = undefined, heightAttribute = undefined, colorAttribute = undefined) {
    
    //TODO: add children and label parameters
    if (weightAttribute) this.weightAttribute = weightAttribute;
    if (heightAttribute) this.heightAttribute = heightAttribute;
    if (colorAttribute) this.colorAttribute = colorAttribute;

    if (!data) {
      return;
    }
    
    if(!this.weightAttribute) this.weightAttribute = 'weight';
    if(!this.heightAttribute) this.heightAttribute = 'height';
    if(!this.colorAttribute) this.colorAttribute = 'color';
    
    this.labelToID = new Map();
    
    const topologyData = [];
    const weightData = [];
    const heightData = [];
    const labelData = [];
    const colorData = [];
    let indexID = 0;

    //read JSON using BFS
    const queue = [{ nodeData: data, parentID: undefined }]

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (currentNode == undefined) continue;
      const currentID = indexID;
      indexID++;

      if (currentNode.parentID !== undefined) {
        topologyData.push(currentNode.parentID, currentID);
        labelData.push([currentID, currentNode.nodeData.name]);
        this.labelToID.set(currentNode.nodeData.name, currentID);
      }

      const nodeWeight = Number((currentNode.nodeData[this.weightAttribute] && currentNode.nodeData.type ==
        "file") ? currentNode.nodeData[this.weightAttribute] : 0);
      const nodeHeight = Number((currentNode.nodeData[this.heightAttribute] && currentNode.nodeData.type ==
        "file") ? currentNode.nodeData[this.heightAttribute] : 0);
      const nodeColor = Number((currentNode.nodeData[this.colorAttribute] && currentNode.nodeData.type == "file") ?
        currentNode.nodeData[this.colorAttribute] : 0);

      weightData.push(nodeWeight);
      heightData.push(nodeHeight);
      colorData.push(nodeColor);

      if (!currentNode.nodeData.children) continue;
      for (const child of currentNode.nodeData.children) {
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
    this.config.colors[3].preset = preset;
    this.updateView();
  }


  setColorSteps(steps) {
    this.config.colors[3].steps = steps;
    this.updateView();
  }


  highlightNodesByID(nodeIDs) {
    for (const nodeID of nodeIDs) {
      this.config.geometry.emphasis.highlight.push(nodeID);
    }
    this.updateView();
  }
  
  highlightNodesByLabel(nodeLabels) {
    const nodeIDs = [];
    for (const nodeLabel of nodeLabels) {
      nodeIDs.push(this.labelToID.get(nodeLabel));
    }
    
    this.highlightNodesByID(nodeIDs);
  }

  removeNodeHighlights(nodeIDs = undefined) {
    if (nodeIDs === undefined) {
      this.config.geometry.emphasis.highlight = [];
      return;
    }

    for (const nodeID of nodeIDs) {
      const index = this.config.geometry.emphasis.highlight.indexOf(nodeID);
      if (index > -1) {
        this.config.geometry.emphasis.highlight.splice(index, 1);
      }
    }
    this.updateView();
  }

  //TODO change mappings
  setColorAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  setWeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  setHeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }


  displayTopWeightLabels(n) {
    this.config.labels.numTopWeightNodes = n;
    this.updateView();
  }

  displayTopHeightLabels(n) {
    this.config.labels.numTopHeightNodes = n;
    this.updateView();
  }

  displayTopColorLabels(n) {
    this.config.labels.numTopColorNodes = n;
    this.updateView();
  }

  setVisualizationType(visualizationType) {
    //TODO reconstruct whole renderer
  }
  
  setupConfig() {
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
        data: [0,1,1],
        linearization: "topology"
      },
      {
        identifier: "source-heights",
        type: "numbers",
        data: [0,1,1],
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
      numTopInnerNodes: 50, //todo set this to inner label count
      numTopWeightNodes: 7,
      numTopHeightNodes: 0,
      numTopColorNodes: 0,
      names: {
        "1": "leaf 1",
        "2": "leaf 2"
      }
    };

    this.config = config;
  }
}