module('users.timfelgentreff.layout.test_fixture').requires().toRun(function() {

lively.morphic.Box.subclass('SubclassedBox', {});
lively.morphic.Box.subclass('OverwrittenExtentBox', {
    getExtent: function() {
        return pt(100, 200);
    }
});
lively.morphic.Box.subclass('SuperCallBox', {
    getExtent: function($super) {
        return $super().addPt(pt(30, 30));
    }
});
}) // end of module
