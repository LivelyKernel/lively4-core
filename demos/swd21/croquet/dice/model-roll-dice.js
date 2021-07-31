// 3D Animation Demo
// Croquet Corporation, 2020

const Q = Croquet.Constants;
// Pseudo-globals
Q.DICE_SIZE = 1;
Q.CONTAINER_SIZE = 4;        // edge length of invisible containing cube
Q.STEP_MS = 1000 / 20;       // step time in ms
Q.SPEED = 3;               // max speed on a dimension, in units/s
Q.ROLL_TIME = 2000;
Q.ATTACH = 0;
Q.DETACH = 1;

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

// 
class RootModel extends Croquet.Model {
  
  init(options) {
    super.init(options);
    this.centerDicePos = [0, 0, -Q.CONTAINER_SIZE/2]; // embedded half-way into the back wall
    
    this.initDicePositionAndColor();
    this.userData = {};
    this.children = [];
    
    this.rotationPos = [0,0,0];

    this.subscribe(this.sessionId, "view-join", this.userJoin);
    this.subscribe(this.sessionId, "view-exit", this.userExit);
  }
  
  initDicePositionAndColor() {
    // A 3x3 matrix to position the dices
    this.dicePosition = [
      [-2, 0, -Q.CONTAINER_SIZE/2],
      [2, 0, -Q.CONTAINER_SIZE/2],
      [0, 1.5, -Q.CONTAINER_SIZE/2],
      [0, -1.5, -Q.CONTAINER_SIZE/2],
      [-2, 1.5, -Q.CONTAINER_SIZE/2],
      [-2, -1.5, -Q.CONTAINER_SIZE/2],
      [2, 1.5, -Q.CONTAINER_SIZE/2],
      [2, -1.5, -Q.CONTAINER_SIZE/2]
    ];
    
    const hueValue = Math.floor(Math.random() * (this.colorMax - 0)) + 0;
    const color = `hsl(${hueValue}, 100%, 50%)`;
    this.diceColor = [
      'hsl(189, 89%, 56%)', 'hsl(299, 82%, 51%)', 'hsl(224, 83%, 54%)',
      'hsl(348, 85%, 54%)', 'hsl(130, 82%, 50%)', 'hsl(59, 85%, 54%)',
      'hsl(33, 93%, 56%)', 'hsl(4, 96%, 54%)', 'hsl(348, 100%, 50%)'
    ];
  }
  
   // Published when a new user enters the session, or re-enters after being temporarily disconnected 
  userJoin(viewId) {
    var size = Object.keys(this.userData).length;
    
    // Maximum 9 dices can join the game
    if(size <= 8) {
      var dicePos;
      if(size == 0) {
        dicePos = this.centerDicePos;
      } else {
        dicePos = this.dicePosition[size-1];
      } 
      this.userData[viewId] = { start: this.now(), color: this.diceColor[size], position: dicePos };
      this.children.push(DiceModel.create({ sceneModel: this, userData: this.userData[viewId], relatedView: viewId }));
      
      const attach = {code: Q.ATTACH, model: null};
      this.publish(this.sessionId, "user-joined", viewId);         
      this.publish(this.id, "refresh", attach);
    }
  }
  
  // Guaranteed event when a user leaves the session, or when the session is cold-started from a persistent snapshot
  userExit(viewId) {     
    const time = this.now() - this.userData[viewId].start; 
    
    var index, actor;
    this.children.forEach(function(item, pos, array) {
      if(item.relatedView == viewId) {
        index = pos;
        actor = item;
        console.log("Actor to detach:", actor)
      }
    });
    delete this.userData[viewId];
    delete this.children[index];
        
    const detach = {code: Q.DETACH, model: actor};
    this.publish(this.id, "refresh", detach);
    this.publish(this.sessionId, "user-exited", {viewId, time});
  }
}

RootModel.register("RootModel");

class DiceModel extends Croquet.Model {

