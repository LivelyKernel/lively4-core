module('users.timfelgentreff.babelsberg.babelsberg-lively').
requires('lively.morphic.Halos').
toRun(function() {
// Lively-specific adaptations for Babelsberg/JS

cop.create('MorphSetConstrainedPositionLayer').refineClass(lively.morphic.Morph, {
    setPosition: function(newPos) {
        if (this.editCb) {
            this.editCb(newPos);
            return this.renderContextDispatch('setPosition', newPos);
        } else {
            return cop.proceed(newPos);
        }
    }
}).refineClass(lively.morphic.DragHalo, {
    dragStartAction: function() {
        this.targetMorph.editCb = bbb.edit(this.targetMorph.getPosition(), ['x', 'y']);
        return cop.proceed.apply(this, arguments);
    },
    dragEndAction: function() {
        this.targetMorph.editCb();
        return cop.proceed.apply(this, arguments);
    }
});


ObjectLinearizerPlugin.subclass('DoNotSerializeConstraintPlugin',
'plugin interface', {
    ignoreProp: function(obj, key, value) {
        return (key === ConstrainedVariable.AttrName ||
                key === ConstrainedVariable.ThisAttrName ||
                (value instanceof Constraint));
    }
});
lively.persistence.pluginsForLively.push(DoNotSerializeConstraintPlugin);

});
