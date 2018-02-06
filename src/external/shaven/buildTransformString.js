// Create transform string from list transform objects

export default (transformObjects) => {

  return transformObjects
    .map(transformation => {
      const values = []

      if (transformation.type === 'rotate' && transformation.degrees) {
        values.push(transformation.degrees)
      }
      if (transformation.x) values.push(transformation.x)
      if (transformation.y) values.push(transformation.y)

      return `${transformation.type}(${values})`
    })
    .join(' ')
}
