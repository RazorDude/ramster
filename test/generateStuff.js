'use strict'

const
	co = require('co'),
	{codeGenerator} = require('../index'),
	fs = require('fs-extra'),
	path = require('path')

co(function*() {
	yield codeGenerator.generateBasicProject(__dirname)
	codeGenerator.config = require('./config')
	yield codeGenerator.generateNGINXConfig('site')
	yield codeGenerator.generateImagesRedirectNGINXConfig(path.join(__dirname, 'config/nginx'))
	yield codeGenerator.buildLayoutFile('site')

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

	return true
}).then((res) => true, (err) => console.log(err))
