System.import('systemjs-babel-build').then(m => window.babel = m.babel)
System.import('systemjs-babel-build').then(m => window.babel = m.babel)
System.import('demos/tanspilationbug.js').then(m => m.greet())


System.import('demos/mymod.js').then(m => m.bla())



var load  = System.loads[System.normalizeSync('demos/mymod2.js')]
var changedModule = System.normalizeSync('demos/mymod2.js');
var dependedModules = Object.values(System.loads).filter( ea => ea.dependencies.find(dep => System.normalizeSync(dep, ea.key) == changedModule))
dependedModules[0].key //  https://lively-kernel.org/lively4/lively4-jens/demos/mymod.js

// What shall we to with it? 

dependedModules.forEach( ea => {
  console.log("reload " + ea.key)
  System.registry.delete(ea.key)  
})


_.last(Object.values(System.loads)).dependencies

SystemJS.normalizeSync

System.loads[System.normalizeSync('demos/mymod.js')].dependencies