  init(options={}) {
    super.init();
    this.sceneModel = options.sceneModel;
    this.userData = options.userData;
    this.relatedView = options.relatedView;
      
    this.size = Q.DICE_SIZE;
    this.color = this.userData.color;
    this.resetPosAndRotationAngle();
    
    this.subscribe(this.sceneModel.id, 'roll-dices', this.roll); // someone has clicked the canvas/dices
    this.subscribe('object3D', 'inital-pos', this.initialRotationPosition);
  }

  // a dice resets itself by positioning at the center of the center-sphere
  // and giving itself a randomized velocity
  resetPosAndRotationAngle() {
    //const srand = range => range * 2 * (Math.random() - 0.5); // float random between -range and +range
    this.pos = this.userData.position.slice();
    this.rotPos = this.sceneModel.rotationPos.slice();
    //const speedRange = Q.SPEED * Q.STEP_MS / 1000; // max speed per step
    //this.speed = [ srand(speedRange), srand(speedRange), srand(speedRange) ];
    this.rotateAngle = 0;
  }
  
  randomAngle() {
    const angles = [90, 180, 270, 360];
    return angles[Math.floor(Math.random() * angles.length)];
  }
  
  roll(clickTime) {
    if (clickTime != undefined) {
      this.clickTime = clickTime;
      //const srand = range => range * 2 * (Math.random() + 0.5);
      const angle = this.randomAngle()
      this.rotateAngle += angle * Math.PI/180;
    }

    if (this.now() - this.clickTime <= Q.ROLL_TIME) {
      let storage = `DiceModel: keep rolling for ${this.now() - this.clickTime} seconds.`;    
      addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
      this.rollPosition();
      this.future(Q.STEP_MS).roll(); // arrange to step again
    } else {
      if (Math.abs(this.rotPos[1] - this.rotateAngle) > 0.001) {
        this.rollPosition();
        this.future(Q.STEP_MS).roll(); // arrange to step again       
      }
    }
  }
  
  rollPosition() {
    const rotation = this.rotPos;  
    
    rotation[0] += (this.rotateAngle - rotation[0]) / 10;
    rotation[1] += (this.rotateAngle - rotation[1]) / 10;

    this.rotateTo([ rotation[0], rotation[1], 0]);
  }
  
  rotateTo(rotation) {
    let storage = `DiceModel: rotate dice to new position --> ${rotation}.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    this.rotPos = rotation;
    this.publish(this.id, 'keep-rollin', this.rotPos);
  }
  
  initialRotationPosition(objectData) {
    this.rotPos = [objectData.rotationX, objectData.rotationY, objectData.rotationZ];
  }
}

DiceModel.register("DiceModel");

class RootView extends Croquet.View {

  constructor(model) {
    super(model);
    this.sceneModel = model;
    
    for (const viewId of Object.keys(model.userData)) {
      this.userJoined(viewId);
    }
    
    const sceneSpec = setUpScene(); // { scene, sceneRender }
    this.scene = sceneSpec.scene;
    this.sceneRender = sceneSpec.sceneRender;
    this.camera = sceneSpec.camera;
    
    three.onclick = event => this.clickOnCanvas(event);
    
    this.subscribe(this.sessionId, "user-joined", this.userJoined);
    this.subscribe(this.sessionId, "user-exited", this.userExited);
    
    this.subscribe(model.id, "refresh", this.refreshView);
  }
  
  userJoined(viewId) {
    const site = `${this.viewId === viewId ? "local" : "remote"}`;
    console.log(`${getRealTimeStamp()} View: ${site} User is joining after ${this.now()/1000} seconds. View-Id:${this.id} or local/remote ${viewId} or local ${this.viewId}`);
  }
  
  userExited({viewId, time}) {
    const site = `${ this.viewId === viewId ? "local" : "remote"}`;   
    console.log(`${getRealTimeStamp()} View: ${site} User left after ${time / 1000} seconds. View-Id:${this.id} or ${viewId} or ${this.viewId}`);
  }
  
  clickOnCanvas() {    
    let storage = `RootView: User-${this.viewId} click on canvas.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    console.log(getRealTimeStamp(), storage)
    
    this.publish(this.sceneModel.id, 'roll-dices', this.now());
  }
  
