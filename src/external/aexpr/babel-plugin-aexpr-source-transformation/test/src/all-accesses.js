var a = {b:1, fn() { return {}; }};
var c = {};

// Mixin everything together
a.fn()[c.d] = 1;