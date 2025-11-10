"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import { debounce } from 'utils';
import {gloperate, Configuration, initialize as initializeCanvas, Renderer, Visualization} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    console.log(this);
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    this.fileTreemapRenderer.setData();
    this.fileTreemapRenderer.updateView();
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
  }
  
  async ensureData() {
    if (this.data) return
    this.data =  await Files.fileTree("src");
  
  }
  
  onExtentChanged() {
    this.fileTreemapRenderer.resize();
    this.fileTreemapRenderer.updateView();
  }
  
}


class FileTreemapRenderer extends gloperate.Initializable {
  
  initialize(htmlCanvasElement) {
    this.canvas = initializeCanvas(htmlCanvasElement);
    // Visualization Types: 0 for 2D (buggy but better for use case); 1 for 3D
    this.visualization = new Visualization(0);
    const renderer = this.visualization.renderer;
    this.canvas.renderer = renderer;
    this._initialized = true;

    return true;
  }

  //TODO: this should be called 
  uninitialize() {
    this.canvas.dispose();
    this.renderer.uninitialize();
  }
  
  
  updateView() {
    this.visualization.update()
  }
  
  
  resize() {
    //TODO: Doesn't work yet
    this.visualization.renderer._altered.alter("frameSize");
  }
  
  setData(data = undefined) {
    this.config = new Configuration();
    
    this.config.topology = {
      edges: [0,1,0,2,0,3,0,4,1,5,1,6,2,7,2,8,3,9,3,10,4,11,4,12],
      format: "interleaved",
      semantics: "parent-id-id"
    };
    
    this.config.layout = {
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
        value: 0.05
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
    };
    
    this.config.buffers = [
      {
        identifier: "source-weights",
        type: "numbers",
        data: {
          "0": 0,
          "1": -1,
          "2": -1,
          "3": -1,
          "4": -1,
          "5": 0.125,
          "6": 0.25,
          "7": 0.125,
          "8": 0.125,
          "9": 0.5,
          "10": 0.125,
          "11": 0.5,
          "12": 0.5
        },
        linearization: "topology"
      },
      {
        identifier: "source-heights",
        type: "numbers",
        data: {
          "0": 0,
          "1": -1,
          "2": -1,
          "3": -1,
          "4": -1,
          "5": 0.1,
          "6": 0.1,
          "7": 0.3,
          "8": 0.2,
          "9": 0.1,
          "10": 0.1,
          "11": 0.1,
          "12": 0.2
        },
        linearization: "topology"
      },
      {
        identifier: "source-colors",
        type: "numbers",
        data: {
          "0": 0,
          "1": -1,
          "2": -1,
          "3": -1,
          "4": -1,
          "5": 0,
          "6": 0.1,
          "7": 0.1,
          "8": 0.6,
          "9": 0.7,
          "10": 1,
          "11": 0,
          "12": 0
        },
        linearization: "topology"
      }
    ];
    
    this.config.bufferViews = [
    {
      identifier: "weights",
      source: "buffer:source-weights",
      transformations: [
        {
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
      transformations: [
        {
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
      transformations: [
        {
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
    
    this.config.colors = [
    {
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
    }];
    this.config.geometry = {
      parentLayer: {showRoot: false},
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
    this.config.labels = {"innerNodeLayerRange": [
      1,
      2
    ],
    numTopInnerNodes: 50,
    numTopWeightNodes: 50,
    numTopHeightNodes: 50,
    numTopColorNodes: 50,
    names: {
      "1": "a",
      "2": "b",
      "3": "c",
      "4": "d",
      "5": "e",
      "6": "f",
      "7": "g",
      "8": "h",
      "9": "i",
      "10": "j",
      "11": "k",
      "12": "l"
    }
  };
    
    this.visualization.configuration = this.config;
    this.updateView();
  }
}