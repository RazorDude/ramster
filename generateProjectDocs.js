'use strict'
const
	co = require('co'),
	{codeGenerator} = require('./index'),
	path = require('path')

co(function*() {
	console.log('Generating...')
	yield codeGenerator.generateDocs(__dirname, '**/*.js', path.join(__dirname, './docs'), [
		'node_modules',
		'test/',
		'.spec.js',
		'modules/api/index.js',
		'modules/client/index.js',
		'modules/codeGenerator/index.js',
		'modules/codeGenerator/test',
		'modules/codeGenerator/templates',
		'modules/csvPromise/index.js',
		'modules/db/index.js',
		'modules/emails/index.js',
		'modules/errorLogger/index.js',
		'modules/generalStore/index.js',
		'modules/migrations/index.js',
		'modules/tokenManager/index.js',
		'modules/toolbelt/index.js',
		'generateProjectDocs.js'
	])
}).then((res) => {
		console.log('Docs generated successfully.')
		process.exit(0)
	},
	(err) => {
		console.log('Error when generating the docs:', err)
		process.exit(1)
	}
)
