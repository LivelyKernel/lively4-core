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
      matrix._matrix = ExtMath.ones(dimA, 1);
    } else {
      matrix._matrix = ExtMath.ones(dimA, dimB);
    }
    
    return matrix;
  }
  
  static zeros(dimA, dimB) {
    let matrix = new Matrix();
    
    if (dimB === undefined) {
      matrix._matrix = ExtMath.zeros(dimA, 1);
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
  
  multiply(matrix2) {
    let result = new Matrix();
    result._matrix = ExtMath.multiply(this._matrix, matrix2._matrix);
    return result;
  }
  
  /**
   * Returns the inverted matrix
   */
  inv() {
    let result = new Matrix();
    result._matrix = ExtMath.inv(this._matrix);
    return result;
  }
  
  reshape(matrix, num1, num2) {
    let result = new Matrix();
    result._matrix = ExtMath.reshape(this._matrix, [num1, num2]);
    return result;
  }
  
  /**
   * Returns the transposed matrix
   */
  transpose(matrix) {
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
    if (y === undefined) {
      this._matrix.set([x], value);
    } else {
      this._matrix.set([x, y], value);
    }
  }
}