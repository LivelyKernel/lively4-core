export default class Node {
    constructor(nameTag) {
        this.nameTag = nameTag;
        this.attributes = {};
        this.beginning = [];
        this.ending = [];
        this.children = [];
        this.matchedCode = "";
        this.parent = null;
        this.protected=false;
    }

    setNext(next) {
        this.next = next;
    }

    setPrevious(previous) {
        this.previous = previous;
    }
}
