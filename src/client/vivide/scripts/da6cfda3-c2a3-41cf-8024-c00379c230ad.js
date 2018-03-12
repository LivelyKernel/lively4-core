import { config } from './../utils.js';

export default ((input, output) => {
  output.push(...input.map(item => item.label()));
})::config({
  widget: 'vivide-list-view'
});
