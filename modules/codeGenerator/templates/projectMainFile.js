'use strict'
const
	argv = require('optimist').argv,
	co = require('co'),
	config = require('./config'),
	{Core} = require('ramster'),
	ramster = new Core(config)

if (argv.runTests) {
	ramster.runTests({
		testDB: argv.testDB === 'true',
		testClients: argv.testClients === 'true' ? true : argv.testClients,
		testAPIs: argv.testAPIs === 'true' ? true : argv.testAPIs
	})
} else {
	co(function*() {
		yield ramster.loadDependencies()
		yield ramster.loadDB()
		yield ramster.loadMailClient()
		yield ramster.loadMigrations()
		yield ramster.loadClients()
		yield ramster.loadAPIs()
		yield ramster.loadCRONJobs()
		yield ramster.listen()
	}).then((res) => true, (err) => console.log(err))
}

module.exports = ramster
