export default class PrintUtils {
    /**
     * Prints to the console with indented lines
     * @param level Indentationlevel
     * @param content The actual string to be printed
     */
    printIndented(level, content) {
        for (var i = 0; i < level; i++) {
            process.stdout.write("   ");
        }
        process.stdout.write(content + "\n");
    }
    /**
     * Prints a whole Tree
     * @param level Indentationlevel
     * @param start Toplevelnode
     */
    printTree(level, start) {
        this.printIndented(level, start.nameTag);
        if(start.beginning.length>0){
            this.printIndented(level, "Beginning");
        }
        for (var i = 0; i < start.beginning.length; i++) {
            if (start.beginning[i].nameTag === "line") {
                this.printTokens(level + 1, start.beginning[i]);
            } else {
                this.printTree(level + 2, start.beginning[i])
            }
        }
        if(start.children.length>0){
            this.printIndented(level, "Children");
        }
        for (var i = 0; i < start.children.length; i++) {

            if (start.children[i].nameTag === "line") {
                this.printTokens(level + 1, start.children[i]);
            } else {
                this.printTree(level + 2, start.children[i])
            }
        }
        if(start.ending.length>0){
            this.printIndented(level, "Ending");
        }
        for (var i = 0; i < start.ending.length; i++) {
            if (start.ending[i].nameTag === "line") {
                this.printTokens(level + 1, start.ending[i]);
            } else {
                this.printTree(level + 2, start.ending[i])
            }
        }
    }
    /**
     * Prints a line object
     * @param level Indentationlevel
     * @param line Linenode to be printed
     */
    printTokens(level, line) {
        this.printIndented(level, "line")
        for (var i = 0; i < line.children.length; i++) {
            this.printIndented(level + 1, line.children[i].nameTag);
        }
    }
}