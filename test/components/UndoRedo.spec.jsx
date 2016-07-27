import UndoRedo from 'components/UndoRedo';
import TestUtils from 'react-addons-test-utils';
import React from 'react';

let renderComponentWithValueAndMax = (value, max) => {
	return TestUtils.renderIntoDocument(<UndoRedo
		max={max}
		value={value}
	></UndoRedo>)
}

describe('UndoRedo', () => {
	
	it('disables Slider when max is 0', () => {
		let undoRedo = renderComponentWithValueAndMax(0, 0)
		expect(undoRedo.refs.slider.props.disabled).to.be.true;
	})
	
	it('enables Slider when max is larger than 0', () => {
		let undoRedo = renderComponentWithValueAndMax(0, 1)
		expect(undoRedo.refs.slider.props.disabled).to.be.false;
	})

	it('sets value to 4 when undoing on 5', () => {
		let argument;
		let undoRedo = TestUtils.renderIntoDocument(<UndoRedo
			max={10}
			value={5}
			jumpToPast={(value) => { argument = value }}
		></UndoRedo>)
		undoRedo.refs.slider.props.onChange(4);
		expect(argument).to.equal(4);
	})

	it('goes 1 into the future when redoing on 4', () => {
		let argument;
		let undoRedo = TestUtils.renderIntoDocument(<UndoRedo
			max={10}
			value={4}
			jumpToFuture={(value) => { argument = value }}
		></UndoRedo>)
		undoRedo.refs.slider.props.onChange(5);
		expect(argument).to.equal(1);
	})

	it('sets to final state when clicking end of slider', () => {
		let argument;
		let undoRedo = TestUtils.renderIntoDocument(<UndoRedo
			max={10}
			value={9}
			jumpToFuture={(value) => { argument = value }}
		></UndoRedo>)
		undoRedo.refs.slider.props.onChange(10);
		expect(argument).to.equal(1);
	})

	it('Does nothing on undo when initialized without an undo callback', () => {
		let undoRedo = renderComponentWithValueAndMax(9, 10);
		undoRedo.onSliderMove(8);
		expect(undoRedo.props.value).to.equal(9)
	})

	it('Does nothing on redo when initialized without a redo callback', () => {
		let undoRedo = renderComponentWithValueAndMax(9, 10);
		undoRedo.onSliderMove(10);
		expect(undoRedo.props.value).to.equal(9)
	})
})