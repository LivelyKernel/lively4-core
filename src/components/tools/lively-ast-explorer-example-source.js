that; import { location } from 'utils';



let thatLoc = undefined;
that.value.traverseAsAST({
  Identifier(path) {
    if (path.node.name === 'thatLoc') {
      thatLoc = path.node.loc.start
    }
  }
})
Promise.resolve(thatLoc)