// DRAFT JUST to have a look at it again.

import Morph from "src/components/widgets/lively-morph.js"
import {pt} from "src/client/graphics.js"

/**
 * Fabrik.js.  This file contains Fabrik  
 *
 * == List of classes == 
 * - Fabrik
 * - FabrikMorph
 * - FabrikComponent
 * - ComponentModel
 * - PinMorph
 * - PinHandle
 * - ConnectorMorph
 * - Component
 * - TextComponent
 * - FunctionComponent
 * - ComponentBox
 * - PointSnapper
 * - FlowLayout
 * - ... to be updated ...
 */
 
 /**************************************************
  * Examples for interactive testing and exploring
  */


// STUBS
var Global = {
  
}

class WorldMorph {
  
}

class Widget {
  
}

class SelectionMorph {
  
}

class Class {
  
}

// logMethod(Morph.prototype, 'onMouseDown');

export default class Fabrik {
	
	positionComponentRelativeToOther(comp, otherComp, relPos) {
		comp.panel.setPosition(otherComp.panel.getPosition().addPt(relPos));
	}

	setPositionRel(relPos, morph) {
		console.assert(morph.owner, 'no owner');
		morph.setPosition(relPos.scaleByPt(morph.owner.getExtent()));
	}
	
	addTextComponent(toComponent) {
     var c = new TextComponent();
     toComponent.plugin(c);
     return c;
	}

	addFunctionComponent(toComponent) {
		var c = new FunctionComponent();
		toComponent.plugin(c);
		return c;
	}

	addFunctionComponent2Inputs(toComponent) {
		var c = new FunctionComponent();
		c.addFieldAndPinHandle("Input2");
		toComponent.plugin(c);
		return c;
	}

	addTextListComponent(toComponent) {
		var c = new TextListComponent();
		toComponent.plugin(c);
		return c;
	}

	addWebRequestComponent(toComponent) {
		var c = new WebRequestComponent();
		toComponent.plugin(c);
		c.panel.setExtent(pt(220,50));
		return c;
	}
	
	addFabrikComponent(toComponent, title) {
		var c = new FabrikComponent();
		c.viewTitle = title;
		toComponent.plugin(c);
		// c.panel.setExtent(pt(220,50));
		return c;
	}
	
	openComponentBox(world, loc) {
		if (!world) world = WorldMorph.current();
		var box = new ComponentBoxMorph();
		world.addMorph(box);
		box.setPosition(loc);
		return box;
	}

	openFabrikComponent(world, loc, extent, title) {
		if (!world) world = WorldMorph.current();
		if (!extent) extent = pt(400, 300);
		if (!loc) loc = pt(100, 100);
		if (!title) title = 'Fabrik Component';
		var c = new FabrikComponent();
		c.defaultViewExtent = extent;
		FabrikComponent.current = c;
		c.viewTitle = title;
		c.openIn(world, loc);
		return c;
	}

	openFabrikComponentExample() {
		var f = this.openFabrikComponent();
		var c1 = this.addTextComponent(f);
		var c2 = this.addTextComponent(f);
		var c3 = this.addTextComponent(f);
		this.addTextComponent(f);
		this.addTextComponent(f);
		c1.setText("Hello World");
		c2.setText("Hallo Welt");
		c3.setText("Ola mundo");
		f.morph.automaticLayout();
		c1.getPinHandle("Text").connectTo(c2.getPinHandle("Text"));
		c2.getPinHandle("Text").connectTo(c3.getPinHandle("Text"));
		return f;
	}

	openFabrikTextListExample() {
		// the next variables are intentionally defined global
		var f = this.openFabrikComponent();
		var input = this.addFunctionComponent(f);
		input.setFunctionBody("return ['eins', 'zwei', 'drei']")
		var list = this.addTextListComponent(f);
		var out = this.addTextComponent(f);
		f.connectComponents(input, "Result", list, "List");
		f.connectComponents(list, "Selection", out, "Text");	
		f.morph.automaticLayout();
		return f;
	}
	
	openConnectorMorphExample() {
		var c = new lively.Fabrik.ConnectorMorph();
		
		var m1 = Morph.makeRectangle(100,100,30,30);
		var m2 = Morph.makeRectangle(200,200, 30,30);
		m1.getPinPosition = function(){return this.getPosition()};
		m2.getPinPosition = m1.getPinPosition;  

		m1.changed = function(){c.updateView()};
		m2.changed = function(){c.updateView()};
		
		var world = WorldMorph.current();
		world.addMorph(c);
		world.addMorph(m1);
		world.addMorph(m2);

		// FIXME Why isnt this handled at a central point?????
		c.setStartHandle(m1);
		c.setEndHandle(m2);
		c.updateView();
		return c;
	}

	openFabrikFunctionComponentExample() {
		// the next variables are intentionally defined global
		var f = this.openFabrikComponent();
		var c1 = this.addTextComponent(f);
		var c2 = this.addTextComponent(f);
		var f1 = this.addFunctionComponent(f);
		c1.setText("");
		c2.setText("");

		f1.setFunctionBody("return 3 + 4");
		f.connectComponents(f1, "Result", c2, "Text");

		f.morph.automaticLayout();
		return f;
	}
	
	/*
	 * Browser Example:
	 *  - Todo: "prepared methods..."
	 *  - added second input field to function manually
	 * 
	 */
	addConvenienceFunctions() {
		Global.allFabrikClassNames = function() {
			return ["FabrikMorph", "FabrikComponent", "PinMorph", "PinHandle",  
				"Component",  "TextComponent", "FunctionComponent", "ComponentBox", "PointSnapper", "FlowLayout"]
		};
		Global.allClassNames = function() {
			var classNames = [];
			Class.withAllClassNames(Global, function(n) { n.startsWith('SVG') || classNames.push(n)});
			return classNames;
		};
		Global.allMethodsFor = function(className) {
			if (className == null) return [];
			return Class.forName(className).localFunctionNames().sort();
		};
		Global.getMethodStringFor = function(className, methodName) { 
			try {
				var func = Global[className].prototype[methodName];
				if (func == null) return "no code";
				var code = func.getOriginal().toString();
				return code;
			} catch(e) { return "no code" }
		};
	}
	
	openFabrikBrowserExample(world, loc) {
		this.addConvenienceFunctions();
		
		if (!loc) loc = pt(100, 100);
		var f = this.openFabrikComponent(world, loc, pt(750, 500), 'Fabrik Browser');

		var getClasses = this.addFunctionComponent(f);
		getClasses.setFunctionBody('return allFabrikClassNames()');
		var getMethods = this.addFunctionComponent(f);
		getMethods.setFunctionBody('return allMethodsFor(this.getInput())'); 
		
		var getSource = new FunctionComponent();
		getSource.addFieldAndPinHandle("Input2");
		
    getSource.formalModel.addObserver({ onInput2Update() { getSource.execute()}});
		f.plugin(getSource);	
		getSource.setFunctionBody('return getMethodStringFor(this.getInput(), this.getInput2())'); 
		
		var classList = this.addTextListComponent(f);
		var methodList = this.addTextListComponent(f);
		
		
		var methodSource = this.addTextComponent(f);
		
		f.connectComponents(getClasses, "Result", classList, "List");
		f.connectComponents(classList, "Selection", getMethods, "Input");   
		f.connectComponents(getMethods, "Result", methodList, "List");  
		
		f.connectComponents(classList,  "Selection", getSource, "Input");   
		f.connectComponents(methodList, "Selection", getSource, "Input2");  
		
		f.connectComponents(getSource, "Result", methodSource, "Text"); 
		
		f.morph.automaticLayout();
		
		// some manual layout
		getClasses.panel.setPosition(pt(250,30));
		this.positionComponentRelativeToOther(classList, getClasses, pt(0, getClasses.panel.getExtent().y + 20));
		this.positionComponentRelativeToOther(getMethods, getClasses, pt(getClasses.panel.getExtent().x + 50, 0));
		this.positionComponentRelativeToOther(methodList, getMethods, pt(0, getMethods.panel.getExtent().y + 20));
		this.positionComponentRelativeToOther(methodSource, classList, pt(0, classList.panel.getExtent().y + 20));
		methodSource.panel.setExtent(pt(methodList.panel.getPosition().x - classList.panel.getPosition().x + classList.panel.getExtent().x, 200));
		this.positionComponentRelativeToOther(getSource, methodSource, pt(-1 * (getSource.panel.getExtent().x + 20), 0));
		
		getClasses.execute();
		return f;
	}

	openFabrikWebRequestExample(world, loc) {
		if (!loc) loc = pt(120, 110);
		var f = this.openFabrikComponent(world, loc, pt(730, 170), 'WebRequest Example');
	
		var urlHolder = this.addTextComponent(f);
		urlHolder.setText("http://www.webservicex.net/CurrencyConvertor.asmx/ConversionRate?FromCurrency=USD&ToCurrency=EUR");
	
		var req = this.addWebRequestComponent(f);
	
		var result = this.addTextComponent(f);
	
		f.morph.automaticLayout();
	
		return f;
	}
	
	openFabrikWeatherWidgetExample(world, loc) {
		if (!loc) loc = pt(100, 100);
		
		
		
		var base = this.openFabrikComponent(world, loc.addXY(-50,-20), pt(800, 400), 'Current Weather Conditions');
		// var urlInput = this.addTextComponent(base); urlInput.panel.setExtent(pt(180,60));
		var zipInput = this.addTextComponent(base); zipInput.panel.setExtent(pt(100,50));
		
		/* 
     * Building the requester Fabrik
     */
		var requestor = this.openFabrikComponent(world, loc, pt(700, 250), 'Request Weather');
		requestor.morph.owner.remove(); // FIXME hack so that window morph disappears...
		base.morph.addMorph(requestor.morph);
		requestor.morph.setExtent(pt(700,250));
		requestor.morph.setPosition(pt(50,50));
		
		/* Pins */
		// var urlPin = requestor.addPin('URL'); this.setPositionRel(pt(0.1, 0), urlPin.morph);
		var zipPin = requestor.addPin('ZIP'); this.setPositionRel(pt(0.2, 0), zipPin.morph);
		var infoPin = requestor.addPin('Info'); this.setPositionRel(pt(0.9, 0.96), infoPin.morph);
		var conditionsPin = requestor.addPin('Conditions'); this.setPositionRel(pt(0.8, 0.96), conditionsPin.morph);
		// urlInput.getPin('Text').connectTo(urlPin);
		zipInput.getPin('Text').connectTo(zipPin);
		
		/* Function component for combining url and zip */
		var combineURLAndZIP = this.addFunctionComponent(requestor);
		// var pin = combineURLAndZIP.addIncputFieldAndPin('Url'); this.setPositionRel(pt(-0.04,0.33), pin.morph);
		combineURLAndZIP.addInputFieldAndPin('Zip');
		combineURLAndZIP.removePin('Input');
		zipPin.connectTo(combineURLAndZIP.getPin('Zip'));
		// urlPin.connectTo(combineURLAndZIP.getPin('Url'));
	
		/* WebRequestor */
		var req = this.addWebRequestComponent(requestor);
		combineURLAndZIP.getPin('Result').connectTo(req.getPin('URL'));
				
		/* Lists for extracting Information */
		var infoList = this.addTextListComponent(requestor);
		// debugger;
		req.getPin('ResponseXML').connectTo(infoList.getPin('List'));
		infoList.getPin('Selection').connectTo(infoPin);
		var conditionList = this.addTextListComponent(requestor);
		conditionList.getPin('Selection').connectTo(conditionsPin);
		req.getPin('ResponseXML').connectTo(conditionList.getPin('List'));
		
		requestor.morph.automaticLayout();
		requestor.morph.collapseToggle(true);
		
		// Base fabrik: create data processing components
		var extractInfos = this.addFunctionComponent(base);
		extractInfos.removePin('Result');
		var cityPin = extractInfos.addPin('City'); this.setPositionRel(pt(0.96, 0.3), cityPin.morph);
		var datePin = extractInfos.addPin('Date'); this.setPositionRel(pt(0.96, 0.6), datePin.morph);
		extractInfos.setFunctionBody('if (input) { \n var infos = input.js.forecast_information; \n this.setCity(infos.city); \n this.setDate(infos.forecast_date); \n }');
		
		var extractCondition = this.addFunctionComponent(base);
		extractCondition.removePin('Result');
		var conditionPin = extractCondition.addPin('Condition'); this.setPositionRel(pt(0.96, 0.2), conditionPin.morph);
		var tempPin = extractCondition.addPin('Temp'); this.setPositionRel(pt(0.96, 0.4), tempPin.morph);
		var humidityPin = extractCondition.addPin('Humidity'); this.setPositionRel(pt(0.96, 0.6), humidityPin.morph);
		var windPin = extractCondition.addPin('Wind'); this.setPositionRel(pt(0.96, 0.8), windPin.morph),
			imagePin = extractCondition.addPin('Image'); this.setPositionRel(pt(0.5, 0.96), imagePin.morph);
		extractCondition.setFunctionBody('if (input) {\n var infos = input.js.current_conditions; \n this.setCondition(infos.condition); \n this.setTemp(infos.temp_c + "C / " + infos.temp_f + "F"); \n this.setHumidity(infos.humidity); \n this.setWind(infos.wind_condition); \n this.setImage("http:\/\/www.google.com" + infos.icon);\n }');
				
		// add the 'UI'
		var extent = pt(80,50);
		var cityTxt = this.addTextComponent(base);
		cityTxt.panel.setExtent(extent);
		cityPin.connectTo(cityTxt.getPin('Text'));
		
		var dateTxt = this.addTextComponent(base);
		dateTxt.panel.setExtent(extent);
		datePin.connectTo(dateTxt.getPin('Text'));
		
		var conditionTxt = this.addTextComponent(base);
		conditionTxt.panel.setExtent(extent);
		conditionPin.connectTo(conditionTxt.getPin('Text'));
		
		var tempTxt = this.addTextComponent(base);
		tempTxt.panel.setExtent(extent);
		tempPin.connectTo(tempTxt.getPin('Text'));
		
		var humidityTxt = this.addTextComponent(base);
		humidityTxt.panel.setExtent(extent);
		humidityPin.connectTo(humidityTxt.getPin('Text'));
		
		var windTxt = this.addTextComponent(base);
		windTxt.panel.setExtent(extent);
		windPin.connectTo(windTxt.getPin('Text'));		
		
		base.morph.automaticLayout();
		
		var dist = 0;
		[tempTxt, conditionTxt, humidityTxt, windTxt].each(function(ea) { ea.panel.setExtent(pt(220,35)) });
		conditionTxt.panel.setPosition(pt(290, 250));
		this.positionComponentRelativeToOther(tempTxt, conditionTxt, pt(0, conditionTxt.panel.getExtent().y + dist));
		this.positionComponentRelativeToOther(humidityTxt, tempTxt, pt(0, tempTxt.panel.getExtent().y + dist));
		this.positionComponentRelativeToOther(windTxt, humidityTxt, pt(0, humidityTxt.panel.getExtent().y + dist));
		
		this.positionComponentRelativeToOther(cityTxt, conditionTxt, pt(0, -1*(cityTxt.panel.getExtent().y + dist)));
		this.positionComponentRelativeToOther(dateTxt, cityTxt, pt(conditionTxt.panel.getExtent().x-dateTxt.panel.getExtent().x, 0));
		
		extractCondition.panel.setExtent(pt(255.0,145.0));
		this.positionComponentRelativeToOther(extractCondition, windTxt, pt(0 - extractCondition.panel.getExtent().x - 30, windTxt.panel.getExtent().y - extractCondition.panel.getExtent().y));
		extractInfos.panel.setExtent(pt(255.0,145.0));
		this.positionComponentRelativeToOther(extractInfos, windTxt, pt(windTxt.panel.getExtent().x + 30, windTxt.panel.getExtent().y - extractInfos.panel.getExtent().y));
		
		zipInput.panel.setExtent(pt(220,35));
		this.positionComponentRelativeToOther(zipInput, cityTxt, pt(0, -1*(zipInput.panel.getExtent().y + dist)));
		
		
		// get things going
		infoList.setSelectionIndex(1);
		conditionList.setSelectionIndex(10);
		zipInput.setText('12685');
		combineURLAndZIP.setFunctionBody("'http://www.google.com/ig/api?weather=' + zip");
		
		return base;
	}
	
