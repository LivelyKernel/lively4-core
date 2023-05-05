/* globals globalThis */

globalThis.systemActivity = globalThis.systemActivity || {};

export default function ({ types: t, template }) {
  
  const counter = template(`globalThis.systemActivity[FILE_NAME]++;`);
  
  return {
    name: "system-activity-tracer",
    visitor: {
      BlockStatement(path, state) {
        debugger;
        const filename = state.file.opts.filename + '';
        globalThis.systemActivity[filename] = 0
        
        const tracking = counter({
          FILE_NAME: t.stringLiteral(filename)
        });
        path.unshiftContainer('body', tracking);
      },
    }
  };
}
