// 3D Animation Demo
// Croquet Corporation, 2020

const Q = Croquet.Constants;
// Pseudo-globals
Q.NUM_DICE = 3;            // number of rolling dice
Q.DICE_SIZE = 1.5;
Q.CENTER_DICE_SIZE = 1.5;  // a large sphere to bounce off
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
    this.centerDicePos = [0, 0, -Q.CONTAINER_SIZE/2]; // embedded half-way into the back wall
    this.leftDicePos = [-3, 0, -Q.CONTAINER_SIZE/2];
    this.rightDicePos = [3, 0, -Q.CONTAINER_SIZE/2];
    
    this.rotationPos = [0,0,0];
    
    this.children = [];
    for (let i = 0; i < Q.NUM_DICE; i++) this.children.push(DiceModel.create({ sceneModel: this }));
  }
}

RootModel.register("RootModel");

class DiceModel extends Croquet.Model {

  init(options={}) {
    super.init();
    //console.log("SCENEMODEL: ", options.sceneModel);
    this.sceneModel = options.sceneModel;
  
    const rand = range => Math.floor(range * Math.random()); // integer random less than range
    this.size = Q.DICE_SIZE;
    this.color = `hsl(${rand(Q.HUE_MAX)},${rand(Q.RANGE_MAX)+50}%,50%)`;
    this.resetPosAndSpeed();
    this.object3dData = {};

    this.subscribe(this.sceneModel.id, 'roll-dices', this.roll); // someone has clicked the canvas/dices
    this.subscribe('object3D', 'inital-pos', this.initialRotationPosition);
  }

  // a dice resets itself by positioning at the center of the center-sphere
  // and giving itself a randomized velocity
  resetPosAndSpeed() {
    const srand = range => range * 2 * (Math.random() - 0.5); // float random between -range and +range
    this.pos = this.sceneModel.centerDicePos.slice();
    this.rotPos = this.sceneModel.rotationPos.slice();
    const speedRange = Q.SPEED * Q.STEP_MS / 1000; // max speed per step
    this.speed = [ srand(speedRange), srand(speedRange), srand(speedRange) ];
  }
  
  roll(clickTime) {
    if (clickTime != undefined) {
      this.clickTime = clickTime;
    }
    
    if (this.now() - this.clickTime <= Q.ROLL_TIME) {
      this.rollPosition();
      this.future(Q.STEP_MS).roll(); // arrange to step again
    } else {
      this.publish(this.id, 'last-rollin-position');
    }
  }
  
  rollPosition() {
    const rotation = this.rotPos;    
    const srand = range => range * 2 * (Math.random() + 0.5); // float random between -range and +range
    
    rotation[0] += srand(0.1);
    rotation[1] -= srand(0.1);
    rotation[2] += srand(0.1);
    
    this.rotateTo([ rotation[0], rotation[1], rotation[2] ]);
  }
  
  rotateTo(rotation) {
    this.rotPos = rotation;
    this.publish(this.id, 'keep-rollin', this.rotPos);
  }
  
  initialRotationPosition(objectData) {
    //this.object3dData[objectData.uuid] = [objectData.rotationX, objectData.rotationY, objectData.rotationZ];
    this.rotPos = [objectData.rotationX, objectData.rotationY, objectData.rotationZ];
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
    this.camera = sceneSpec.camera;

    three.onclick = () => this.publish(model.id, 'roll-dices', this.now());
        
    model.children.forEach(childModel => this.attachChild(childModel));
  }

  attachChild(childModel) {
    this.scene.add(new DiceView(childModel).object3D);
  }

  update() {
    this.sceneRender();
  }
}

