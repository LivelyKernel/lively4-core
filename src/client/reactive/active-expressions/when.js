import aexpr from 'aexpr-source-transformation-propagation';

export default function when(condition) {
  const exp = aexpr(condition);
  return new Promise(resolve => {
    exp.onBecomeTrue(() => {
      exp.dispose();
      resolve();
    });
  });
}
