const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testJob0: function() {
		const instance = this
		let jobs = null
		describe('cronJobs.0', function() {
			before(function() {
				jobs = instance.modules.cronJobs.jobs
				return true
			})
			it('should execute successfully and return true', function() {
				return co(function*() {
					let result = yield jobs[0].onTick()
					assert.strictEqual(result, true, `bad value ${result} for result, expected true`)
					return true
				})
			})
		})
	}
}
