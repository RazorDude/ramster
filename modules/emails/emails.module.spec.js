const
	assert = require('assert'),
	co = require('co')

module.exports = {
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
			it('should execute successfully if all parameters are correct', function() {
				this.timeout(10000)
				return co(function*() {
					yield instance.sendEmail('sample', 'admin@ramster.com', 'testSubject')
					return true
				})
			})
		})
	}
}