// 3D Animation Demo
// Croquet Corporation, 2020

const Q = Croquet.Constants;
// Pseudo-globals
Q.NUM_DICE = 2;            // number of rolling dice
Q.BALL_RADIUS = 0.25;
Q.DICE_SIZE = 1.5;
Q.CENTER_SPHERE_RADIUS = 1.5;  // a large sphere to bounce off
Q.CENTER_DICE_SIZE = 1.5;  // a large sphere to bounce off
Q.CENTER_SPHERE_NEUTRAL = 0xaaaaaa; // color of sphere before any bounces
Q.CONTAINER_SIZE = 4;        // edge length of invisible containing cube
Q.STEP_MS = 1000 / 20;       // step time in ms
Q.SPEED = 3;               // max speed on a dimension, in units/s
Q.HUE_MAX = 360;
Q.RANGE_MAX = 50;
Q.ROLL_TIME = 3000;

// one-time function to set up Three.js, with a simple lit scene
function setUpScene() {
  
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(50, 50, 50);
  scene.add(light);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 2, 5000);
  camera.position.set(0, 0, 4); 
  
  const threeCanvas = document.getElementById("three");
  
  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas });
  renderer.setClearColor(0xaa4444);

  function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize, false);
  onWindowResize();

  // function that the app must invoke when ready to render the scene 
  // on each animation frame.
  function sceneRender(cube) {
    renderer.render(scene, camera); 
  }
  
  return { scene, sceneRender, camera };
}

class RootModel extends Croquet.Model {
  
  init(options) {
    // force init 14
    super.init(options);
    this.diceSize = Q.DICE_SIZE;
    this.centerDicePos = [0, 0, -Q.CONTAINER_SIZE/2]; // embedded half-way into the back wall
    
    this.children = [];
    for (let i = 0; i < Q.NUM_DICE; i++) this.children.push(DiceModel.create({ sceneModel: this }));
    
    this.subscribe(this.id, 'reset', this.resetCenterDice); // someone has clicked the center sphere
    this.subscribe(this.id, 'roll-dices', this.rollDices); // someone has clicked the canvas/dices
  }

  resetCenterDice() {
    console.log("Reset the dices")
    this.publish(this.id, 'recolor-center-sphere', Q.CENTER_SPHERE_NEUTRAL);
  }
  
  rollDices(time) {
    //let storage = `Model: Inform all Clients after ${this.now()/1000} seconds: ${user.userName} wish to roll dices.`;    
    //addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    this.publish(this.id, 'update-view');
  }
}

RootModel.register("RootModel");

class DiceModel extends Croquet.Model {

  init(options={}) {
    super.init();
    console.log("SCENEMODEL: ", options.sceneModel);
    this.sceneModel = options.sceneModel;
  
    const rand = range => Math.floor(range * Math.random()); // integer random less than range
    this.size = Q.DICE_SIZE;
    this.color = `hsl(${rand(Q.HUE_MAX)},${rand(Q.RANGE_MAX)+50}%,50%)`;
    this.resetPosAndSpeed();

    //this.subscribe(this.sceneModel.id, 'reset', this.resetPosAndSpeed); // reset the dices
    //this.subscribe(this.sceneModel.id, 'roll-dices', this.resetPosAndRollDices); // someone has clicked the canvas/dices
    this.subscribe(this.sceneModel.id, 'roll-dices', this.roll); // someone has clicked the canvas/dices
  }

  // a ball resets itself by positioning at the center of the center-sphere
  // and giving itself a randomized velocity
  resetPosAndSpeed() {
    const srand = range => range * 2 * (Math.random() - 0.5); // float random between -range and +range
    this.pos = this.sceneModel.centerDicePos.slice();
    const speedRange = Q.SPEED * Q.STEP_MS / 1000; // max speed per step
    this.speed = [ srand(speedRange), srand(speedRange), srand(speedRange) ];
  }
  
  roll(clickTime) { 
    if (clickTime != undefined) {
      this.clickTime = clickTime;
    }
    if (this.now() - this.clickTime <= Q.ROLL_TIME) {
      this.future(Q.STEP_MS).roll(); // arrange to step again
      this.publish(this.id, 'keep-rollin');
    }
  }
}

DiceModel.register("DiceModel");

class RootView extends Croquet.View {

