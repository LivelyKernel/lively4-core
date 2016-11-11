import * as cop from 'src/external/ContextJS.js';

cop.create(window, "LivelySystemLayer").refineObject(System, {
	import(name, parentName, parentAddress) {
		name = name.replace(/^.\//,"https://lively-kernel.org/lively4/lively4-jens/demos/");
		lively.notify("import "+ name + ", " + parentName +","+ parentAddress);
		return cop.proceed(name, parentName, parentAddress);
	}
});


// LivelySystemLayer.beGlobal()