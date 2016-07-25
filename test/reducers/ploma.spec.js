import ploma from 'reducers/ploma'
import * as types from 'constants/actionTypes'
import { point } from '../helpers'
import { togglePloma } from 'actions/configuring'

describe('ploma', () => {
	describe('initial state', () => {

		it('uses ploma', () => {
			expect(ploma(undefined, {}).usePloma).to.be.true;
		})

		it('sets a random unique canvas factor', () => {
			let factor1 = ploma(undefined, {}).uniqueCanvasFactor;
			let factor2 = ploma(undefined, {}).uniqueCanvasFactor;
			expect(factor1).to.exist;
			expect(factor2).to.exist;
			expect(factor1).to.not.equal(factor2)
		})

	})

	describe('toggles', () => {

		it('from false to true', () => {
			let action = togglePloma(true)
			let oldState = {
				usePloma: false
			}
			expect(ploma(oldState, action).usePloma).to.be.true
		})

		it('true to false', () => {
			let action = togglePloma(false)
			let oldState = {
				usePloma: true
			}
			expect(ploma(oldState, action).usePloma).to.be.false
		})

	})

})