	openCurrencyConverterExample(world, loc) {
		// the next variables are intentionally defined global
		if (!loc) loc = pt(10,10);
		var f = this.openFabrikComponent(world, loc, pt(940,270), 'Currency Converter');
	
		var urlComp = this.addTextComponent(f);
		urlComp.setText("http://www.webservicex.net/CurrencyConvertor.asmx/ConversionRate?FromCurrency=USD&ToCurrency=EUR");
		var reqComp = this.addFunctionComponent(f);
		reqComp.setFunctionBody("new WebResource('http://www.webservicex.net/CurrencyConvertor.asmx/ConversionRate?FromCurrency=USD&ToCurrency=EUR').get().contentDocument.getElementsByTagName('double')[0].textContent;");
		// reqComp.setFunctionBody("");
		f.connectComponents(urlComp, "Text", reqComp, "Input");
		var currencyComp = this.addTextComponent(f);
		//f.connectComponents(reqComp, "Result", currencyComp, "Text");
		
		
		var currency1Comp = this.addTextComponent(f);
		var currency2Comp = this.addTextComponent(f);
		
		var fromToConvComp = this.addFunctionComponent2Inputs(f);
		fromToConvComp.setFunctionBody("return Number(this.getInput()) * Number(this.getInput2())");
		f.connectComponents(fromToConvComp, "Result", currency2Comp, "Text");
		
		var toFromConvComp = this.addFunctionComponent2Inputs(f);
		toFromConvComp.setFunctionBody("return 1/Number(this.getInput()) * Number(this.getInput2())");
		f.connectComponents(toFromConvComp, "Result", currency1Comp, "Text");
		
		currencyComp.setText("0");
		currency1Comp.setText("");
		currency2Comp.setText("");
	
	
		f.morph.automaticLayout();
		return f;
	}
	
	openFahrenheitCelsiusExample(world, loc) {
		if (!loc) loc = pt(100, 100);
		var f = this.openFabrikComponent(world, loc, pt(940,270), 'Celsius-Fahrenheit Converter');
		celsius = this.addTextComponent(f);
		celsius.setText("");
	
		var f1 = this.addFunctionComponent(f);
		f1.setFunctionBody("input * 9/5 + 32");
	
		var fahrenheit = this.addTextComponent(f);
		fahrenheit.setText("");
	
		var f2 = this.addFunctionComponent(f);
		//f4.addFieldAndPinHandle('Input');
		f2.setFunctionBody("(input - 32) * 5/9");
	
		f.connectComponents(celsius, "Text", f1, "Input");
		f.connectComponents(f1, "Result", fahrenheit, "Text");
	
		// f.connectComponents(fahrenheit, "Text", f3, "Input");
		// f.connectComponents(f3, "Result", f4, "Input");
		// f.connectComponents(f4, "Result", celsius, "Text");
	
		f.morph.automaticLayout();
	
		// some manual layouting
		// f3.panel.setPosition(f1.panel.getPosition().addPt(pt(0,f1.panel.getExtent().y + 20)));
		// f4.panel.setPosition(f2.panel.getPosition().addPt(pt(0,f2.panel.getExtent().y + 20)));
		//f4.panel.setPosition(f2.panel.getPosition().addPt(pt(0,f2.panel.getExtent().y - 10)));
		this.positionComponentRelativeToOther(f2, f1, pt(0, f1.panel.getExtent().y + 20));
		celsius.panel.setPosition(celsius.panel.getPosition().addPt(pt(0,celsius.panel.getExtent().y / 2)));
		fahrenheit.panel.setPosition(fahrenheit.panel.getPosition().addPt(pt(0,(fahrenheit.panel.getExtent().y + 20) / 2)));
	
		return f;
	}
	
	
	openFahrenheitCelsiusExampleSimple(world, loc) {
		if (!loc) loc = pt(100, 100);
		var f = this.openFabrikComponent(world, loc, pt(940,270), 'Celsius-Fahrenheit Converter');
		celsius = this.addTextComponent(f);
		celsius.setText("");
	
		var f1 = this.addFunctionComponent(f);
		f1.setFunctionBody("input * 9/5 + 32");
	
		var fahrenheit = this.addTextComponent(f);
		fahrenheit.setText("");
	
		var f2 = this.addFunctionComponent(f);
		//f4.addFieldAndPinHandle('Input');
		f2.setFunctionBody("(input - 32) * 5/9");
	
		f.connectComponents(celsius, "Text", f1, "Input");
		f.connectComponents(f1, "Result", fahrenheit, "Text");
	
		// f.connectComponents(fahrenheit, "Text", f3, "Input");
		// f.connectComponents(f3, "Result", f4, "Input");
		// f.connectComponents(f4, "Result", celsius, "Text");
	
		f.morph.automaticLayout();
	
		// some manual layouting
		// f3.panel.setPosition(f1.panel.getPosition().addPt(pt(0,f1.panel.getExtent().y + 20)));
		// f4.panel.setPosition(f2.panel.getPosition().addPt(pt(0,f2.panel.getExtent().y + 20)));
		//f4.panel.setPosition(f2.panel.getPosition().addPt(pt(0,f2.panel.getExtent().y - 10)));
		this.positionComponentRelativeToOther(f2, f1, pt(0, f1.panel.getExtent().y + 20));
		celsius.panel.setPosition(celsius.panel.getPosition().addPt(pt(0,celsius.panel.getExtent().y / 2)));
		fahrenheit.panel.setPosition(fahrenheit.panel.getPosition().addPt(pt(0,(fahrenheit.panel.getExtent().y + 20) / 2)));
	
		return f;
	}
	
	openFabrikFunctionComponentExample2() {
		// the next variables are intentionally defined global
		var f = this.openFabrikComponent();
		var c1 = this.addTextComponent(f);
		var c2 = this.addTextComponent(f);
		var f1 = this.addFunctionComponent(f);
		c1.setText("");
		c2.setText("");
	
		f1.setFunctionBody("return this.getInput() * this.getInput()");
	
		f.connectComponents(f1, "Result", c1, "Text");
		f.connectComponents(c2, "Text", f1, "Input");
	
		f.morph.automaticLayout();
	
		return f;
	}

};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
						Fabrik implementation
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *	
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* Fabrik Model. It is used to store the data of the components. Data flow is simulated
   by establishing observer relationships bewtween the models of the components */

/*
 * PinMorph, the graphical representation of a pin handle
 */
class PinMorph extends Morph {
	
	initialize(){
	  this.isPinMorph =  true,
	  this.style =  {fill: Color.green, opacity: 0.5, borderWidth: 1, borderColor: Color.black},
	  
    // #TODO  
    // noShallowCopyProperties: Morph.prototype.noShallowCopyProperties.concat(['pinHandle']),

      
    // #TODO
    // super(new lively.scene.Ellipse(pt( 0, 0), 10));
		
		this.suppressHandles = true; // no handles
		this.openForDragAndDrop = true;
	   
		this.setExtent(pt(18,18)); // fixes ellipse pt(0,0) === center behavior
		return this;
	}

	handlesMouseDown() { return true }

	okToBeGrabbedBy() {
  
  }

	setPinHandle(pinHandle) {
		// console.log("setPinHandle" + pinHandle)
		this.pinHandle = pinHandle;
		this.ownerWidget = pinHandle;
	}
	
	copyFrom(copier, other) {
		// console.log("copy PinMorph from:" + other.id())
		super.copyFrom(copier, other);
		
		copier.smartCopyProperty("pinHandle", this, other);
		this.ownerWidget = this.pinHandle;
		
		return this;
	}

	 /* Drag and Drop of Pin */		
	addMorph(morph) {
		if (!morph.pinHandle || !morph.pinHandle.isFakeHandle) return;
		// console.log("dropping pin on other pin...");
		super.addMorph(morph); // to remove it out of the hand

		//FIXME: just for make things work...
		var fakePin = morph.pinHandle;
		fakePin.connectors.first().remove();
		
		// FIXME only workaround for connect problem, use double dispatch
		fakePin.originPin.connectTo(this.pinHandle);
				
		this.removeMorph(morph);
	}
	
	onMouseOut(evt) { 
		var self = this;
		if (this.hideHelpHandObserver) return; // we are already observing
		this.hideHelpHandObserver = new HandPositionObserver(function(currentMousePosition) {
			if (self.world() && currentMousePosition.dist(self.worldPoint(pt(5,5))) > 20) {
				self.hideHelp();
				this.stop();
				self.hideHelpHandObserver = null;
			}
		});
		this.hideHelpHandObserver.start();
	}
	
	setupInputMorphStyle() {
		this.setFill(Color.blue);
		if (this.pinHandle.component) {
			var inputPins = this.pinHandle.component.inputPins();
			var index = inputPins.indexOf(this.pinHandle);
			if (index > 0) {
				var prevPinPosition = (inputPins[index - 1]).morph.getPosition();
				// console.log("prev pos " + prevPinPosition);
				this.setPosition(prevPinPosition.addPt(pt(0,25)));
			}	   
		}
	}
	
	changed(aspect, value) {
		super.changed();
		if (aspect == "globalPosition" && this.snapper) 
			this.snapper.snap(value);
		this.updatePosition();
	}

	getLocalPinPosition() {
		return this.getExtent().scaleBy(0.5);
	}
	
	getGlobalPinPosition() {
		return this.getGlobalTransform().transformPoint(this.getLocalPinPosition());
	}
	
	dropMeOnMorph(receiver) {
		// logCall(arguments, this);
		if (receiver && receiver.isPinMorph)
			receiver.addMorph(this);
		else {
			var fakeEventPos = this.worldPoint(this.getExtent().scaleBy(0.5));
			console.log('fake event pos ' + fakeEventPos);
			var myPos = this.getGlobalPinPosition();
			var otherPin = this.pinHandle.reachablePins().detect(function(ea) {
				return ea.morph.getGlobalPinPosition().dist(myPos) < 20 });
			console.log('other Pin ' + otherPin)
			if (otherPin) {
				return otherPin.morph.addMorph(this); // let him do the job
			}  
			// console.log("found other pin " + otherPinMorph)
			this.pinHandle.connectors.first().remove();
			this.remove();
		};
	}

	// PinPosition relative to the Fabrik Morph
	getPinPosition() {
		// FIXME should be cleaned up
		if (this.pinHandle.component instanceof FabrikComponent)
			return this.pinHandle.component.morph.localize(this.getGlobalPinPosition());
		if (this.pinHandle.component.fabrik)
			return this.pinHandle.component.fabrik.morph.localize(this.getGlobalPinPosition());
		// we have no fabrik so we are probably global
		return this.getGlobalPinPosition()
	}

	updatePosition(evt) {
		// console.log("update position" + this.getPosition());
		if (!this.pinHandle || !this.pinHandle.connectors) return;
		this.pinHandle.connectors.each(function(ea){ ea && ea.updateView() });
	}

	snapToPointInside(point) {
		var oldPos = point
		point = point.maxPt(pt(0,0));
		point = point.minPt(this.owner.shape.bounds().extent());
		this.setPosition(point.subPt(this.shape.bounds().extent().scaleBy(0.5)));
	}
	
	onMouseMove(evt) {
		if (evt.isAltDown() && evt.hand.mouseButtonPressed) {
			this.snapToPointInside(this.owner.localize(evt.mousePoint))
		}
	}

	// When PinHandleMorph is there, connect to its onMouseDown
	onMouseDown(evt) {
		logCall(arguments, this);
			
		if (evt.isAltDown()) return;
		
		// for not grabbing non-fake pins.
		if (evt.hand.topSubmorph() === this) evt.hand.showAsUngrabbed(this);
		
		if (this.pinHandle.isFakeHandle) return;
		
		if(!this.pinHandle.component.fabrik) {
			console.warn("Warning: " + this + " has no fabrik, so connections are not possible");
			return;
		}
		var fakePin = this.pinHandle.createFakePinHandle();


		if (!fakePin.morph) fakePin.buildView(); // Could already be triggered in connectTo in create....
		// change style to distinguish between real handles... put into an own method...?
		fakePin.morph.setFill(Color.red);
		fakePin.morph.setExtent(pt(10,10));
		
		evt.hand.addMorph(fakePin.morph);
		fakePin.morph.setPosition(pt(0,0));
		fakePin.morph.startSnapping(fakePin.reachablePins());
				
		this.updatePosition();
	}

	getHelpText() {
		var valueHelpText = this.pinHandle.getValue();
		if (valueHelpText == "[object Object]")
			valueHelpText = this.prettyPrintObject(valueHelpText);
		return this.pinHandle.getName() + "\n" + valueHelpText;
	}

	prettyPrintObject(obj) {
		var result = "{"
		Object.keys(obj).each(function(ea) {
			result = result + ea + ": " + (obj[ea]).toString().truncate(20) +"\n";
		});
		return result + "}"
	}

	acceptsDropping(evt) {
		return super.acceptsDropping(evt)
	}
	
	getFakeConnectorMorph() {
		return this.pinHandle.connectors.first().morph;
	}

	okToBeGrabbedBy() {
  
  }
	
	startSnapping(pinSnapPoints) {
		if (!this.pinHandle.component.fabrik && !(this.pinHandle.component instanceof FabrikComponent))
			return; // wihtout a fabrik we don't know what other points to snap
		this.snapper = new PointSnapper(this);
		//FIXME
		this.snapper.points = pinSnapPoints.collect(function(ea) { return ea.morph.owner.worldPoint(ea.morph.bounds().center()) });
		this.snapper.offset = pt(this.bounds().width * -0.5, this.bounds().height * -0.5);
		var self = this;
		this.snapper.formalModel.addObserver({onSnappedUpdate(snapped) {
			if (self.snapper.formalModel.getSnapped()) {
				self.setFill(Color.green);
				self.getFakeConnectorMorph().setBorderColor(Color.green);

			} else {
				self.setFill(Color.red); 
				self.getFakeConnectorMorph().setBorderColor(Color.red);
			}
		}})
	}
	
	adoptToBoundsChange(ownerPositionDelta, ownerExtentDelta, scaleDelta) {
		var center = this.getExtent().scaleBy(0.5);
		// console.log("center: " + center);
		var centerPos = this.getPosition().addPt(center);
		// console.log("centerPos: " + centerPos);
		var scaledPos = centerPos.scaleByPt(scaleDelta);
		// console.log("scaledPos: " + scaledPos);
		var newPos = scaledPos.subPt(center);
		// console.log("newPos: " + newPos);
		this.setPosition(newPos);
	}

	morphMenu(evt) { 
		// var menu = super(evt);
		var menu = new MenuMorph([], this);
		menu.addItem(["inspect value", function() {
			new SimpleInspector(this.pinHandle.getValue()).open();
		}.bind(this)]);
		menu.addItem(["remove", function() {
			this.pinHandle.component.removePin(this.pinHandle.getName());
		}.bind(this)]);
		return menu;
	}

}
	
/*
 * A graphical representation for pins
 */
