import ExtMath from 'src/external/math.js'

/**
 * Wrapper class that encapsulates an external math library
 * to keep it exchangable.
 */
export default class Matrix {
  /**
   * Returns a matrix object of the library.
   */
  constructor(data) {
    if (data !== undefined) {
      this._matrix = ExtMath.matrix(data);
    }
  }
  
  static ones(dimA, dimB) {
    let matrix = new Matrix();
    
    if (dimB === undefined) {
      matrix._matrix = ExtMath.ones(dimA);
    } else {
      matrix._matrix = ExtMath.ones(dimA, dimB);
    }
    
    return matrix;
  }
  
  static zeros(dimA, dimB) {
    let matrix = new Matrix();
    
    if (dimB === undefined) {
      matrix._matrix = ExtMath.zeros(dimA);
    } else {
      matrix._matrix = ExtMath.zeros(dimA, dimB);
    }
    
    return matrix;
  }
  
  /**
   * Returns the determinante
   */
  det() {
    return ExtMath.det(this._matrix);
  }
  
  add(matrix2) {
    let result = new Matrix();
    result._matrix = ExtMath.add(this._matrix, matrix2._matrix);
    return result;
  }
  
  subtract(matrix2) {
    let result = new Matrix();
    result._matrix = ExtMath.subtract(this._matrix, matrix2._matrix);
    return result;
  }
  
  multiply(value) {
    let result = new Matrix();
    
    if (value instanceof Matrix) {
      result._matrix = ExtMath.multiply(this._matrix, value._matrix);
    } else {
      result._matrix = ExtMath.multiply(this._matrix, value);
    }
    
    return result;
  }
  
  divide(value) {
    let result = new Matrix();
    
    if (value instanceof Matrix) {
      result._matrix = ExtMath.divide(this._matrix, value._matrix);
    } else {
      result._matrix = ExtMath.divide(this._matrix, value);
    }
    
    return result;
  }
  
  /**
   * Returns the inverted matrix
   */
  invert() {
    let result = new Matrix();
    result._matrix = ExtMath.inv(this._matrix);
    return result;
  }
  
  reshape(num1, num2) {
    let result = new Matrix();
    // Do not change the current matrix only the return value
    let tmp = ExtMath.multiply(this._matrix, 1);
    result._matrix = ExtMath.reshape(this._matrix, [num1, num2]);
    this._matrix = tmp;
    return result;
  }
  
  /**
   * Returns the transposed matrix
   */
  transpose() {
    let result = new Matrix();
    result._matrix = ExtMath.transpose(this._matrix);
    return result;
  }
  
  /**
   * Calculates the mean of the matrix
   */
  mean() {
    return ExtMath.mean(this._matrix);
  }
  
  concat(value) {
    let result = new Matrix();
    result._matrix = ExtMath.concat(this._matrix, value);
    return result;
  }
  
  get(x, y) {
    if (y === undefined) {
      return this._matrix.get([x]);
    } else {
      return this._matrix.get([x, y]);
    }
  }
  
  set(x, y, value) {
    this._matrix.set([x, y], value);
  }
  
  toString() {
    return ExtMath.round(this._matrix, 3).toString()
  }
}