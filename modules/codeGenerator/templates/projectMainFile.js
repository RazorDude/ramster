'use strict'
const
	argv = require('optimist').argv,
	co = require('co'),
	config = require('./config/profiles/' + (argv.configProfile || 'local')),
	{Core} = require('ramster'),
	ramster = new Core(config)

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

module.exports = ramster
