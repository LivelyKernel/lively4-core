import * as actions from 'actions/timetravel';
import * as types from 'constants/actionTypes';

describe('timetravel actions', () => {

  it('should create an action to jump 3 units into future', () => {
    const pointInFuture = 3;
    const expectedAction = {
      type: types.JUMP_TO_FUTURE,
      pointInFuture
    }
    expect(actions.jumpToFuture(pointInFuture)).to.deep.equal(expectedAction)
  })

  it('should create an action to jump to past point in time', () => {
    const pointInPast = 20;
    const expectedAction = {
      type: types.JUMP_TO_PAST,
      pointInPast
    }
    expect(actions.jumpToPast(pointInPast)).to.deep.equal(expectedAction)
  })

})