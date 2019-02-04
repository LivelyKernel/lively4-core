class Placeholder
{
  constructor(height, width, offset) {
    this.height = height 
    this.width = width
    this.offset = offset
  } 
}

export default class Layout {
  constructor() {
    this.object = new Placeholder(undefined, 60)
    this.objectMargin = new Placeholder(40)
    this.property = new Placeholder(undefined, 80, this.object.width)
    this.header = new Placeholder(undefined, this.object.width + this.property.width)
    
    
    this.timeframe = new Placeholder(undefined, undefined, this.header.width + 5)
    this.row = new Placeholder(32, undefined, this.timeframe.offset)
    this.rowValue = new Placeholder(30, undefined, this.timeframe.offset)
  }
}
