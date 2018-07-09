import { isFunction, functionMetaInfo } from 'utils';
"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Dynamic type checks', function() {
  // #TODO #Question: are generators functions in this case?
  it('`isFunction` works on functions but not on non-functions', () => {
    expect(isFunction(function foo() {})).to.be.true;
    expect(isFunction(async function foo() {})).to.be.true;

    expect(isFunction({})).to.be.false;
    expect(isFunction('')).to.be.false;
    expect(isFunction(1)).to.be.false;
    expect(isFunction(undefined)).to.be.false;
    expect(isFunction(null)).to.be.false;
    expect(isFunction(0)).to.be.false;
    expect(isFunction(true)).to.be.false;
    expect(isFunction(new Date())).to.be.false;
  });
  describe('Dynamic type checks', function() {
    it('functionMetaInfo function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(function foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo anonymous function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(() => {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo async function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(async () => {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.true;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo generator function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(function* foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.true;
    });
    it('functionMetaInfo async generator function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(async function* foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.true;
      expect(isGenerator).to.be.true;
    });
    it('functionMetaInfo string', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo('');
      expect(isFunction).to.be.false;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo null', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo('');
      expect(isFunction).to.be.false;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });

  });
});
