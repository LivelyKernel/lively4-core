const Q = Croquet.Constants;
Q.MIN = 1;
Q.MAX = 6;
Q.COLOR_MAX = 360;
Q.RAND_MAX = 24;

var getRealTimeStamp = function() {
  var date = new Date(Date.now());
  return "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]";
};

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

// To calculate random dice rolling position
function getRandom(max, min) {
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
    this.userData = {};
    this.participants = 0;
    this.diceHistory = [];   
      
    this.subscribe(this.sessionId, "view-join", this.userJoin);
    this.subscribe(this.sessionId, "view-exit", this.userExit);
    
    this.subscribe("dice", "bumpDice", this.bumpDice);
    this.subscribe("dice", "history", this.addToDiceHistory);
    this.subscribe("input", "userName", this.registerUserName);
  }
  
  // Published when a new user enters the session, or re-enters after being temporarily disconnected 
  userJoin(viewId) {
    const hueValue = Math.floor(Math.random() * Q.COLOR_MAX);
    const color = `hsl(${hueValue}, 100%, 50%)`;
    const colorAlpha = `hsl(${hueValue}, 100%, 50%, 0.6)`;
    
    this.userData[viewId] = { start: this.now(), color: color, colorAlpha: colorAlpha };
    
    this.publish(this.sessionId, "user-joined", viewId);
    
    this.participants++;
    this.publish("viewInfo", "refresh");
  }
  
  // Guaranteed event when a user leaves the session, or when the session is cold-started from a persistent snapshot
  userExit(viewId) {      
    const time = this.now() - this.userData[viewId].start;
    
    delete this.userData[viewId];    
    this.publish(this.sessionId, "user-exited", {viewId, time});
    
    this.participants--;
    this.publish("viewInfo", "refresh");
  }
  
  // (B) Root-Model of all Clients
  // Model get knowledge of Clients wish to roll the dice
  bumpDice(data) {
    let storage = `Model: Inform all Clients after ${this.now()/1000} seconds: ${data.user.userName} wish to roll dices.`;
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    this.publish("dice", "updateView", data.view); 
  }
  
  // 
  addToDiceHistory(item) {
    this.history.push(item);
    console.log("DiceHistory: ", this.diceHistory)
  }
  
  // For better understanding who clicked the display 
  registerUserName(userObject) {    
    const viewId = userObject.view;
    this.userData[viewId].userName = userObject.userName;
    
    this.publish("view", "changeView", viewId);
    console.log(`${getRealTimeStamp()} DiceModel: ${userObject.userName} enters the game.`)
  }
}

RootModel.register("RootModel");

class RootView extends Croquet.View {

  constructor(model) {
    super(model);
    this.model = model;
    this.viewDiceHistory = [];

    for (const viewId of Object.keys(model.userData)) {
      this.userJoined(viewId);
    }

    cube.onclick = event => this.rollDice(event);
    uNameButton.onclick = event => this.readUserName(event);
    
    this.subscribe(this.sessionId, "user-joined", this.userJoined);
    this.subscribe(this.sessionId, "user-exited", this.userExited);
     
    this.subscribe("dice", "updateView", this.handleDiceUpdate);
    this.subscribe("viewInfo", "refresh", this.refreshViewInfo);
    this.subscribe("view", "changeView", this.changeView);    
  }
  
  userJoined(viewId) {
    const site = `${this.viewId === viewId ? "local" : "remote"}`;
    console.log(`${getRealTimeStamp()} View: ${site} User is joining after ${this.now()/1000} seconds. View-Id:${this.id} or local/remote ${viewId} or local ${this.viewId}`);
  }
  
  userExited({viewId, time}) {
    const site = `${ this.viewId === viewId ? "local" : "remote"}`;   
    console.log(`${getRealTimeStamp()} View: ${site} User left after ${time / 1000} seconds. View-Id:${this.id} or ${viewId} or ${this.viewId}`);
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
    }
    
    this.initaliseDice();
  }
  
  // Dicecolor and boarder color is initalized with pre setted color when the user is joining the session
  initaliseDice() {
    const user = this.model.userData[this.viewId];    
    var x = document.getElementsByClassName("container")[0].getElementsByTagName("DIV");
    for (var i=1; i<x.length; i++) {
      x[i].style.background = user.colorAlpha; 
      x[i].style.border = `2px solid ${user.color}`;
    }
  }
  
  // Option D --> Client is receiving the models message a Client wants to roll the dice. Everyone is rolling by its own for a special amount of time
  handleDiceUpdate() {
    const user = this.model.userData[this.viewId];
    
    var xRand = getRandom(Q.RAND_MAX, Q.MIN);
    var yRand = getRandom(Q.RAND_MAX, Q.MIN);
            
    cube.style.transform = `rotateX(${xRand}deg) rotateY(${yRand}deg)`;
    cube.style.transition = '6s';
    
    // (A) View V1 von Client C1 --> Pushes button
    let storage = `${user.userName} roll diceNumber ${cube.style.transform}.`;
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
  }
  
  readUserName() {
    const userName = userInput.value;
    this.publish("input", "userName", {view: this.viewId, userName: userName});
  }
  
  // First opportunity: Dicenumber is randomly calculated the moment the button is pushed from the user and it's published to the model and published back to the user
  rollDice() {
    const user = this.model.userData[this.viewId];
    
    // (A) View V1 von Client C1 --> Pushes button
    let storage = `${user.userName} pushed the dice button.`;
    addToLocalStorage(this.sessionId, getRealTimeStamp(), storage);
    
    // Model should either inform all Clients that a roll-Event is received or roll the dice for everyone
    this.publish("dice", "bumpDice", {user: user});
  }
  
  // After enter a username the first view will disappear and the view with the dice come to foreground
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

let Session = Croquet.Session.join({
    appId: "io.lively.croquet.dice", 
    name: "newDice10", 
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
  window.requestAnimationFrame(myFrame);
});