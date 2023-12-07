'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';

export default class Link extends ReactiveMorph {
  
  connectedCallback() {
    if (this.isDummy()) return;
    this._innerHTML = this.innerHTML;
    this.addAExpr(aexpr(() => this.lastChild).onChange(lastChild => {
      debugger;
      if (lastChild.tagName !== 'A') {
        this._innerHTML = this.innerHTML;
         Promise
          .resolve(this._render())
          .then(nextHtmlDoc => this.lastResolvedRender = nextHtmlDoc)
          .then(htmlDoc => this.differentialUpdate(htmlDoc))
      }
    }));
    super.connectedCallback();
  }
  
  onClick(evt) {
    evt.preventDefault();
    const { targetDestination } = this.props;
    if (!targetDestination) return;
    const currentRouter = router();
    if (currentRouter)
      currentRouter.navigateTo(targetDestination);
  }
  
  render() {
    debugger;
    const wrapper = (
      <a 
        class={`${this.getAttribute('className') || ''} ${this.props.isActive ? 'active' : ''}`} 
        href="#"
        click={evt => this.onClick(evt)}
      />
    );
    wrapper.innerHTML = this._innerHTML;
    return wrapper;
  }
}