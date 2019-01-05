'use strict'
const
	argv = require('yargs').argv,
	co = require('co'),
	config = require('./config'),
	{Core} = require('ramster'),
	ramster = new Core(config)

if (argv.runTests) {
	let thereWereErrors = false
	afterEach(function() {
		if (!thereWereErrors && (this.currentTest.state !== 'passed')) {
			thereWereErrors = true
		}
	})
	after(function() {
		setTimeout(() => {
			if (thereWereErrors) {
				process.exit(1)
			}
			process.exit(0)
		}, 1000)
	})
	ramster.runTests({
		testConfig: (argv.testConfig === 'true') || (argv.testConfig === true),
		testDB: (argv.testDB === 'true') || (argv.testDB === true),
		testDBInjectedModules: (argv.testDBInjectedModules === 'true') || (argv.testDBInjectedModules === true),
		testClients: (argv.testClients === 'true') || (argv.testClients === true) ? true : argv.testClients,
		testAPIs: (argv.testAPIs === 'true') || (argv.testAPIs === true) ? true : argv.testAPIs,
		testWebpackBuildTools: (argv.testWebpackBuildTools === 'true') || (argv.testWebpackBuildTools === true),
		staticDataFileNames: argv.staticDataFileNames ? JSON.parse(argv.staticDataFileNames) : undefined
	})
	if (argv.testLint === 'true') {
		ramster.runLintTests(__dirname, `{,!(node_modules)/**/}*.js`, 'public')
	}
} else {
	co(function*() {
		yield ramster.loadDependencies()
		yield ramster.loadDB()
		yield ramster.loadMailClient()
		ramster.loadMigrations()
		yield ramster.loadClients()
		yield ramster.loadAPIs()
		ramster.loadCRONJobs()
		yield ramster.listen()
	}).then((res) => true, (err) => console.log(err))
}

module.exports = ramster
