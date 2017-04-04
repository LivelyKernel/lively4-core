document.addEventListener('babelsbergready', function () {
    console.log("all bbbscripts compiled");
});

obj = {a: 1, b: 2}
s = new ClSimplexSolver();
always: { solver: s
        obj.a + 7 <= obj.b
}
obj.a = 10;
console.log("loaded JavaScript", obj.a, obj.b);
