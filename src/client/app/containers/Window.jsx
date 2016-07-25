import { connect } from 'react-redux';
import WindowCanvas from 'components/WindowCanvas';
import { appendPoint, createStroke, finishStroke } from 'actions/drawing';

const mapStateToProps = (state) => {
  return state
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAppendPoint: (point) => {
      dispatch(appendPoint(point))
    },
    onCreateStroke: (point) => {
      dispatch(createStroke(point))
    },
    onFinishStroke: (point) => {
      dispatch(finishStroke(point))
    }
  }
}

const Window = connect(
  mapStateToProps,
  mapDispatchToProps
)(WindowCanvas)

export default Window;