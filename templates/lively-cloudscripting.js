import Morph from './Morph.js';

export default class LivelyCloudscripting extends Morph {
  async initialize() {
    this.windowTitle = "LivelyCloudscripting";
    this.loginButton = this.getSubmorph('.login-button');
    this.credentialsButton = this.getSubmorph('.credentials button.toggle-list');
    this.credentialsList = this.getSubmorph('.credentials-list');
    this.isLoggedIn = false;
    
    this.loginButton.addEventListener('click', this.login.bind(this));
    this.credentialsButton.addEventListener('click', this.credentialsButtonClick.bind(this));
    
    // $(this.credentialsButton).click(function(){
    //     alert("show credentialsList");
    // });
        
  }
  
  /*
   * Event handlers
   */
  credentialsButtonClick(evt) {
    $(this.credentialsList).slideToggle();
  }
  
  login(evt) {
    var name = $(this.getSubmorph("#login-name")).val()
    if(!this.isLoggedIn) {
      alert("Login " + name)
      $(this.loginButton).text("Logout")
    } else {
      alert("Logout " + name)
      $(this.loginButton).text("Login")
    }
    
    this.isLoggedIn = !this.isLoggedIn;
    
  }
  

}