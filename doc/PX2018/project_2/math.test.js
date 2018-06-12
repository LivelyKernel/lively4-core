import {expect} from 'src/external/chai.js';
import Math from './math.js';



describe('math', () => {
  let matrix = Math.matrix([[7, 1], [-2, 3]]); 
  
  it('Calculate determinant of the matrix', () => {
    expect(Math.det(matrix)).to.equal(23);
  });
});