class PinHandle extends Widget {
	

	initialize(component, pinName) {
	  this.isPinHandle =  true

    // TODO
	  // noShallowCopyProperties: Widget.prototype.noShallowCopyProperties.concat(['morph', 'connectors'])
		
		// Why isnt this handled at a central point?????
		this.formalModel = ComponentModel.newModel({Name: pinName, PinType: "regular"});
		this.ownModel(this.formalModel);

		//this.formalModel = Record.newPlainInstance({Name: pinName, Type: "regular"});
		//this.name = pinName;
		//this.type = "regular";
		this.component = component;
		this.connectors = [];			
	}

	copyFrom(copier, other) {
		// console.log("copy PinHandle from:" + other.id())
		super.copyFrom(copier, other);
			
		copier.smartCopyProperty("morph", this, other);
		copier.smartCopyProperty("connectors", this, other);
		return this; 
	}

	
	getName() {
		return this.formalModel.getName();
		//return this.name
	}
	
	isInputPin() {
		return this.formalModel.getPinType() === "input"   
		//return  this.type === "input";
	}
	
	becomeInputPin() {
		this.formalModel.setPinType("input");
		//this.type = "input" 
		if (this.morph) this.morph.setupInputMorphStyle();
	}

	buildView() {
		this.morph = new PinMorph();
		
		// perhaps move to morph
		this.morph.setPinHandle(this);
		if (this.isInputPin())
			this.morph.setupInputMorphStyle();
		return this.morph;
	}
	
	deleteView() {
		
	}
	
	setValue(value) {
		this.component.formalModel["set" + this.getName()](value);
	}
	
	getValue() {
		return this.component.formalModel["get" + this.getName()]();
	}

	reachablePins() {
		// this method determines all pins which are "physically" reachable, this means
		// the own pins, the pins of the outer FabrikComponent and pins of the own components
		// (when this.component is a fabrikCompoment)
		// filter all through isConnectableTo()
		
		//FIXME
		// ----------
		var ownPins = this.component.pinHandles;
		// ----------
		var ownerPins = this.component.fabrik ?
			this.component.fabrik.components.inject(this.component.fabrik.pinHandles, function(pins, ea) {
				return ea == this.component ? pins : pins.concat(ea.pinHandles) }) :
			[];
		ownerPins = this.component.fabrik && this.component.fabrik.panel && this.component.fabrik.panel.isCollapsed ?
					[] :
					ownerPins;
		// ----------
		var childPins = this.component instanceof FabrikComponent ?
			this.component.components.inject([], function(pins, ea) { return pins.concat(ea.pinHandles) }) :
			[];
		childPins = this.component && this.component.panel && this.component.panel.isCollapsed ?
					[] :
					childPins;
						
		var allPins = ownPins.concat(ownerPins).concat(childPins);
		return allPins.uniq().select(function(ea) { return this.isConnectableTo(ea) }, this);
	}
	
	isConnectableTo(otherPin) {
		if (otherPin === this || otherPin === this.originPin) return false;
		if (otherPin.isFakeHandle && this === otherPin.originPin) return true;
		if (this.component instanceof FabrikComponent && this.component.components.include(otherPin.component)) return true;
		if (otherPin.component instanceof FabrikComponent && otherPin.component.components.include(this.component)) return true;
		if (this.component.fabrik === otherPin.component.fabrik) return true;
		return false;
	}
	
	connectTo(otherPinHandle) {

		if (!this.isConnectableTo(otherPinHandle)) {
			console.warn('tried to connect pins but a connection is not allowed')
			return;
		}
		
		// force an update, even if there is already a connection
		if (!otherPinHandle.isFakeHandle && otherPinHandle.getValue() != this.getValue())
			otherPinHandle.setValue(this.getValue());
					
		var existingConnection = this.detectConnectorWith(otherPinHandle);
		if (existingConnection) {
			// console.log('There exists already a connection from ' + this.getName() + ' to ' + otherPinHandle.getName());
			return existingConnection;
		};
				
		// if there exists a connection in the other direction make it two way
		var connector = otherPinHandle.detectConnectorWith(this);
		if (connector) {
			connector.beBidirectional();
			return connector;
		};
		
		// No connection exists; make a new one
		connector = new PinConnector(this, otherPinHandle);
		this.connectors.push(connector);
		otherPinHandle.connectors.push(connector);
		
		
		//FIXME
		if (this.component instanceof FabrikComponent && this.component === otherPinHandle.component)
			this.component.pluginConnector(connector);
		else if (this.component instanceof FabrikComponent && this.component.fabrik === otherPinHandle.component)
			otherPinHandle.component.pluginConnector(connector);
		else if (this.component instanceof FabrikComponent && this.component === otherPinHandle.component.fabrik)
			this.component.pluginConnector(connector);
		else
			this.component.fabrik && this.component.fabrik.pluginConnector(connector);
		
					
		return connector;
	}
	
	connectBidirectionalTo(otherPinHandle) {
		this.connectTo(otherPinHandle);
		return otherPinHandle.connectTo(this);
	}
	
	isConnectedTo(otherPin) {
		return this.connectors.any(function(ea) {
			return ea.toPin == otherPin || (ea.fromPin == otherPin && ea.isBidirectional);
		});
	}
	
	detectConnectorWith(otherPin) {
		return this.connectors.detect(function(ea) {
			return ea && ea.toPin == otherPin;
		});
	}

	// Not used right now! Instead PinMorph.addMorph has all the logic! Refactor!
	connectFromFakeHandle(fakePin) {
		// FIXME: remove fakePin connection or replace fakePin with this!
		var con = fakePin.originPin.detectConnectorWith(fakePin);
		if (!con) throw new Error('No connector encountered when removing fakpin connection');
		con.remove();
		return fakePin.originPin.connectTo(this);
	}

	createFakePinHandle() {
		var fakePin = new PinHandle();
		fakePin.isFakeHandle = true;
		fakePin.originPin = this;
		fakePin.component = this.component;
		fakePin.buildView();
		// in PinMorph.onMouseDown() fabrik.connectPins is send again after the connector morph was created
		// for adding the connector morph to the update position logic. This is redundant, how to remove this
		// without mixing model and view logic?
		this.connectTo(fakePin);
		return fakePin;
	}
	
	remove() {
		this.connectors.each(function(ea) { ea.remove() });
		if (this.morph) this.morph.remove();
	}
	
}

class ComponentModel {
	static newModel(optSpec) {
		// FIXME Why isnt this handled at a central point?????
		return Record.newNodeInstance(optSpec || {});
	}
}

/*
 *  *** Connector Morph ***
 * 
 *  Merging the Connector Morph from the Widgets package back is a litte bit tricky,
 *  because the behavior is different.
 *  This Connector connects two little Handles/Pins/Ports that belong to a bigger Morph/Component.
 *  The ConnectorMorph in Widgets connects two morphs directly.
 *  TODO: Merge them, or give them a common super class.
 */ 
export class ConnectorMorph extends Morph {
	
	// isConnectorMorph: true,
	// noShallowCopyProperties: Morph.prototype.noShallowCopyProperties.concat(['pinConnector'])

	initialize(verts, lineWidth, lineColor, pinConnector) {
		if (!verts) verts = [pt(0,0), pt(100,100)];
		if (!lineWidth) lineWidth = 1;  
		if (!lineColor) lineColor = Color.red;   
		
		this.pinConnector = pinConnector;
		
		var vertices = verts.invoke('subPt', verts[0]);
		// TODO super(new lively.scene.Polyline(vertices));
		this.applyStyle({borderWidth: lineWidth, borderColor: lineColor, fill: null});
		
		this.customizeShapeBehavior();		
		this.lineColor = lineColor;
		
		this.closeAllToDnD();	
		
		this.arrowHead = new ArrowHeadMorph(1, lineColor, lineColor);
		this.addMorph(this.arrowHead);
		this.setupArrowHeadUpdating();
		this.orthogonalLayout = true;

		this.midPoints = [];	// to be implemented
	}

	/* Serialization */
	onDeserialize() {
		this.setupArrowHeadUpdating();
		this.updateArrow();
	}

	copyFrom(copier, other) {
		super.copyFrom(copier, other);
		copier.smartCopyProperty("pinConnector", this, other);
		return this; 
	}

	handlesMouseDown() { return true }
	
	/* Arrow */
	setupArrowHeadUpdating() {
		var self = this;
		this.shape.setVertices = this.shape.setVertices.wrap(function(proceed) {
			var args = $A(arguments); args.shift(); 
			proceed.apply(this, args);
			self.updateArrow();
		});
	}
	
	updateArrow() {
		var v = this.shape.vertices();
		var toPos = v[v.length-1];
		var fromPos = v[v.length-2];
		this.arrowHead.pointFromTo(fromPos, toPos);
		if (this.pinConnector && this.pinConnector.isBidirectional) {
			if (!this.arrowHeadBack) {
				this.arrowHeadBack = new ArrowHeadMorph(1, this.lineColor, this.lineColor);
				this.addMorph(this.arrowHeadBack);
				this.closeAllToDnD();
			};
			toPos = v[0];
			fromPos = v[1];		
			this.arrowHeadBack.pointFromTo(fromPos, toPos);
		};
	}

	/* Accessors */
	/* Handles are the Pins or Ports where the line connects */
	setStartHandle(pinHandle) {
		this.startHandle = pinHandle;
	}

	getStartHandle() {
		return this.startHandle;
	}

	setEndHandle(pinHandle) {
		this.endHandle = pinHandle;
	}

	getEndHandle() {
		return this.endHandle;
	}

	/* Morphs are the big entities that should be connected */
	getStartMorph() {
		return this.getStartHandle().owner
	}
	
	getEndMorph() { 
		return this.getEndHandle().owner 
	}

	/* UI Customization */
	
	// I don't know who sends this, but by intercepting here I can stop him.... drag me
	// logStack shows no meaningfull results here
	translateBy(delta) {
		//logStack();
		//super(delta)
	}
	
	remove(){
		super.remove();
		if (!this.fabrik) console.log('no fabrik!!!');
		if (this.fabrik) this.fabrik.removeConnector(this);
	}

	fullContainsWorldPoint(p) {
		//console.log(indentForDepth(indentLevel) + "check fullContainsWorldPoint" + this);
		if (!this.startHandle || !this.endHandle)
			return false;
		// to ensure correct dnd behavior when connector is beneath a pinMorph in hand
		if (this.startHandle.fullContainsWorldPoint(p) || this.endHandle.fullContainsWorldPoint(p))
			return false;
		return super.fullContainsWorldPoint(p);
	}

	/* Control Point UI */

	customizeShapeBehavior() {
		
		this.shape.controlPointProximity = 10;
		
		// disable first and last control point of polygone 
		this.shape.partNameNear = this.shape.partNameNear.wrap(function(proceed, p) { 
			var part = proceed(p);
			if (part == 0 || part == (this.vertices().length - 1)) return null
			return part 
		});
	
	}

	makeHandle(position, partName, evt) {
		// change behavior of the control point handles 
		// console.log("make handle " + position + ' partName ' + partName );
		var verts = this.shape.vertices();
		var handleMorph = super.makeHandle(position, partName, evt);

		var self = this;

		handleMorph.onMouseDown = handleMorph.onMouseDown.wrap(function(proceed, evt) {
			proceed(evt); 
			if (evt.isCommandKey())
				self.pinConnector.remove() // remove connector
		});
		handleMorph.onMouseMove = handleMorph.onMouseMove.wrap(function(proceed, evt) {
			proceed(evt); 
		});				
		return handleMorph;
	}
	
	morphMenu(evt) {
		var menu = super.morphMenu(evt); 
		var self = this;	
		menu.addItem(["cut", this.pinConnector, "remove"], 0);
		if (!this.orthogonalLayout) {
			menu.addItem(["orthogonal [ ]", function() {
				self.orthogonalLayout = true;
				self.layoutOrthogonal();
			}], 1)
		} else {
			menu.addItem(["orthogonal [X]", function() {
				self.orthogonalLayout = false;
			}], 0)
		};
		return menu
	}
	
	/* Control Points */

	setStartPoint(point) {
		if (!point) 
			throw {msg: "failed setStartPoint " + point};
		var v = this.shape.vertices();
		v[0] = point;
		this.setVertices(v); 
	}
	
	setEndPoint(point) {
		if (!point) 
			throw {msg: "failed setEndPoint " + point}; 
		var v = this.shape.vertices();
		v[v.length-1] = point;
		this.setVertices(v); 
	}
	
	getStartPoint() {
		return this.shape.vertices().first();
	}
	
	getEndPoint() {
		return this.shape.vertices().last();
	}
	
	getControlPoints() {
		var points = [];
		points.push(this.getStartPoint());
		points.push(this.getEndPoint());
		return points
	}
	

	/* Updating */
	
	updateView(varname, source) {
		// console.log("update View for connector");
	 	if (!this.owner) return;
		if (this.startHandle) this.setStartPoint(this.localize(this.startHandle.getGlobalPinPosition()));
		if (this.endHandle) this.setEndPoint(this.localize(this.endHandle.getGlobalPinPosition()));
		this.layoutOrthogonal();
	}

	reshape( partName, newPoint, lastCall) {
		// console.log("reshape")
		super.reshape(partName, newPoint, lastCall);
		this.layoutOrthogonal();
	}

	
	layoutOrthogonal() {
		if (this.orthogonalLayout) {
			var p = this.getControlPoints();
			var v = this.shape.vertices();
			if (p.length == 2 ) {
				var mid = p[0].midPt(p[1]);
				v = [];
				v.push(p[0]) 
				if (this.isStartPointHorizontal()) { 
					if (!this.isEndPointHorizontal()) {
						v.push(pt(p[1].x, p[0].y));
					} else {
						v.push(pt(mid.x, p[0].y));
						v.push(pt(mid.x, p[1].y));
					}
				} else {
					if (this.isEndPointHorizontal()) {
						v.push(pt(p[0].x, p[1].y));
					} else {
						v.push(pt(p[0].x, mid.y));
						v.push(pt(p[1].x, mid.y));
					}
				}
				v.push(p[1]);
			};
			// the other cases are left to the reader ;-) ...
			this.setVertices(v);
		};
	}

	enableOrthogonalLayout() {
		this.orthogonalLayout = true;
	}
	
	computeNormalizeXYRatio(bounds, position) {
		// normalized x / y ratio as heuristic for how to connectors should leave.. 
		var d = bounds.center().subPt(position);
		return Math.abs(d.x / bounds.width) > Math.abs(d.y / bounds.height)	
	}

	computeNormalizeXYRatioFromMorph(morph) {
		if(!morph.owner) return true;
		return this.computeNormalizeXYRatio(morph.owner.shape.bounds(), morph.getPosition())
	}
	
	isStartPointHorizontal() {
		return this.computeNormalizeXYRatioFromMorph(this.getStartHandle());
	}
	
	isEndPointHorizontal() {
		return this.computeNormalizeXYRatioFromMorph(this.getEndHandle());
	}

}


class PinConnector extends Widget {

 		
	initialize(fromPinHandle, toPinHandle) {
	  // noShallowCopyProperties: Widget.prototype.noShallowCopyProperties.concat(['morph']),
		super.initialize();
		
		
    this.fromPin = fromPinHandle; 
		this.toPin = toPinHandle;		     
		this.isBidirectional = false;
		
		if (toPinHandle.isFakeHandle) return;
		this.observeFromTo(fromPinHandle, toPinHandle);
			
		// console.log("PinConnector says: Connected pin " + fromPinHandle.getName() + " to pin " + toPinHandle.getName());
	}
  
