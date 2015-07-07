module('users.ohshima.ElectricalComponents').requires('users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

var solver = new ClSimplexSolver();

Object.subclass('users.ohshima.ElectricalComponents.Component',
'initialization', {
    initialize: function($super) {
    },
    newLead: function() {
        return new users.ohshima.ElectricalComponents.Lead();
    }
});

users.ohshima.ElectricalComponents.Component.subclass('users.ohshima.ElectricalComponents.Lead',
'initialization', {
    initialize: function($super) {
        this.voltage = 0.0;
        this.current = 0.0;
    }
});

users.ohshima.ElectricalComponents.Component.subclass('users.ohshima.ElectricalComponents.TwoLeadedObject',
'initialization', {
    initialize: function($super) {
        this.lead1 = this.newLead();
        this.lead2 = this.newLead();
        bbb.always({ctx: {self: this}, solver: solver}, (function () {
            return self.lead1.current + self.lead2.current == 0.0;
        }));
    },
});

users.ohshima.ElectricalComponents.TwoLeadedObject.subclass('users.ohshima.ElectricalComponents.Resistor',
'initialization', {
    initialize: function($super, resistance) {
        $super();
        this.resistance = resistance;
        bbb.always({ctx: {self: this, resistance: this.resistance}, solver: solver}, (function () {
            return ((self.lead2.voltage - self.lead1.voltage) == self.lead2.current * resistance)
        }));
    },
});

users.ohshima.ElectricalComponents.TwoLeadedObject.subclass('users.ohshima.ElectricalComponents.Battery',
'initialization', {
    initialize: function($super, supplyVoltage) {
        $super();
        this.supplyVoltage = supplyVoltage;
        bbb.always({ctx: {self: this, supplyVoltage: this.supplyVoltage}, solver: solver}, (function () {
            return (self.lead2.voltage - self.lead1.voltage == supplyVoltage)
        }));
    },
});

users.ohshima.ElectricalComponents.Component.subclass('users.ohshima.ElectricalComponents.Ground',
'initialization', {
    initialize: function($super) {
        $super();
        this.lead = this.newLead();
        bbb.always({ctx: {self: this}, solver: solver}, (function () {
            return (self.lead.voltage == 0.0) && (self.lead.current == 0.0)
        }));
    },
});

users.ohshima.ElectricalComponents.TwoLeadedObject.subclass('users.ohshima.ElectricalComponents.Ammeter',
'initialization', {
    initialize: function($super) {
        $super();
        bbb.always({ctx: {self: this}, solver: solver}, (function () {
            return (self.lead1.voltage == self.lead2.voltage)
        }));
    },
});

users.ohshima.ElectricalComponents.TwoLeadedObject.subclass('users.ohshima.ElectricalComponents.Wire',
'initialization', {
    initialize: function($super) {
        $super();
        bbb.always({ctx: {self: this}, solver: solver}, (function () {
            return (self.lead1.voltage == self.lead2.voltage)
        }));
    },
});

users.ohshima.ElectricalComponents.TwoLeadedObject.subclass('users.ohshima.ElectricalComponents.Voltmeter',
'initialization', {
    initialize: function($super) {
        $super();
        this.readingVoltage = 0.0;
        bbb.always({ctx: {self: this}, solver: solver}, (function () {
            return (self.lead1.current == 0.0 && ((self.lead2.voltage - self.lead1.voltage) == self.readingVoltage)) 
        }));
    },
});

Object.extend(users.ohshima.ElectricalComponents.Lead, {
    connectAll: function(leads) {
        this.componentConnect.apply(this, leads);
    },
    componentConnect: function() {
        var len = arguments.length
        if (len === 0) 
            return;
        return this['componentConnect' + len].apply(this, $A(arguments))
    },
    componentConnect1: function(lead1) {
        bbb.always({ctx: {lead1: lead1}, solver: solver}, (function () {
            return lead1.current == 0.0;
        }))
    },
    componentConnect2: function(lead1, lead2) {
        bbb.always({ctx: {lead1: lead1, lead2: lead2}, solver: solver}, (function () {
            return (lead1.voltage == lead2.voltage)
        }));
        bbb.always({ctx: {lead1: lead1, lead2: lead2}, solver: solver}, (function () {
            return lead1.current + lead2.current == 0.0;
        }));
    },
    componentConnect3: function(lead1, lead2, lead3) {
        bbb.always({ctx: {lead1: lead1, lead2: lead2, lead3: lead3}, solver: solver}, (function () {
            return (lead1.voltage == lead2.voltage) && (lead1.voltage == lead3.voltage)
        }));
        bbb.always({ctx: {lead1: lead1, lead2: lead2, lead3: lead3}, solver: solver}, (function () {
            return lead1.current + lead2.current + lead3.current == 0.0;
        }));
    },
    componentConnect4: function(lead1, lead2, lead3, lead4) {
        bbb.always({ctx: {lead1: lead1, lead2: lead2, lead3: lead3, lead4: lead4}, solver: solver}, (function () {
            return (lead1.voltage == lead2.voltage) && (lead1.voltage == lead3.voltage) && (lead1.voltage == lead4.voltage)
        }));
        bbb.always({ctx: {lead1: lead1, lead2: lead2, lead3: lead3, lead4: lead4}, solver: solver}, (function () {
            return lead1.current + lead2.current + lead3.current + lead4.current == 0.0;
        }))
    }
});

// Enter your code here

}) // end of module
