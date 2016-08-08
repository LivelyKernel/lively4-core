'use strict';

import { aexpr, setMember, getMember, getAndCallMember } from '../src/aexpr-source-transformation-propagation.js';

describe('Propagation Logic', function() {

    it('should be supported with proper integration', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => getMember(obj, "prop")).onChange(spy);

        expect(spy).not.to.be.called;

        setMember(obj, "prop", "=", 17);

        expect(spy).to.be.calledOnce;
    });

});