	observeFromTo(fromPinHandle, toPinHandle) {
		// FIXME: Relays inbetween? Serialization?
		var fromModel = fromPinHandle.component.getModel();
		var toModel = toPinHandle.component.getModel();
		// console.log("observeFromModel " + fromModel + " -> " + toModel);

		// implicit assertion: pinHandle name equals field name of model
		var spec = {};
		spec[fromPinHandle.getName()] = "=set" + toPinHandle.getName();
		fromModel.addObserver(toModel, spec); 
   		// console.log("DEBUG: " + fromModel[fromPinHandle.getName()+"$observers"] )
	}
  
	// just for make things work ...
	buildView() {
		this.morph = new lively.Fabrik.ConnectorMorph(null, 4, Color.blue, this);
		if (!this.fromPin.morph) throw new Error("fromPin.morph is nil");
		if (!this.toPin.morph) throw new Error("toPin.morph is nil");
		this.morph.setStartHandle(this.fromPin.morph); // handle is the handle or the morph?
		this.morph.setEndHandle(this.toPin.morph);
		this.morph.ownerWidget = this;
		this.morph.connector = this; // for debugging... of course...
		return this.morph;
	}
	
	deleteView() {
		
	}

	onDeserialize() {
		//super();
		// console.log("dersialize connector from" + this.fromPin.id() + " to " + this.toPin.id())  
		this.observeFromTo(this.fromPin, this.toPin);
		if (this.isBidirectional) {
			this.observeFromTo(this.toPin, this.fromPin);
		}
	}

	copyFrom(copier, other) {
		// console.log("COPY CONNECTOR")
		super.copyFrom(copier, other);
		
		//copier.smartCopyProperty("morph", this, other);

		// console.log("COPY TO")		
		copier.shallowCopyProperty("toPin", this, other);	
		// console.log("toPin: " + other.toPin);
		// console.log("COPY FROM")		
		copier.shallowCopyProperty("fromPin", this, other);
		// console.log("fromPin: " + other.fromPin);
		
		return this; 
	}	

	// FIXME do we need this anymore? Can be directly called from pinMorph?... ?
	updateView(varname, source) {
	  	if (!this.fromPin || !this.toPin) return; // fragile state during copying
		if (!this.fromPin.morph || !this.toPin.morph) return; // nothing to update from.... 
		if (!this.morph) this.buildView();
		this.morph.updateView(varname, source);
	}
	
	remove() {
		// FIXME: View!!!
		if (this.morph) {
			// console.log('remove con');
			this.morph.remove();
		}
	
		// should be removed! Fabrik should not know about connectors!
		if (this.fabrik) this.fabrik.removeConnector(this);

		// FIXME move to PionHandle
		var self = this;
	   	//  console.log("remove con from " + this.fromPin.getName() + " to: " + this.toPin.getName());
		this.fromPin.connectors = this.fromPin.connectors.reject(function (ea) { return ea === self}, this);
		this.toPin.connectors = this.toPin.connectors.reject(function (ea) { return ea === self}, this);
		
		this.fromPin.component.getModel().removeObserver(this.toPin.component.getModel(), this.fromPin.getName());
		if (this.isBidirectional)
			this.toPin.component.getModel().removeObserver(this.fromPin.component.getModel(), this.toPin.getName());
	}
	
	beBidirectional() {
		this.isBidirectional = true;
		this.observeFromTo(this.toPin, this.fromPin);		
		this.updateView();
	}
}


// orignal: BoxMorph
class ComponentMorph extends Morph {
	

	/* initialization */

	initialize(bounds) {
	
    // padding: Rectangle.inset(7),
	  // defaultExtent: pt(180,100),
 	  // noShallowCopyProperties: Morph.prototype.noShallowCopyProperties.concat(['halos', 'component', 'ownerWidget', 'formalModel'])

    
    bounds = bounds || this.defaultExtent.extentAsRectangle();
		super.initialize(bounds);
		this.closeDnD();
			
		this.linkToStyles(['fabrik']);
		this.shapeRoundEdgesBy(8);
		// this.setFillOpacity(0.7);
		// this.setStrokeOpacity(0.7);
		
		this.priorExtent = pt(0,0);
		this.priorPosition = pt(0,0);
				
		return this;
	}
	
	setComponent(component) {
		this.component = component;
		this.formalModel = component.getModel()
		this.setupWithComponent();
		this.ownerWidget = component; // for serialization
	}
	
	setupWithComponent() {
		this.component.setupHandles();
		this.setupHalos();
		this.updateHaloItemPositions();		
	}

	/* Copy & Serialization */

	onDeserialize() {
		this.setupHalos();
		this.setupMousOverWrappingForHalos(this);
	}

	copyFrom(copier, other) {
		copier.addMapping(other.id(), this);
		
		// copy model first, because the view references the model
		copier.smartCopyProperty("component", this, other);	
		copier.smartCopyProperty("formalModel", this, other);
			
		super.copyFrom(copier, other);

		copier.smartCopyProperty("ownerWidget", this, other);	
		
			
		return this; 
	}	

	/* Tests */
	
	isFramed() { return false}
	
	isUserMode() {
		return (this.owner instanceof FabrikMorph) && this.owner.isCollapsed
	}
	
	/* Accessors */

	allPinMorphs() {
	   return this.submorphs.select(function(ea){return ea.isPinMorph})
	}
	
	allConnectors() {
		return this.allPinMorphs().inject([], function(all, ea){
			return all.concat(ea.pinHandle.connectors)
		})
	}
		
	/* basic */

	changed(){
		super.changed();
		if (!this.component) return;
		// update the position of the pins
		var newPos = this.getGlobalTransform().transformPoint(pt(0,0));
		if ((!this.pvtOldPosition || !this.pvtOldPosition.eqPt(newPos)) && this.component.pinHandles) {
			this.pvtOldPosition = newPos;
			this.component.pinHandles.each(function(ea) { ea.morph && ea.morph.updatePosition() });
		};
	}

	remove(){
		super.remove();
		this.allConnectors().each(function(ea){ ea.remove() });
		this.component.remove();
	}

	/* context menu */

	morphMenu(evt) { 
		var menu = super.morphMenu(evt);
		var self = this;
		menu.addItem(["add pin named...", function() { 
			WorldMorph.current().prompt('Name for Pin?', function(name) {
		     self.component.addFieldAndPinHandle(name) }, 'Test')}]
	     );
		return menu;
	}

	// addMorph and layout logic
	addMorph(morph, accessorname) {
	
		if (morph.isPinMorph) 
			this.addMorphFront(morph)
		else 
			this.addMorphBack(morph);

		morph.closeDnD();
		morph.closeAllToDnD();
		
		// FIXME cleanup
		if (this[accessorname]) throw new Error("Added two times same type of morph. See add methods");
		if (accessorname) this[accessorname] = morph;

		this.setupMousOverWrappingForHalos(morph);
		
		return morph;
	}

	setupMousOverWrappingForHalos(morph) {
		// Wrap mouse over to make Halos show everytime
		// FIXME this is not serializable
		var self = this;
		var wrapMouseOver = function() {
			this.onMouseOver = this.onMouseOver.wrap(function(proceed, evt) {
				proceed(evt); self.showHalos();
			});
		};
		wrapMouseOver.apply(morph);
		morph.withAllSubmorphsDo(wrapMouseOver);		
	}
	
	/* Content Creation Helper  */

	getBoundsAndShrinkIfNecessary(minHeight) {
		// assume that we have all the space
		var topLeft = pt(this.padding.left(), this.padding.top());
		var bottomRight = this.getExtent().subPt(pt(this.padding.right(), this.padding.bottom()));
		// see if other morphs are there and if yes shrink them so that minHeight fits into this
		var otherRelevantMorphs = this.submorphs.reject(function(ea) { return ea.constructor === PinMorph});
		if (otherRelevantMorphs.length > 0) {
			this.adoptSubmorphsToNewExtent(this.getPosition(), this.getExtent(),
			this.getPosition(), this.getExtent().subPt(pt(0, minHeight)));
			// new topLeft so that we can put morph below the last one. let inset/2 space between morphs
			topLeft = topLeft.addPt(pt(0, bottomRight.y - minHeight - this.padding.top() / 2));
		};
		return rect(topLeft, bottomRight);
	}
	
	// CLEANUp!!!!!!!!!!!!!!!
	addTextPane() {
		var minHeight = 70;
		var morph = newTextPane(this.getBoundsAndShrinkIfNecessary(minHeight), "------");
		// morph.disableScrollBars();

		morph.adoptToBoundsLayout = 'layoutRelativeExtent';
		// FIXME closure assignment does not serialize
		morph.innerMorph().saveContents = morph.innerMorph().saveContents.wrap(function(proceed, contentString) {	
			this.setText(contentString, true /*force new value*/);
		});
		var spec = {fontSize: 12, borderWidth: 0, /*opacity: 0.9,*/ borderRadius: 3};
		morph.submorphs[0].applyStyle(spec); 
		spec.fill = null;
		morph.innerMorph().applyStyle(spec); 
		spec.borderWidth = 1;
		morph.applyStyle(spec); 

		morph.openForDragAndDrop = false;
		morph.innerMorph().openForDragAndDrop = false;
		morph.okToBeGrabbedBy = this.okToBeGrabbedBy;
		morph.innerMorph().okToBeGrabbedBy = this.okToBeGrabbedBy;
		
		morph.relayMouseEvents(morph.innerMorph(), {onMouseDown: "onMouseDown", onMouseMove: "onMouseMove", onMouseUp: "onMouseUp"});
		
		return this.addMorph(morph, 'text');
	}

	addLabel(label) {
		if (!label) label = "------";
		var minHeight = 15;
		var morph = new TextMorph(this.getBoundsAndShrinkIfNecessary(minHeight),label).beLabel();
		morph.adoptToBoundsLayout = 'layoutRelativeExtent';
		return this.addMorph(morph, 'label');
	}
	
	addListPane() {
		var minHeight = 80;
		var morph = newRealListPane(this.getBoundsAndShrinkIfNecessary(minHeight));
		morph.adoptToBoundsLayout = 'layoutRelativeExtentAndPosition';
		var spec = {fontSize: 12, borderWidth: 0, /*opacity: 0.75,*/ borderRadius: 3};
		morph.innerMorph().applyStyle(spec); 
		morph.linkToStyles(['fabrik_listPane']);
		spec.fill = null;
		morph.submorphs[0].applyStyle(spec);
		morph.submorphs[1].applyStyle(spec); 
		spec.borderWidth = 1;
		morph.applyStyle(spec);
		
		morph.openForDragAndDrop = false;
		morph.innerMorph().openForDragAndDrop = false;
		morph.okToBeGrabbedBy = this.okToBeGrabbedBy;
		morph.innerMorph().okToBeGrabbedBy = this.okToBeGrabbedBy;
		
		return this.addMorph(morph, 'textList');
	}
	
	addLabeledText(label) {
		var minHeight = 80;
		var morph = new LabeledTextMorph(this.getBoundsAndShrinkIfNecessary(minHeight), label , '-----');
		// FIXME closure assignment does not serialize
		morph.reshape = morph.reshape.wrap(function(proceed, partName, newPoint, lastCall) {
			try {
				return proceed(partName, newPoint, lastCall);
			} finally {
				var owner = this.owner;
				if (owner.getExtent().subPt(pt(owner.padding.topLeft())).y < this.bounds().extent().y) {
					owner.setExtent(this.getExtent().addPt(owner.padding.topLeft()));
				}
			}
		});
		
		var spec = {borderWidth: 0, /*opacity: 0.9,*/ borderRadius: 3};
		morph.applyStyle(spec);		
		
		morph.openForDragAndDrop = false;
		morph.innerMorph().openForDragAndDrop = false;
		morph.okToBeGrabbedBy = this.okToBeGrabbedBy;
		morph.innerMorph().okToBeGrabbedBy = this.okToBeGrabbedBy;
		
		return this.addMorph(morph, 'labeledText');
	}
	

	// not used any more besides the test?
	addButton(buttonLabel) {
		var height = 22;
		var morph = new ButtonMorph(this.getBoundsAndShrinkIfNecessary(height));
		// FIXME closure assignment does not serialize
		morph.adoptToBoundsChange = function(ownerPositionDelta, ownerExtentDelta) {
			morph.setPosition(morph.getPosition().addPt(pt(0, ownerExtentDelta.y)));
			morph.setExtent(morph.getExtent().addPt(pt(ownerExtentDelta.x, 0)));
			morph.setPosition(morph.getPosition().addPt(ownerPositionDelta));
		};
		morph.setLabel(buttonLabel);
		return this.addMorph(morph, 'button');
	}

	/* resize */
	
	minExtent() { return pt(50,25) }
	
	/* reshape changes the bounds of the morph and its shape but makes it not smaller than minExtent()
	 * submorphs can react to bounds shape by implementing adoptSubmorphsToNewExtent
	 * FIXME what about adoptToBoundsChange???
	 */
	reshape(partName, newPoint, lastCall) {
		var insetPt = this.padding.topLeft();
		var priorExtent = this.getExtent().subPt(insetPt);
		var priorPosition = this.getPosition();
		var deltaPos = pt(0,0);
		var morph = this;
		
		// overwrite reshape ... move stuff there or in Morph/WindowMorph? Behavior should be correct for most morphs...
		// FIXME move as much as possible from shape.reshape into this!
	 	this.shape.reshape = function(partName, newPoint, lastCall) {
			var bnds = this.bounds();
			var userRect = this.bounds().withPartNamed(partName, newPoint);
			// do not flip the bounds
			if (!userRect.partNamed(partName).eqPt(newPoint)) return null;
			deltaPos = userRect.topLeft(); // vector by which the morph is moved
			var minExtent = morph.minExtent();
			// adopt deltaPos and userRect so that newBounds has ar least minExtent
			if (userRect.extent().x <= minExtent.x) {
				if (deltaPos.x != 0)
					deltaPos = deltaPos.withX(deltaPos.x - (minExtent.x - userRect.extent().x));
				userRect = userRect.withWidth(minExtent.x);
			};
			if (userRect.extent().y <= minExtent.y) {
				if (deltaPos.y != 0)
					deltaPos = deltaPos.withY(deltaPos.y - (minExtent.y - userRect.extent().y));
				userRect = userRect.withHeight(minExtent.y);
			};
			var newBounds = userRect.extent().extentAsRectangle(); // newBounds has position (0,0)
			this.setBounds(newBounds);
		}.bind(this.shape);
		
		var retval = super.reshape(partName, newPoint, lastCall);
		this.adoptSubmorphsToNewExtent(priorPosition,priorExtent, this.getPosition(), this.getExtent().subPt(insetPt))
		this.setPosition(this.getPosition().addPt(deltaPos));
		return retval;
	}
	
	setExtent(newExt) {
		this.adoptSubmorphsToNewExtent(this.getPosition(), this.getExtent(), this.getPosition(), newExt);
		super.setExtent(newExt);
	}

	adjustForNewBounds(){
		this.fullBounds = null;
		super.adjustForNewBounds();
	}

	/* rk's do it yourself layout algorithm */

