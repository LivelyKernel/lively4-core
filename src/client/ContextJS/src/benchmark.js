/*
 * Copyright (c) 2008-2016 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict'

import * as cop from './contextjs'
import { Layer } from './contextjs'

function extendString(s, length) {
    return s + new Array(Math.max(0, length - s.length)).join(' ')
}

function ralign(s, length) {
    return new Array(Math.max(0, length - String(s).length)).join(' ') + s 
}

const DEFAULT_MAXSIZE = 1000000000
const DEFAULT_TARGETTIME = 25
const SAMPLE_SIZE = 30

function benchmarkBlock(name, unrolledOps, func) {
    var MAXSIZE = DEFAULT_MAXSIZE || 100000000;
    var TARGETTIME = DEFAULT_TARGETTIME || 1000;
    unrolledOps = unrolledOps || 1;

    var time = 0.0;
    var size = 100; 
    var ops = 0;
    var obj = new BenchClass();
    // warmup
    func(100, obj);
    // find good size
    while(time < TARGETTIME && size < MAXSIZE) {
        // console.log("execute func: " + time + " " + size)
        func(1, obj);
        var time1 = new Date().getTime();
        func(size, obj);
        var time2 = new Date().getTime();
        time = time2 - time1;
        ops = (unrolledOps * size);
        size *= 2;
    };
    // measure
    let sample = new Array(SAMPLE_SIZE);
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        let time1 = new Date().getTime();
        func(size, obj);
        let time2 = new Date().getTime();
        let timedelta = time2 - time1;
        sample[i] = ops / timedelta;
    }
    // var result = extendString(name, 40) + ralign(String(ops), 16) + " " +
    //     ralign(String(time), 4) + " " + ralign(String(Math.round(ops / time)), 8);
    let result = [name, size, ops].concat(sample).join();
    console.log(result);
}

export function benchmark(work) {
    // warmup
    const startTime = Date.now();
    for (let i = 0; i < 50 || Date.now() - startTime < 800; i++) {
        work();
    }
    // measure
    let sample = new Array(SAMPLE_SIZE);
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = Date.now();
        work();
        const end = Date.now();
        sample[i] = end - start;
    }
    return sample;
}


/*
 * Benchmark subjects
 */

const L1 = new Layer("L1");
const L2 = new Layer("L2");
const L3 = new Layer("L3");
const L4 = new Layer("L4");
const L5 = new Layer("L5");
const L6 = new Layer("L6");
const L7 = new Layer("L7");
const L8 = new Layer("L8");
const L9 = new Layer("L9");
const L10 = new Layer("L10");

/**
 * Benchmark subject with counter variables from 00 to 10.
 * They can be increased with noLayer_##(), and countWithoutLayers without COP
 * and with countWithLayers with COP.
 */
class BenchClass {

	constructor() {
		this.counter_00= 0;
		this.counter_01= 0;
		this.counter_02= 0;
		this.counter_03= 0;
		this.counter_04= 0;
		this.counter_05= 0;
		this.counter_06= 0;
		this.counter_07= 0;
		this.counter_08= 0;
		this.counter_09= 0;
		this.counter_10= 0;
	}

    /**
     * Increases all the counters from 01 up to the number of this method.
     * No conditionals are involved, only which method is called determines
     * which counters are affected.
     * This also applies to all other noLayer_## methods.
     */
	noLayer_01() {	
		this.counter_01++;
	}

	noLayer_02() {	
		this.counter_01++; this.counter_02++;
	}

	noLayer_03() {	
		this.counter_01++; this.counter_02++; this.counter_03++;
	}

