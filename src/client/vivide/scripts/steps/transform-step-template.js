import { config } from 'src/client/vivide/utils.js';

((input, vivideLayer) => {
  for (let item of input) {
    vivideLayer.push(item);
  }
})::config({
  
})