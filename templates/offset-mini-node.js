import { pt } from 'src/client/graphics.js';
import { domEvents } from 'src/client/constants.js';

import { remove, getEditor, getCanvas } from './offset-mini-utils.js';

import ContextMenu from 'src/client/contextmenu.js';

import GlobalDragCapture from 'https://lively-kernel.org/lively4/gs/components/global-drag-capture.js';

const NODE_DESCRIPTIONS = function buildNodeDescriptions() {
  const i = 'in';
  const o = 'out';
  const d = 'data';
  const c = 'control';
  const cb = 'callback';

  function port(direction, multiplicity, label, type, options = {}) {
    return {
      direction,
      multiplicity,
      label,
      type,
      kind: type,
      ...options
    }
  }

  function single(inputDescription) {
    return {
      getAs: 'single',
      inputFields: [inputDescription]
    };
  }

  function codeInput(title = 'code', initialValue = '') {
    return {
      type: 'code',
      initialValue,
      title
    };
  }

  function stringInput(title = '', initialValue = '') {
    return {
      type: 'string',
      initialValue,
      title
    };
  }

  function numberInput(title = '', initialValue = '') {
    return {
      type: 'number',
      initialValue,
      title
    };
  }

  const nodeDescriptions = {
    'simple': () => {
      return {
        label: 'simple',
        columns: 'auto auto',
        rows: 'auto auto',
        areas: `
"label label"
"in out"
`,
        ports: {
          in: port(i, '*', undefined, d),
          out: port(o, '1', 'condition', d),
        }
      };
    },
    'if': () => {
      return {
        label: 'if',
        aliases: ['fork', 'branch', 'condition'],
        columns: 'auto auto',
        rows: 'auto auto auto auto',
        areas: `
"label label"
"in then"
"condition else"
"negate else"
`,
        ports: {
          in: port(i, '*', undefined, c),
          condition: port(i, '1', 'condition', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'bool',
                initialValue: false
              }]
            }
          }),
          negate: port(i, '1', 'negate', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'bool',
                initialValue: true
              }]
            },
            optional: {
              startsVisible: false
            }
          }),
          then: port(o, '1', 'then', c),
          else: port(o, '1', 'else', c)
        }
      };
    },
    'branch': () => {
      return {
        label: 'branch',
        aliases: ['fork', 'if', 'condition'],
        columns: 'auto auto',
        rows: 'auto auto auto auto',
        areas: `
"label label"
"condition out"
"then out"
"else out"
"negate out"
`,
        ports: {
          out: port(o, '1', undefined, d),
          condition: port(i, '1', 'if', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'bool',
                initialValue: false
              }]
            }
          }),
          negate: port(i, '1', 'negate', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'bool',
                initialValue: true
              }]
            },
            optional: {
              startsVisible: false
            }
          }),
          then: port(i, '1', 'then', d),
          else: port(i, '1', 'else', d)
        }
      };
    },
    'member': () => {
      return {
        label: 'get property',
        columns: 'auto auto',
        rows: 'auto auto auto',
        areas: `
"label label"
"object out"
"property out"
`,
        ports: {
          object: port(i, '1', 'object', d, {
            inlineValues: single(codeInput('object'))
          }),
          property: port(i, '1', 'propery', d, {
            inlineValues: single(stringInput('property name'))
          }),
          out: port(o, '*', undefined, d) }
      };
    },
    'global': () => {
      return {
        label: 'get global',
        columns: 'auto auto',
        rows: 'auto auto',
        areas: `
"label label"
"name out"
`,
        ports: {
          name: port(i, '1', 'name', d, {
            inlineValues: single(stringInput('name'))
          }),
          out: port(o, '*', undefined, d) }
      };
    },
    'call': () => {
      return {
        label: 'call function',
        columns: 'auto auto',
        rows: 'auto auto auto',
        areas: `
"label label"
"fn out"
"param out"
`,
        ports: {
          fn: port(i, '1', 'function', d, {
            inlineValues: single(codeInput('func'))
          }),
          param: port(i, '1', undefined, d, {
            inlineValues: single(codeInput('param-xxx')),
            multi: {
              min: 0,
              defaultNum: 1
            }
          }),
          out: port(o, '*', undefined, d) }
      };
    },
    'call-member': () => {
      return {
        label: 'call method',
        columns: 'auto auto',
        rows: 'auto auto auto auto auto auto auto auto',
        areas: `
"label label"
"object result"
"property result"
"param result"
`,
        ports: {
          object: port(i, '1', 'object', d, {
            inlineValues: single(codeInput('object'))
          }),
          property: port(i, '1', 'propery', d, {
            inlineValues: single(stringInput('property name'))
          }),
          'param': port(i, '1', undefined, d, {
            inlineValues: single(codeInput('param-xxx')),
            multi: {
              min: 0,
              defaultNum: 1
            }
          }),
          result: port(o, '*', 'result', d) }
      };
    },
    'on turn': () => {
      return {
        label: 'on turn',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"label out"
`,
        ports: {
          out: port(o, '1', undefined, c)
        }
      };
    },
    'input field tester': () => {
      return {
        label: 'input field tester',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"label out"
"property property"
`,
        ports: {
          property: port(o, '1', 'propery', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'integer',
                initialValue: '123',
                title: 'int'
              }, {
                type: 'number',
                initialValue: 12.3,
                title: 'float'
              }, {
                type: 'bool',
                initialValue: true,
                title: 'checked?'
              }, {
                type: 'element',
                initialValue: 'fire',
                list: ['slash', 'bash', 'pierce', 'fire', 'ice', 'lightning']
              }, {
                type: 'string',
                initialValue: 'hello',
                title: 'property name'
              }]
            }
          }),
          out: port(o, '1', undefined, c)
        }
      };
    },
    'extra AC': () => {
      return {
        label: 'extra AC',
        columns: 'auto 1fr auto',
        rows: 'auto auto',
        areas: `
"in label out"
"amount amount amount"
`,
        ports: {
          amount: port(i, '1', 'num of ACs', d, {
            inlineValues: single({
              type: 'integer',
              initialValue: '1',
              title: 'num of ACs'
            })
          }),
          in: port(i, '*', undefined, c),
          out: port(o, '1', undefined, c)
        }
      };
    },
    'element': () => {
      return {
        label: 'element',
        columns: 'auto auto',
        rows: 'auto auto',
        areas: `
"label label"
"element out"
`,
        ports: {
          element: port(i, '1', undefined, d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'element',
                initialValue: 'fire',
                list: ['slash', 'bash', 'pierce', 'fire', 'ice', 'lightning']
              }]
            }
          }),
          out: port(o, '1', undefined, d)
        }
      };
    },
    'attack': () => {
      return {
        label: 'attack',
        columns: 'auto-flow dense auto auto',
        rows: 'auto auto',
        areas: `
"in label out"
"target target target"
`,
        ports: {
          in: port(i, '*', undefined, c),
          target: port(i, '1', 'target', d),
          out: port(o, '1', undefined, c)
        }
      };
    },
    'first': () => {
      return {
        label: 'first',
        columns: 'auto auto auto',
        rows: 'auto',
        areas: `
"array label item"
`,
        ports: {
          array: port(i, '1', 'array', d),
          item: port(o, '*', undefined, d)
        }
      };
    },
    'at': () => {
      return {
        label: 'at index',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label item"
"index index index"
`,
        ports: {
          array: port(i, '1', 'array', d),
          index: port(i, '1', 'index', d, {
            inlineValues: {
              getAs: 'single',
              inputFields: [{
                type: 'integer',
                initialValue: '0',
                title: 'index'
              }]
            }
          }),
          item: port(o, '*', undefined, d)
        }
      };
    },
    'array.map': () => {
      return {
        label: '.map',
        columns: 'auto auto auto',
        rows: 'auto auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.filter': () => {
      return {
        label: '.filter',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.find': () => {
      return {
        label: '.find',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.minBy': () => {
      return {
        label: '.minBy',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.maxBy': () => {
      return {
        label: '.maxBy',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.every': () => {
      return {
        label: '.every',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.some': () => {
      return {
        label: '.some',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"array label result"
"iterator iterator iterator"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d),
          iterator: port(i, '1', 'iterator', cb)
        }
      };
    },
    'array.random': () => {
      return {
        label: '.random',
        columns: 'auto auto auto',
        rows: 'auto',
        areas: `
"array label result"
`,
        ports: {
          array: port(i, '1', 'array', d),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'array-iterator': () => {
      return {
        label: 'iterator',
        columns: '1fr auto',
        rows: 'auto auto auto auto auto',
        areas: `
"label caller"
"out out"
"item item"
"index index"
"array array"
`,
        ports: {
          caller: port(o, '1', undefined, cb),
          out: port(o, '1', undefined, c),
          item: port(o, '*', 'item', d, {
            optional: {
              startsVisible: true
            }
          }),
          index: port(o, '*', 'index', d, {
            optional: {
              startsVisible: false
            }
          }),
          array: port(o, '*', 'array', d, {
            optional: {
              startsVisible: false
            }
          })
        }
      };
    },
    'return': () => {
      return {
        label: 'return',
        columns: 'auto 1fr',
        rows: 'auto auto',
        areas: `
"in label"
"result result"
`,
        ports: {
          in: port(i, '*', undefined, c),
          result: port(i, '1', 'result', d, {
            inlineValues: single(codeInput('value'))
          })
        }
      };
    },
    'enemies': () => {
      return {
        label: 'enemies',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"label out"
`,
        ports: {
          out: port(o, '*', undefined, d)
        }
      };
    },
    'allies': () => {
      return {
        label: 'allies',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"label out"
`,
        ports: {
          out: port(o, '*', undefined, d)
        }
      };
    },
    'me': () => {
      return {
        label: 'me',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"label out"
`,
        ports: {
          out: port(o, '*', undefined, d)
        }
      };
    },
    'sequence': () => {
      return {
        label: 'sequence',
        columns: 'auto auto',
        rows: 'auto auto',
        areas: `
"in label"
"out out"
`,
        ports: {
          in: port(i, '*', undefined, c),
          out: port(o, '1', undefined, c, {
            multi: {
              min: 1,
              defaultNum: 2
            }
          })
        }
      };
    },
    'default': () => {
      return {
        label: 'default',
        columns: 'max-content min-content',
        rows: 'auto',
        areas: `
"inport label outport"
`,
        ports: {
          inport: port(i, '*', 'my in', d),
          outport: port(o, '1', 'my out', c)
        }
      };
    }
  };

  function numberInPort(label = undefined, title, initialValue) {
    return port(i, '1', undefined, d, {
      inlineValues: single(numberInput(title, initialValue))
    });
  }

  const battlerProperties = [];
  battlerProperties.push('hp', 'maxhp', 'mp', 'maxmp');
  battlerProperties.push('at', 'mat', 'df', 'mdf', 'spd');
  battlerProperties.push('sp', 'ac', 'baseac', 'onTurn');
  battlerProperties.push('mods', 'res', 'scratchpad', ' skills', 'standardAttackType', 'turnNumber', 'waitTime');
  battlerProperties.push('name', 'type', 'align');
  const battlerPropertiesDescriptions = Object.fromEntries(battlerProperties.map(property => {
    return ['battler.' + property, () => {
      return {
        label: '.' + property,
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"battler label result"
`,
        ports: {
          battler: port(i, '1', 'battler', d),
          result: port(o, '*', undefined, d)
        }
      };
    }];
  }));

  const arithmeticOperators = '+-*/%'.split('');
  const arithmeticDescriptions = Object.fromEntries(arithmeticOperators.map(operator => {
    return [operator, () => {
      return {
        label: operator,
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: numberInPort(undefined, 'num'),
          b: numberInPort(undefined, 'num'),
          result: port(o, '*', undefined, d)
        }
      };
    }];
  }));

  const comparisonDescriptions = {
    'is greater than': () => {
      return {
        label: '>',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: numberInPort(undefined, 'number'),
          b: numberInPort(undefined, 'number'),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'is greater than or equal': () => {
      return {
        label: '>=',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: numberInPort(undefined, 'number'),
          b: numberInPort(undefined, 'number'),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'is less than': () => {
      return {
        label: '<',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: numberInPort(undefined, 'number'),
          b: numberInPort(undefined, 'number'),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'is less than or equal': () => {
      return {
        label: '<=',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: numberInPort(undefined, 'number'),
          b: numberInPort(undefined, 'number'),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'equal': () => {
      return {
        label: '==',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: port(i, '1', undefined, d, {
            inlineValues: single(codeInput('input'))
          }),
          b: port(i, '1', undefined, d, {
            inlineValues: single(codeInput('input'))
          }),
          result: port(o, '*', undefined, d)
        }
      };
    },
    'not equal': () => {
      return {
        label: '!=',
        columns: 'auto auto auto',
        rows: 'auto auto',
        areas: `
"a label result"
"b label result"
`,
        ports: {
          a: port(i, '1', undefined, d, {
            inlineValues: single(codeInput('input'))
          }),
          b: port(i, '1', undefined, d, {
            inlineValues: single(codeInput('input'))
          }),
          result: port(o, '*', undefined, d)
        }
      };
    }
  };

  const skillDescriptions = {};

  const devDescriptions = {
    'dev:print-it': () => {
      return {
        label: '>',
        columns: 'auto auto',
        rows: 'auto',
        areas: `
"in label"
`,
        ports: {
          in: port(i, '*', 'print it', d)
        }
      };
    }
  };

  Object.assign(nodeDescriptions, battlerPropertiesDescriptions, arithmeticDescriptions, comparisonDescriptions, skillDescriptions, devDescriptions);
  return nodeDescriptions;
}();

export class NodeDescriptions {

  static _descriptions() {
    return NODE_DESCRIPTIONS;
  }

  static getDescriptionByType(type) {
    const descriptions = this._descriptions();

    if (descriptions[type]) {
      return descriptions[type]();
    }

    return descriptions.default();
  }

  static listNodeTypes() {
    return Object.keys(this._descriptions());
  }

  static getDescriptionForType(type) {
    return this.getDescriptionByType(type);
  }

  static getDescriptionForTypeWithFallback(type) {
    return this.getDescriptionByType(type);
  }

}

class MoveNode {

  constructor(node) {
    this.node = node;
  }

  get canvas() {
    return this.node._canvas;
  }

  initSelection() {
    const canvas = this.canvas;
    let selection = canvas.getSelection();
    if (!selection.includes(this.node)) {
      selection = [this.node];
      canvas.setSelection(selection);
    } else {
      selection = selection.filter(element => element.isMovableMorph());
    }

    return this.selection = selection;
  }

  onPointerDown(evt) {
    // evt.preventDefault();
    evt.stopPropagation();

    this.justClicking = true;

    const selection = this.initSelection();
    this.startingPositions = selection.map(::lively.getPosition);
    this.offset = pt(0, 0);

    const draggingStart = lively.getPosition(this.node);
    if (isNaN(draggingStart.x) || isNaN(draggingStart.y)) {
      throw new Error("Drag failed, because window Position is not a number");
    }

    this.dragStartingPoint = pt(evt.clientX, evt.clientY);

    this.node.classList.add('dragging', true);

    const drag = new GlobalDragCapture(evt => this.onPointerMove(evt), evt => this.onPointerUp(evt, drag));
  }

  onPointerMove(evt) {
    this.justClicking = this.justClicking && pt(evt.clientX, evt.clientY).eqPt(this.dragStartingPoint);

    if (!this.justClicking) {
      // lively.showEvent({ clientX: evt.pageX, clientY: evt.pageY }).style.background = 'orange'

      evt.preventDefault();
      evt.stopPropagation();

      const canvas = this.canvas;
      const k = canvas ? canvas.currentZoomScale : 1;
      const deltaPos = pt(evt.pageX, evt.pageY).subPt(this.dragStartingPoint).subPt(lively.getScroll());
      this.offset = deltaPos.scaleBy(1 / k);

      this.positionSelectionAtOffset(this.offset);
    }
  }

  onPointerUp(evt, drag) {
    evt.preventDefault();

    // this.node.windowTitle.releasePointerCapture(evt.pointerId)
    this.node.classList.remove('dragging');
    drag.remove();
  }

  positionSelectionAtOffset(offset) {
    this.selection.forEach((element, i) => {
      const pos = this.startingPositions[i].addPt(offset);
      element.setPosition(pos);
    });
  }

}

/*MD # ApplyTypeToNode MD*/
class ApplyTypeToNode {

  /*MD ## Method Object MD*/
  constructor(node, newType, oldType) {
    this.node = node;
    this.newType = newType;
    this.oldType = oldType;
  }

  async compute() {
    const description = this.getDescriptionByType(this.newType);

    const regexp = /[a-zA-Z0-9-]+/g;
    const portIds = Array.from(description.areas.matchAll(regexp), match => match[0]).uniq();
    const gridAreas = portIds.map(id => `#container #${id} {
grid-area: ${id};
align-self: center;
}`).join('\n');
    const containerCSS = this.node.get('style#container-grid');
    containerCSS.innerHTML = `
#container {
padding: 2px;
padding-left: 5px;
padding-right: 5px;
border-radius: 3px;

display: grid;
grid-template-columns: ${description.columns};
grid-template-rows: ${description.rows};
grid-template-areas: 
${description.areas}
;
column-gap: 2px;
row-gap: 2px;
}
${gridAreas}
`;

    const container = this.node.get('#container');
    container.innerHTML = '';

    // label
    const hasLabel = portIds::remove('label');
    if (hasLabel && description.label) {
      container.append(<span id="label">{description.label}</span>);
    }

    const oldPortsByRole = this.getOldPorts();

    const portDescriptions = description.ports;
    const newPortKeys = Object.keys(portDescriptions);
    const [onlyLeft,, onlyRight] = portIds.computeDiff(newPortKeys);
    if ([...onlyLeft].length > 0 || [...onlyRight].length > 0) {
      lively.error(`invalid node type description for '${this.newType}': left: [${onlyLeft}], right: [${onlyRight}]`);
    }

    newPortKeys.forEach(key => container.append(<slot id={key} name={key}></slot>));

    const oldPortDescriptions = this.getOldPortDescriptions();

    // unmentioned old ports are automatically removed
    for (let key of newPortKeys) {
        
      const portDescription = portDescriptions[key];

      const keepOldPort = () => {
        this.keepOldPort(oldPortsByRole, key, portDescription);
      };

      // migrate from nothing
      if (!oldPortDescriptions) {
        if (!portDescription.optional || portDescription.optional.startsVisible) {
          await this.node.createNewPort(key, portDescription);
        }
        continue;
      }

      // required port
      if (!portDescription.optional) {
        if (oldPortsByRole.has(key)) {
          keepOldPort();
        } else {
          await this.node.createNewPort(key, portDescription);
        }
        continue;
      }

      const oldPortDescription = oldPortDescriptions[key];
      const newDefaultVisible = portDescription.optional.startsVisible;
      // default is visible
      if (newDefaultVisible) {
        if (!oldPortDescription) {
          if (oldPortsByRole.has(key)) {
            throw new Error(`have old port but no old description for ${key} when migrating from ${this.oldType} to ${this.newType}`);
          }
          await this.node.createNewPort(key, portDescription);
          continue;
        }

        if (!oldPortsByRole.has(key) && oldPortDescription.optional && oldPortDescription.optional.startsVisible) {
          // player explicitly removed the port
          continue;
        }

        if (oldPortsByRole.has(key)) {
          keepOldPort();
        } else {
          await this.node.createNewPort(key, portDescription);
        }
        continue;
      }

      // default not visible
      if (!oldPortDescription) {
        continue;
      }
      if (!oldPortDescription.optional) {
        // #TODO: question: should a required port be visible when migrating?
        // actually only, if the player interacted with the port!
        // for now, we always add that port explicitly
        keepOldPort();
        continue;
      }
      if (oldPortsByRole.has(key) && oldPortDescription.optional && !oldPortDescription.optional.startsVisible) {
        // player explicitly added this port
        keepOldPort();
        continue;
      }
    }
    oldPortsByRole.forEach(port => port.removeYourself());
  }

  /*MD ## Utils MD*/
  keepOldPort(oldPortsByRole, key, portDescription) {
    const oldPort = oldPortsByRole.get(key);

    // possible to keep the old port element?
    // #TODO: solve with polymorphism
    const requiredElementType = portDescription.multi ? 'offset-mini-port-list' : 'offset-mini-port';
    if (oldPort.localName === requiredElementType) {
      // keep the element by removing it from the to-remove list
      oldPortsByRole.delete(key);
      // #TODO: need to update the port: is this enough?
      this.node.updatePort(oldPort, key, portDescription);
    } else {
      // we need to switch from port to port-list or vice versa
      this.node.createNewPort(key, portDescription);
    }
  }

  getDescriptionByType(type) {
    return this.node.getDescriptionByType(type);
  }

  getOldPorts() {
    // only include direct ports, not the ones in port-lists and nested nodes
    const ownSelector = `offset-mini-node[data-lively-id='${this.node._id}']`;
    const oldPortElements = this.node.querySelectorAll(`${ownSelector} > offset-mini-port, ${ownSelector} > offset-mini-port-list`);

    const oldPortsByRole = new Map();
    oldPortElements.forEach(child => {
      const slotName = child.getAttribute('slot');
      if (oldPortsByRole.has(slotName)) {
        // only support one port per name for now
        child.remove();
        return;
      }
      oldPortsByRole.set(slotName, child);
    });

    return oldPortsByRole;
  }

  getOldPortDescriptions() {
    if (!this.oldType) {
      return;
    }

    const oldDescription = this.getDescriptionByType(this.oldType);
    return oldDescription.ports;
  }

}

import Morph from 'src/components/widgets/lively-morph.js';

export default class GsVisualEditorNode extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get _canvas() {
    return getEditor(this);
  }

  get _id() {
    return lively.ensureID(this);
  }
  incomingEdges() {
    return Array.from(this._canvas.querySelectorAll(`[toElement="${this._id}"]`));
  }
  outgoingEdges() {
    return Array.from(this._canvas.querySelectorAll(`[fromElement="${this._id}"]`));
  }
  incomingEdge() {
    return this._canvas.querySelector(`[toElement="${this._id}"]`);
  }
  outgoingEdge() {
    return this._canvas.querySelector(`[fromElement="${this._id}"]`);
  }

  /*MD ## More Accessors MD*/
  get addOptionalPortIcon() {
    return this.get('#add-optional-port');
  }

  /*MD ## Tags MD*/
  isMovableMorph() {
    return true;
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.windowTitle = "GsVisualEditorNode";
    lively.html.registerKeys(this);

    lively.addEventListener("template", this, "dblclick", evt => this.onDblClick(evt));

    this.setupClick();
    this.setupDrag();

    this.initializeShadowRoot();
    this.positionChangeObservers;
  }
  
  ongstooltip(tooltip) {
    const desc = this.getOwnDescription();

    tooltip.append(<aside>
                    <i class='fa-light fa-square-o'></i>
                    <div class="icon-caption">Node</div>
                  </aside>, (<main>
                     <h5>{desc.label || this.getType()}</h5>
      <p>{desc.desc || '<no description for this node>'}</p>
    </main>))
  }

  _controlIconForBattler(icon, caption, clickCallback, tooltipMain) {
    const faClass = "fa fa-" + icon;
    return <span class="char-icon" gstooltip={s}></span>
  }

  initializeShadowRoot() {
    this.registerButtons();
    // this.setupTEST();
    this.setType(this.getType());
    this.setupAddOptionalPort();
  }

  /*MD ## Optional Port Configuration MD*/
  setupAddOptionalPort() {
    const icon = this.addOptionalPortIcon;
    icon.addEventListener('pointerdown', evt => this.onAddOptionalPort(evt));
    icon.addEventListener('contextmenu', evt => this.onAddOptionalPortContextMenu(evt));
  }

  // #TODO: this should be done on rerender
  updateAddOptionalPortVisibility() {
    const icon = this.addOptionalPortIcon;
    const hasOptionalPorts = Object.entries(this.getOwnDescription().ports).some(([, portDesc]) => portDesc.optional);
    icon.style.display = hasOptionalPorts ? 'flex' : 'none';
  }

  onAddOptionalPort(evt) {
    if (evt.pointerType !== "mouse") {
      lively.notify('non-mouse input');
      return;
    }

    // left mouse button
    if (evt.button === 0 && evt.buttons === 1) {
      evt.stopPropagation();
      evt.preventDefault();

      this.addNextOptionalPort();
    }
  }

  addNextOptionalPort() {
    const desc = this.getOwnDescription();

    for (let [key, portDesc] of Object.entries(desc.ports)) {
      if (portDesc.optional && !this.hasPort(key)) {
        this.createNewPort(key, portDesc);
        return;
      }
    }

    lively.warn('found no additional optional port');
  }

  onAddOptionalPortContextMenu(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this._canvas.preventGlobalContextMenu();

    let enabledIcon = function (enabled) {
      return enabled ? '<i class="fa fa-check-square-o" aria-hidden="true"></i>' : '<i class="fa fa-square-o" aria-hidden="true"></i>';
    };

    const desc = this.getOwnDescription();

    const items = Object.entries(desc.ports).filter(([, portDesc]) => portDesc.optional).map(([key, portDesc]) => [key, (evt, item) => {
      evt.stopPropagation();
      evt.preventDefault();

      if (this.hasPort(key)) {
        const port = this.getPort(key);
        port.removeYourself();
      } else {
        this.createNewPort(key, portDesc);
      }
      item.querySelector(".icon").innerHTML = enabledIcon(this.hasPort(key));
    }, "", enabledIcon(this.hasPort(key))]);

    const menu = new ContextMenu(this, items);
    menu.openIn(document.body, evt, this);
  }

  removePortFromYourself(port) {
    port.removeYourself();
  }
  /*MD ## Position Observer MD*/
  get positionChangeObservers() {
    if (!this._positionChangeObservers) {
      this._positionChangeObservers = [];
      this.setupPositionObserver();
    }

    return this._positionChangeObservers;
  }

  setupPositionObserver() {
    this.mutationObserver = new MutationObserver((mutations, observer) => {
      const anyStyleChanged = mutations.some(record => record.target == this && record.attributeName == "style");
      if (anyStyleChanged) {
        this.onPositionChange();
      }
    });
    this.mutationObserver.observe(this, {
      childList: false,
      subtree: false,
      characterData: false,
      attributes: true
    });
  }

  onPositionChange() {
    lively.notify('moved ' + this.getAttribute('node-type'));
    this.positionChangeObservers.forEach(c`anchorChanged`);
    this.getAllSubmorphs('offset-mini-port').forEach(port => port.onPositionChange());
  }

  addPositionChangeObserver(observer) {
    this.positionChangeObservers.push(observer);
  }

  removePositionChangeObserver(observer) {
    this.positionChangeObservers::remove(observer);
  }

  /*MD ## Rendering MD*/
  rerender() {}

  setupTEST() {
    domEvents.forEach(name => {
      this.get('#TEST').addEventListener(name, e => {
        if (e.clientX && e.clientY) {
          const rect = lively.showEvent(e);
          rect.innerHTML = e.type;
        }
        lively.notify(name);
      });
    });
  }

  /*MD ## Node Configuration MD*/
  async applyOptions(options) {
    this.setJSONAttribute('node-options', options);
    this.classList.add(...(options.classes || []));
    await this.setType(options.type);
    this.setPositionFromOptions(options);
  }

  async setType(type) {
    const oldType = this.getAttribute('node-type');
    this.setAttribute('node-type', type);
    await this.applyType(type, oldType);
    this.updateAddOptionalPortVisibility();
  }

  getOwnDescription() {
    const type = this.getType();
    return this.getDescriptionByType(type);
  }

  getDescriptionByType(type) {
    return NodeDescriptions.getDescriptionForTypeWithFallback(type);
  }

  async applyType(type, oldType) {
    return await new ApplyTypeToNode(this, type, oldType).compute();
  }

  $append(...elements) {
    this.append(...elements);
  }

  $remove() {
    this.remove()
  }

  async createNewPort(key, portDescription) {
    const port = await (<offset-mini-port></offset-mini-port>)
    this.$append(port);
    this.updatePort(port, key, portDescription);
  }

  updatePort(port, key, portDescription) {
    port.setAttribute('slot', key);
    port.style.gridArea = key;
    port.applyOptions(portDescription);
  }

  getType() {
    return this.getAttribute('node-type');
  }

  get markVisited() {
    return !!this.getJSONAttribute('visited');
  }

  set markVisited(v) {
    this.get('#TEST').style.background = v ? 'red' : null;
    return !!this.setJSONAttribute('visited', v);
  }
  /*MD ## Navigation MD*/
  getAllPorts() {
    return this.querySelectorAll(`offset-mini-port`);
  }

  getPort(name) {
    return this.querySelector(`offset-mini-port[slot="${name}"]`);
  }

  hasPort(name) {
    return !!this.getPort(name);
  }

  /*MD ## Geometry MD*/
  /**
   * @param hasArrowHead (bool) 'false' to not extent, because no arrow head; 'true' when an arrow head goes into the object
   */
  getAnchorPoint(hasArrowHead, other) {
    function getAnchorDir(element, other) {
      var bounds = lively.getGlobalBounds(element);
      var otherBounds = lively.getGlobalBounds(other);

      var dist = bounds.center().subPt(otherBounds.center());
      if (Math.abs(dist.x) > Math.abs(dist.y)) {
        if (bounds.center().x > otherBounds.center().x) {
          return "leftCenter";
        } else {
          return "rightCenter";
        }
      } else {
        if (bounds.center().y > otherBounds.center().y) {
          return "topCenter";
        } else {
          return "bottomCenter";
        }
      }
    }

    const bounds = this._canvas.boundsForElement(this);
    const anchor = getAnchorDir(this, other);

    return {
      pos: bounds.expandBy(hasArrowHead ? 1 : 0)[anchor](), // no extent if no arrow head
      dir: pt(0, 0)
    };
  }

  getCollisionShape() {
    const pos = lively.getPosition(this);
    const extent = lively.getExtent(this);

    return new paper.Path.Rectangle({
      point: [pos.x, pos.y],
      size: [extent.x, extent.y]
    });
  }

  /*MD ## --- MD*/
  removeFromCanvas() {

    this.incomingEdges().forEach(edge => edge.removeFromCanvas());
    this.outgoingEdges().forEach(edge => edge.removeFromCanvas());

    this.getAllPorts().forEach(port => port.removeConnectedEdges());


    this.remove()
  }
  /*MD ## Drag MD*/
  setupClick() {
    this.addEventListener('click', evt => {
      this.onClick(evt);
    });
  }

  setupDrag() {
    this.addEventListener('pointerdown', evt => {
      this.onPointerDown(evt);
    });
  }

  onClick(evt) {
    // if (!this.justClicking) {
    //   return;
    // }
    // this._canvas.setSelection([this]);
  }

  onPointerDown(evt) {
    if (evt.pointerType !== "mouse") {
      lively.notify('non-mouse input');
      return;
    }

    // left mouse button
    if (evt.button === 0 && evt.buttons === 1) {
      return new MoveNode(this).onPointerDown(evt);
    }

    // right mouse button
    if (evt.button === 2 && evt.buttons === 2) {
      return this.handleRightClick(evt);
    }
  }

  // currently, bubble to canvas
  handleRightClick(evt) {
    // evt.stopPropagation();
    // evt.preventDefault();

    //     this._canvas.preventGlobalContextMenu();

    //     const items = [['remove this node', (evt, item) => {
    //       this._canvas.killNode(this)
    //     }, "", <i class="fa fa-trash" aria-hidden="true"></i>]];

    //     const menu = new ContextMenu(this, items);
    //     menu.openIn(document.body, evt, this);
  }

  setPositionFromOptions(options) {
    const { left, top } = options;

    if (typeof left === 'number' && typeof top === 'number') {
      this.setPosition(pt(left, top));
    }
  }

  setPosition(pos) {
    lively.setPosition(this, pos);
    const { x: left, y: top } = pos;
    this.persistPosition(top, left);
  }

  persistPosition(top, left) {
    if (!this.hasAttribute('node-options')) {
      this.setJSONAttribute('node-options', {});
    }
    const json = this.getJSONAttribute('node-options');
    json.top = top;
    json.left = left;
    this.setJSONAttribute('node-options', json);
  }

  /*MD ## Error Messages MD*/
  err(msg, errorContext) {
    lively.error(msg, errorContext);
  }

  errNoPortNamed(portName, errorContext) {
    this.err(`[${this.getType()}] has no port (${portName})`, errorContext);
  }

  errPortNotOfDirection(portName, direction, errorContext) {
    lively.error(`port [${this.getType()}](${portName}) is no ${direction} port`, errorContext);
  }

  /*MD ## --- MD*/
  onDblClick() {
    this.animate([{ backgroundColor: "lightgray" }, { backgroundColor: "red" }, { backgroundColor: "lightgray" }], {
      duration: 1000
    });
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode, 'node');
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {}
  livelyPreMigrate() {}
  livelyMigrate(other) {}
  livelyInspect(contentNode, inspector) {}
  async livelyExample() {}

}