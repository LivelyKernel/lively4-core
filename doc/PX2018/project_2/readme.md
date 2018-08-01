<style>
p {
  max-width: 800px;
  text-align: justify;
}

.code {
  font-family: monospace;
  font-size: 1.2em;
}
</style>

# Presentations
- [Mid-term presentation](browse://doc/PX2018/project_2/presentation/presentation-2018-07-18.md)
- [Final presentation](browse://doc/PX2018/project_2/presentation/presentation-2018-05-16.md)

# Implementation
Artifacts:

- <strong>lively-mpm.js</strong>: Container class to step through an animation defined by a subclass of MpmAnimation.
- <strong>elasticbodies.js</strong>: Defines the animation of two elastic bodies, which collide at f(x) = x.
- <strong>matrix.js</strong>: Encapsulates math.js matrix function to provide an object-like matrix class
- <strong>presentation-animation.js</strong>: Shows configurable, browseable sketches to illustrate MPM

## Mesh-Generation
- Used [Gmsh](http://gmsh.info/) for mesh point generation
  - Points stored in [gmsh-circle-mesh.json](browse://doc/PX2018/project_2/gmsh-circle-mesh.json)
  - Loaded via [circlemesh.js](browse://doc/PX2018/project_2/circlemesh.js)
- Alternative: random points (less appealing look)


## Usage
- Start the lively-mpm component
- Press "Start Animation" or "Step"
- Speed changes are applied on reset
- The opacity of the optional grid can be changed

# Future Work
Currently, the algorithm is not working as intended and does not incorporate the live-programming tools of Lively4. By integrating the algorithm into the Lively4 environment, it can be debugged more easily to identify remaining implementation errors. 