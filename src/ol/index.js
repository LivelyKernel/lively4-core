import Window from 'src/components/widgets/lively-window.js'
import Morph from 'src/components/widgets/lively-morph.js'
class OLWindow extends Window{
  render(){super.render(); }
  
}
class OLManagerWin extends OLWindow{
  initialize(){super.initialize(); window.addEventListener('message',this.onMessage.bind(this))}
  onmessage(m){
    Array.from(this.childNodes).filter(c => c.onmessage && m.type === 'postToChild' && m.data.adress === c.windowTitle).forEach(n => {
      n.onmessage(m.data.data);
      
    })
    
  }
  
}
class OLExWinMorph extends Morph{
  initialize(){super.initialize(); let root = this.attachShadow({mode: 'open'});this.id = 'olid-' + Math.random(); window.postMessage({type: 'windowify',id: this.id,shadow: true}); root.get('.content').appendChild(document.createElement('slot'));}
  
}