	adoptSubmorphsToNewExtent(priorPosition, priorExtent, newPosition, newExtent) {
		var positionDelta = newPosition.subPt(priorPosition);
		var extentDelta = newExtent.subPt(priorExtent);
		var scaleDelta = newExtent.scaleByPt(priorExtent.invertedSafely());
		this.submorphs.select(function(ea) { return ea.adoptToBoundsChange || ea.adoptToBoundsLayout}).each(function(morph) {
			// console.log("adopting to bounds change: " + morph);
			// test for not serializable method or closure
			if (morph.adoptToBoundsChange) { 
				morph.adoptToBoundsChange(positionDelta, extentDelta, scaleDelta, rect(newPosition, newExtent))
			} else {
				// look for layout function in a more declarative style
				var func = AdoptToBoundsChangeFunctions.prototype[morph.adoptToBoundsLayout];
				if(!func) {
					throw new Error("AdoptToBoundsChangeFunctions Error: could not find layout function: " + morph.adoptToBoundsLayout)
				};
				func.apply(this, [morph, positionDelta, extentDelta, scaleDelta, rect(newPosition, newExtent)]);
			}
		});
	}

	/* Menu */

	setupMenu() {
		this.menuButton = new ButtonMorph(new Rectangle(0, -20, 40, 20));
		this.menuButton.setLabel("Menu");
		this.menuButton.setFill(Color.blue);
		// this.menuButton.setFillOpacity(0.5);
		this.halos.addMorph(this.menuButton);
		this.menuButton.connectModel({model: this, setValue: "openComponentMenu"});   
	}
	
	getMenuItems() {
		return [["say Hello ", function(){ alert("Hello")}]]
	}
	
	openComponentMenu(buttonDown) {
		if (!buttonDown) return;
		if (this.componentMenu)
			this.componentMenu.remove();
		this.componentMenu = new MenuMorph(this.getMenuItems(), this);
		this.componentMenu.openIn(this, this.menuButton.getPosition());
	}

	/* Halos */

	setupHalos() {
		this.halos = Morph.makeRectangle(0, 0, 100, 100);
		this.halos.ignoreWhenCopying = true;
		// to be replace by some general layout mechanism ... aber kloar
		var self = this;
		this.halos.setExtent(this.getExtent());
		this.halos.adoptToBoundsChange = function(ownerPositionDelta, ownerExtentDelta) {
			self.halos.setExtent(self.halos.getExtent().addPt(ownerExtentDelta));
			self.updateHaloItemPositions();
		};
		this.halos.closeDnD();
		this.halos.setFill(null);
		this.halos.setBorderWidth(0);
		this.halos.ignoreEvents();
		this.setupHaloItems();
	}
	
	setupHaloItems() {
		this.closeHalo = this.addHaloItem("X", new Rectangle(0, 0, 18, 20), 
			{relativePosition: pt(1,0), positionOffset: pt(0, -20)},
			{fill: Color.red/*, fillOpacity: 0.5*/});
		this.closeHalo.connectModel(Relay.newInstance({Value: "=removeMe"}, {removeMe() {this.remove()}}));
		this.addGrabHalo({relativePosition: pt(1,0), positionOffset: pt(-45, -20)})
	}
	
	updateHaloItemPositions() {
		// select can be removed? no one shpuld be able to add foreign morphs
		this.halos.submorphs.select(function(ea){return ea.layoutFrame}).each(function(ea){
			var newPos = ea.layoutFrame.relativePosition.scaleByPt(this.getExtent());
			newPos = newPos.addPt(ea.layoutFrame.positionOffset);
			ea.setPosition(newPos);
		}, this)
		//this.closeHalo.setPosition(pt(this.getExtent().x - 0, -20));
	}
	
	showHalos() {
		if (!this.halos)
			this.setupHalos();
		if (!this.isUserMode()) {
			if (this.handObserver) return; // we are not finished yet
			var self = this;
			this.addMorph(this.halos);
			this.updateHaloItemPositions();
			this.handObserver = new HandPositionObserver(function(value) {
				if (!self.owner || !self.bounds().expandBy(10).containsPoint(self.owner.localize(value))) {
					self.removeMorph(self.halos);
					self.adjustForNewBounds();
					this.stop();
					self.handObserver = null;
				};
			});
			this.handObserver.start();
		}		
	}
	
	addHaloItem(label, bounds, layoutFrame, style) {
		var button = new ButtonMorph(bounds ||  new Rectangle(0, -20, 40, 20));
		button.setLabel(label || "----");
		button.applyStyle(style || {});
		button.setFillOpacity(0.5);
		button.layoutFrame = layoutFrame || {relativePosition: pt(0,0), positionOffset: pt(0,0)};
		this.halos.addMorph(button);
		return button;
	}
	
	addGrabHalo(positionSpec) {
		var grabHalo = this.addHaloItem("grab",  new Rectangle(0,0,45,20),
			positionSpec, {fill: Color.green/*, fillOpacity: 0.5*/});

		var grabFunction = function(value) {
			if (!value) return;

			
			if (this.isFramed()) this.unframed();
			this.owner.removeMorph(this);
			this.owner = null;
			
			var hand = WorldMorph.current().hands.first(); //FIXME -- get the click event?
			hand.addMorph(this);
			this.setPosition(pt(0,0));
			this.moveBy(grabHalo.getPosition().negated().subPt(grabHalo.getExtent().scaleBy(0.5)));
		}.bind(this);
		grabHalo.connectModel(Relay.newInstance({Value: '=grabbed'}, {grabbed: grabFunction}));
	}

	/* Events */

	handlesMouseDown() { return true }
	takesKeyboardFocus() { return true }	 
	okToBeGrabbedBy(evt) {
		return this; 
	}
	
	onMouseOver() {
		this.showHalos();
	}
	
	onMouseDown(evt) {
		// console.log('making selection');
		super.onMouseDown(evt)
		evt.hand.setKeyboardFocus(this);
		return true;
	}

	onKeyPress(evt) {
		// console.log("onKeyPress " + this + " ---  " + evt )

		if (evt.letItFallThrough != true && ClipboardHack.tryClipboardAction(evt, this)) {
			evt.letItFallThrough = true; // let the other copy shortcut handler know that evt is handled
			return;
		};
		
		return false;
	}
	
	/* Actions */

	doCopy() {
		TextMorph.clipboardString = this.component.copySelectionAsXMLString(); 
	}
	
	doPaste() {

	}
	
	doCut() {
		
	}

	copyToHand( hand) {
		
		var componentCopy = this.component.copy(new Copier());
		var copy = componentCopy.panel;

				
		// var copy = this.copy(new Copier());
		// console.log('copied %s', copy);
		copy.owner = null; // so following addMorph will just leave the tfm alone
		this.owner.addMorph(copy); // set up owner as the original parent so that...		

		hand.addMorph(copy);  // ... it will be properly transformed by this addMorph()
		hand.showAsGrabbed(copy);
		// copy.withAllSubmorphsDo(function() { this.startStepping(null); }, null);
		
		
		
	}
}

/*
 * The basic component
 *
 *  Componet - NodeRecord - ComponentMorph
 *   the relation beteween component and component morph is implicitly established via the shared formalModel
 */
class Component extends Widget {
	

	initialize(){
	  // morphClass: ComponentMorph
	  // noShallowCopyProperties: ['id', 'rawNode',  'formalModel', 'actualModel', 'pinHandles', 'panel']

    super.initialize();
		this.formalModel = ComponentModel.newModel({Name: "NoName"});
		this.formalModel.setName("Abstract Component");
		this.ownModel(this.formalModel);
				
		this.pinHandles = [];
	}
	
	getFieldNames() {
		return Object.keys(this.formalModel.definition)
	}
	
	getSmartCopyProperties() {
		return this.smartCopyProperties
	}
	
	createFieldAccessors() {
		this.getFieldNames().each(function(ea) {
			this.pvtCreateAccessorsForField(ea);
		}, this);
	}
	
	onDeserialize() {
		this.createFieldAccessors();
	}
	
	copySelectionAsXMLString() {
		var clipboardCopier = new ClipboardCopier();
		var component = this;
		var copier = new Copier();
		var componentCopy = component.copy(copier);
		copier.finish();
		var copy = componentCopy.panel;		
		var doc = clipboardCopier.createBaseDocument();
		var worldNode = doc.childNodes[0].childNodes[0];
		worldNode.appendChild(copy.rawNode);
		var exporter = new Exporter(copy);
		// todo: what about the SystemDictionary
		var helpers = exporter.extendForSerialization();
		var result = Exporter.stringify(copy.rawNode);
		exporter.removeHelperNodes(helpers);
		return result
	}
	
	
	// inspired from Morph.copyFrom
	copyFrom(copier, other) {
		// console.log("COPY COMPONENT")
		super.copyFrom(copier, other);
		
		copier.smartCopyProperty("panel", this, other);
		copier.smartCopyProperty("pinHandles", this, other);

		copier.shallowCopyProperties(this, other);
		this.createFieldAccessors();

		// if (this.panel) this.panel.owner = null;
		// this.fabrik = null;

		return this; 
	}
	
	buildView(optExtent) {
		var bounds = optExtent && optExtent.extentAsRectangle();
		this.panel = new this.morphClass(bounds);
		this.morph = this.panel;
		this.panel.setComponent(this);
	   
		// this.setupHandles();
		// Fix for adding to Fabrik with addMorph()
		return this.panel;
	}
	
	deleteView() {
		if (this.morph) {
			this.morph.formalModel = null;
			this.morph.component = null;
		}
		
		this.panel = null; 
		this.morph = null;
		this.pinHandles.each(function(ea) {ea.deleteView});
	}
	     
	addField(fieldName, coercionSpec, forceSet) {
		this.formalModel.addField(fieldName, coercionSpec, forceSet);
		this.pvtCreateAccessorsForField(fieldName);
		this['set' + fieldName](null); // FIXME do with spec
	}
	
	addFieldAndPinHandle(field, coercionSpec, forceSet) {
		// automaticaly create field if no field exists for pin
		return this.addPin(field, coercionSpec, forceSet);
	}
	
	pvtCreateAccessorsForField(fieldName) {
		this["get" + fieldName] = function() {
			return this.formalModel["get" + fieldName]();
		};
		this["set" + fieldName] = function(value) {
			return this.formalModel["set" + fieldName](value);
		};
	}
	
   
	addPin(pinName, optCoercionSpec, force) {
		// FIXME: Rewrite test that field exists
		if (!this["get" + pinName]) this.addField(pinName, optCoercionSpec, force);
		var pinHandle = new PinHandle(this, pinName);
		this.pinHandles.push(pinHandle);
		if (this.morph) this.setupPinHandle(pinHandle);
		return pinHandle;
	}
	
	removePin(name) {
		this.getPin(name).remove();
		this.pinHandles = this.pinHandles.without(this.getPin(name));
		// delete this['get' + name];
		// delete this['set' + name];
	}
	
	// deprecated, use getPin!
	getPinHandle(pinName) {
		return this.getPin(pinName);
	}
	
	getPin(pinName) {
		return this.pinHandles.detect(function(ea) { return ea.getName() == pinName });
	}

	inputPins() {
		return this.pinHandles.select(function(ea) { return ea.isInputPin() })
	}

	toString() {
		return super.toString() + this.name
	}

	// move this to morph!! Just say addNewPinHandle. Morph must figure out where it should go.
	setupHandles() {
		logCall(arguments, this);
		if (!this.panel) return;
		var offset = this.panel.bounds().height / 2 - 10;
		this.pinHandles.each(function(handle) {
			if (!handle.morph || (handle.morph.owner !== this.panel)) {
				this.setupPinHandle(handle);
			};
			handle.morph.setPosition(pt(-1 * (handle.morph.getExtent().x / 2), offset));
			offset += handle.morph.bounds().height + 10;
		}, this);
	}
	
	setupPinHandle(pin) {
		pin.buildView();
		this.panel.addMorph(pin.morph);
		pin.morph.openForDragAndDrop = false;
	}
	
	addTextMorphForFieldNamed(fieldName) {
		if (!this.panel) throw new Error('Adding morph before base morph (panel exists)');
		this.morph = this.panel.addTextPane().innerMorph();
		this.morph.connectModel(this.formalModel.newRelay({Text: fieldName}));
		return this.morph
	}
	
	getFieldNamesFromModel(model) {
		var result = [];
		// console.log("looking for field names");
		// look for getter/setter functions and extract field names from them
		for (var name in model) {
			if (!name.startsWith('set') || !(model[name] instanceof Function)) continue; 
			var nameWithoutSet = /^set(.*)/.exec(name)[1];
			var getterName = 'get' + nameWithoutSet;
			if (!(model[getterName] instanceof Function)) continue;
			// Ignore the getRecordField and setRecordField which every Record has
			if (nameWithoutSet == 'RecordField') continue;
			// getter and setter are there, we found a field
			// console.log("Found field: " + nameWithoutSet);
			result.push(nameWithoutSet);
		};
		return result;
	}
	
	remove() {
		if (this.fabrik) this.fabrik.unplug(this);
	}
}

class UserFrameMorph extends SelectionMorph {


	initialize(viewPort, defaultworldOrNull) {
	  this.removeWhenEmpty =  false
		
    super.initialize(viewPort, defaultworldOrNull);
		this.closeAllToDnD();
		this.setFill(Color.gray); 
	}
	
	reshape(partName, newPoint, lastCall) {
		// Initial selection might actually move in another direction than toward bottomRight
		// This code watches that and changes the control point if so
		var result = null;
		if (this.initialSelection) {
			var selRect = new Rectangle.fromAny(pt(0,0), newPoint);
			if (selRect.width*selRect.height > 30) {
				this.reshapeName = selRect.partNameNearest(Rectangle.corners, newPoint);
			}
			this.setExtent(pt(0, 0)) // dont extend until we know what direction to grow
			// super(this.reshapeName, newPoint, lastCall);
			result = Morph.prototype.reshape.call(this, this.reshapeName, newPoint, lastCall);
		} else {
			// super(partName, newPoint, lastCall);
			result = Morph.prototype.reshape.call(this, partName, newPoint, lastCall);
		}
		this.selectedMorphs = [];
		if (this.owner) {
			this.owner.submorphs.forEach(function(m) {
				if (m !== this && this.bounds().containsRect(m.bounds()) && m instanceof ComponentMorph) this.selectedMorphs.push(m);
			}, this);
		};
		this.selectedMorphs.reverse();

		if (lastCall) this.initialSelection = false;
		// if (lastCall /*&& this.selectedMorphs.length == 0 && this.removeWhenEmpty*/) this.remove();
		if (lastCall && this.selectedMorphs.length == 0 && this.removeWhenEmpty) this.remove();
		// this.selectedMorphs = [];
		
		if (lastCall) {
			if ((this.shape.bounds().extent().x < 10 && this.shape.bounds().extent().y < 10) ||
				(this.shape.bounds().extent().x < 3 || this.shape.bounds().extent().y < 3)) {
				this.remove();
			}
		}
		return result;
	}
	
	// removeWhenEmpty: false, 
	
	remove() { 
		// this.selectedMorphs.invoke('remove');
		// this.owner.removeMorph(this); // FIXME
		Morph.prototype.remove.call(this);
		if (this.fabrik) this.fabrik.userFrame = null
	}
	
