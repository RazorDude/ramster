'use strict'

const
	argv = require('yargs').argv,
	co = require('co'),
	{codeGenerator} = require('../index'),
	fs = require('fs-extra'),
	path = require('path')

co(function*() {
	yield codeGenerator.generateBasicProject(__dirname, argv.configProfile)
	codeGenerator.config = require('./config')
	yield codeGenerator.generateNGINXConfig('site')
	yield codeGenerator.generateImagesRedirectNGINXConfig(path.join(__dirname, 'config/nginx'))
	yield codeGenerator.buildLayoutFile('site')

	let projectMainFilePath = path.join(__dirname, 'index.js'),
		fileData = (yield fs.readFile(projectMainFilePath)).toString().replace(/require\('ramster'\)/g, `require('../index')`),
		fd = yield fs.open(projectMainFilePath, 'w')
	yield fs.writeFile(fd, fileData)
	yield fs.close(fd)

	// replace "require('ramster')" with "require('../../../../index')" in db modules and with "require('../../../../../index')" in clients and apis
	let dbComponentsPath = path.join(__dirname, 'modules/db'),
		dbComponents = yield fs.readdir(dbComponentsPath)
	for (const i in dbComponents) {
		const componentName = dbComponents[i],
			componentIndexFilePath = path.join(dbComponentsPath, componentName, 'index.js')
		let fileData = (yield fs.readFile(componentIndexFilePath)).toString().replace(/require\('ramster'\)/g, `require('../../../../index')`),
			fd = yield fs.open(componentIndexFilePath, 'w')
		yield fs.writeFile(fd, fileData)
		yield fs.close(fd)
	}
	yield fs.copy(
		path.join(__dirname, '../modules/codeGenerator/templates/modules/testModule'),
		path.join(__dirname, './modules/testModule')
	)

	let clientModulesPath = path.join(__dirname, 'modules/clients'),
		clientModules = yield fs.readdir(clientModulesPath)
	for (const i in clientModules) {
		const moduleName = clientModules[i]
		if (moduleName.indexOf('.') === -1) {
			const modulePath = path.join(clientModulesPath, moduleName),
				moduleComponents = yield fs.readdir(modulePath)
			for (const j in moduleComponents) {
				const componentName = moduleComponents[j]
				if (componentName.indexOf('.') === -1) {
					const componentIndexFilePath = path.join(modulePath, componentName, 'index.js')
					let fileData = (yield fs.readFile(componentIndexFilePath)).toString().replace(/require\('ramster'\)/g, `require('../../../../../index')`),
						fd = yield fs.open(componentIndexFilePath, 'w')
					yield fs.writeFile(fd, fileData)
					yield fs.close(fd)
				}
			}
		}
	}

	let pathToESLintRC = path.join(__dirname, '../.eslintrc')
	try {
		yield fs.lstat(pathToESLintRC)
	} catch(e) {
		yield fs.copyFile(path.join(__dirname, '.eslintrc'), pathToESLintRC)
	}

	return true
}).then((res) => process.exit(0), (err) => {
	console.log(err)
	process.exit(1)
})