	noLayer_04() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++;
	}

	noLayer_05() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++;
	}

	noLayer_06() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++;
	}

	noLayer_07() {	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++;
	}

	noLayer_08(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++; this.counter_08++;
	}

	noLayer_09(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; this.counter_07++; this.counter_08++; this.counter_09++;
	}

	noLayer_10(){	
		this.counter_01++; this.counter_02++; this.counter_03++; this.counter_04++; this.counter_05++; this.counter_06++; 
		this.counter_07++; this.counter_08++; this.counter_09++; this.counter_10++;
	}

    /**
     * Increases counters depending on the supplied context object.
     * For each truthy valued property layerX (1 <= X <= 10)
     * the respective counter will be updated.
     */
	countWithoutLayers(context){
		if(context.layer1) {	
			this.counter_01++; 
		};
		if(context.layer2) {	
			this.counter_02++; 
		};
		if(context.layer3) {
			this.counter_03++; 
		};
		if(context.layer4) {
			this.counter_04++; 
		};
		if(context.layer5) {
			this.counter_05++; 
		};
		if(context.layer6) {
			this.counter_06++;
		};
		if(context.layer7) { 
			this.counter_07++; 
		};
		if(context.layer8) {
			this.counter_08++; 
		};
		if(context.layer9) {
			this.counter_09++; 
		};
		if(context.layer10) {
			this.counter_10++;
		};
	}

    /**
     * Increases counters based on the currently active COP layers.
     */
	countWithLayers() {	
		this.counter_00++;
	}
}

L1.refineClass(BenchClass, {
	countWithLayers() {	
		this.counter_01++;
		cop.proceed()
	}
})
	
L2.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_02++;
		cop.proceed()
	}
})
	
L3.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_03++;
		cop.proceed()
	}
})
	
L4.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_04++;
		cop.proceed()
	}
})
	
L5.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_05++;
		cop.proceed()
	}
})
	
L6.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_06++;
		cop.proceed()
	}
})
	
L7.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_07++;
		cop.proceed()
	}
})
	
L8.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_08++;
		cop.proceed()
	}
})
L9.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_09++;
		cop.proceed()
	}
})
L10.refineClass(BenchClass, {
    countWithLayers() {	
		this.counter_10++;
		cop.proceed()
	}
})

/**
 * Benchmark subject with counters from 01 to 05.
 * Each method increases all counters based on the currently active COP layers.
 */
class C1 {
	initialize() {
		this.counter_01= 0;
		this.counter_02= 0;
		this.counter_03= 0;
		this.counter_04= 0;
		this.counter_05= 0;
	}
	
	m1() {this.counter_00++;}
	m2() {this.counter_00++;}
	m3() {this.counter_00++;}
	m4() {this.counter_00++;}
	m5() {this.counter_00++;}
}

L1.refineClass(C1, {
    m1() {this.counter_01++;}, 
    m2() {this.counter_01++;}, 
    m3() {this.counter_01++;}, 
    m4() {this.counter_01++;}, 
    m5() {this.counter_01++;}
})

L2.refineClass(C1, {
    m1() {this.counter_02++;},
    m2() {this.counter_02++;}, 
    m3() {this.counter_02++;}, 
    m4() {this.counter_02++;}, 
    m5() {this.counter_02++;}
})

L3.refineClass(C1, {
    m1() {this.counter_03++;},
    m2() {this.counter_03++;}, 
    m3() {this.counter_03++;}, 
    m4() {this.counter_03++;}, 
    m5() {this.counter_03++;}
})

L4.refineClass(C1, {
    m1() {this.counter_04++;},
    m2() {this.counter_04++;}, 
    m3() {this.counter_04++;}, 
    m4() {this.counter_04++;}, 
    m5() {this.counter_04++;}
})

L5.refineClass(C1, {
    m1() {this.counter_05++;},
    m2() {this.counter_05++;}, 
    m3() {this.counter_05++;}, 
    m4() {this.counter_05++;}, 
    m5() {this.counter_05++;}
})

/*
 * Benchmarks
 */

