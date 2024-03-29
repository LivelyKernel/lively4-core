// 3D Animation Demo
// Croquet Corporation, 2020

const Q = Croquet.Constants;
// Pseudo-globals
Q.NUM_DICE = 3;            // number of rolling dice
Q.DICE_SIZE = 1.5;
Q.CONTAINER_SIZE = 4;        // edge length of invisible containing cube
Q.STEP_MS = 1000 / 20;       // step time in ms
Q.HUE_MAX = 360;
Q.RANGE_MAX = 50;
Q.ROLL_TIME = 3000;

var addToLocalStorage = function (name, key, value) {
  // Get the localStorage data at the existing session entry
  let storageEntry = localStorage.getItem(name);
  
  // If no localStorage for the session entry exists, add the first data
  if (storageEntry == null) {
    localStorage.setItem(name, JSON.stringify(storageEntry));
    return;
  }
  
  // Otherwise, convert the localStorage string to an array
  var oldStorage = JSON.parse(storageEntry) || [];
  //console.log("SE1", oldStorage);
  
  // Add new data to localStorage array 
  oldStorage.push(`${key}: ${value}`);

  // Save back to localStorage
  localStorage.setItem(name, JSON.stringify(oldStorage));
  return;
};

var getRealTimeStamp = function() {
  var date = new Date(Date.now());
  return "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]";
};

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
  function sceneRender() {
    renderer.render(scene, camera); 
  }
  
  return { scene, sceneRender, camera };
}

class RootModel extends Croquet.Model {
  
  init(options) {
    // force init 14
    super.init(options);
    this.userData = {};
    this.diceSize = Q.DICE_SIZE;
    this.centerDicePos = [0, 0, -Q.CONTAINER_SIZE/2]; // embedded half-way into the back wall
    
    this.children = [];
    for (let i = 0; i < Q.NUM_DICE; i++) this.children.push(DiceModel.create({ sceneModel: this }));
    
    this.subscribe(this.sessionId, "view-join", this.userJoin);
    this.subscribe(this.sessionId, "view-exit", this.userExit);
  }
  
  // Published when a new user enters the session, or re-enters after being temporarily disconnected 
  userJoin(viewId) {  
    this.userData[viewId] = { start: this.now()};   
    this.publish(this.sessionId, "user-joined", viewId);
  }
  
  // Guaranteed event when a user leaves the session, or when the session is cold-started from a persistent snapshot
  userExit(viewId) {      
    const time = this.now() - this.userData[viewId].start;
    
    delete this.userData[viewId];    
    this.publish(this.sessionId, "user-exited", {viewId, time});
  }
}

RootModel.register("RootModel");

class DiceModel extends Croquet.Model {

  init(options={}) {
    super.init();
    this.sceneModel = options.sceneModel;
  
    const rand = range => Math.floor(range * Math.random()); // integer random less than range
    this.size = Q.DICE_SIZE;
    this.color = `hsl(${rand(Q.HUE_MAX)},${rand(Q.RANGE_MAX)+50}%,50%)`;
    this.resetDicePosition();

    this.subscribe(this.sceneModel.id, 'roll-dices', this.keepRolling); // someone has clicked the canvas/dices
  }

  // a ball resets itself by positioning at the center of the center-sphere
  // and giving itself a randomized velocity
  resetDicePosition() {
    const srand = range => range * 2 * (Math.random() - 0.5); // float random between -range and +range
    this.pos = this.sceneModel.centerDicePos.slice();
  }
  
