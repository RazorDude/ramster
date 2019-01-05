const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testGetField: function() {
		const instance = this
		describe('testModule.doSomething', function() {
			it('should return true when executed', function() {
				return co(function*() {
					let value = yield instance.doSomething()
					assert.strictEqual(value, true, `bad value ${value} for return value, expected true`)
					return true
				})
			})
		})
	}
}
