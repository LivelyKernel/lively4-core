import { openComponentBin } from "./morphic/component-loader.js";

export function registerShortcuts() {
  document.body.addEventListener("keyup", (evt) => {
    if (evt.ctrlKey && evt.shiftKey && evt.altKey && evt.keyCode == 80) {
      openComponentBin();
    }
  });
}
