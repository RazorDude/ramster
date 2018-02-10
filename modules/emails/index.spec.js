'use strict'
const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testMe: function() {
		const instance = this
		describe('mailClient', function() {
			it('should execute testSendEmail successfully', function() {
				instance.testSendEmail()
				assert(true)
			})
		})
	},
	testSendEmail: function() {
		const instance = this
		describe('mailClient.sendEmail', function() {
			it('should throw an error with the correct message if templateName is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid templateName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if templateName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid templateName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the "to" email is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid "to" email string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the "to" email is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', '')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid "to" email string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if subject is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid subject string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if subject is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com', '')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid subject string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully up to the emal sending point', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com', 'testSubject')
					} catch(e) {
						didThrowAnError = e && (e.message === 'Unauthorized')
					}
					assert(didThrowAnError)
					return true
				})
			})
		})
	}
}