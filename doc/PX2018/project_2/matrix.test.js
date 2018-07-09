import {expect} from 'src/external/chai.js';
import Matrix from './matrix.js';



describe('math', () => {
  let matrix1 = new Matrix([[7, 1], [-2, 3]]);
  //let matrix2 = Math.matrix([[5, -6, 2], [3, 1, 9], [7, 5, 2]]);
  //let matrix3 = Math.matrix([[3, 1, -3], [-1, 5, 7], [4, 9, -2]]);
  
  it('Calculate determinant of the matrix', () => {
    expect(matrix1.det()).to.equal(23);
  });
  
   it('Calculate mean of the matrix', () => {
    expect(matrix1.mean()).to.equal(2.25);
  });
  
  //it('Multiply matrices', () => {
    //expect(Math.det(matrix1)).to.equal(23);
  //});
});