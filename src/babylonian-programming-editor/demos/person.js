export default class /*instance:*/Person/*{"id":"5a21_c16d_9e81","name":{"mode":"input","value":"Tim"},"values":{"name":{"mode":"input","value":"\"Timmy\""},"hobby":{"mode":"input","value":"\"hiking\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  
  /*MD 
  <lively-drawboard width="400px" height="400px" color="black" pen-size="null" tabindex="0" style=" background-color: rgb(255, 250, 205); z-index: 200; width: 371px; height: 161.5px;" class="lively-content"><svg xmlns="http://www.w3.org/2000/svg" id="svg" data-is-meta="true" style="position: absolute; top: 0px; left: 0px; width: 373px; height: 163.5px; border: none; opacity: 1; touch-action: none;"><path stroke="black" stroke-width="null" fill="none" d="M119.5,78.5c-9.75838,-1.6264 -41.29473,-6.70527 -49,1c-3.50027,3.50027 -3.5906,9.99655 -4,14.5c-1.27996,14.07952 4.82719,20.7356 20,22c13.64257,1.13688 48.83444,2.16556 59,-8c5.59481,-5.59481 0.74959,-29 -10.5,-29"></path><path stroke="black" stroke-width="null" fill="none" d="M209,80.5c0,-4.87543 -11.38627,1.91893 -12.5,2.5c-12.29199,6.41321 -26.38474,25.83595 -9.5,36.5c17.56253,11.09213 48.0346,-1.03569 50,-22c0.86954,-9.27513 -0.92215,-27.73114 -14,-22.5"></path><path stroke="black" stroke-width="null" fill="none" d="M158.5,119.5c2.02285,2.02285 -5.79911,25.68849 11.5,18c5.90036,-2.62238 3.66158,-12.33842 0,-16c-2.45427,-2.45427 -8.69765,-1 -12,-1"></path><path stroke="black" stroke-width="null" fill="none" d="M106,125.5c0,7.02277 16.28617,16.36026 21,19c30.01274,16.80714 55.67464,8.36527 88,6c6.61436,-0.48398 14.97158,0.26777 21,-3.5c3.6867,-2.30419 5.07251,-7.19336 6.5,-11c0.42719,-1.13917 2.39605,-6 2,-6"></path><path stroke="black" stroke-width="null" fill="none" d="M125.5,100.5c0,-0.33333 0,-0.66667 0,-1"></path><path stroke="black" stroke-width="null" fill="none" d="M134,100.5c0,-1.85568 -13.49805,0.37476 -14.5,0.5c-6.21496,0.77687 -23.90246,2.29262 -20,14c0.28382,0.85147 1.76472,-0.4853 2.5,-1c3.14336,-2.20035 6.26824,-4.43168 9.5,-6.5c5.69571,-3.64525 13.14532,-11.17734 20.5,-7.5"></path><path stroke="black" stroke-width="null" fill="none" d="M170,99c4.92946,-4.92946 20.07874,1.51856 24,6c1.67103,1.90975 11,7.74774 11,5.5"></path><path stroke="black" stroke-width="null" fill="none" d="M81.5,51c-3.39983,4.53311 -9.64222,8.5 -15.5,8.5c-0.99359,0 -2.36729,-0.89814 -2,-2c2.43643,-7.3093 23.16101,-7.29431 28,-8c21.59749,-3.14963 43.11784,-7.5 65,-7.5c27.58224,0 72.86462,-10.87846 98,-2.5c0.36046,0.12015 -18.5,3.39168 -18.5,5c0,0.53767 2.49666,-1.99866 2.5,-2c1.32225,-0.5289 1.86121,0.13879 3,-1"></path><path stroke="black" stroke-width="null" fill="none" d="M83.5,41.5c-0.66104,0.66104 -10.60389,-16.5 -15,-16.5c-0.46047,0 3.56097,7.37806 4.5,5.5c6.72447,-13.44894 25.26579,-9.75093 38,-10.5c22.92918,-1.34878 48.0496,1.48898 70.5,-3.5c0.75701,-0.16822 22.23417,-6.26583 23.5,-5c1.11803,1.11803 -1.06563,2.9797 -1.5,4.5c-1.0296,3.6036 -1,6.78288 -1,10.5"></path></svg></lively-drawboard>
  
  MD*/
  
  /*example:*//*example:*/sayHello/*{"id":"b8e7_3471_5f14","name":{"mode":"input","value":"test"},"color":"hsl(30, 30%, 70%)","values":{"shout":{"mode":"input","value":""}},"instanceId":{"mode":"select","value":"5a21_c16d_9e81"},"prescript":"","postscript":""}*//*{"id":"bb41_bcac_7491","name":{"mode":"input","value":"test2"},"color":"hsl(200, 30%, 70%)","values":{"shout":{"mode":"input","value":"\"dadsf\""}},"instanceId":{"mode":"select","value":"5a21_c16d_9e81"},"prescript":"","postscript":""}*/(/*probe:*/shout/*{}*/) {
    
    var a = 4
    
    /*probe:*/a/*{}*/
    
    
    var msg = `I'm ${this.name} and I like ${this.hobby}` 
    if (shout) {
      msg = msg.toUpperCase()
    } 
    /*probe:*/msg/*{}*/
    console.log(/*probe:*/msg/*{}*/);
  }
  
  reverseName() {
    this.name = this.name.split("").reverse().join("");
  }
}



function testPerson() {
  var name = /*replacement:*/prompt("Enter a name", "")/*{"id":"3967_7cb1_c84b","value":{"mode":"input","value":"\"David\""}}*/
  let person = new Person(name, "debugging")
  return person
}


function /*example:*/sayLotsOfHello/*{"id":"00c2_2c13_8a86","name":{"mode":"input","value":"speaker"},"color":"hsl(300, 30%, 70%)","values":{"n":{"mode":"input","value":"10"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(n) {
  let speaker = testPerson()
  for (var i = 0; i < n; i++) {
    speaker.sayHello()
  }
}


/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */