import {sum} from "./sum.js"

export function onmessage(e) {
  postMessage(sum(e.data));
}