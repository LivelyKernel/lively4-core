import { connect } from 'react-redux';
import Desk from 'components/Desk';
import { last, cloneDeep } from 'lodash';
import { appendPoint, createStroke, finishStroke } from 'actions/drawing';

const mapStateToProps = (state) => {
  let returnState = cloneDeep(state.ploma);
  returnState.scene = state.scenes.present;
  returnState.scene = last(state.scenes.present);
  return returnState;
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

const Scene = connect(
  mapStateToProps,
  mapDispatchToProps
)(Desk)

export default Scene;