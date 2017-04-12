import withLogging from '../src/withlogging.js';
import select from '../src/select.js';
import { AddExpr, NegExpr, NumExpr } from './fixtures/expr.js';

describe('complex example', function() {
    it('runs an empty program', function() {

        withLogging.call(AddExpr);

        var seventeen = new NumExpr(17);
        var adExpr = new AddExpr(
            new NegExpr(
                seventeen
            ),
            new NumExpr(42)
        );

        var threshold = 10;
        var selection = select(AddExpr, function(expr) {
            return expr.result() > threshold;
        });

        expect(selection.now()).to.have.lengthOf(1);

        var manualSelectionSize = 0;
        selection
            .enter(function(item) {
                manualSelectionSize++;
            })
            .exit(function(item) {
                manualSelectionSize--;
            });

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
        console.log('Size of Selection', selection.size());
        expect(expr2.result()).to.equal(11);
        expect(selection.now()).to.have.lengthOf(1);
        expect(manualSelectionSize).to.equal(1);

        expect(mappedSelection.now()).to.have.lengthOf(1);
        mappedSelection.now().forEach(function(numExpr) {
            expect(numExpr.result()).to.equal(11);
        });

        expr2.destroy();
        expr2.destroy();
        console.log('Size of Selection', selection.size());
        expect(selection.now()).to.have.lengthOf(0);
        expect(manualSelectionSize).to.equal(0);

        expect(mappedSelection.now()).to.have.lengthOf(0);
    });
});
