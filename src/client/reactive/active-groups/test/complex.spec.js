"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from 'active-groups';
import { AddExpr, NegExpr, NumExpr } from './expr.js';

describe('complex example', function() {
    it('runs an empty program', function() {

      var seventeen = new NumExpr(17);
        var adExpr = new AddExpr(
            new NegExpr(
                seventeen
            ),
            new NumExpr(42)
        );

        var threshold = 10;
        var selection = select(AddExpr)
          .filter(expr => expr.result() > threshold);
        expect(selection.now()).to.have.length(1);

      var manualSelectionSize = 0;
        selection
            .enter(item => manualSelectionSize++)
            .exit(item => manualSelectionSize--);

        expect(manualSelectionSize).to.equal(1);

        var mappedSelection = selection.map(function(addExpr) {
            return new NumExpr(addExpr.result());
        })
            .enter(function(numExpr) {
                console.log('new NumExpr through mapping', numExpr);
            });

        expect(mappedSelection.now()).to.have.lengthOf(1);
        mappedSelection.now().forEach(function(numExpr) {
            expect(numExpr.result()).to.equal(25);
        });

        var five = new NumExpr(5);
        var expr = new AddExpr(
            five,
            adExpr
        );
        expect(expr.result()).to.equal(30);
        expect(selection.now()).to.have.lengthOf(2);
        expect(manualSelectionSize).to.equal(2);

        expect(mappedSelection.now()).to.have.lengthOf(2);
        mappedSelection.now().forEach(function(numExpr) {
            expect(
                numExpr.result() === 25 ||
                numExpr.result() === 30
            ).to.be.true;
        });
        five.val = -30;
        expect(expr.result()).to.equal(-5);
        expect(selection.now()).to.not.include(expr);
        expect(selection.now()).to.have.lengthOf(1);
        expect(manualSelectionSize).to.equal(1);

        expect(mappedSelection.now()).to.have.lengthOf(1);
        mappedSelection.now().forEach(function(numExpr) {
            expect(numExpr.result()).to.equal(25);
        });

        seventeen.val = 70;
        expect(expr.result()).to.equal(-58);
        expect(selection.now()).to.have.lengthOf(0);
        expect(manualSelectionSize).to.equal(0);

        expect(mappedSelection.now()).to.have.lengthOf(0);

        var eleven = new NegExpr(
          new NegExpr(
            new NumExpr(11)
          )
        );
        var expr2 = new AddExpr(
            eleven,
            new NumExpr(0)
        );
        expect(expr2.result()).to.equal(11);
        expect(selection.now()).to.have.lengthOf(1);
        expect(manualSelectionSize).to.equal(1);

        expect(mappedSelection.now()).to.have.lengthOf(1);
        mappedSelection.now().forEach(function(numExpr) {
            expect(numExpr.result()).to.equal(11);
        });

        var newFive = new NumExpr(5);
        eleven.expr = newFive;
        expect(expr2.result()).to.equal(-5);
        expect(selection.now()).to.have.lengthOf(0);
        expect(manualSelectionSize).to.equal(0);

        expect(mappedSelection.now()).to.have.lengthOf(0);

        newFive.val = -11;
        expect(expr2.result()).to.equal(11);
        expect(selection.now()).to.have.lengthOf(1);
        expect(manualSelectionSize).to.equal(1);

        expect(mappedSelection.now()).to.have.lengthOf(1);
        mappedSelection.now().forEach(function(numExpr) {
            expect(numExpr.result()).to.equal(11);
        });

        expr2.destroy();
        expr2.destroy();
        expect(selection.now()).to.have.lengthOf(0);
        expect(manualSelectionSize).to.equal(0);

        expect(mappedSelection.now()).to.have.lengthOf(0);
    });
});
