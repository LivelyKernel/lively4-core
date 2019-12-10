/*Dependency Graph*/

class DependencyGraph {

  get inner() { this._inner }

  constructor(ast) {
    this._inner = DependencyNode.from(ast);
  }

  dependencies() {
    return this._inner.deps;
  }
}


class DependencyNode {

  get node() { return this.path.node }
  get deps() { return this._deps || (this._deps = this.getDependencies()) }

  constructor(path) {
    this.path = path;
    this.children = this.getChildren();
    this.dependencies = null;
  }

  getChildren() {
    return [];
  }

  getDependencies() {
    return this.children.forEach((c) => c.getDependencies()).flat();
  }

  static from(path) {
    let nodeClass = DependencyNode.getType(path);
    return new nodeClass(path)
  }

  static getType(path) {
    switch (path.node.type) {
      case "Identifier": return IdentifierDependencyNode
      case "CallExpression": return CallExpressionDependencyNode
      default: console.error("not yet implemented", path)
    }
  }



}


// TODO check if its reference or not
// TODO is it executed?
class IdentifierDependencyNode extends DependencyNode {

  getDependencies() {
    // if its a function identifier, unwrap the state
    let binding = this.path.scope.getBinding(this.node.name);
    return binding.constViolations
  }
}


class CallExpressionDependencyNode extends DependencyNode {

  getChildren() {
    return [this.path.get("callee")];
  }
}