class DiceView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    //console.log("MODEL:", model)
    
    this.faces = [
      "1x-0x0",
      "1x0x0",
      "-1x0x0",
      "-1x0x0",
      "0x1x0",
      "0x1x0",
      "0x-1x0",
      "0x-1x0",
      "0x0x1",
      "0x-0x1",
      "0x0x-1"
    ];
    
    const geometry = new THREE.BoxGeometry(Q.DICE_SIZE,Q.DICE_SIZE,Q.DICE_SIZE);
    //console.log("geometry", geometry);
    
    const textureLoader = new THREE.TextureLoader()
    
    const faces = [];
    for (let i = 1; i <= 6; i++) {
      faces.push(textureLoader.load(`faces/${i}.png`));
      //faces.push(textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg'));
    }
    
    const materials = Array.apply(null, Array(6)).map((_, i) => 
      new THREE.MeshBasicMaterial({ color: model.color, map: faces[i], transparent: true, opacity: 0.75, side: THREE.DoubleSide  }));
    
    geometry.faces[ 0 ].materialIndex = 1; 
    geometry.faces[ 1 ].materialIndex = 1; 
    geometry.faces[ 2 ].materialIndex = 2; 
    geometry.faces[ 3 ].materialIndex = 2; 
    geometry.faces[ 4 ].materialIndex = 3; 
    geometry.faces[ 5 ].materialIndex = 3; 
    geometry.faces[ 6 ].materialIndex = 4; 
    geometry.faces[ 7 ].materialIndex = 4; 
    geometry.faces[ 8 ].materialIndex = 5; 
    geometry.faces[ 9 ].materialIndex = 5; 
    geometry.faces[ 10 ].materialIndex = 6; 
    geometry.faces[ 11 ].materialIndex = 6; 
      
    this.object3D = new THREE.Mesh(geometry, materials);
    this.object3D.originalMaterials = materials.slice(0);
    console.log("this.object3D", this.object3D);
    
    this.position = this.setInitialDicePosition(model.pos);
    this.startRoll();
    
    this.subscribe(model.id, { event: 'keep-rollin', handling: 'oncePerFrame' }, this.updateRotation);
    this.subscribe(model.id, { event: 'last-rollin-position', handling: 'oncePerFrame' }, this.finalPosition);
    //this.subscribe(model.id, { event: 'pos-changed', handling: 'oncePerFrame' }, this.rollDice);
  }
  
  startRoll() {
    const randomNum = Math.floor(Math.random() * 12);
    const randomFace = this.object3D.geometry.faces[randomNum];
    const normal = randomFace.normal;
    
    const vector = this.object3D.quaternion.setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0));
    
    console.log("++ vector ++", vector)
    
    const initialObject = {
      uuid: this.object3D.uuid, 
      rotationX: this.object3D.rotation.x, 
      rotationY: this.object3D.rotation.y, 
      rotationZ: this.object3D.rotation.z
    }
    
    this.publish('object3D', 'inital-pos', initialObject)
  }
  
  updateRotation(rotation) {
    this.object3D.rotation.fromArray(rotation)
  }
  
  finalPosition(rotation) {
    const current = this.object3D.rotation;
    
    this.cubeQuaternion = new THREE.Quaternion();
    this.cubeQuaternion.setFromRotationMatrix(this.object3D.matrix);
    const cubeVector = (new THREE.Vector3( 0, 1, 0 )).applyQuaternion(this.cubeQuaternion).negate();
    
    //console.log("finalPosition.cubeVector", cubeVector)
    
    var roundedVector = {
        x: Math.round(cubeVector.x),
        y: Math.round(cubeVector.y),
        z: Math.round(cubeVector.z)
    }
    var faceName = roundedVector.x + "x" + roundedVector.y + "x" + roundedVector.z;
    //console.log("finalPosition.FACENAME", faceName);
    //console.log("finalPosition.FACENAME", this.object3D.geometry.faces);
    var faceIndex = this.faces.indexOf(faceName);
    var faceNormal = this.object3D.geometry.faces[faceIndex]
    //console.log("finalPosition.FACEINDEX", faceIndex)
    
    this.object3D.quaternion.setFromUnitVectors(cubeVector, new THREE.Vector3(0, 1, 0));
    
    
    /*var newMaterial;
    
    for(var i = 0, len = this.object3D.material.length; i < len; i++){
        if(showOneSide == true){
            // only side facing camera has original material
            if(i == faceIndex){
                newMaterial = this.object3D.originalMaterials[i];
            }else{
                newMaterial = transparentMaterial;
            }
        }else{
            // show original material
            newMaterial = this.object3D.originalMaterials[i];
        }

        // change material if not already set
        if(this.object3D.material[i] != newMaterial){
            this.object3D.material[i] = newMaterial;
            this.object3D.material[i].needsUpdate = true;

            if(showOneSide){
                $('#face-index').text('faceIndex: '+i);
            }
        }
    }*/
    
    //TODO: Welche Seite (face) ist am nächsten zur Camera? - Von dieser Seite face.normal verwenden um die letzte Drehung zu berechnen
    //this.object3D.quaternion.setFromUnitVectors(xxxx, this.object3D.up);
    
    //console.log("FINAL", this.object3D)
    
    //this.object3D.quaternion.setFromUnitVectors(this.object3D.rotation, new THREE.Vector3(0, 1, 0));
  }
  
  setInitialDicePosition(pos) {
    var location = this.object3D.position.fromArray(pos);
    var lastChar = this.model.id.charAt(this.model.id.length - 1);
    let num = parseInt(lastChar);
    if (num == 2) {
      this.object3D.position.x = 0;
    } 
    else if (num % 2 == 1) {
      this.object3D.position.x += -3;
    } 
    else {
      this.object3D.position.x += 3;
    } 
  }
}

Croquet.Session.join({
  appId: "io.codepen.croquet.threed_anim",
  name: "abc", 
  password: "secret", 
  model: RootModel, 
  view: RootView,
});