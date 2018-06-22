import ExtMath from 'src/external/math.js'

/**
 * Wrapper class that encapsulates an external math library
 * to keep it exchangable.
 */
export default class Math {
  static ones(dimA, dimB) {
    return ExtMath.ones(dimA, dimB)
  }
  
  static zeros(dimA, dimB) {
    return ExtMath.zeros(dimA, dimB);
  }
  
  static det(matrix) {
    return ExtMath.det(matrix);
  }
  
  static inv(matrix) {
    return ExtMath.inv(matrix);
  }
  
  static derivation(matrix) {
    
  }
  
  static reshape(matrix, num1, num2) {
    return ExtMath.reshape(matrix, [num1, num2]);
  }
  
  static transpose(matrix) {
    return ExtMath.transpose(matrix);
  }
  
  /**
   * Returns a matrix object of the library.
   */
  static matrix(data) {
    return ExtMath.matrix(data);
  }
  
  /**
   * Calculates the mean of a matrix
   */
  static mean(matrix) {
    return ExtMath.mean(matrix);
  }
}