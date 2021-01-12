export default function() {

    let counter = 0;

    const visitor = {
        enter(path) {
            if(!path.node.traceid) {
                path.node.traceid = {round: 0, count: counter++};
            } 
        }
    };

    return {
        visitor: {
            Program: {
                enter(path) {
                path.node.traceid = counter++;
                path.traverse(visitor)
            },
                exit(path) {
                    path.node.inspect()
                }
            }
        }
    }
}