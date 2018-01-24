'use strict'

const
	co = require('co'),
	fs = require('fs-extra'),
	handlebars = require('handlebars'),
	path = require('path'),
	pug = require('pug'),
	spec = require('./index.spec')

class CodeGenerator {
	constructor(config) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		if (config) {
			this.config = config
		}
	}

	checkConfig(config, options) {
		if (!config) {
			throw {customMessage: 'No valid config property exists for this class. Please provide the config object on class instance creation, or at a later point by accessing the config property.'}
		}
		if (options) {
			const {clientModuleName, apiModuleName} = options
			if (clientModuleName && !config.clients[clientModuleName]) {
				throw {customMessage: 'No client module config exists in the provided config for the provided client module name.'}
			}
			if (apiModuleName && !config.apis[apiModuleName]) {
				throw {customMessage: 'No api module config exists in the provided config for the provided api module name.'}
			}
		}
		return true
	}

	generateConfigFile(outputPath, outputFileName, templateFilePath) {
		const instance = this
		return co(function*() {
			let configTemplate = yield fs.readFile(templateFilePath)
			try {
				let dirStats = yield fs.lstat(outputPath)
				if (!dirStats.isDirectory()) {
					throw {customMessage: 'The provided output path already exists, but is not a directory.'}
				}
			} catch (e) {
				if (!e || (e.customMessage !== 'The provided output path already exists, but is not a directory.')) {
					yield fs.mkdirp(outputPath)
				} else {
					throw e
				}
			}
			let fd = yield fs.open(path.join(outputPath, outputFileName), 'w')
			yield fs.writeFile(fd, configTemplate)
			yield fs.close(fd)
			return true
		})
	}

	generateIndexConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'index.js', path.join(__dirname, '../shared/templates/config/index.js'))
	}

	generateCommonConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'common.js', path.join(__dirname, '../shared/templates/config/common.js'))
	}

	generateProfileConfigFile(outputPath, profileName) {
		if ((typeof profileName !== 'string') || !profileName.length) {
			throw {customMessage: 'The profileName argument must be a non-empty string.'}
		}
		return this.generateConfigFile(path.join(outputPath, './profiles'), `${profileName}.js`, path.join(__dirname, '../shared/templates/config/profiles/local.js'))
	}

	buildLayoutFile(clientModuleName) {
		const instance = this,
			{config} = this
		return co(function*() {
			if ((typeof clientModuleName !== 'string') || !clientModuleName.length) {
				throw {customMessage: 'The clientModuleName argument must be a non-empty string.'}
			}
			instance.checkConfig(config, {clientModuleName})
			const moduleConfig = config.clients[clientModuleName]
			let publicSourcesPath = path.join(config.clientModulesPublicSourcesPath, clientModuleName),
				publicPath = path.join(config.clientModulesPublicPath, clientModuleName),
				profileLayoutFilePath = path.join(publicSourcesPath, 'layout_' + config.name + '.pug'),
				dirStats = yield fs.lstat(publicSourcesPath)
			if (!dirStats.isDirectory()) {
				throw {customMessage: 'The client module public sources path exists, but is not a directory.'}
			}
			dirStats = yield fs.lstat(publicPath)
			if (!dirStats.isDirectory()) {
				throw {customMessage: 'The client module public path exists, but is not a directory.'}
			}
			let layoutData = (pug.compileFile(profileLayoutFilePath, {}))(),
				layoutFilePath = path.join(publicPath, 'layout.html'),
				layoutFile = yield fs.open(layoutFilePath, 'w')
			yield fs.writeFile(layoutFile, layoutData)
			yield fs.close(layoutFile)
			return true
		})
	}

	generateImagesRedirectNGINXConfig(outputPath) {
		const instance = this,
			{config} = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			let outputFilePath = path.join(outputPath, './images.conf')
			try {
				let dirStats = yield fs.lstat(outputPath)
				if (!dirStats.isDirectory()) {
					throw {customMessage: 'The provided outputPath path exists, but is not a directory.'}
				}
			} catch (e) {
				if (!e || (e.customMessage !== 'The provided output path already exists, but is not a directory.')) {
					yield fs.mkdirp(outputPath)
				} else {
					throw e
				}
			}
			let outputFile = yield fs.open(outputFilePath, 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, '../shared/templates/config/nginx/images.conf')))
			yield fs.close(outputFile)
			return true
		})
	}

	generateNGINXConfig(clientModuleName) {
		const instance = this,
			{config} = this
		return co(function*() {
			if ((typeof clientModuleName !== 'string') || !clientModuleName.length) {
				throw {customMessage: 'The clientModuleName argument must be a non-empty string.'}
			}
			instance.checkConfig(config, {clientModuleName})
			const moduleConfig = config.clients[clientModuleName], {
					serverPort,
					nodeProxyProtocol,
					nodeProxyHostAddress,
					nodeProxyServerPort,
					prependWSServerConfigFromFiles,
					appendWSServerConfigFromFiles,
					webpackHost,
					webpackBuildFolderName
				} = moduleConfig,
				{projectName, clientModulesPublicPath, wsPort, wsConfigFolderPath, mountGlobalStorageInWebserver, globalStoragePath, addDistToStaticConfigInWebserver, hostProtocol, hostAddress} = config
			let configFilePath = path.join(wsConfigFolderPath, `${projectName}-${clientModuleName}.conf`),
				configFile = yield fs.open(configFilePath, 'w'),
				prependToServerConfig = '',
				appendToServerConfig = '',
				bundleConfig = '',
				distToStaticConfig = '',
				publicPath = path.join(clientModulesPublicPath, clientModuleName)

			if (prependWSServerConfigFromFiles instanceof Array) {
				for (const i in prependWSServerConfigFromFiles) {
					prependToServerConfig += (yield fs.readFile(prependWSServerConfigFromFiles[i])).toString()
				}
			}

			if (appendWSServerConfigFromFiles instanceof Array) {
				for (const i in appendWSServerConfigFromFiles) {
					appendToServerConfig += (yield fs.readFile(appendWSServerConfigFromFiles[i])).toString()
				}
			}

			if (mountGlobalStorageInWebserver) {
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, '../shared/templates/config/nginx/global-storage.conf'))).toString())
				prependToServerConfig += template({globalStoragePath: globalStoragePath.replace(/\\/g, '\\\\')})
			}

			if (webpackHost) {
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, '../shared/templates/config/nginx/bundle.conf'))).toString())
				bundleConfig += template({webpackHost, webpackFolder: webpackBuildFolderName || 'dist'})
			}

			if (addDistToStaticConfigInWebserver) {
				distToStaticConfig = yield fs.readFile(path.join(__dirname, '../shared/templates/config/nginx/distToStatic.conf'))
			}

			let template = handlebars.compile((yield fs.readFile(path.join(__dirname, '../shared/templates/config/nginx/main.conf'))).toString())
			yield fs.writeFile(configFile, template({
				listeningPort: wsPort,
				serverName: hostAddress,
				serverRoot: /^win/.test(process.platform) ? publicPath.replace(/\\/g, '\\\\') : publicPath,
				prependToServerConfig,
				appendToServerConfig,
				bundleConfig,
				distToStaticConfig,
				nodeProxyProtocol: nodeProxyProtocol || hostProtocol,
				nodeProxyHostAddress: nodeProxyHostAddress || hostAddress,
				nodeProxyServerPort: nodeProxyServerPort || serverPort
			}))
			yield fs.close(configFile)

			return true
		})
	}
}

module.exports = CodeGenerator
