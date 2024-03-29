const Q = Croquet.Constants;
Q.MIN = 1;
Q.MAX = 6;
Q.RAND_MAX = 24;

var getRealTimeStamp = function() {
  var date = new Date(Date.now());
  return "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]";
};

function destroySession(session) {
  //document.getElementById("destroyButton").onclick = event => this.destroy(event, session);
}

/*function destroy(event, session) {
    session.leave();
}*/

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

var getRandom = function (max, min) {
  return (Math.floor(Math.random() * (max-min)) + min) * 90;
}


/*
* UseCase: 
* Client A is pushing button --> roll dice
* Model sends reflector User A wants to roll dice
* Reflector sends to all Users, including A, to roll the dice
* All Users roll the dice
* Option A: Math.random() is used to generate dice number --> no oficial seed
* Option B: Seeded random number generator is used to calculation dice number
*/
class RootModel extends Croquet.Model {

  init() {
    this.colorMax = 360;
    this.userColor = new Map();
    this.userData = {};
    this.participants = 0;
    this.modelDiceHistory = [];
    
    console.log(`${getRealTimeStamp()} A new Model is created by init() after ${this.now()/1000} seconds. Model-Id:${this.id}`);    
      
    this.subscribe(this.sessionId, "view-join", this.userJoin);
    this.subscribe(this.sessionId, "view-exit", this.userExit);
    
    this.subscribe("dice", "rollDice", this.rollDice);
    this.subscribe("dice", "history", this.addToDiceHistory);
    this.subscribe("input", "userName", this.registerUserName);
  }
  
  userJoin(viewId) {
    const hueValue = Math.floor(Math.random() * (this.colorMax - 0)) + 0;
    const color = `hsl(${hueValue}, 100%, 50%)`;
    const colorAlpha = `hsl(${hueValue}, 100%, 50%, 0.6)`;
    
    this.userColor.set(viewId, color);
    this.userData[viewId] = { start: this.now(), color: color, colorAlpha: colorAlpha };
    this.publish(this.sessionId, "user-joined", viewId);
    
    this.participants++;
    this.publish("viewInfo", "refresh");
  }
  
  userExit(exitObj) {    
    const time = this.now() - this.userData[exitObj.view].start;
    const viewId = exitObj.view;
    const actor = this.userData[viewId];
    
    delete this.userData[viewId];
    actor.destroy();
    
    this.publish(this.sessionId, "user-exited", {viewId, time});
    
    this.participants--;
    this.publish("viewInfo", "refresh");
    
    if (exitObj.bool == true) {
      console.log("Model is destroyed")
      this.destroy();
    }
  }
  
