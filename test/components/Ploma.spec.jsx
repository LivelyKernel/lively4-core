import Ploma from 'components/Ploma';
import TestUtils from 'react-addons-test-utils';
import React from 'react';
import { point } from '../helpers'

describe('Ploma', () => {

	it('toggling without a callback does nothing', () => {
		let ploma = TestUtils.renderIntoDocument(<Ploma></Ploma>);
		expect(ploma.props.usePloma).to.be.true;
		TestUtils.Simulate.click(ploma.refs.toggle);
		expect(ploma.props.usePloma).to.be.true;
	})

	it('calls callback with true when not checked and clicked', () => {
		let value = false;
		let ploma = TestUtils.renderIntoDocument(<Ploma
			usePloma={false}
			onToggle={(bool) => {
				value=bool
			}}
		></Ploma>);
		TestUtils.Simulate.click(ploma.refs.toggle);
		expect(value).to.be.true;
	})
})