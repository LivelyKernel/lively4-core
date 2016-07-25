import undoable from 'reducers/undoable'
import { jumpToFuture, jumpToPast } from 'actions/timetravel'
import * as types from 'constants/actionTypes'

let emptyState = {
	future: [],
	past: [],
	present: 'default'
}

let dummyEndState = {
	past: ['', 'd', 'de', 'def', 'defa', 'defau', 'defaul'],
	future: [],
	present: 'default'
}

let dummyStartState = {
	past: [],
	future: ['d', 'de', 'def', 'defa', 'defau', 'defaul', 'default'],
	present: ''
}

let dummyThreeState = {
	past: ['', 'd', 'de'],
	future: ['defa', 'defau', 'defaul', 'default'],
	present: 'def'
}

let dummyFourState = {
	past: ['', 'd', 'de', 'def'],
	future: ['defau', 'defaul', 'default'],
	present: 'defa'
}

let dummySixState = {
	past: ['', 'd', 'de', 'def', 'defa', 'defau'],
	future: ['default'],
	present: 'defaul'
}

describe('undoable', () => {

	describe('initial state', () => {

		it('creates the default present', () => {
			let actualState = undoable((state = '') => state)(undefined, {})
			expect(actualState.present).to.deep.equal('');
		})

		it('creates an empty past', () => {
			let actualState = undoable((state = '') => state)(undefined, {})
			expect(actualState.past).to.deep.equal([]);
		})

		it('creates an empty future', () => {
			let actualState = undoable((state = '') => state)(undefined, {})
			expect(actualState.future).to.deep.equal([]);
		})
	})

	describe('undoing', () => {

		it('does nothing if history is empty', () => {
			let actualState = undoable((state = '') => state)(emptyState, jumpToPast(3))
			expect(actualState).to.deep.equal(emptyState);
		})

		it('goes back to start when jumping back further than start', () => {
			let actualState = undoable((state = '') => state)(dummyEndState, jumpToPast(-1))
			expect(actualState).to.deep.equal(dummyStartState);
		})

		it('can go back to first state in history', () => {
			let actualState = undoable((state = '') => state)(dummyEndState, jumpToPast(0))
			expect(actualState).to.deep.equal(dummyStartState);
		})

		it('can go back to some state in history', () => {
			let actualState = undoable((state = '') => state)(dummyEndState, jumpToPast(3))
			expect(actualState).to.deep.equal(dummyThreeState);
		})

		it('can go back to second to last state', () => {
			let actualState = undoable((state = '') => state)(dummyEndState, jumpToPast(6))
			expect(actualState).to.deep.equal(dummySixState);
		})
	})

	describe('redoing', () => {

		it('does nothing if future is empty', () => {
			let actualState = undoable((state = '') => state)(emptyState, jumpToFuture(3))
			expect(actualState).to.deep.equal(emptyState);
		})

		it('goes forward to end when jumping further than end', () => {
			let actualState = undoable((state = '') => state)(dummyStartState, jumpToFuture(10))
			expect(actualState).to.deep.equal(dummyEndState);
		})

		it('can go forward to last state in future', () => {
			let actualState = undoable((state = '') => state)(dummyStartState, jumpToFuture(7))
			expect(actualState).to.deep.equal(dummyEndState);
		})

		it('can go forward to some state in future', () => {
			let actualState = undoable((state = '') => state)(dummyStartState, jumpToFuture(3))
			expect(actualState).to.deep.equal(dummyThreeState);
		})

		it('can go forward one step to the future', () => {
			let actualState = undoable((state = '') => state)(dummyThreeState, jumpToFuture(1))
			expect(actualState).to.deep.equal(dummyFourState);
		})
	})

})