  constructor(model) {
    super(model);
    this.sceneModel = model;
    
    const sceneSpec = setUpScene(); // { scene, sceneRender }
    this.scene = sceneSpec.scene;
    this.sceneRender = sceneSpec.sceneRender;
    
    //three.onclick = event => this.clickOnCanvas(event);
    //three.onclick = () => this.publish(model.id, 'reset');
    three.onclick = () => this.publish(model.id, 'roll-dices', this.now());
        
    model.children.forEach(childModel => this.attachChild(childModel));
  }

  posFromSphereDrag(pos) {
    const limit = Q.CONTAINER_SIZE / 2;
    // constrain x and y to container (z isn't expected to be changing)
    [0, 1].forEach(i => { if (Math.abs(pos[i]) > limit) pos[i] = limit * Math.sign(pos[i]); });
    this.publish(this.sceneModel.id, 'sphere-drag', pos);
  }

  attachChild(childModel) {
    this.scene.add(new DiceView(childModel).object3D);
  }

  update(time) {
    //console.log("TIME", time, this.now());
    this.sceneRender(this.cube);
  }
  
  clickOnCanvas() {
    console.log("Clicked on Canvas")
  }
}

class DiceView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    console.log("MODEL:", model)
    
    const geometry = new THREE.BoxGeometry(Q.DICE_SIZE,Q.DICE_SIZE,Q.DICE_SIZE);
    const textureLoader = new THREE.TextureLoader()
    
    const materials = [
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-1.jpg')}),
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-2.jpg')}),
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-3.jpg')}),
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-4.jpg')}),
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-5.jpg')}),
    new THREE.MeshBasicMaterial({color: model.color, map: textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-6.jpg')}),
  ];
    
    this.object3D = new THREE.Mesh(geometry, materials);
    
    this.position = this.setInitialDicePosition(model.pos);
    this.startRoll();
    this.subscribe(model.id, { event: 'keep-rollin', handling: 'oncePerFrame' }, this.updateRotation);
    //this.subscribe(model.id, { event: 'pos-changed', handling: 'oncePerFrame' }, this.rollDice);
  }
  
  startRoll = () => {
    this.rotationSpeed = 0.5;
    const randomNum = Math.floor(Math.random() * 12);
    console.log("this.object3D.geometry.faces",this.object3D.geometry.faces);
    const randomFace = this.object3D.geometry.faces[randomNum];
    const normal = randomFace.normal;

    this.object3D.quaternion.setFromUnitVectors(normal, new THREE.Vector3( 0, 1, 0 ));
    this.targetX = (this.object3D.rotation.x + 2 * Math.PI) % (2 * Math.PI);
  }
  
  updateRotation() {
    const diff = (this.object3D.rotation.x - this.targetX) % (2 * Math.PI);
    const rotation = this.object3D.rotation;
    if (this.rotationSpeed > 0.08) {
      rotation.x += this.rotationSpeed;
      rotation.y += this.rotationSpeed;
      //rotation.z += this.rotationSpeed;
      this.rotationSpeed -= 0.005 * Math.random();
    } else if (diff > 0.041 && diff < 2*Math.PI - 0.041 ) {
      rotation.x += this.rotationSpeed;
      rotation.y += this.rotationSpeed;
      //rotation.z += this.rotationSpeed;
      this.rotationSpeed -= 0.0005 * Math.random();
    }
  }

  rollDice() {
    const srand = range => range * 2 * (Math.random() + 0.5); // float random between -range and +range
    //this.object3D.position.fromArray(pos);
    this.object3D.rotation.x += srand(0.1);
    this.object3D.rotation.y += srand(0.1);
    this.object3D.rotation.z += srand(0.1);
  }
  
  setInitialDicePosition(pos) {
    var location = this.object3D.position.fromArray(pos);
    console.log("location:", location);
    var lastChar = this.model.id.charAt(this.model.id.length - 1);
    let num = parseInt(lastChar);
    if (num % 2 == 1) {
      this.object3D.position.x += -3;
    } else {
      this.object3D.position.x += 3;
    } 
  }
}

Croquet.Session.join({
  appId: "io.codepen.croquet.threed_anim",
  name: "unnamed", 
  password: "secret", 
  model: RootModel, 
  view: RootView,
});