	okToBeGrabbedBy(evt) {
		// this.selectedMorphs.forEach( function(m) { evt.hand.addMorph(m); } );
		return null;
	}

   
	createHandle(hand) {
		var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, hand, this, "bottomRight");
		handle.setExtent(pt(5, 5));
		handle.mode = 'reshape';
		this.addMorph(handle);
		hand.setMouseFocus(handle);
		return handle;
	}
	
	handleCollapseFor(fabrikMorph) {
		// remove morphs and connectors
		fabrikMorph.component.connectors.each(function(ea) { 
			fabrikMorph.removeMorph(ea.morph);
			if (ea instanceof PinConnector) // sometimes there is garbage in this list 
				fabrikMorph.hiddenContainer.addMorph(ea.morph);
		});
		var compMorphs = fabrikMorph.component.components.collect(function(ea) { return ea.panel });
		var morphsToHide = this.selectedMorphs ?
			compMorphs.reject(function(ea) { return this.selectedMorphs.include(ea) }.bind(this)) :
			compMorphs;
		morphsToHide.each(function(ea) { 
			fabrikMorph.removeMorph(ea);
			if (ea.dimMorph)
				ea.dimMorph.remove();
			if (ea)
				fabrikMorph.hiddenContainer.addMorph(ea);
		});
		
		// we move the fabrikMorph to where this selection currently is, the selectedMorphs have to be moved in the other direction
		this.positionDelta = this.getPosition();
		fabrikMorph.positionAndExtentChange(fabrikMorph.getPosition().addPt(this.positionDelta), this.getExtent());
		this.selectedMorphs.each(function(ea) {
			ea.component.pinHandles.each(function(pin) { 
				ea.removeMorph(pin.morph);
				pin.morph.storedPosition = pin.morph.getPosition();
				fabrikMorph.hiddenContainer.addMorph(pin.morph); 
			});
			ea.moveBy(this.positionDelta.negated());
		}.bind(this));
		
		fabrikMorph.hiddenContainer.addMorph(this); 
		fabrikMorph.removeMorph(this);
	}
	
	handleUncollapseFor(fabrikMorph) {
		// remove morphs and connectors
		var compMorphs = fabrikMorph.component.components.collect(function(ea) { return ea.panel });
		var morphsToShow = this.selectedMorphs ?
			compMorphs.reject(function(ea) { return this.selectedMorphs.include(ea) }.bind(this)) :
			compMorphs;
		morphsToShow.each(function(ea) { fabrikMorph.addMorph(ea) });

		this.selectedMorphs.each(function(ea) {
			ea.component.pinHandles.each(function(pin) { 
				ea.addMorph(pin.morph);
				pin.morph.setPosition(pin.morph.storedPosition);
			});
			this.positionDelta && ea.moveBy(this.positionDelta);
		}.bind(this));
				
		fabrikMorph.addMorph(this);

	}

}

/* Morph and Component for encapsulating other components */
class FabrikMorph extends ComponentMorph {
	
	
	initialize(bounds) {
    
		super.initialize(bounds);
	  // padding: Rectangle.inset(0),
		
    this.hiddenContainer = new ClipMorph(rect(pt(0,0),pt(1,1)));
		this.addMorphBack(this.hiddenContainer);
	}
	
	automaticLayout() {
		(new FlowLayout()).layoutElementsInMorph(this.fabrik.components, this);
	}
	
	// remove and put stuff in setupforcomponent instead
	setupForFabrik(fabrik){
     this.fabrik = fabrik;  // remove instance var, component is sufficient
     this.component = fabrik;
     this.component.components.each(function(ea) { this.addMorphForComponent(ea) }, this);
     this.component.connectors.each(function(ea) { this.addMorph(ea.morph || ea.buildView()) }, this);		
	}
	
	setupHaloItems(){
		this.closeHalo = this.addHaloItem("X", new Rectangle(0, 0, 18, 20), 
			{relativePosition: pt(1,0), positionOffset: pt(0, -20)},
			{fill: Color.red/*, fillOpacity: 0.5*/});
		this.closeHalo.connectModel(Relay.newInstance({Value: "=removeMe"}, {removeMe() {this.remove()}}));

		this.addGrabHalo({relativePosition: pt(1,0), positionOffset: pt(-45,0)});

		this.collapseHalo = this.addHaloItem("collapse",  new Rectangle(0,0,60,20),
			{relativePosition: pt(1,0), positionOffset: pt(-105,0)}, 
			{fill: Color.orange/*, fillOpacity: 0.5*/});
		this.collapseHalo.connectModel(Relay.newInstance({Value: '=collapseToggle'}, this));
	}
	
	addMorph(morph) {
		// don't let loose ends stay around
		if (morph.pinHandle && morph.pinHandle.isFakeHandle)
			throw new Error("Pin dropped on fabrik, this should not happen any more")
		
		// dropping components into the fabrik component...!
		if (morph.component)
			this.component.plugin(morph.component);
		
		if (morph.isConnectorMorph) 
			this.addMorphFront(morph);
		else 
			this.addMorphBack(morph);
				
		return morph;
	}
	
	addMorphForComponent(component) {
		this.addMorph(component.panel || component.buildView());
	}

	okToBeGrabbedBy(evt) {
		return null; 
	}
	
	// handlesMouseDown() { return true },
	
	onMouseDown(evt) {
		super.onMouseDown(evt);
		if(this.isCollapsed) return true;
		
		if (evt.isAltDown() ) { 
			this.makeUserFrame(evt);
		} else {
			this.makeSelection(evt); 
		}
		
		return true;
	}

	makeUserFrame(evt) {  //default behavior is to grab a submorph
		if (this.userFrame != null) this.userFrame.remove();
		var frame = new UserFrameMorph(this.localize(evt.point()).asRectangle());
		frame.fabrik = this;
		this.userFrame = this.addMorph(frame);
		var handle = this.userFrame.createHandle(evt.hand)

		return handle // for tests...
		// var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, this.userFrame, "bottomRight");
		// 	handle.setExtent(pt(0, 0));
		// 	handle.mode = 'reshape';
		//     this.userFrame.addMorph(handle);
		//     evt.hand.setMouseFocus(handle);
	}

	makeSelection(evt) {  //default behavior is to grab a submorph
		if (this.currentSelection != null) this.currentSelection.removeOnlyIt();
		var m = new SelectionMorph(this.localize(evt.point()).asRectangle());
		this.addMorph(m);
		this.currentSelection = m;
		var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, m, "bottomRight");
		handle.setExtent(pt(0, 0));
		handle.mode = 'reshape';
		m.addMorph(handle);
		evt.hand.setMouseFocus(handle);
		// evt.hand.setKeyboardFocus(handle);
	}

	collapseToggle(value) {
		if (!value) return; // FIXME value from button click... ignore!
		if (this.isCollapsed) 
			this.uncollapse()
		else 
			this.collapse();
		this.updateAfterCollapse();
	}
	
	updateAfterCollapse() {
		this.updateHaloItemPositions();
		if (this.isFramed())
       	this.setExtent(this.getExtent().addPt(this.owner.titleBar.getExtent().withX(0)));
	}
	
	collapse() {
		// console.log('collapse fabrik');
		this.isCollapsed = true;
		this.collapseHalo.setLabel('uncollapse');
		this.uncollapsedExtent = this.getExtent();
		this.uncollapsedPosition = this.getPosition();
		this.oldFill= this.getFill();
		this.setFill(this.collapsedFill || Color.gray.darker());
		
		if (this.dimMorph)
			this.dimMorph.remove();
			
		// close uncollapsed subfabriks before collapsing me
		this.component.components.each(function(ea) { 
			if (ea.panel.dimMorph)
				ea.panel.dimMorph.remove();
			if (ea.panel.isCollapsed == false) {
				// console.log("collapse " + ea);
	     	ea.panel.collapseToggle(true);
			};
		});
		
		if (this.userFrame) {
			this.userFrame.handleCollapseFor(this);
		} else {
			this.component.components.each(function(ea) { 
				this.removeMorph(ea.panel); 
				this.hiddenContainer.addMorph(ea.panel)}.bind(this));
			this.component.connectors.each(function(ea) { 
				this.removeMorph(ea.morph); 
				this.hiddenContainer.addMorph(ea.morph)}.bind(this));
			this.positionAndExtentChange(this.collapsedPosition || this.getPosition(),
								     this.collapsedExtent || this.component.defaultCollapsedExtent);
		}
	}
	
	uncollapse() {
		// console.log('uncollapse fabrik');
		this.isCollapsed = false;
		this.collapseHalo.setLabel('collapse');
		this.collapsedFill = this.getFill(); 
		this.setFill(this.oldFill || Color.gray);

		if (this.userFrame) {
			this.positionAndExtentChange(this.uncollapsedPosition || this.getPosition(), this.uncollapsedExtent || this.component.defaultViewExtent);
			this.userFrame.handleUncollapseFor(this);
		} else {
			this.collapsedExtent = this.getExtent();
			this.collapsedPosition = this.getPosition();
			this.positionAndExtentChange(this.uncollapsedPosition || this.getPosition(), this.uncollapsedExtent || this.component.defaultViewExtent);
			// console.log("set position: " + this.uncollapsedPosition);
			// this.setPosition(this.uncollapsedPosition);
			this.component.components.each(function(ea) { this.addMorph(ea.panel) }.bind(this));
		};

		// insert a dim morph behind the uncollapsed fabrik morph
		if (!this.isFramed()) {
			this.dimMorph = Morph.makeRectangle(rect(pt(0,0), this.owner.getExtent()));
			this.dimMorph.applyStyle({fill: Color.gray, fillOpacity: 0.7});
			this.dimMorph.ignoreEvents();
			this.owner.addMorphFront(this.dimMorph);
			this.owner.addMorphFront(this);
		};
		
		this.component.connectors.each(function(ea) { this.addMorph(ea.morph); ea.updateView(); }.bind(this) );	
	}
	
	minExtent() {
		return pt(10,5);
		// if (this.isCollapsed) return pt(10,5);
		//     var borderMorphs = this.getComponentMorphsNearBorders();
		//     var topY = borderMorphs.top ? borderMorphs.top.getPosition().y : 0;
		//     var leftX = borderMorphs.left ? borderMorphs.left.getPosition().y : 0;
		//     var bottomY = borderMorphs.bottom ? borderMorphs.bottom.bounds().maxY() : 50;
		//     var rightX = borderMorphs.right ? borderMorphs.right.bounds().maxX() : 50;
		//     return pt(rightX - leftX, bottomY - topY);
	}
	
	getComponentMorphsNearBorders() {
		var compMorphs = this.submorphs.select(function(ea) { return ea instanceof ComponentMorph});
		var borderMorphs = {};
		var cmpFuncs = {top(m1, m2) { return m1.getPosition().y <= m2.getPosition().y},
						left(m1, m2) { return m1.getPosition().x <= m2.getPosition().x},
						right(m1, m2) { return m1.bounds().maxX() >= m2.bounds().maxX()},
						bottom(m1, m2) { return m1.bounds().maxY() >= m2.bounds().maxY()}};
		// for in does not work with ometa...
		['top', 'left', 'right', 'bottom'].each(function(pos) {
			compMorphs.each(function(eaMorph) {
				if (!borderMorphs[pos]) borderMorphs[pos] = eaMorph;
				borderMorphs[pos] = cmpFuncs[pos](eaMorph, borderMorphs[pos]) ? eaMorph : borderMorphs[pos];
			});
		});
		return borderMorphs;
	}
	
	closeAllToDnD(loc) {
		// ok, lets handle this myself
	}
	
	// considers windowMorph when exsiting
	positionAndExtentChange(pos, ext) {
		// console.log("")
		if (this.owner instanceof WindowMorph) {
			this.owner.setExtent(ext);
		} else {
			this.setExtent(ext);
			this.setPosition(pos);
		}
	}
	
	isFramed() {
		return this.owner instanceof WindowMorph;
	}
	
	framed() {
		if (this.isFramed()) return;
		var window = new WindowMorph(this, this.component.viewTitle, false);
		window.suppressHandles = true;

		// undo closeAllToDnD
		this.openDnD();
		this.openInWindow = window;
		return window;
	}

	reshape(partName, newPoint, lastCall) {
		var result = super.reshape(partName, newPoint, lastCall);
		if (this.isFramed()) {
			var window = this.owner;
			var windowdBnds = window.bounds().topLeft().extent(this.shape.bounds().extent().addXY(0, window.titleBar.innerBounds().height));
			// window.setExtent(windowdBnds.extent());
			window.setBounds(windowdBnds);
			window.adjustForNewBounds();
		};
		return result;
	}
	
	unframed() {
		if (!this.isFramed()) return;
		this.owner.remove();
		this.openInWindow = null;
		this.reshape = this.constructor.prototype.reshape.bind(this);
		this.collapseToggle = this.constructor.prototype.collapseToggle.bind(this);
		return this;
	}

	doPaste() {
		if (TextMorph.clipboardString) {
			// should we test before if it is the right content?
			var components = this.component.pasteComponentFromXMLString(TextMorph.clipboardString)
			components.each(function(ea) {
				var insertPosition = this.component.panel.localize(WorldMorph.current().hands.first().getPosition());
				// ea.panel.setPosition(insertPosition);
			}, this);
		}
	}

	/* Maintance Helper Scripts */
	disableAllScrollBars() {
		this.submorphs.each(function(cm){ cm.submorphs.each(function(ea){
			if (ea.disableScrollBars) ea.disableScrollBars()
		})})
	}

	enableAllScrollBars() {
		this.submorphs.each(function(cm){ cm.submorphs.each(function(ea){
			if (ea.addVerticalScrollBar) ea.addVerticalScrollBar()
		})})
	}
}

/*
 * The main Fabrik Component
 *  - contains other components and connections between them
 */
class FabrikComponent extends Component {

	// morphClass: FabrikMorph,
	// defaultViewExtent: pt(750, 500),
	// defaultCollapsedExtent: pt(200, 100), // move to morph?
	// defaultViewTitle: "FabrikComponent"

	initialize(){
		super.initialize(null);
		this.components = [];
		this.connectors = [];
		return this;
	}
	
	buildView(optExtent) {
		// console.log("buildView for " + this);
		// this.panel = PanelMorph.makePanedPanel(this.viewExtent || optExtent || this.defaultViewExtent,
		//	 [['playfield', function(initialBounds){ return new FabrikMorph(initialBounds) }, pt(1,1).extentAsRectangle()]]
		// );
		// this.morph = this.panel.playfield;
		
		super.buildView(optExtent || this.defaultViewExtent);
		this.panel.fabrik = this;
		this.panel.setComponent(this);
	 
		this.morph.setupForFabrik(this);
		// this.panel.linkToStyles(['fabrik']);
		this.morph.linkToStyles(['fabrik']);
			
		return this.panel;
	}
	
	deleteView(){
		super.deleteView();
		
		this.connectors.each(function(ea) {ea.deleteView});
		this.components.each(function(ea) {ea.deleteView});
	}
	
	// can be called when this.morph does not exist, simply adds components and wires them
	plugin(component) {
		
		if (this.components.include(component)) {
			// console.log('FabrikComponent.plugin(): ' + component + 'was already plugged in.');
			return;
		}
		this.components.push(component);
		component.fabrik = this; // remember me
		if (this.morph) this.morph.addMorphForComponent(component);
		return component;
	}

	unplug(component) {
		this.components = this.components.reject(function(ea) { return ea === component });
		component.fabrik = null;
	}
	
	pluginConnector(connector) {
		if (this.connectors.include(connector)) {
			console.warn("Plugin connector failed: " + connector + " is already plugged in!");
			return;
		};		
		this.connectors.push(connector);
		// argh! is this really necessary??
		connector.fabrik = this;
		
		if (!this.morph) return connector;
		
		if (!connector.morph)
			connector.buildView();
		if (!this.morph.submorphs.include(connector.morph))
			this.morph.addMorph(connector.morph);
		connector.updateView();
		return connector;
	}

	connectComponents(fromComponent, fromPinName, toComponent, toPinName){
		return fromComponent.getPin(fromPinName).connectTo(toComponent.getPin(toPinName));
	}

	removeConnector(connector) {
		if (!this.connectors.include(connector)) {
			// console.log('FabrikComponent>>removeConnector: tried to remove connector, which is not there');
		};
		// console.log('Removing connectir')
		this.connectors = this.connectors.reject(function(ea) { return ea === connector });
		this.morph.removeMorph(connector.morph);
	}
	
	// setup after the window is opened
	openIn(world, location, optExtent) {
		var morph = this.panel || this.buildView(optExtent);
		var window = world.addMorph(morph.framed());
		window.setPosition(location || morph.getPosition());
		return window;
	}


	pasteComponentFromXMLString(componentMorphsAsXmlString) {
		var copier = new ClipboardCopier();
		return copier.pasteComponentFromXMLStringIntoFabrik(componentMorphsAsXmlString, this);
	}

}

// special copier for components...

class ClipboardCopier {
	pasteComponentFromXMLStringIntoFabrik(componentMorphsAsXmlString, fabrik) {
		// console.log("pasteComponentFromXMLStringIntoFabrik")
		
		var morphs = this.loadMorphsWithWorldTrunkFromSource(componentMorphsAsXmlString);
		
		if (morphs.length == 0)
			return;
		
		// unpack potential selection morph
		if(morphs[0].isSelectionContainer) {
			// console.log("unpack potential selection morph")
			morphs = morphs[0].submorphs
		};
		
		// console.log("try to paste  " + morphs.length + " morphs")
		var components = morphs.collect(function(ea) {
			return ea.component}).select(function(ea) {return ea});
		var copier = new Copier();
		// console.log("try to paste  " + components.length + " components")
		
		var offset = pt(50,50); 
		// fabrik.panel.localize(WorldMorph.current().hands.first().getPosition())
		components.each(function(ea) {
			var comp = ea.copy(copier);
			var oldPos = comp.panel.getPosition();
			fabrik.plugin(comp);
			comp.panel.setPosition(oldPos.addPt(offset));
			if (!fabrik.morph.submorphs.include(comp.panel)) {
				console.warn("ERROR: pasted component did not get added to fabrik");
			}
		})
		return components
	}
}

class PluggableComponentMorph extends ComponentMorph {

	addMorph(morph, accessorname) {
		if (morph.formalModel) {
			this.submorphs.each(function(ea) { ea.remove() });
			super.addMorph(morph, accessorname);
			this.setExtent(morph.getExtent().addPt(pt(this.padding.left() * 2, this.padding.top() * 2)));
			morph.setPosition(this.padding.topLeft());
			// why is here plugable component logic in the ComponentMorph? (jl)
			if (this.component && this.component.adoptToModel)
				this.component.adoptToModel(morph.formalModel);
			return morph;
		} else {
			return super.addMorph(morph, accessorname);
		}
	}
}


class PluggableComponent extends Component {
	
	// morphClass: PluggableComponentMorph

	buildView(extent) {
		super.buildView(extent);
		this.morph.openDnD();
		return this.panel;
	}
	
	adoptToModel(model) {
		this.formalModel = model;
		var fieldNames = this.getFieldNamesFromModel(model);
		fieldNames.each(function(ea) {
			if (!this.getPin(ea)) {
				this.pvtCreateAccessorsForField(ea);
				this.addPin(ea);
			}
		}, this);
		this.setupHandles();
	}
}
	
class TextComponentMorph extends ComponentMorph  {
		
	setupWithComponent(){
		super.setupWithComponent();
		this.text = this.component.addTextMorphForFieldNamed('Text')
	}
	
	setupHaloItems(){
		super.setupHaloItems();		
		var evalHalo = this.addHaloItem("accept",  new Rectangle(0,0,45,20),
			{relativePosition: pt(1,1), positionOffset: pt(-45,2)}, 
			{fill: Color.green/*, fillOpacity: 0.5*/});
		evalHalo.connectModel({model: this, setValue: "onAcceptPressed"});
		evalHalo.getHelpText = function(){return "accept text in component [alt+s]"}
	}
   
	onAcceptPressed(value) {
		this.text.doSave()
	}	
}

class TextComponent extends Component {
	
 
	initialize() {
		super.initialize();
	  this.morphClass = TextComponentMorph,
		this.addFieldAndPinHandle('Text', {to: String});
	}

	onDeserialize(){
		super.onDeserialize();
		// because the coercion is a function and the function is stored in a closure we have to build the setters here again 
		var oldText = this.formalModel.getText();
		this.addField('Text', {to: String}) 
		this.formalModel.setText(oldText)
	}

	buildView(){
		super.buildView();
		this.setupHandles();
		return this.panel;
	}
}


// TODO #COPExample
// cop.create('FunctionComponentLayer').refineClass(TextMorph, {
// 	getDoitContext(proceed) {
// 		console.log("get doit context " )		

// 		return this.getOwnerWidget()},
// });

class FunctionComponentMorph extends ComponentMorph {


	setupWithComponent(){
	
    // withLayers: [FunctionComponentLayer]
	  // smartCopyProperties: ['pinHandles', 'panel']

    super.setupWithComponent();
		var label = this.addLabel();
		label.connectModel(this.component.formalModel.newRelay({Text: "-FunctionHeader"}), true);		
		this.functionBodyMorph = this.addTextPane().innerMorph();
		this.functionBodyMorph.connectModel(this.component.formalModel.newRelay({Text: "FunctionBody"}));
  		this.component.morph = this.functionBodyMorph; 
	}

	onDeserialize(){
		super.onDeserialize();
		this.setupTextField();
	}
	
	setupHaloItems(){
		super.setupHaloItems();
     var inputHalo = this.addHaloItem("+input", new Rectangle(0,0,45,20),
			{relativePosition: pt(0,0), positionOffset: pt(0,-20)},
			{fill: Color.blue.lighter().lighter()/*, fillOpacity: 0.5*/});
		inputHalo.connectModel({model: this.component, setValue: "interactiveAndNewInputField"});
		
		var evalHalo = this.addHaloItem("eval",  new Rectangle(0,0,45,20),
			{relativePosition: pt(1,1), positionOffset: pt(-45,0)}, 
			{fill: Color.green/*, fillOpacity: 0.5*/});
		evalHalo.connectModel({model: this.component, setValue: "evalButtonPressed"});
	}
	
	setupTextField() {
		var self = this;
		if (!this.functionBodyMorph)
			return;

		// this.functionBodyMorph.boundEval = this.functionBodyMorph.boundEval.wrap(function(proceed, str) {
			// var forceImplicit = !str.match(/^[ ]*return /);
			// var source = self.component.composeFunction(self.component.formalModel.getFunctionHeader(), str, interactiveEval, forceImplicit);
			// console.log("eval: " + source)      
			// return eval(source).apply(self.component, self.component.parameterValues());
		// });
	}		
}

class FunctionComponent extends Component {


	initialize(){ // fix here...
	  this.morphClass = FunctionComponentMorph
		super.initialize();
		this.addField("FunctionBody");
		this.addField("FunctionHeader");
		this.addFieldAndPinHandle("Result");
		this.addInputFieldAndPin("Input");
		this.setupAutomaticExecution();
	}
		
	onDeserialize(){
		super.onDeserialize();
		this.setupTransitendBehavior();
	}

	copyFrom(copier, other) {
		super.copyFrom(copier, other);
		this.setupTransitendBehavior();
		return this; 
	}

	setupTransitendBehavior() {
		this.setupAutomaticExecution();
		// TODO: this is only a hack to get the bar green! This whole updating should probably be implemented with Relays
		this.inputPins().each(function(inputPin) {
			this.generateInputPinObserverFor(inputPin.getName())
		}, this);	
	}

	buildView(extent) {
		super.buildView(extent)

		this.panel.setupTextField();
		
		this.setupHandles();
		
		// FIXME cleanup
		var input = this.getPinHandle("Input").morph;
		input.setupInputMorphStyle();
		input.setPosition(pt(-1 * input.getExtent().x / 2, 
			(this.panel.getExtent().y / 2) - (input.getExtent().y / 2)));
		
		var result = this.getPinHandle("Result").morph;
		result.setPosition(pt(this.panel.getExtent().x - (input.getExtent().x / 2), 
			(this.panel.getExtent().y / 2) - (input.getExtent().y / 2)));
		
		return this.panel;
	}

	guessNewInputFieldName() {
		return "Input" + (this.inputPins().length + 1)
	}
	
	evalButtonPressed(buttonDown) {
		if(buttonDown) return;
		this.saveAndExecute();
	}
	
	interactiveAndNewInputField(buttonDown) {
		if (buttonDown) return;
		var name = this.guessNewInputFieldName();
		WorldMorph.current().prompt('Name for Input Pin?', function(name) {
			this.addInputFieldAndPin(name);
		}.bind(this), name)
	}
	
	addInputFieldAndPin(name) {
		var pin = this.addFieldAndPinHandle(name);
		pin.becomeInputPin();
		this.updateFunctionHeader();
		this.generateInputPinObserverFor(name);
		return pin;
	}
	
	saveAndExecute() {
		this.morph.doSave();
		this.execute();
	}

	setupAutomaticExecution(){
		this.formalModel.addObserver({onFunctionBodyUpdate() {
			this.setResult(null); // force an update
			this.execute()
		}});
	}

	removePin(name) {
		super.removePin(name);
		this.updateFunctionHeader();
	}

	generateInputPinObserverFor(fieldName) {
		var specObj = {};
		specObj['on' + fieldName + 'Update'] = function() { this.execute() }.bind(this);
		this.formalModel.addObserver(specObj);
	}

	parameterNames() {
		return this.inputPins().collect(function(ea){return ea.getName().toLowerCase()});
	}

	parameterValues() {
		return this.inputPins().collect(function(ea){return ea.getValue()}); 
	} 

	functionHeader() {
		return  'function f(' + this.parameterNames().join(',') + ')';
	}

	updateFunctionHeader() {
		this.formalModel.setFunctionHeader(this.functionHeader());
	}

	pvtGetFunction() {
		this.updateFunctionHeader();
		return this.composeFunction(this.formalModel.getFunctionHeader(), this.formalModel.getFunctionBody() || "", interactiveEval)
	}
	
	composeFunction(header, body, evalFunc, forceImplicit) {
		var funcSource = "var x = "+ header;
		var evalImplicit = ! body.match(/return /) || forceImplicit
		// BUG problems with: [1,2,3,4,5,6].select(function(ea) {return true})
		if(evalImplicit) {
			body = this.fixObjectLiterals(body);
			funcSource = funcSource.replace("(", "(pvtArgToEvalBody, ");
			funcSource = funcSource.replace(", )", ")") // just in case we would have no other parameter
			funcSource += ' { return eval(pvtArgToEvalBody)}; x'; // implicit return
		} else {
			funcSource += " { " + body + "}; x";
		};
		evalFunc = evalFunc || eval;
		try {
			if(evalImplicit)
				return evalFunc(funcSource).curry(body).bind(this)
			else
				return evalFunc(funcSource).bind(this);
		} catch(e) {
			// console.log("Error when evaluating:" + funcSource + " error: " + e.msg);
			return function(){} // do nothing
		}
	}

	fixObjectLiterals(str) {
		// var lines = str.split(/\n|\r/);
		str = ' ' + str + ' '; // whoaaa, ugly
		var regExp = /(.*)[^\(]\{(.*?)\}[^\)](.*)/;
		// debugger;
		while (regExp.test(str)) {
			var parts = regExp.exec(str);
			str = parts[1] + '({' + parts[2] + '})' + parts[3];
		};
		// return lines.join('\n');
		return str
	}
	
	execute() {
		var parameters = this.parameterValues();
		try {
			var result = this.pvtGetFunction().apply(this, parameters);
		} catch(e) {
			dbgOn(true);
			var msg = "FunctionComponentModel: error " + e + " when executing body" + this.formalModel.getFunctionBody();
			var world = WorldMorph.current();
			world.setStatusMessage(msg, Color.red, 15, function(){
				world.showErrorDialog(e)
			})


			console.log();
	

			return; // don't set any result
		};
		// console.log("Result of function call: " + result);
		this.formalModel.setResult(result || null ); 
	}
}

class WebRequestComponent extends Component {
	
	initialize(){
		super.initialize();
		// this.addFieldAndPinHandle("URL", null, true); // force sets even if value the same
		this.addFieldAndPinHandle("URL");
		this.addFieldAndPinHandle("ResponseText");
		this.addFieldAndPinHandle("ResponseXML");
		this.setupObserver();
	}

	setupObserver() {
		this.formalModel.addObserver({onURLUpdate(url) { this.makeRequest() }});
		this.formalModel.addObserver({onResponseTextUpdate() { 
				//console.log('getting response...') 
		}});	
	}

	onDeserialize(){
		super.onDeserialize();
		this.setupObserver();
		// this.formalModel.addObserver(this.morph, {URL: '!Text'});
	}

	buildView(optExtent) {
		super.buildView(optExtent);

		this.morph = this.panel.addLabeledText('Url').innerMorph();;			
		this.morph.formalModel = this.formalModel.newRelay({Text: 'URL'});
		this.formalModel.addObserver(this.morph, {URL: '!Text'});
		
		this.setupHandles();
		return this.panel;
	}
	
	setupHandles(){
		super.setupHandles();
		var morph = this.getPin("URL").morph;
		morph.setPosition(pt(-1 * (morph.getExtent().x / 2), this.panel.getExtent().y / 2));
		// FIXME: positions below are not really correct, but when scaling the pins, things get messed up...
		var morph = this.getPin("ResponseText").morph;
		morph.setPosition(pt(this.panel.getExtent().x - morph.getExtent().x / 2, this.panel.getExtent().y * 1/4));
		var morph = this.getPin("ResponseXML").morph;
		morph.setPosition(pt(this.panel.getExtent().x - morph.getExtent().x / 2, this.panel.getExtent().y * 3/5));  
	}
	
	makeRequest() {
		if (!this.formalModel.getURL()) return;
		//console.log('making reqest to: ' + this.formalModel.getURL());
		
		try {
			var url = new URL(this.formalModel.getURL());
		} catch(e) {
			console.warn('Invalid URL! in makeRequest');
			return // invalid url, we do not proceed
		}
		
		var webR = new WebResource(url).beAsync();
		lively.bindings.connect(webR, 'content', this.formalModel, 'setResponseText');
		lively.bindings.connect(webR, 'contentDocument', this.formalModel, 'setResponseXML', {
			converter(doc) {
				var elem = document.importNode(doc.documentElement, true);
				return FabrikConverter.xmlToStringArray(elem);
			}});
		
		webR.get();
	}
}

class ImageComponent extends Component {
	
	initialize(){
		super.initialize();
		this.addFieldAndPinHandle("URL");
	}
	
	onDeserialize(){
		super.onDeserialize();
		this.setupTransientView();
	}

	buildView(optExtent) {
		super.buildView(optExtent);

		var url = this.getURL() || 'http://www.lively-kernel.org/repository/lively-wiki/mouse.png';
		this.morph = new ImageMorph(this.panel.getBoundsAndShrinkIfNecessary(80), url);
		this.morph.adoptToBoundsLayout = 'layoutRelativeExtent';
		this.morph.openForDragAndDrop = false;
		this.morph.suppressHandles = true;
		this.morph.setFill(null);
		
		this.panel.addMorph(this.morph, 'image');
		this.setupTransientView();

		return this.panel;
	}
	
	setupTransientView() {
		this.formalModel.addObserver(this.morph, {URL: '!URL'});
		this.morph.okToBeGrabbedBy = function() { return this.panel }.bind(this);
		var self = this;
		this.morph.setExtent = this.morph.setExtent.wrap(function(proceed, extent) {
			proceed(extent);
			self.morph.image.setWidth(extent.x);
			self.morph.image.setHeight(extent.y);
		});
	}

}

class TextListComponent extends Component {

	initialize(){
		super.initialize();
		this.addFieldAndPinHandle('List');
		this.addFieldAndPinHandle('Selection');
		this.addField('SelectionIndex');
		this.setList([]);
		this.setupListEnhancement();
	}

