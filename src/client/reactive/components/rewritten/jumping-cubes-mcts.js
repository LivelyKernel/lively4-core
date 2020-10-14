
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
    return this._children = this._children || this.possibleMoves
    // #TODO use .applyMove
    ().map(move => [move, this.applyMove(move)]);;
  }

  applyMove(move) {
    return new MCTSNode(doMove(move, this.state), this);
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

function canClick(cube, color) {
  return cube.color === color || cube.color === 'gray';
}

export default class MCTS {
  constructor(rootState) {
    this.root = new MCTSNode(rootState);
    this.root.visited = true;
  }

  async run(resources) {
    // let start = performance.now()
    while (resources-- > 0) {
      const leaf = this.traverse(this.root);
      // lively.success(leaf.parentNode === this.root)
      // lively.warn(this.root.children.find(([, c])=>c===leaf))
      const result = this.simulation(leaf);
      this.backpropagation(leaf, result);
      // lively.notify(performance.now()-start);
      // start = performance.now()

      await new Promise(requestAnimationFrame);
    }

    lively.notify(this.root.children.map(([, c]) => c.wins + '/' + c.playouts).join(' '));
    return this.root.children.maxBy(([, { playouts }]) => playouts).first;
  }

  traverse(node) {
    const nodeToExplore = this.selection(node);
    return this.expansion(nodeToExplore);
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

  simulation(node) {
    node.visited = true;

    while (!node.isTerminal()) {
      const moves = node.possibleMoves();
      const chosenMove = RolloutPolicy.uniformRandom(node, moves);
      node = node.applyMove(chosenMove);
    }

    return this.evaluate(node);
  }

  evaluate(node) {
    lively.notify(node.state.field[0][0].color + ' wins');
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

  // _.cloneDeep()
  field = field.map(line => line.map(({ color, value, numNeighbours }) => ({ color, value, numNeighbours })));

  let cubeInfo;
  const cubesToIncrement = [[field[i][j], i, j]];
  while (cubeInfo = cubesToIncrement.shift()) {
    const [cube, cubeI, cubeJ] = cubeInfo;
    cube.color = color;
    cube.value++;

    if (field.every(line => line.every(cube => cube.color === color))) {
      return { field, color: oppositeColor(color) };
    }

    if (cube.value > cube.numNeighbours) {
      if (field[cubeI - 1]) {
        cubesToIncrement.push([field[cubeI - 1][cubeJ], cubeI - 1, cubeJ]);
      }
      if (field[cubeI][cubeJ - 1]) {
        cubesToIncrement.push([field[cubeI][cubeJ - 1], cubeI, cubeJ - 1]);
      }
      if (field[cubeI + 1]) {
        cubesToIncrement.push([field[cubeI + 1][cubeJ], cubeI + 1, cubeJ]);
      }
      if (field[cubeI][cubeJ + 1]) {
        cubesToIncrement.push([field[cubeI][cubeJ + 1], cubeI, cubeJ + 1]);
      }
    }
  }

  return { field, color: oppositeColor(color) };
}

function oppositeColor(color) {
  return color === 'red' ? 'green' : 'red';
}