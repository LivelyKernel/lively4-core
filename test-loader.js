System.config({
  transpiler: 'babel',
  baseURL: '/base',
  map: {
    babel: 'src/external/babel-browser.js'
  }
});
System.import('test-main.js');
