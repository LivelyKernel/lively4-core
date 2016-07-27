import { jumpToPast, jumpToFuture } from 'actions/timetravel';
import { connect } from 'react-redux';
import React from 'react';
import UndoRedo from 'components/UndoRedo'

let UndoRedoContainer = ({ max, value, onJumpToFuture, onJumpToPast}) => (
  <UndoRedo
    jumpToPast={onJumpToPast}
    jumpToFuture={onJumpToFuture}
    max={max}
    value={value}
  ></UndoRedo>
)
 
const mapStateToProps = (state) => {
  return {
    max: state.scenes.past.length + state.scenes.future.length,
    value: state.scenes.past.length
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onJumpToFuture: (futureValue) => dispatch(jumpToFuture(futureValue)),
    onJumpToPast: (pastValue) => dispatch(jumpToPast(pastValue))
  }
}

UndoRedoContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(UndoRedoContainer)

export default UndoRedoContainer