export function explicitContextBenchmarks() {
	var runWithContext = function(name, context) {
		benchmarkBlock(name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {			
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context);
				obj.countWithoutLayers(context); 
			}
		})
	};
	
	return [
	{name: "ContextJS:Method:Standard:0 ", run: function() {
		runWithContext(this.name, {})
	}},
	{name: "ContextJS:Method:Standard:1 ", run: function() {
		runWithContext(this.name, {layer1: true})
	}},
	{name: "ContextJS:Method:Standard:2 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true })
	}},
	{name: "ContextJS:Method:Standard:3 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true })
	}},
	{name: "ContextJS:Method:Standard:4 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true })
	}},
	{name: "ContextJS:Method:Standard:5 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true })
	}},
	{name: "ContextJS:Method:Standard:6 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true })
	}},
	{name: "ContextJS:Method:Standard:7 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true })
	}},
	{name: "ContextJS:Method:Standard:8 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true })
	}},
	{name: "ContextJS:Method:Standard:9 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true, layer9: true })
	}},
	{name: "ContextJS:Method:Standard:10 ", run: function() {
		runWithContext(this.name, {layer1: true, layer2: true, layer3: true, layer4: true, layer5: true, layer6: true, layer7: true, layer8: true, layer9: true, layer10: true  })
	}}]
}

export function plainCallsBenchmarks() {

	return [
	{name: "ContextJS:Method:NoLayer_01", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();	
				obj.noLayer_01();		
			}})
		}	
	},
	{name: "ContextJS:Method:NoLayer_02", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();	
				obj.noLayer_02();		
				}})
			}
		},
	{name: "ContextJS:Method:NoLayer_03", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();	
				obj.noLayer_03();		
			}})
		}
		},
	{name: "ContextJS:Method:NoLayer_04", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();	
				obj.noLayer_04();		
			}})
		}
	},

	{name: "ContextJS:Method:NoLayer_05", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();	
				obj.noLayer_05();		
			}})
			}
	},
	{name: "ContextJS:Method:NoLayer_06", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();	
				obj.noLayer_06();		
			}})
		}
	},

	{name: "ContextJS:Method:NoLayer_07", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();	
				obj.noLayer_07();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_08", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();	
				obj.noLayer_08();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_09", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_09();	
				obj.noLayer_01();		
			}})
		}
		},

	{name: "ContextJS:Method:NoLayer_10", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();	
				obj.noLayer_10();		
			}})
		}
	}]
}

export function copContextBenchmarks() {
	return [
	{name: "ContextJS:Method:WithLayer:0 ", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {		
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();	
				obj.countWithLayers();				
			}})
		}
    },

	{name: "ContextJS:Method:WithLayer:1 ", run: function() {
		cop.withLayers([L1], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:2 ", run: function() {
		cop.withLayers([L1, L2], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:3 ", run: function() {
		cop.withLayers([L1, L2, L3], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:4 ", run: function() {
		cop.withLayers([L1, L2, L3, L4], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:5 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:6 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5, L6], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:7 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5, L6, L7], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:8 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5, L6, L7, L8], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:9 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5, L6, L7, L8, L9], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	},

	{name: "ContextJS:Method:WithLayer:10 ", run: function() {
		cop.withLayers([L1, L2, L3, L4, L5, L6, L7, L8, L9, L10], () => {
			benchmarkBlock(this.name, 16, function(size, obj) {
				for(var i = 0; i < size; i++) {		
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();	
					obj.countWithLayers();				
				}
			});
		})}
	}]	
}

export function repeatedNestedLayerActivationsBenchmarks() {
	var o1 = new C1();

	return [
	{name: "ContextJS:ActivateLayer:0 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m2();
				o1.m3();
				o1.m4();
				o1.m5();
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:1 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});	
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:2 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					cop.withLayers([L2], function() {
						o1.m2();
						o1.m3();
						o1.m4();
						o1.m5();
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:3 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					cop.withLayers([L2], function() {
						o1.m2();
						cop.withLayers([L3], function() {
							o1.m3();
							o1.m4();
							o1.m5();
						});
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:4 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					cop.withLayers([L2], function() {
						o1.m2();
						cop.withLayers([L3], function() {
							o1.m3();
							cop.withLayers([L4], function() {
								o1.m4();
								o1.m5();
							});
						});
					});		
				});		
			}})
		}
	},
	{name: "ContextJS:ActivateLayer:5 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					cop.withLayers([L2], function() {
						o1.m2();
						cop.withLayers([L3], function() {
							o1.m3();
							cop.withLayers([L4], function() {
								o1.m4();
								cop.withLayers([L5], function() {
									o1.m5();
								});
							});
						});
					});		
				});		
			}})
		}
	}]
}

