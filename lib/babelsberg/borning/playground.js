module('users.borning.playground').requires("users.timfelgentreff.babelsberg.tests").toRun(function() {

TestCase.subclass('users.borning.playground.PlaygroundTests', {
    testPointAdd: function() {
        var pt1 = pt(10, 15),
            pt2 = pt(20, 35),
            pt3 = pt(30, 50);
            this.assert(pt1.addPt(pt2).equals(pt3));
    },
    testPointAdditionConstraint: function() {
        // test a constraint that adds two points
        var p1 = pt(10,15), p2 = pt(20,35), p3=pt(0,0);
        bbb.always({
            // debugging: true
            solver: new ClSimplexSolver(),
            ctx: {
                ClSimplexSolver: ClSimplexSolver,
                p1: p1,
                p2: p2,
                p3: p3,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return p1.addPt(p2).equals(p3) && p1.equals(pt(100, 300)) && p3.x == 145 && p3.y == 500;;
        });         
        this.assert(p1.equals(pt(100,300)));
        this.assert(p2.equals(pt(45,200)));
        this.assert(p3.equals(pt(145,500)));
        
        // original constraint follows:
        //    always: {
        //    // debugging: true
        //    solver: new ClSimplexSolver()
        //    p1.addPt(p2).equals(p3) && p1.equals(pt(100,300))  &&
        //	p3.x==45 && p3.y==500;
        //    } 
    },
    testEquals: function() {
        // very simple assertion test
        var x = 5;
        this.assert(x==5)
    }
   
})

}); // end of module
