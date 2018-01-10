'use strict'

const
	assert = require('assert'),
	co = require('co'),
	config = require('./config'),
	{Core} = require('../index')

co(function*() {
	let core = new Core(config)
	core.testConfig()
	// yield core.listen()
	return true
}).then((res) => console.log('[TEST]: all tests completed.'), (err) => {
	console.log('[TEST]: Failed to execute all tests. Error:', err)
})
