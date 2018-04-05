'use strict'

const
	assert = require('assert')

module.exports = {
	testMe: function() {
		const instance = this
		describe('errorLogger', function() {
			it('should execute the error logging function successfully', function() {
				instance.error({customMessage: 'Exception test.'})
				assert(true)
			})
		})
	}
}
