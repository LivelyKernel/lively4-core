module('users.ohshima.ElectricalComponentsTests').requires('lively.TestFramework', 'users.ohshima.ElectricalComponents').toRun(function() {
    
TestCase.subclass('users.ohshima.ElectricalComponentsTests.Test1',
'tests', {
    test2Lead1: function() {
        var t = new users.ohshima.ElectricalComponents.TwoLeadedObject();
        t.lead1.current = 5.0;
        this.assertEquals(t.lead2.current, -5.0);

        t.lead1.current = 6.0;
        this.assertEquals(t.lead2.current, -6.0);
    },
    testResistor1: function() {
        var r = new users.ohshima.ElectricalComponents.Resistor(100.0);
        r.lead1.voltage = 0.0;
        r.lead2.voltage = 50.0;
        this.assertEquals(r.lead1.voltage, 0.0, "r lead1 voltage");
        this.assertEquals(r.lead2.voltage, 50.0, "r lead2 voltage");
//        show({l1v: r.lead1.voltage, l1c: r.lead1.current, l2v: r.lead2.voltage, l2c: r.lead2.current})

        this.assertEquals(r.lead1.current, -0.5, "r lead1 current");

        r.lead1.current = 5.0;
        this.assertEquals(r.lead2.current, -5.0, "r lead2 current");
        // show({l1v: r.lead1.voltage, l1c: r.lead1.current, l2v: r.lead2.voltage, l2c: r.lead2.current})
    },
    testBattery1: function() {
        var b = new users.ohshima.ElectricalComponents.Battery(5.0);
        b.lead1.voltage = 0.0;
        // show({l1v: b.lead1.voltage, l1c: b.lead1.current, l2v: b.lead2.voltage, l2c: b.lead2.current, rs: b.supplyVoltage})
        this.assertEquals(b.lead1.voltage, 0.0, "b lead1 voltage");
        this.assertEquals(b.lead2.voltage, 5.0, "b lead2 voltage");
    },
    testGround1: function() {
        var g = new users.ohshima.ElectricalComponents.Ground();
//        show({l1v: g.lead1.voltage, l1c: g.lead1.current, l2v: g.lead2.voltage, l2c: g.lead2.current})
        g.lead.voltage = 0.0;
        this.assertEquals(g.lead.voltage, 0.0, "g lead voltage");
        this.assertEquals(g.lead.current, 0.0, "g lead current");
    },
    testWire1: function() {
        var w = new users.ohshima.ElectricalComponents.Wire();
//        show({l1v: w.lead1.voltage, l1c: w.lead1.current, l2v: w.lead2.voltage, l2c: w.lead2.current})
        w.lead1.voltage = 10.0;
        this.assertEquals(w.lead1.voltage, 10.0, "w lead1 voltage");
        this.assertEquals(w.lead2.voltage, 10.0, "w lead2 voltage");
    },
    testConnect0: function() {
        users.ohshima.ElectricalComponents.Lead.componentConnect();
    },

    testConnect1: function() {
        var l1 = new users.ohshima.ElectricalComponents.Lead();
//        show({l1v: r.lead1.voltage, l1c: r.lead1.current, l2v: r.lead2.voltage, l2c: r.lead2.current})
        l1.voltage = 10.0;
        users.ohshima.ElectricalComponents.Lead.componentConnect(l1);
        this.assertEquals(l1.voltage, 10.0, "l1 voltage");
        this.assertEquals(l1.current, 0.0, "l1 current");
    },
    testConnect2: function() {
        var l1 = new users.ohshima.ElectricalComponents.Lead();
        var l2 = new users.ohshima.ElectricalComponents.Lead();
        users.ohshima.ElectricalComponents.Lead.componentConnect(l1, l2);
        l1.voltage = 10.0;
        l2.current = 5.0;
//        show({l1v: l1.voltage, l1c: l1.current, l2v: l2.voltage, l2c: l2.current})
        this.assertEquals(l2.voltage, 10.0, "l2 voltage");
        this.assertEquals(l1.current, -5.0, "l1 current");
    },
    testConnect3: function() {
        var l1 = new users.ohshima.ElectricalComponents.Lead();
        var l2 = new users.ohshima.ElectricalComponents.Lead();
        var l3 = new users.ohshima.ElectricalComponents.Lead();
        users.ohshima.ElectricalComponents.Lead.componentConnect(l1, l2, l3);
        l2.voltage = 10.0;
        l2.current = 5.0;
        l3.current = 4.0;
//        show({l1v: l1.voltage, l1c: l1.current, l2v: l2.voltage, l2c: l2.current})
        this.assertEquals(l1.voltage, 10.0, "l1 voltage");
        this.assertEquals(l2.voltage, 10.0, "l2 voltage");
        this.assertEquals(l3.voltage, 10.0, "l3 voltage");
        this.assertEquals(l1.current, -9.0, "l1 current");
        this.assertEquals(l2.current, 5.0, "l2 current");
        this.assertEquals(l3.current, 4.0, "l3 current");
    },
    testConnect4: function() {
        var l1 = new users.ohshima.ElectricalComponents.Lead();
        var l2 = new users.ohshima.ElectricalComponents.Lead();
        var l3 = new users.ohshima.ElectricalComponents.Lead();
        var l4 = new users.ohshima.ElectricalComponents.Lead();
        users.ohshima.ElectricalComponents.Lead.componentConnect(l1, l2, l3, l4);
        l2.voltage = 10.0;
        l2.current = 5.0;
        l3.current = 4.0;
        l4.current = 3.0;
//        show({l1v: l1.voltage, l1c: l1.current, l2v: l2.voltage, l2c: l2.current})
        this.assertEquals(l1.voltage, 10.0, "l1 voltage");
        this.assertEquals(l2.voltage, 10.0, "l2 voltage");
        this.assertEquals(l3.voltage, 10.0, "l3 voltage");
        this.assertEquals(l4.voltage, 10.0, "l4 voltage");
        this.assertEquals(l1.current, -12.0, "l1 current");
        this.assertEquals(l2.current, 5.0, "l2 current");
        this.assertEquals(l3.current, 4.0, "l3 current");
        this.assertEquals(l4.current, 3.0, "l4 current");
    }
})

}) // end of module
