'use strict'

const
	co = require('co'),
	{codeGenerator, Core} = require('../index'),
	path = require('path')

co(function*() {
	let outputPath = path.join(__dirname, './config')
	yield codeGenerator.generateIndexConfigFile(outputPath)
	yield codeGenerator.generateCommonConfigFile(outputPath)
	yield codeGenerator.generateProfileConfigFile(outputPath, 'local')

	let core = new Core(require('./config'))

	codeGenerator.config = core.config
	yield codeGenerator.buildLayoutFile('site')
	yield codeGenerator.generateImagesRedirectNGINXConfig(path.join(outputPath, './nginx'))

	return true
}).then((res) => true, (err) => console.log(err))
