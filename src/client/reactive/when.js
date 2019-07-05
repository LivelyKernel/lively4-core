// #TODO: use params to provide them to the given aexpr
export default function when(condition, ...params) {
  const exp = condition.asAExpr();
  return new Promise(resolve => {
    exp.onBecomeTrue(() => {
      exp.dispose();
      resolve();
    });
  });
}
