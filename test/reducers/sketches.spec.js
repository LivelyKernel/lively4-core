import sketches from 'reducers/sketches'
import { appendPoint, createStroke, finishStroke } from 'actions/drawing'
import * as types from 'constants/actionTypes'
import { point } from '../helpers'

describe('sketches', () => {

	describe('handling the initial state', () => {

		it('creates an empty array of strokes', () => {
			expect(
				sketches(undefined, {})
			).to.deep.equal(
				[]
			)
		})
	
	})

	describe('adding a point', () => {

		it('to an empty canvas creates a sketch', () => {
			let result = sketches([], appendPoint(point(10,10)));
			expect(result).to.have.length(1);
		})

		it('sets the position to the first point', () => {
			let result = sketches([], appendPoint(point(10,10)));
			expect(result).to.have.length(1);
			expect(result[0].position).to.deep.equal(point(10,10));
		})

		it('appends a point to the last sketch', () => {
			let result = sketches([], appendPoint(point(10,10)));
			expect(result[0].position).to.deep.equal(point(10,10));
		})

		it('cannot create a new sketch if one exists', () => {
			let currentSketches = [{
				strokes: []
			}]
			let result = sketches(currentSketches, appendPoint(point(10,11)));
			expect(result).to.have.length(1)
		})

		it('keeps the original position', () => {
			let currentSketches = [{
				strokes: [],
				position: point(10,10)
			}]
			let result = sketches(currentSketches, appendPoint(point(10,11)));
			expect(result[0].position).to.deep.equal(point(10,10));
		})

	})

	describe('starting a stroke', () => {

		it('when no sketch exists creates a sketch', () => {
			let result = sketches(
				[],
				createStroke(point(10,10))
			);
			expect(result).to.have.length(1)
		})

		it('initializes a sketch at the given position', () => {
			let result = sketches(
				[],
				createStroke(point(10,10))
			);
			expect(result[0].position).to.deep.equal(point(10,10));
		})

		it('adds a sketch if one sketch exists', () => {
			let result = sketches(
				[{ strokes: [] }],
				createStroke(point(10,10))
			);
			expect(result).to.have.length(2);
		})

		it('adds a sketch if multiple sketches exists', () => {
			let result = sketches(
				[{ strokes: [] }, { strokes: [] }],
				createStroke(point(10,10))
			);
			expect(result).to.have.length(3);
		})

	})

	describe('finishing a stroke', () => {

		it('marks the only sketch as finished', () => {
			let result = sketches(
				[{ strokes: [] }],
				finishStroke(point(10,10))
			);
			expect(result[0].finished).to.be.true
		})

		it('marks the last sketch as finished', () => {
			let result = sketches(
				[{ strokes: [] }, { strokes: [] }],
				finishStroke(point(10,10))
			);
			expect(result[1].finished).to.be.true
		})

	})


})