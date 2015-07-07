module('users.ohshima.ElectricalCircuitTests').requires('lively.TestFramework', 'users.ohshima.ElectricalComponents').toRun(function() {

TestCase.subclass('users.ohshima.ElectricalCircuitTests.Test1',
'tests', {
    test4BatteryResistor: function() {
        // like test1, except that the circuit is not completed - the current should be 0
        var b = new users.ohshima.ElectricalComponents.Battery(12);
        var r = new users.ohshima.ElectricalComponents.Resistor(100);
        var g = new users.ohshima.ElectricalComponents.Ground();
        users.ohshima.ElectricalComponents.Lead.componentConnect(g.lead, b.lead1, r.lead1);
        this.assertEqualsEpsilon(b.lead1.voltage, 0.0, "battery grounded lead");
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(b.lead2.voltage, 12.0, "battery ungrounded lead");
        this.assertEqualsEpsilon(r.lead2.voltage, 0.0, "resistor ungrounded lead");
        this.assertEqualsEpsilon(b.lead2.current, 0.0, "battery current");
        this.assertEqualsEpsilon(r.lead2.current, 0.0, "resistor current");
    },
    test2BatteryResistor: function() {
        var b = new users.ohshima.ElectricalComponents.Battery(12);
        var r = new users.ohshima.ElectricalComponents.Resistor(200);
        var g = new users.ohshima.ElectricalComponents.Ground();
        users.ohshima.ElectricalComponents.Lead.componentConnect(g.lead, b.lead1, r.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(b.lead2, r.lead2);
        this.assertEqualsEpsilon(b.lead1.voltage, 0.0, "battery grounded lead");
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(b.lead2.voltage, 12.0, "battery ungrounded lead");
        this.assertEqualsEpsilon(r.lead2.voltage, 12.0, "resistor ungrounded lead");
        this.assertEqualsEpsilon(r.lead2.current, 0.06, "resistor current");
    },
    test3BatteryResistor: function() {
        /* Like test2BatteryResistor, except no ground.  This should still work.  We don't actually know what 
           the absolute voltages will be, but we do know what their differences should be (which is what is tested).
           Cassowary will leave some voltage or another at 0 due to the stay constraints on it. */
        var b = new users.ohshima.ElectricalComponents.Battery(12);
        var r = new users.ohshima.ElectricalComponents.Resistor(200);
        users.ohshima.ElectricalComponents.Lead.componentConnect(b.lead1, r.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(b.lead2, r.lead2);
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(r.lead2.voltage-r.lead1.voltage, 12.0, "resistor voltage drop");
        this.assertEqualsEpsilon(r.lead2.current, 0.06, "resistor current");
        // Now try setting the voltage for b.lead2 to 60.  The voltage on the other lead should adjust for both the battery and resistor.
        b.lead2.voltage = 60.0;
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(r.lead2.voltage, 60.0, "resistor lead2 voltage");
        this.assertEqualsEpsilon(r.lead1.voltage, 48.0, "resistor lead1 voltage");
        this.assertEqualsEpsilon(r.lead2.current, 0.06, "resistor current");
    },
    test1WheatstoneBridge: function() {
        // a Wheatstone bridge with all resistors the same
        this.epsilon = 1.0e-8;
        var b = new users.ohshima.ElectricalComponents.Battery(12);
        var g = new users.ohshima.ElectricalComponents.Ground();
        var w = new users.ohshima.ElectricalComponents.Wire();
        var r1 = new users.ohshima.ElectricalComponents.Resistor(100);
        var r2 = new users.ohshima.ElectricalComponents.Resistor(100);
        var r3 = new users.ohshima.ElectricalComponents.Resistor(100);
        var r4 = new users.ohshima.ElectricalComponents.Resistor(100);
        users.ohshima.ElectricalComponents.Lead.componentConnect(g.lead, b.lead1, r3.lead2, r4.lead2);
        users.ohshima.ElectricalComponents.Lead.componentConnect(b.lead2, r1.lead1, r2.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(r1.lead2, r3.lead1, w.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(r2.lead2, r4.lead1, w.lead2);
        this.assertEqualsEpsilon(b.lead1.voltage, 0.0, "battery grounded lead");
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(w.lead1.current, 0.0, "wire current");
        this.assertEqualsEpsilon(w.lead1.voltage, 6.0, "wire lead1 voltage");
        this.assertEqualsEpsilon(w.lead2.voltage, 6.0, "wire lead2 voltage");
        this.assertEqualsEpsilon(r1.lead1.current, 0.06, "r1 current");
        this.assertEqualsEpsilon(b.lead1.current, 0.12, "b current");
    },
    test2WheatstoneBridge: function() {
        // a Wheatstone bridge that is balanced but with unequal resistances for the upper and lower halves
        this.epsilon = 1.0e-8;
        var b = new users.ohshima.ElectricalComponents.Battery(12);
        var g = new users.ohshima.ElectricalComponents.Ground();
        var w = new users.ohshima.ElectricalComponents.Wire();
        var r1 = new users.ohshima.ElectricalComponents.Resistor(100);
        var r2 = new users.ohshima.ElectricalComponents.Resistor(100);
        var r3 = new users.ohshima.ElectricalComponents.Resistor(200);
        var r4 = new users.ohshima.ElectricalComponents.Resistor(200);
        users.ohshima.ElectricalComponents.Lead.componentConnect(g.lead, b.lead1, r3.lead2, r4.lead2);
        users.ohshima.ElectricalComponents.Lead.componentConnect(b.lead2, r1.lead1, r2.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(r1.lead2, r3.lead1, w.lead1);
        users.ohshima.ElectricalComponents.Lead.componentConnect(r2.lead2, r4.lead1, w.lead2);
        this.assertEqualsEpsilon(b.lead1.voltage, 0.0, "battery grounded lead");
        this.assertEqualsEpsilon(b.supplyVoltage, 12.0, "battery supply voltage");
        this.assertEqualsEpsilon(w.lead1.current, 0.0, "wire current");
        this.assertEqualsEpsilon(w.lead1.voltage, 8.0, "wire lead1 voltage");
        this.assertEqualsEpsilon(w.lead2.voltage, 8.0, "wire lead2 voltage");
        this.assertEqualsEpsilon(r1.lead1.current, 0.04, "r1 current");
        this.assertEqualsEpsilon(b.lead1.current, 0.08, "b current");
    }

})
})
