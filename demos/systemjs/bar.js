// throw new Error("X")

(function(System, SystemJS) {
    System.register([], function(_export, _context) {
        return {
            setters: [],
            execute: async function() {
                console.log("I was here again!")
                
                var bar = await Promise.resolve(43)
              
                
                _export("bar", bar)
            }
        };
    });
}
)(SystemJS6, SystemJS6);
