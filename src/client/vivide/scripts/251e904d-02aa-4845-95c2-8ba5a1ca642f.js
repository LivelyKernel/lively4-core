import { config } from './../utils.js';

export default ((input, output) => {
  output.push(...input.map(item => item));
})::config({
  widget: 'vivide-list-view'
});
