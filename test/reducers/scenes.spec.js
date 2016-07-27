import scenes from 'reducers/scenes'
import { appendPoint, createStroke } from 'actions/drawing'
import * as types from 'constants/actionTypes'
import { point } from '../helpers'

let undoableScenes = (anArray) => {
	return {
		past: [],
		future: [],
		present: anArray
	}
}

describe('scenes', () => {

	describe('initial state', () => {

		it('creates an empty present', () => {
			expect(
				scenes(undefined, {}).present
			).to.deep.equal([]);
		})

		it('creates an empty past', () => {
			expect(
				scenes(undefined, {}).past
			).to.deep.equal([]);
		})

		it('creates an empty future', () => {
			expect(
				scenes(undefined, {}).future
			).to.deep.equal([]);
		})
	})

	describe('creating a stroke', () => {

		it('when no scene exists creates one', () => {
			let result = scenes(
				undoableScenes([]),
				createStroke(point(10,10))
			);
			expect(result.present).to.have.length(1)
		})

		it('always adds to the current scene', () => {
			let result = scenes(
				undoableScenes([{ sketches:[] }]),
				createStroke(point(10,10))
			);
			expect(result.present).to.have.length(1)
		})
		
	})

	describe('adding a point', () => {

		it('to no existing scene creates a scene', () => {
			let result = scenes(
				undoableScenes([]),
				appendPoint(point(10,10))
			);
			expect(result.present).to.have.length(1);
		})

		it('to a scene does not create a new one', () => {
			let result = scenes(
				undoableScenes([{ sketches:[] }]),
				appendPoint(point(10,10))
			);
			expect(result.present).to.have.length(1);
		})

	})

})