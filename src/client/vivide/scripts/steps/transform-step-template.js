import { config } from 'src/client/vivide/utils.js';

export default ((input, output) => {
  output.push(...input.map(item => item));
})