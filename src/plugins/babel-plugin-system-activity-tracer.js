/* globals globalThis */

import Preferences from 'src/client/preferences.js';

globalThis.systemActivity = globalThis.systemActivity || {};

export default function ({ types: t, template }) {
  
  const counter = template(`globalThis.systemActivity[FILE_NAME]++;`);
  
  return {
    name: "system-activity-tracer",
    visitor: {
      BlockStatement(path, state) {
        if (Preferences.get('DisableSystemActivityTracing')) {
          return
        }

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
