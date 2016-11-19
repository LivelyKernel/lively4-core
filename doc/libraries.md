# Libraries 

__We don't want to do everything ourselves... anymore__

Using powerful compontents can make live more complicated, e.g. sometimes understanding them and intergrating them can be hard or sometimes nearly imposible. And sometimes your are buying more that you actually wanted..

We have serveral use cases in mind:

- create diagrams for documentation / illustration / mindmapping... ("Graffle")
- collaborative note taking and scribling with a pen, say digital whiteboard + notebook (OneNote)
- make use of interactive graph edting and layout in our applications ("Lively Fabrik")
- create (interactive) visualizations ("D3")
- Mix textual notes with hand taken notes and vector drawings into interactive documents ("Lively Notes")

# Graphic libraries

Since Lively4 commits just to html5, we are agnostic when it comes to canvas or svg and want to leave it to the application developers what to use. That said, our tools are also applications that need some graphics. So we have to decide what to use..

## Overview Articles comparing JavaScript Vector Graphic Libraries

- [7-awesome-javascript-libraries-for-drawing](http://www.learningjquery.com/2015/05/7-awesome-javascript-libraries-for-drawing)
- [javascript-drawing-libraries-diagrams](http://modeling-languages.com/javascript-drawing-libraries-diagrams/)
- [Comparison of 2D canvas libraries](https://docs.google.com/spreadsheets/d/1JYEGMN2jJtmwyjB4DMw3uaYLVMkduf61suKpiOzo0hc/edit#gid=0)
- [JavaScript_graphics_library on wikipedia](https://en.wikipedia.org/wiki/JavaScript_graphics_library)

## Diagramming

- [MxGraph](https://github.com/jgraph/mxgraph), (Apache License)
  - showcase: [draw.io](https://github.com/jgraph/draw.io)  (GPL Licence) 
- [JointJS](https://github.com/clientIO/joint), (Apache License) 
  - Rappid #comerical "Rappid is a diagramming framework for advanced applications, delivering the best of HTML 5 + SVG and providing you with the right tools to build outstanding products."
- Microsoft's Powerpoint #Propriatary
- [jsPlumb](http://jsplumbtoolkit.com) #MIT


## Note taking
- Microsoft's OneNote #Propriatary
  - Collaborative
  - Cloud/REST API
- Google Docs #Propriatary

## Charting library
- [D3 - Data-Driven Documents](http://d3js.org/)(BSD license) 
  - DOM + SVG, Examples 
- [Plotly.js](https://plot.ly/javascript/) #MIT [github](https://github.com/plotly/plotly.js)
  - "Built on top of d3.js and stack.gl, plotly.js is a high-level, declarative charting library. plotly.js ships with 20 chart types, including 3D charts, statistical graphs, and SVG maps."
- [GraphicsJS](http://www.graphicsjs.org) #BSD
  - free library of [AnyChart.js](http://www.anychart.com) #Compercial

# Games and Interaction Design=

- [Processing.js](http://processingjs.org)
- [two.js](https://two.js.org/) 
  - "Two.js is a two-dimensional drawing api geared towards modern web browsers. It is renderer agnostic enabling the same api to draw in multiple contexts:"
  - #SVG #Canvas #Webgl.
- [Three.js](http://mrdoob.github.com/three.js) #WebGL

# Generic 2D Scenegraph
- [Raphael](http://dmitrybaranovskiy.github.io/raphael/) #MIT 
- EaselJS
  - "A JavaScript library that makes working with the HTML5 Canvas element easy. Useful for creating games, generative art, and other highly graphical experiences."
  - part of [CreateJS](http://createjs.com/) #MIT 
    - "A suite of open source libraries and tools for building rich interactive content on open web technologies." 
- [Fabric.js](http://fabricjs.com/) #MIT 
  - #Canvas, Examples
- [Paperjs](http://paperjs.org) #MIT 

# Graph Layout
- [Dagre] (https://github.com/cpettitt/dagre) #MIT
  - [combined with JointJS](http://www.daviddurman.com/automatic-graph-layout-with-jointjs-and-dagre.html)
  - 
## Misc
- [BonsaiJS](http://bonsaijs.org/) #MIT 
  - "A lightweight graphics library with an intuitive graphics API and an SVG renderer." 
- [Cakejs](http://code.google.com/p/cakejs/) #MIT 
  - #jQuery UI framework 
- [dojox.gfx](http://dojotoolkit.org)([Dojo)(dual BSD and AFL license)
- [GoJS](http://gojs.net)
- [JenScript](http://jensoftapi.com/site/framework/jenscript) #AGPL #Commercial
- [jsDraw2DX](http://jsdraw2dx.jsfiction.com) #LGPL
- [JSGL](http://jsgl.org) #LGPL
- [KineticJS](http://kineticjs.com/) #MIT
- [oCanvas](http://ocanvas.org/)
- [p5.js](http://p5js.org/)(#LGPL)
- [ZinoCanvas](http://zinoui.com/demos/canvas)(#GPL #Commercial)




