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
						if (e && (e.customMessage === 'Invalid templateName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if templateName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid templateName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the "to" email is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid "to" email string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the "to" email is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', '')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid "to" email string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if subject is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid subject string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if subject is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com', '')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid subject string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
			it('should execute successfully up to the email sending point', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmail('sample', 'admin@ramster.com', 'testSubject')
					} catch(e) {
						if (e && ((e.message === 'Unauthorized') || (e.code === 'ENOTFOUND'))) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error thrown')
					return true
				})
			})
		})
	}
}