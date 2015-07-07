obj = {a: 1, b: 2}
s = new ClSimplexSolver();
always: { solver: s
	obj.a + 7 <= obj.b
}
obj.a = 10;
console.log("loaded BabelsbergScript", obj.a, obj.b);
