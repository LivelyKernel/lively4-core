'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';

const DEFAULT_WIDTH = '1200px';
const DEFAULT_HEIGHT = '800px';
const DEFAULT_LEFT = '1445px';
const DEFAULT_TOP = '105px';

export default class ConduitRp19 extends ReactiveMorph {
  
  initialize() {
    this.windowTitle = 'Conduit';
    this.style.overflowY = 'scroll';
    const { parentNode } = this;
    parentNode.style.width = DEFAULT_WIDTH;
    parentNode.style.height = DEFAULT_HEIGHT;
    parentNode.style.left = DEFAULT_LEFT;
    parentNode.style.top = DEFAULT_TOP;
    lively.loadCSSThroughDOM('ion-icons', '//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css');
  }
  
  render() {
    return (
      <div class='Conduit'>
        <app-rp19></app-rp19>
      </div>
    );
  }
}