
import systemBabel from 'src/external/babel/babel7default.js'
const {
  template,
} = systemBabel.babel;


/**
 * Inserts a timer check
 */
const insertSomething = (path, isStart = false) => {
  const code = `console.log("hello")`;
  path.unshiftContainer("body", template(code)());
};

export default function({ types: t }) {
  return {
    name: 'assignment-plugin',
    visitor: { 
      BlockParent(path) {
      },
      
      BlockStatement(path) {
        insertSomething(path);
      },
    },
  }
}