	onDeserialize(){
		super.onDeserialize();
		this.setupListEnhancement();
	}

	buildView(optExtent) {
		super.buildView(optExtent);
		this.morph = this.panel.addListPane().innerMorph();
		this.morph.connectModel(this.formalModel.newRelay({List: "List", Selection: "Selection"}));
		this.setupHandles();
		return this.panel;
	}
	
	// remember selection idx when list changes, let also the morph know
	// TODO should be called during deserialization
	setupListEnhancement() {
		this.formalModel.addObserver({onListUpdate(newList) {
			if (!this.getSelectionIndex()) return;
			var list = this.getList();
			if (list) {
				var listItem = list[this.getSelectionIndex()]
				if (listItem) {
					this.setSelection(listItem);
				}
			}   
		}});		
		this.formalModel.addObserver({onSelectionUpdate(sel) {
			var idx;
			this.getList().each(function(ea, i) { if (equals(ea, sel)) idx = i;  });
			this.setSelectionIndex(idx);
			this.morph && this.morph.selectLineAt(idx);
		}});
	}
	
}

class ComponentContainerMorph extends Morph  {
	// suppressHandles: true,

	initialize(bounds) {
		super.initialize(new lively.scene.Rectangle(bounds));
		this.setFill(null);
		// to be implemented
	}
	
	
	morphToGrabOrReceive(evt) {
		if (!this.fullContainsWorldPoint(evt.mousePoint)) return null;
		return this // don't ask any submorphs
	}
	
	captureMouseEvent(evt, hasFocus) {
		if (hasFocus) return this.mouseHandler.handleMouseEvent(evt, this);
		if (!evt.priorPoint || !this.fullContainsWorldPoint(evt.priorPoint)) return false;
		if (this.mouseHandler == null)
			return false;

		if (!evt.priorPoint || !this.shape.containsPoint(this.localize(evt.priorPoint))) 
			return false;

		return this.mouseHandler.handleMouseEvent(evt, this);
	}
	
	createMorph(evt) {
		if (!this.createFunc) return null;	
		var compMorph = this.createFunc();
		evt.hand.addMorph(compMorph);
		compMorph.setPosition(pt(0,0));
		return compMorph
	}
	
	okToBeGrabbedBy() {
		return null
	}

	handlesMouseDown() { return true }
	 
	onMouseDown(evt) {
		return this.createMorph(evt);
	}
}

class ComponentBoxMorph extends Morph {


	initialize(bounds) {
	// openForDragAndDrop: false,
	// suppressHandles: false
		bounds = bounds || new Rectangle(0, 0, 630,300)
		super.initialize(new lively.scene.Rectangle(bounds));
		this.linkToStyles(['fabrik_componentBox'])


		this.buildContent();
		return this;
	}

	onDeserialize() {
		this.submorphs.clone().each(function(ea) {ea.remove()});
		this.buildContent();
	}

	addMorphOfComponent(comp, createFunc, optExtent) {
		var m = comp.buildView(optExtent);
		
		var scale = 0.7;
		m.setExtent(optExtent || pt(120, 100));
		m.setScale(scale);

		var textHeight = 30;
		var wrapper = new ComponentContainerMorph(m.getExtent().addPt(pt(0,textHeight)).extentAsRectangle());
	  	wrapper.createFunc = createFunc;
  		wrapper.addMorph(m);
		var text = new TextMorph(pt(0, m.getExtent().y * scale + 5)
			.extent(m.getExtent().x * scale, wrapper.getExtent().y * scale), comp.constructor.type);
		text.beLabel();
		wrapper.addMorph(text);
		this.addMorph(wrapper);
	}

	buildContent() {
		this.addMorphOfComponent(new FabrikComponent(), function() {
	      var extent = pt(300,250);
	      var fabrik = new FabrikComponent();
	      fabrik.defaultViewExtent = extent;
	      fabrik.viewTitle = 'Fabrik';
	      fabrik.openIn(WorldMorph.current(), WorldMorph.current().hands.first().getPosition().midPt(extent));
	      return fabrik.panel.owner;
	  	});
	  	var defaultCreateFunc = function(theClass, optExtent) {
      	return new theClass().buildView(optExtent);
	  	};
	  	this.addMorphOfComponent(new FunctionComponent(), defaultCreateFunc.curry(FunctionComponent));
		this.addMorphOfComponent(new TextComponent(), defaultCreateFunc.curry(TextComponent));
		this.addMorphOfComponent(new PluggableComponent(), defaultCreateFunc.curry(PluggableComponent));
		this.addMorphOfComponent(new TextListComponent(), defaultCreateFunc.curry(TextListComponent));
		this.addMorphOfComponent(new WebRequestComponent(), defaultCreateFunc.curry(WebRequestComponent, pt(220,50)), pt(220,50));
		this.addMorphOfComponent(new ImageComponent(), defaultCreateFunc.curry(ImageComponent, pt(50,50)), pt(50,50));
		new FlowLayout(this).layoutSubmorphsInMorph();
	}
}

/*********************************
 * Gerneral Purpose Helper Classes
 */
 
/*
 * PoinSnapper: snaps a morph to a list of points in world coordinates
 */
class PointSnapper {

	initialize(morph, points) {
		this.formalModel = Record.newPlainInstance({Snapped: false});
		this.morph = morph;
		this.points = points;
		this.limit = 15;
		this.offset = pt(0,0);
		return this;
	}

	updatePosition(newPosition) {
		if (!this.oldPosition || !newPosition.eqPt(this.oldPosition)) {
			this.oldPosition = newPosition;
			this.morph.setPosition(newPosition);
		}
	}

	snap(mousePosition) {
		// var oldPosInWorld = this.morph.owner.worldPoint(oldPos);
		// console.log("oldPosInWorld " + oldPosInWorld);
		var newPosInWorld = this.detectPointNear(mousePosition);
		if (!newPosInWorld) {
			this.updatePosition(pt(0,0));
			this.formalModel.setSnapped(false);
			return
		};
		var newPos = this.morph.owner.localize(newPosInWorld);
		this.updatePosition(newPos.addPt(this.offset));
		this.formalModel.setSnapped(true);
	}

	detectPointNear(position) {
		if(!this.points) return;
		return this.points.detect(function(ea) {
			// console.log("detect " + ea);
			var dx = Math.abs(ea.x - position.x);
			var dy = Math.abs(ea.y - position.y);
			// console.log("dx " + dx + " dy " + dy);
			return  dx < this.limit && dy < this.limit;
		}, this);
	}
}

/*
 * A simple FlowLayout, which positions elements of the morph from left to right
 */
class FlowLayout {
	/*
	* very simple flow layout:
	*   - flow left to right 
	*   - top to bottom
	*   - keep a space between 
	*/
	
	initialize(morphToLayout) {
		this.morphToLayout = morphToLayout;
		this.padding = Rectangle.inset(20);
		this.positionX = this.padding.left();
		this.positionY = this.padding.top();
		this.maxHeight = 0;
	}
	
	layoutSubmorphsInMorph() {
		this.morphToLayout.submorphs.forEach(function(ea) {
			this.setPositionFor(ea);
		}, this);
	}
	
	layoutElementsInMorph(components, morph) {
		this.morphToLayout = morph;
		components.each(function(ea) { this.setPositionFor(ea.panel) }, this);
	}
	
	setPositionFor(submorph) {
		//var bounds = rect(submorph.getPosition(), submorph.getExtent());
		var bounds = submorph.bounds();
		if ((this.positionX + bounds.width + this.padding.right()) > this.morphToLayout.bounds().right()) {
			this.positionX = this.padding.left(); // start left
			this.positionY += this.maxHeight + this.padding.top(); // on a new line
			this.maxHeight = 0; // and reset maxHeigth for that new line
		};
		submorph.setPosition(pt(this.positionX, this.positionY));
		this.positionX += bounds.width + this.padding.left();
		if (bounds.height > this.maxHeight) this.maxHeight = bounds.height;
	}

}

// make Roberts functional layouting serializeable with just one more layer of indirection
class AdoptToBoundsChangeFunctions {
	layoutRelativeExtent(morph, ownerPositionDelta, ownerExtentDelta) {
		morph.setExtent(morph.getExtent().addPt(ownerExtentDelta));
	}
	
	layoutRelativeExtentAndPosition(morph, ownerPositionDelta, ownerExtentDelta) {
		morph.setExtent(morph.getExtent().addPt(ownerExtentDelta));
		morph.setPosition(morph.getPosition().addPt(ownerPositionDelta));
	}
}

/* Very simple XML converter */
class FabrikConverter {
   
	static basicToJs(xml) {
		var obj = {};
		// FIXME assumes data is only important attribute...
		obj[xml.nodeName] = xml.hasChildNodes() ? {} : (xml.attributes && xml.getAttribute('data')) || xml.textContent;
		return obj;
	}
	
	static xmlToJs(xml) {
		var baseObj = FabrikConverter.basicToJs(xml);
		var childObjs = $A(xml.childNodes).collect(function(ea) { return FabrikConverter.xmlToJs(ea) });
		function firstKey(obj) { return Object.keys(obj).first() };
		childObjs.each(function(ea) { baseObj[firstKey(baseObj)][firstKey(ea)] = ea[firstKey(ea)] });
		return baseObj;
	}
	
	// flattens XML and creates string representations for each node
	static xmlToStringArray(xml, indent) {
		if (!indent) indent = '';
		
		var objCreator = function(string, xml) { return {string: string, xml: xml, js: FabrikConverter.xmlToJs(xml), isJSONConformant: true} };
		
		if (!xml || xml instanceof DocumentType) return [];
		if (!xml.parentNode) return FabrikConverter.xmlToStringArray(xml.firstChild, indent); // omit root
		if (!xml.hasChildNodes()) return [objCreator(indent + Exporter.stringify(xml), xml)];
		var list = $A(xml.childNodes).inject([], function(all, ea) {
			return all.concat(FabrikConverter.xmlToStringArray(ea, indent + '\t')) });
		// get just the tag opener and closer for the string
		var ownXMLStrings = /(<.*?>).*(<.*?>)/.exec(Exporter.stringify(xml));
		list.unshift(objCreator(indent + ownXMLStrings[1], xml));
		list.push(objCreator(indent + ownXMLStrings[2], xml));
		return list;
	}
};


/*
 * Extending ClockMorph for PluggableComponent
 */
class FabrikClockWidget extends Widget {
	
	initialize(){
		super.initialize();
		this.formalModel = Record.newNodeInstance({Minutes: null, Seconds: null, Hours: null});
		this.ownModel(this.formalModel);
	}
	
	buildView(extent) {
		this.morph = new FabrikClockMorph(pt(0,0), 50, 0, this.formalModel);
		this.morph.ownerWidget = this;
		return this.morph
	}
}

class FabrikClockMorph extends Morph {
	// openForDragAndDrop: false,
	// styleClass: ['clock', 'raisedBorder'],
	// fomals: ["Minutes", "Seconds", "Hours"]

	initialize(position, radius, timeZoneOffset, model) {
		super.initialize(new lively.scene.Ellipse(position, radius));
		this.applyLinkedStyles();
		if (!model) {
			model = Record.newNodeInstance({Minutes: null, Seconds: null, Hours: null});
		};
		//this.relayToModel(model, {Minutes: "Minutes", Seconds: "Seconds", Hours: "Hours"});
		this.formalModel = model;
		this.connectModel(model.newRelay({Minutes: "Minutes", Seconds: "Seconds", Hours: "Hours"}));
		this.makeNewFace(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']);  // Roman
		this.timeZoneOffset = timeZoneOffset;
		return this;
	}

	onMinutesUpdate() {
  
  }

	onSecondsUpdate() {
  
  }

	onHoursUpdate() {
  
  }

	makeNewFace(items) {
		var bnds = this.innerBounds();
		var radius = bnds.width/2;
		var labelSize = Math.max(Math.floor(0.04 * (bnds.width + bnds.height)), 2); // room to center with default inset

   		for (var i = 0; i < items.length; i++) {
			//var labelPosition = bnds.center().addPt(Point.polar(radius*0.85, ((i/items.length - 0.25)*Math.PI*2)).addXY(labelSize/2, 0));
			var labelPosition = bnds.center().addPt(Point.polar(radius*0.85, ((i/items.length - 0.25)*Math.PI*2)));
			this.addMorph(TextMorph.makeLabel(items[i],{fontSize: 8}).centerAt(labelPosition));
		}

		this.hours = this.addMorph(Morph.makePolygon([pt(-2.5, 0), pt(0, -radius*0.50), pt(2.5, 0)], 0, null, Color.blue));
		this.minutes = this.addMorph(Morph.makePolygon([pt(-2, 0), pt(0, -radius*0.70), pt(2, 0)], 0, null, Color.blue));
		this.seconds = this.addMorph(Morph.makePolygon([pt(-1.5, radius*0.25), pt(0, -radius*0.85), pt(1.5, radius*0.25)], 0, null, Color.red));
		this.dot = this.addMorph(Morph.makeCircle(pt(0, 0), 3, 0, null, Color.red));

		this.updateHands();
		this.changed();
	}

	reshape() {
  
  }

	startSteppingScripts() {
		this.startStepping(1000, "updateHands"); // once per second
	}

	updateHands() {
		// console.log("update hands");
		var currentDate = new Date();
		var offset;
		if (this.timeZoneOffset === undefined)
			offset = -1 * currentDate.getTimezoneOffset() / 60;
		else
			offset = this.timeZoneOffset;
		var second = currentDate.getUTCSeconds();
		var minute = currentDate.getUTCMinutes() + second/60;
		var hour = currentDate.getUTCHours() + offset + minute/60;
		this.setHands(second, minute, hour);
	}

	setHands(seconds, minutes, hours) {
		this.getModel().setMinutes(minutes);
		this.getModel().setHours(hours);
		this.getModel().setSeconds(seconds);

		this.hours.setRotation(hours/12*2*Math.PI);
		this.minutes.setRotation(minutes/60*2*Math.PI);
		this.seconds.setRotation(seconds/60*2*Math.PI); 
	}

}

/* Changing the behavior of the WorldMorph: when a FabrikMorph is dropped, make it framed */
// 	WorldMorph.prototype.addMorphFrontOrBack = WorldMorph.prototype.addMorphFrontOrBack.wrap(function(proceed, m, front, override) {
// 	if (m instanceof FabrikMorph && !override/* && !m.openInWindow*/) {
// 		m.halos.remove();
// 		m.adjustForNewBounds();
// 		// console.log('adding fabrikmorph to world...')
// 		return m.component.openIn(this, this.hands.first().getPosition().addPt(m.getPosition()));
// 	};
// 	return proceed(m, front);
// })

/*
* Helper functions for debugging
*/
function emptyString(length){
	for(var s=""; s.length < length ; s += " ") {}  
	return s
}

function logTransformChain(morph, indent, result) {
	if (!result)
	result = ""
	if (!indent)
	indent = 0;
	result += emptyString(indent*2) + morph + " " + morph.getTransform() + "\n";
	if (morph.owner)
	return logTransformChain(morph.owner, indent + 1, result);
	else
	// console.log(result);
	return result
}


function debugFunction(func) {
	var errObj = {};
	lively.lang.Execution.installStackTracers();
	try {
		return func.call()
	} catch(e) {
		errObj.err = e;
		lively.lang.Execution.installStackTracers("uninstall");
		var viewer = new ErrorStackViewer(errObj)
		viewer.openIn(WorldMorph.current(), pt(220, 10));
	};
}

console.log('loaded Fabrik.js');