  refreshView(data) {
    switch (data.code){
      case Q.ATTACH:
        this.sceneModel.children.forEach(childModel => this.attachChild(childModel));
        break;
      case Q.DETACH:
        var childModel, dice, index;
        this.scene.children.forEach(function(item, index, array) {
          if(item.userData.id == data.model.id) {
            dice = item;
            console.log(dice)
          }
        });        
        this.detachChild(dice);
        break;
    }
  }

  attachChild(childModel) {
    var detach = false;
    var dice;
    this.scene.children.forEach(function(item, index, array) {
      if(item.type === "Mesh") {
        if(item.userData.id == childModel.id) {
          // detach dice from scene
          detach = true;
          dice = item;
        }
      }
    });
    if(detach) {
      this.detachChild(dice);
    }
    this.scene.add(new DiceView(childModel).object3D);
  }
  
  detachChild(dice) {    
    if (!(dice instanceof THREE.Object3D)) return false;
    // for better memory management and performance
    if (dice.geometry) {
        dice.geometry.dispose();
    }
    if (dice.material instanceof Array) {
        dice.material.forEach(material => material.dispose());
    }
    if (dice.parent) {
        dice.parent.remove(dice);
    }    
  }

  update() {
    this.sceneRender();
  }
}

// View of a single dice
class DiceView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    
    const geometry = new THREE.BoxGeometry(Q.DICE_SIZE,Q.DICE_SIZE,Q.DICE_SIZE);    
    const textureLoader = new THREE.TextureLoader()
    
    // Each side of a dice gets its own image that represents a dice number between one and six
    const faces = [];
    for (let i = 1; i <= 6; i++) {
      faces.push(textureLoader.load(`faces/${i}.png`));
    }
    
    // Loaded faces are set to as material
    const materials = Array.apply(null, Array(6)).map((_, i) => 
      new THREE.MeshBasicMaterial({ color: model.color, map: faces[i]}));
    
    // Build dice together and add the corresponding model as userdata
    this.object3D = new THREE.Mesh(geometry, materials);
    this.object3D.originalMaterials = materials.slice(0);
    this.object3D.userData = this.model;
    
    this.startPosition(model.pos);    
    this.subscribe(model.id, { event: 'keep-rollin', handling: 'oncePerFrame' }, this.updateRotation);
  }
  
  // The inital position of the dice is set to a random face side of the dice
  startPosition(pos) {
    this.object3D.position.fromArray(pos);
    
    const randomNum = Math.floor(Math.random() * 12);
    const randomFace = this.object3D.geometry.faces[randomNum];
    const normal = randomFace.normal;

    const vector = this.object3D.quaternion.setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0));

    const initialObject = {
      rotationX: this.object3D.rotation.x, 
      rotationY: this.object3D.rotation.y, 
      rotationZ: this.object3D.rotation.z
    }
    
    // For rolling the dice in the model the inital rotation position must be communicated
    this.publish('object3D', 'inital-pos', initialObject)
  }
  
  // Every single frame the dice is rolling a bit to the models calculated rotation position
  updateRotation(rotation) {
    let storage = `DiceView: User-${this.viewId} rotate the dices to new position --> ${rotation}.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);

    this.object3D.rotation.fromArray(rotation)
  }
}

Croquet.Session.join({
  appId: "org.lively.croquet.dice",
  name: "dice-game-model", 
  password: "super_safe", 
  model: RootModel, 
  view: RootView,
}).then(session => {
  console.log("Session_Properties: ", session);
  console.log(`${getRealTimeStamp()} Session is started by View ${session.view.id}`); 
  function myFrame(time) {
    session.step(time);
    window.requestAnimationFrame(myFrame);
  }
  window.requestAnimationFrame(myFrame);
});