  rollDice(user) {
    let storage = `Model: Inform all Clients after ${this.now()/1000} seconds: ${user.userName} wish to roll dices.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    var xRand = getRandom(Q.RAND_MAX, Q.MIN);
    var yRand = getRandom(Q.RAND_MAX, Q.MIN);
    
    console.log("Randoms:", xRand, yRand);
    
    this.publish("dice", "updateView", {xRand,yRand});
  }
  
  addToDiceHistory(item) {
    this.history.push(item);
    console.log("DiceHistory: ", this.modelDiceHistory)
  }
  
  registerUserName(userObject) {
    const viewId = userObject.view;
    this.userData[viewId].userName = userObject.userName;
    
    this.publish("view", "changeView", viewId);
    console.log(`${getRealTimeStamp()} DiceModel: ${userObject.userName} enters the game.`)
  }
}

RootModel.register("RootModel");

class DiceModel extends Croquet.Model {
  
  init(options={}) {
    super.init();
    console.log("SCENEMODEL: ", options.sceneModel);
    this.sceneModel = options.sceneModel;
    const rand = range => Math.floor(range * Math.random()); // integer random less than range
    this.color = `hsl(${rand(360)},${rand(50)+50}%,50%)`;
    this.colorAlpha = `hsla(${rand(360)},${rand(50)+50}%,50%,0.6)`;
  }
}

DiceModel.register("DiceModel");

class RootView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    this.viewDiceHistory = [];
    
    console.log(`${getRealTimeStamp()} A new View is created after ${this.now()/1000} seconds. View-Id:${this.id} with associated model: ${model.id}`);

    for (const viewId of Object.keys(model.userData)) {
      this.userJoined(viewId);
    }
          
    cube.onclick = event => this.onclick(event);
    unameButton.onclick = event => this.readUserName(event);
    
    this.subscribe(this.sessionId, "user-joined", this.userJoined);
    this.subscribe(this.sessionId, "user-exited", this.userExited);
     
    //this.subscribe("dice", "updateModel", this.handleUpdateModel);
    this.subscribe("dice", "updateView", this.handleUpdateView);
    this.subscribe("viewInfo", "refresh", this.refreshViewInfo);
    this.subscribe("view", "changeView", this.changeView);
    
    this.refreshViewInfo();
  }
  
  userJoined(viewId) {
    const site = `${this.viewId === viewId ? "local" : "remote"}`;
    console.log(`${getRealTimeStamp()} View: ${site} User is joining after ${this.now()/1000} seconds. View-Id:${this.id} or local/remote ${viewId} or local ${this.viewId}`);
  }
  
  userExited({viewId, time}) {
    const site = `${ this.viewId === viewId ? "local" : "remote"}`;   
    console.log(`${getRealTimeStamp()} View: ${site} User left after ${time / 1000} seconds. View-Id:${this.id} or ${viewId} or ${this.viewId}`);
  }
  
  destroyView() {
    const val = true;
    const viewId = this.viewId
    const destroyObject = {view: viewId, bool: val};
    
    console.log("destroyObject", destroyObject)
    this.publish(this.sessionId, "view-exit", destroyObject);
  }

  refreshViewInfo() {
    const user = this.model.userData[this.viewId];
    if (!user) {
      userId.innerHTML = "<b>User-Id:</b> " + "no user";
      viewCount.innerHTML = "<b>Active Participants: </b> " + this.model.participants;
    } else {
      userId.innerHTML = "<b>User-Id:</b> " + "user-" + this.viewId;
      userNameTwo.innerHTML = "<b>User-Name:</b> " + user.userName;
      viewCount.innerHTML = "<b>Active Participants: </b> " + this.model.participants;
      
      var x = document.getElementsByClassName("container")[0].getElementsByTagName("DIV");      
      for (var i=0; i<x.length; i++) {
        x[i].style.background = user.colorAlpha; 
        x[i].style.border = `2px solid ${user.color}`;
      }
    }
  }
  
  // First opportunity: Dicenumber is randomly calculated the moment the button is pushed from the user and it's published to the model and published back to the user
  onclick() {
    const user = this.model.userData[this.viewId];
    let storage1 = `${user.userName} rolled the dice.`;    
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage1);
    
    // This goes out to all instances of model --> distributed
    // Model should either inform all Clients that a roll-Event is received or roll the dice for everyone
    this.publish("dice", "rollDice", user);
  }
  
  // Option D --> Client is receiving the models message a Client wants to roll the dice. Everyone is rolling by its own
  handleUpdateView({xRand,yRand}) {
    const user = this.model.userData[this.viewId];    
    let storage = `${user.userName} is finally rolling dice.`;
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    cube.style.transform = `rotateX(${xRand}deg) rotateY(${yRand}deg)`;
    cube.style.transition = '6s';
  }
  
  readUserName() {
    const userName = userInput.value;
    this.publish("input", "userName", {view: this.viewId, userName: userName});
  }
  
  changeView(viewId) {
    if (this.viewId === viewId) {
      first.style.display = 'none';
      second.style.display = 'block';
    
      this.refreshViewInfo();
    }
  }
  
  addToViewDiceHistory(dice) {
    this.viewDiceHistory.push(dice);
    console.log("ViewDiceHistory: ", this.viewDiceHistory);
  }
}
  
class InputView extends Croquet.View {
  
  constructor(model) {
    super(model);
    this.model = model;
    
    console.log(`${getRealTimeStamp()} A new InputView is created after ${this.now()/1000} seconds. View-Id:${this.id} with associated model: ${model.id}`);
    
    unameButton.onclick = event => this.readUserName(event);
  }
  
  readUserName() {
    const userName = userInput.value;
    console.log(userName);
  }
}

let Session = Croquet.Session.join({
    appId: "io.lively.croquet.dice", 
    name: "abc12", 
    password: "secret", 
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
  destroySession(session);
  window.requestAnimationFrame(myFrame);
});