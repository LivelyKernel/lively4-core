'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';

const style = `border-radius: 50%; width: 40px; height: 40px; margin: 90px auto; position: relative; border-top: 3px solid rgba(0, 0, 0, 0.1); border-right: 3px solid rgba(0, 0, 0, 0.1); border-bottom: 3px solid rgba(0, 0, 0, 0.1); border-left: 3px solid #818a91; transform: translateZ(0); animation: loading-spinner 0.5s infinite linear;`;

export default class LoadingSpinner extends ReactiveMorph {
  render() {
    return (
      <div class="loading-spinner" style={style}>
        <style>
        {`
        @keyframes loading-spinner {
          0% { transform : rotate(0deg); }
          100% { transform : rotate(360deg); }
        }
        `}
        </style>
      </div>
    );
  }
}