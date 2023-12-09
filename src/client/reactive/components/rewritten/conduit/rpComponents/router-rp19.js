'enable rp19-jsx';

import _ from 'src/external/lodash/lodash.js';
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';

let _router;
export const router = () => _router;

class Router extends ReactiveMorph {
  
  get config() {
    return this._config || (this._config = {});
  }
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      this.attachChildPropsListener(this.children);
      _router = this;
    });
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    if (_router === this)
      _router = undefined;
  }
  
  attachChildPropsListener(children) {
    _([...children]).forEach(child => {
      this.addAExpr(aexpr(() => child.props).onChange(newProps => 
        this.updateConfig(newProps, child)
      ), 'children');
      this.updateConfig(child.props, child);
    });
  }
  
  navigateTo(next) {
    this.checkMinimumNavigationRequirements(next);
    const { [next.target]: { showOn } } = this.config;
    if (_.has(showOn, 'condition') && !showOn.condition(next)) {
      console.debug('Routing condition not met. Will not change route!');
      return;
    }
    this.current = _.cloneDeep(next);
  }
  
  checkMinimumNavigationRequirements(navigation) {
    if (!_.has(navigation, 'target')) 
      throw Error('Attribute `target` of object `next` is missing');
    if (!_.has(this.config, navigation['target']))
      throw Error('Target not found');
  }
  
  updateConfig(newProps, child) {
    const { start } = this.props;
    this.checkMinimumPropRequirements(newProps);
    this.config[newProps.showOn.target] = {
      showOn: newProps.showOn,
      node: child.cloneNode(true)
    };
    if (!this.current && newProps.showOn.target === start.target)
      this.navigateTo(start);
  }
  
  checkMinimumPropRequirements(props) {
    if (!_.hasIn(props, 'showOn.target'))
      throw Error('Attribute `target` in routing properties is missing')
  }
  
  render() {
    return this.current && 
      this.config[this.current.target] && 
      this.config[this.current.target]['node'];
  }
}

export default Router;