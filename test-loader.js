console.log("TEST LOADER ")
System.config({
  transpiler: 'babel',
  baseURL: '/base',
  map: {
    babel: 'src/external/babel-browser.js',
    kernel: 'src/client/legacy-kernel.js'
  }
});
System.import('test-main.js')
  .catch(e => console.log(
    e,
    e.name,
    e.message,
    e.stack
  )
);
