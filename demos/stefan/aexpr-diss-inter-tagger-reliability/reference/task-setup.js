
var aexprCallbacks = [],
    signals = [],
    solveSignals = false,
    resolveSignals = function() {
        if(!solveSignals) {
            solveSignals = true;
            signals.forEach(s => s());
            solveSignals = false;
            let nonSignalCB;
            while(nonSignalCB = aexprCallbacks.pop()) {
                nonSignalCB();
            }
        }
    },
    newAExpr = function(axp) {
        return {
            onChange(cb) {
                axp.onChange(val => {
                    if(solveSignals) {
                        aexprCallbacks.push(() => cb(axp.getCurrentValue()));
                    } else {
                        return cb(val);
                    }
                });
            }
        }
    }