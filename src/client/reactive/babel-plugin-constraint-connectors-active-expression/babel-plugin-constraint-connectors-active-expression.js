
const SHARED_FLAG_GENERATED_IMPORT_IDENTIFIER = 'SHARED_FLAG_GENERATED_IMPORT_IDENTIFIER';

export default function ({ types: t, template }) {
  return {
    name: 'constraint-connectors-active-expression',
    visitor: {
      Program: {
        enter(path, state) {
          
        }
      }
    }
  };
}