// https://github.com/1999/topological-sort
export default class TopologicalSort {

    constructor(nodes) {
        this.nodes = new Map();
        this.addMultipleInternalNodes(nodes);
    }

    addNode(key, node) {
        return this.addInternalNode(key, node);
    }

    addNodes(nodes) {
        this.addMultipleInternalNodes(nodes);
    }

    addEdge(fromKey, toKey) {
        const sourceNode = this.nodes.get(fromKey);
        const targetNode = this.nodes.get(toKey);
        sourceNode.children.set(toKey, targetNode);
    }

    sort() {
        this.visitedNodes = new Set();
        this.sortedKeysStack = [];
        const output = new Map();

        for (const [key] of this.nodes) {
            this.exploreNode(key, []);
        }

        for (let i = this.sortedKeysStack.length - 1; i >= 0; i--) {
            const node = this.nodes.get(this.sortedKeysStack[i]);
            output.set(this.sortedKeysStack[i], node);
        }

        return output;
    }

    exploreNode(nodeKey, explorePath) {
        const newExplorePath = [...explorePath, nodeKey];

        const node = this.nodes.get(nodeKey);
        if (this.visitedNodes.has(node)) {
            return;
        }

        // mark node as visited so that it and its children
        // won't be explored next time
        this.visitedNodes.add(node);

        for (const [childNodeKey] of node.children) {
            this.exploreNode(childNodeKey, newExplorePath);
        }

        this.sortedKeysStack.push(nodeKey);
    }

    addInternalNode(key, node) {
        this.nodes.set(key, {
            children: new Map(),
            node,
        });

        return this;
    }

    addMultipleInternalNodes(nodes) {
        const nodesFlat = [...nodes];

        for (let i = nodes.size - 1; i >= 0; i--) {
            const [key, node] = nodesFlat[i];
            this.addInternalNode(key, node);
        }
    }

}
