
class MCTSNode {

  constructor(state, parentNode) {
    this.visited = false;

    this.state = state;
    this.parentNode = parentNode;

    // evaluation
    this.wins = 0;
    this.playouts = 0;
  }

  possibleMoves() {
    const field = this.state.field;
    const color = this.state.color;

    return field.flatMap((line, i) => line.filterMap((cube, j) => canClick(cube, color) ? { i, j } : undefined));
  }

  get fullyExpanded() {
    return this.children.every(([, { visited }]) => visited);
  }

  get children() {
    return this._children = this._children || this.possibleMoves().map(move => [move, this.applyMove(move)]);
  }

  childNodes() {
    return this._children.map(moveAndChild => moveAndChild[1]);
  }

  applyMove(move) {
    return new MCTSNode(doMove(move, cloneState(this.state)), this);
  }

  // all cubes have same (non-gray) color
  isTerminal() {
    const color = this.state.field[0][0].color;
    if (color === 'gray') {
      return false;
    }
    for (let line of this.state.field) {
      for (let cube of line) {
        if (cube.color !== color) {
          return false;
        }
      }
    }
    return true;
  }

  print() {
    const field = this.state.field;

    const values = field.map(line => line.map(cube => '%c' + cube.value).join('')).join('\n');
    const colors = field.flatMap(line => line.map(cube => 'color:' + cube.color));

    console.log(values, ...colors);
  }

}

function cloneState(state) {
  const field = state.field.map(line => line.map(cube => ({
    color: cube.color,
    value: cube.value,
    numNeighbours: cube.numNeighbours,
  })));

  field.forEach((line, i) => line.forEach((cube, j) => {
    cube.neighbours = [];
    if (field[i - 1]) {
      cube.neighbours.push(field[i - 1][j]);
    }
    if (field[i][j - 1]) {
      cube.neighbours.push(field[i][j - 1]);
    }
    if (field[i + 1]) {
      cube.neighbours.push(field[i + 1][j]);
    }
    if (field[i][j + 1]) {
      cube.neighbours.push(field[i][j + 1]);
    }
  }));

  return {
    field,
    color: state.color,
  }
}

function canClick(cube, color) {
  return cube.color === color || cube.color === 'gray';
}

export default class MCTS {
  constructor(rootState) {
    this.root = new MCTSNode(rootState);
    this.root.visited = true;
  }

  async run(resources, { progress = () => {} }) {
    const allResources = resources;

    const HALF_FRAME = 1000 / 60 / 2;
    let start = performance.now();
    const times = [];
    while (resources-- > 0) {
      const begin = performance.now();
      this.step();
      times.push(performance.now() - begin);

      if (performance.now() - start > HALF_FRAME) {
        progress(this.root.state.color, 1 - resources / allResources);
        await new Promise(requestAnimationFrame);
        start = performance.now();
      } else {
        continue;
      }
    }
    lively.warn(times.average())

    // lively.openInspector(this.root)
    // lively.notify(this.root.children.map(([, c]) => c.wins + '/' + c.playouts).join(' '));
    return this.root.children.maxBy(([, { playouts }]) => playouts).first;
  }

  step() {
    const nodeToExplore = this.selection(this.root);
    const leaf = this.expansion(nodeToExplore);
    const result = this.simulation(leaf);
    this.backpropagation(leaf, result);
  }

  selection(node) {
    function bestUCT(node) {
      return node.children.map(([, childNode]) => childNode).maxBy(childNode => {
        return childNode.wins / childNode.playouts + Math.SQRT2 * Math.sqrt(Math.log(node.playouts) / childNode.playouts);
      });
    }
    while (node.fullyExpanded && !node.isTerminal()) {
      node = bestUCT(node);
    }
    return node;
  }

  // pick unvisited child
  expansion(node) {
    if (node.isTerminal()) {
      return node;
    }
    return node.children.filter(([, { visited }]) => !visited).map(([, child]) => child).sample() || node;
  }

  simulation(leafNode) {
    leafNode.visited = true;

    let node = leafNode;
    while (!node.isTerminal()) {
      const moves = node.possibleMoves();
      const chosenMove = RolloutPolicy.uniformRandom(node, moves);
      if (node === leafNode) {
        node = node.applyMove(chosenMove);
      } else {
        // quick .applyMove without cloning objects for rest of simulation
        node = new MCTSNode(doMove(chosenMove, node.state), this);
      }
    }

    return this.evaluate(node);
  }

  evaluate(node) {
    // lively.notify(node.state.field[0][0].color + ' wins');
    return node.state.field[0][0].color;
  }

  backpropagation(node, result) {
    while (node) {
      if (node.state.color !== result) {
        node.wins++;
      }
      node.playouts++;
      node = node.parentNode;
    }
  }
}

class RolloutPolicy {
  static uniformRandom(node, moves) {
    return moves.sample();
  }
}

// state: field, color (player on turn)
// cube: color, value, numNeighbours
// move: i, j
function doMove({ i, j }, { field, color }) {
  const moveColor = field[i][j].color;
  if (moveColor !== color && moveColor !== 'gray') {
    throw new Error('illegal Move');
  }

  const numCubes = field.length * field.first.length;
  let capturedCubes = field.sumBy(line => line.count(cube => cube.color === color));

  let cube;
  const cubesToIncrement = [field[i][j]];
  while (cube = cubesToIncrement.shift()) {
    if (cube.color !== color) {
      capturedCubes++;
    }
    cube.color = color;
    cube.value++;
    if (numCubes === capturedCubes) {
      return { field, color: oppositeColor(color) };
    }

    if (cube.value > cube.numNeighbours) {
      cube.value -= cube.numNeighbours;
      cubesToIncrement.push(...cube.neighbours);
    }
  }
  
  // layerwiseIncrements(field[i][j], color, numCubes, capturedCubes)
  // recursiveIncrements(field[i][j], color, numCubes, capturedCubes)

  return { field, color: oppositeColor(color) };
}

function layerwiseIncrements(initialCube, color, numCubes, capturedCubes) {
  
  let cubes1 = [initialCube];
  let cubes2 = [];

  while (cubes1.length > 0) {

    for (let cube1 of cubes1) {
      if (cube1.color !== color) {
        capturedCubes++;
      }
      cube1.color = color;
      cube1.value++;
      if (cube1.value > cube1.numNeighbours) {
        cube1.value -= cube1.numNeighbours;
        cubes2.push(...cube1.neighbours);
      }
    }
    cubes1.length = 0;

    for (let cube2 of cubes2) {
      if (cube2.color !== color) {
        capturedCubes++;
      }
      cube2.color = color;
      cube2.value++;
      if (cube2.value > cube2.numNeighbours) {
        cube2.value -= cube2.numNeighbours;
        cubes1.push(...cube2.neighbours);
      }
    }
    cubes2.length = 0;
    
    if (numCubes === capturedCubes) {
      return;
    }
  }
}

function recursiveIncrements(initialCube, color, numCubes, capturedCubes) {
  
  function increment(cube) {
    if (cube.color !== color) {
      capturedCubes++;
    }
    cube.color = color;
    cube.value++;
    if (numCubes === capturedCubes) {
      return true;
    }

    if (cube.value > cube.numNeighbours) {
      cube.value -= cube.numNeighbours;
      for (let neighbour of cube.neighbours) {
        increment(neighbour);
      }
    }
  }
  
  return increment(initialCube);
}

function oppositeColor(color) {
  return color === 'red' ? 'green' : 'red';
}