export function repeatedLayerActivationsBenchmarks() {
	var o1 = new C1();

    return [
	{name: "ContextJS:ActivateLayerFlat:0 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m2();
				o1.m3();
				o1.m4();
				o1.m5();
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:1 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:2 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1, L2], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:3 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1, L2, L3], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:4 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1, L2, L3, L4], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	},
	{name: "ContextJS:ActivateLayerFlat:5 ", run: function() {
		benchmarkBlock(this.name, 1, function(size, obj) {
			for(var i = 0; i < size; i++) {
				cop.withLayers([L1, L2, L3, L4, L5], function() {
					o1.m1();
					o1.m2();
					o1.m3();
					o1.m4();
					o1.m5();
				});
			}})
		}
	}]
}

/**
 * Benchmark subject for measuring various variants of wrapped methods.
 */
class WrapBench {
	constructor() {
		this.counter_01 = 0;
		this.counter_02 = 0
	}
	
	m1() {
		this.counter_01++;
	}
}

export function methodWrappingBenchmarks() {
	var o1 = new WrapBench(); // unmodified
	var o2 = new WrapBench();
	o2.m1 = function() {this.counter_02++;} // plain overwritten

    // wrap and call original
	var o3 = new WrapBench();
    const original_m1 = o3.m1.bind(o3);
	o3.m1 = function wrappedm1(...args) {
        original_m1();
        this.counter_02++;
    };

    // put arguments into an array
	var o4 = new WrapBench();
	o4.m1 = function(...args) {
		this.counter_01++;		
		args.shift();
		return args
	};

	return [
	{name: "WrapperBenchmark:Default ", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
				o1.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:InstanceSpecific ", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o2.m1();
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();				
				o2.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:Wrap", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
				o3.m1();
			}})
		}
	},
	{name: "WrapperBenchmark:ArgsToArray", run: function() {
		benchmarkBlock(this.name, 16, function(size, obj) {
			for(var i = 0; i < size; i++) {
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
				o4.m1(1,2,'Hello World');
			}})
		}
	}]
}

export function allBenchmarks() {
    return [
        ...explicitContextBenchmarks(),
        ...plainCallsBenchmarks(),
        ...copContextBenchmarks(),
        ...repeatedNestedLayerActivationsBenchmarks(),
        ...repeatedLayerActivationsBenchmarks(),
        ...methodWrappingBenchmarks()]
}

export function runBenchmarksAsync(benchmarksToRun, done) {
    (function runNext() {
        var benchmark = benchmarksToRun.shift();
        if (!benchmark) {
            done();
        };
        benchmark.run(benchmark.name)
        setTimeout(runNext, 10);
    })();
}

export function runBenchmarks(benchmarksToRun) {
    for (const benchmark of benchmarksToRun) {
        benchmark.run(benchmark.name)
    }
}

const LOOP_SIZE = 1000000;

export function makeWorkloadWithoutLayersAndParameters() {
    class C {
        constructor() { this.counter = 0 }
        method() { this.counter++ }
    }
    const obj = new C();
    return function () {
        for (let i = 0; i < LOOP_SIZE; i++) {
            obj.method();
        }
    }
}

export function makeWorkloadWithDisabledLayersWithoutParameters() {
    class C {
        constructor() { this.counter1 = 0, this.counter2 = 0 }
        method() { this.counter1++ }
    }
    const layer = new Layer('overwriting').refineClass(C, {
        method() { this.counter2++ }
    });
    const obj = new C();
    return function () {
        for (let i = 0; i < LOOP_SIZE; i++) {
            obj.method();
        }
    }
}
