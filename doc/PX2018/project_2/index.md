<script>
// all scripts are lively-scripts that share the same "module" and therefore module global variables
import { createNewFileButton } from "doc/PX2018/project_2/utils.js"
</script>


<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">

# Project 2: Sebastian Koall - Material Point Method

<script>if (typeof createNewFileButton !== 'function') {var createNewFileButton = function f(){};}createNewFileButton("doc/PX2018/project_2/notices/", "New Notice", "notices");</script>
<script>if (typeof createNewFileButton !== 'function') {var createNewFileButton = function f(){};}createNewFileButton("doc/PX2018/project_2/meeting/", "New Meeting", "meeting", true);</script>
<script>if (typeof createNewFileButton !== 'function') {var createNewFileButton = function f(){};}createNewFileButton("doc/PX2018/project_2/presentation/", "New Presentation", "presentation", true);</script>  

[Initial Presentation](presentation/presentation-2018-05-16.md)

[Next Meeting](meeting/meeting-2018-05-22.md)


## Dev Notes

This project separates model in a separate class and module from the web component. This is does not work well with our live development tools at the moment. But we can achieve a Smalltalk like experience by at least updating the class (and methods). The problem is that we get a new class after reloading a module. We could fix that and hook into module loading semantics or accept it for now and update specific (or all?) instances by changing the link to the prototype. 

```javascript
var mpm = document.querySelector("lively-mpm")
mpm.animation.particles = mpm.animation.particles.slice(0,12)

mpm.animation.initParticles()


import ElasticBodies from "doc/PX2018/project_2/elasticbodies.js"

// #UPDATE_INSTANCES
// after updating elasticbodies.js, the class changes
mpm.animation.constructor === ElasticBodies

// we can fix this, so we can do live development again....
mpm.animation.__proto__ = ElasticBodies.prototype


// #TODO generalize this, to do a "become" 
```