const
	assert = require('assert'),
	co = require('co'),
	{describeSuiteConditionally, runTestConditionally} = require('../toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	moment = require('moment')

module.exports = {
	testMe: function() {
		const instance = this
		describe('base-server.component', function() {
			it('should execute testDecodeQueryValues successfully', function() {
				instance.testDecodeQueryValues()
				assert(true)
			})
		})
	},
	testDecodeQueryValues: function() {
		const instance = this
		let {components} = this
		describe('base-server.component.decodeQueryValues', function() {
			it('should execute successfully and return null if the provided object is undefined', function() {
				assert(instance.decodeQueryValues() === null)
			})
			it('should execute successfully and return the provided item as-is, if it is null', function() {
				assert(instance.decodeQueryValues(null) === null)
			})
			it('should execute successfully and return the provided item as-is, if it is a string', function() {
				assert(instance.decodeQueryValues('test') === 'test')
			})
			it('should execute successfully and return the provided item as-is, if it is a number', function() {
				assert(instance.decodeQueryValues(12) === 12)
			})
			it('should execute successfully and return the provided item as-is, if it is a boolean', function() {
				assert(instance.decodeQueryValues(true) === true)
			})
			it('should execute successfully and return the decoded object', function() {
				let decodedObject = instance.decodeQueryValues({
					justAKey: 'testValue',
					[encodeURIComponent('AKey&ASpecialValue%')]: {
						12: true,
						a: encodeURIComponent('some%test&123=6059testValue'),
						b: [1, 2, 3, 4, encodeURIComponent('Te&s=%t')]
					}
				})
				// console.log(
				// 	decodedObject.justAKey === 'testValue',
				// 	typeof decodedObject['AKey&ASpecialValue%'] === 'object',
				// 	!(decodedObject['AKey&ASpecialValue%'] instanceof Array),
				// 	decodedObject['AKey&ASpecialValue%']['12'] === true,
				// 	decodedObject['AKey&ASpecialValue%'].a === 'some%test&123=6059testValue',
				// 	decodedObject['AKey&ASpecialValue%'].b instanceof Array,
				// 	decodedObject['AKey&ASpecialValue%'].b[0] === 1,
				// 	decodedObject['AKey&ASpecialValue%'].b[1] === 2,
				// 	decodedObject['AKey&ASpecialValue%'].b[2] === 3,
				// 	decodedObject['AKey&ASpecialValue%'].b[3] === 4,
				// 	decodedObject['AKey&ASpecialValue%'].b[4] === 'Te&s=%t'
				// )
				assert(
					(decodedObject.justAKey === 'testValue') &&
					(typeof decodedObject['AKey&ASpecialValue%'] === 'object') &&
					!(decodedObject['AKey&ASpecialValue%'] instanceof Array) &&
					(decodedObject['AKey&ASpecialValue%']['12'] === true) &&
					(decodedObject['AKey&ASpecialValue%'].a === 'some%test&123=6059testValue') &&
					(decodedObject['AKey&ASpecialValue%'].b instanceof Array) &&
					(decodedObject['AKey&ASpecialValue%'].b[0] === 1) &&
					(decodedObject['AKey&ASpecialValue%'].b[1] === 2) &&
					(decodedObject['AKey&ASpecialValue%'].b[2] === 3) &&
					(decodedObject['AKey&ASpecialValue%'].b[3] === 4) &&
					(decodedObject['AKey&ASpecialValue%'].b[4] === 'Te&s=%t')
				)
			})
		})
	}
}