  keepRolling(clickTime) { 
    if (clickTime != undefined) {
      this.clickTime = clickTime;
    }
    if (this.now() - this.clickTime <= Q.ROLL_TIME) {
      let storage = `DiceModel: keep rolling for ${this.now() - this.clickTime} seconds.`;    
      addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
      
      this.future(Q.STEP_MS).keepRolling();
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
    
    three.onclick = event => this.clickOnCanvas(event);
    
    model.children.forEach(childModel => this.attachChild(childModel));
    
    this.subscribe(this.sessionId, "user-joined", this.userJoined);
    this.subscribe(this.sessionId, "user-exited", this.userExited);
  }
  
  userJoined(viewId) {
    const site = `${this.viewId === viewId ? "local" : "remote"}`;
    console.log(`${getRealTimeStamp()} View: ${site} User is joining after ${this.now()/1000} seconds. View-Id:${this.id} or local/remote ${viewId} or local ${this.viewId}`);
  }
  
  userExited({viewId, time}) {
    const site = `${ this.viewId === viewId ? "local" : "remote"}`;   
    console.log(`${getRealTimeStamp()} View: ${site} User left after ${time / 1000} seconds. View-Id:${this.id} or ${viewId} or ${this.viewId}`);
  }

  attachChild(childModel) {
    this.scene.add(new DiceView(childModel).object3D);
  }
  
  clickOnCanvas() {    
    let storage = `RootView: User-${this.viewId} click on canvas.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
        
    this.publish(this.sceneModel.id, 'roll-dices', this.now());
  }

  update(time) {
    this.sceneRender();
  }
}

class DiceView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    
    this.rotationSpeed = 0.5;
    this.rotateAngle += 90 * Math.PI/180;
    
    const geometry = new THREE.BoxGeometry(Q.DICE_SIZE,Q.DICE_SIZE,Q.DICE_SIZE);    
    const textureLoader = new THREE.TextureLoader()
    
    const faces = [];
    for (let i = 1; i <= 6; i++) {
      faces.push(textureLoader.load(`faces/${i}.png`));
    }
    
    const materials = Array.apply(null, Array(6)).map((_, i) => 
      new THREE.MeshBasicMaterial({ color: model.color, map: faces[i]}));
      
    this.object3D = new THREE.Mesh(geometry, materials);
    this.object3D.originalMaterials = materials.slice(0);

    this.position = this.setInitialDicePosition(model.pos);
    this.startPosition();
    
    this.subscribe(model.id, { event: 'keep-rollin', handling: 'oncePerFrame' }, this.rollDice);
  }
  
  startPosition(){
    const randomNum = Math.floor(Math.random() * 12);
    const randomFace = this.object3D.geometry.faces[randomNum];
    const normal = randomFace.normal;

    this.object3D.quaternion.setFromUnitVectors(normal, new THREE.Vector3( 0, 1, 0 ));
    this.targetX = (this.object3D.rotation.x + 2 * Math.PI) % (2 * Math.PI);
  }

  rollDice() {
    const srand = range => range * 2 * (Math.random() + 0.5); // float random between -range and +range
    this.object3D.rotation.x += srand(this.rotationSpeed);
    this.object3D.rotation.y += srand(this.rotationSpeed);
    
    const rotation = [this.object3D.rotation.x, this.object3D.rotation.y, this.object3D.rotation.z]    
    let storage = `DiceView: ${this.viewId} Update dice rotation. New rotaton from ${this.object3D.id} is ${rotation}.`;     
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
  }
  
  // The first rendering time the dices are placed horizontal in the canvas center
  setInitialDicePosition(pos) {
    var location = this.object3D.position.fromArray(pos);
    console.log("location:", location);
    console.log("current object:", this.model.id)
    var lastChar = this.model.id.charAt(this.model.id.length - 1);
    let num = parseInt(lastChar);
    if (num == 2) {
      this.object3D.position.x = 0;
    } else if (num % 2 == 1) {
      this.object3D.position.x += -3;
    } else {
      this.object3D.position.x += 3;
    }
  }
}

Croquet.Session.join({
  appId: "org.lively.croquet.dice",
  name: "DiceByModel5", 
  password: "super_safe", 
  model: RootModel, 
  view: RootView,
  debug: ["session", "snapshot" /*, "sends", "snapshot", "data", "subscribe", "classes"*/]
}).then(session => {
  console.log("Session_Properties: ", session);
  console.log(`${getRealTimeStamp()} Session is started by View ${session.view.id}`); 
  function myFrame(time) {
    session.step(time);
    window.requestAnimationFrame(myFrame);
  }
  window.requestAnimationFrame(myFrame);
});