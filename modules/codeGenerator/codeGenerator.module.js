'use strict'
/**
 * The codeGenerator module. Contains the CodeGenerator class.
 * @module codeGeneratorModule
 */

const
	co = require('co'),
	fs = require('fs-extra'),
	handlebars = require('handlebars'),
	path = require('path'),
	pug = require('pug'),
	spec = require('./codeGenerator.module.spec')

/**
 * The CodeGenerator class. Contains various methods for building and generating a wide variety of code files for a new or an existing project.
 * @class CodeGenerator
 */
class CodeGenerator {
	/**
	 * Creates an instance of CodeGenerator. Sets test methods (defined in the accompanying .spec.js file) and adds the provided config param as a method property (if provided).
	 * @param {object} config (optional) The full project config.
	 * @see module:configModule
	 * @memberof CodeGenerator
	 */
	constructor(config) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		if (config) {
			/**
			 * The full project config.
			 * @type {object}
	 		 * @see module:configModule
			 */
			this.config = config
		}
		/**
		 * An array containing class method names for which a project config is required to execute sucessfuly.
		 * @member {string[]}
		 */
		this.configRequiredForMethods = ['buildLayoutFile', 'generateNGINXConfig']
	}

	/**
	 * Builds the layout.html file for a given client module out of it's layout_<configProfileName>.pug file.
	 * @param {string} clientModuleName The name of the client module to build the layout file for.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
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

	/**
	 * Checks if a given config exists, and (optonally) check for the existence of a clent/api module with a given name within that config.
	 * @param {object} config The full project config.
	 * @see module:configModule
	 * @param {object} options (optional) The client/api module names to check for.
	 * @param {string} options.clientModuleName (optional) The name of the client module to check for - an error will be thrown if config.clients[clientModuleName] is undefined.
	 * @param {string} options.apiModuleName (optional) The name of the api module to check for - an error will be thrown if config.apis[apiModuleName] is undefined.
	 * @returns {boolean} The method returns true if the checks were successful, otherwise appropriate errors are thrown.
	 * @memberof CodeGenerator
	 */
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

	/**
	 * Check if a given outputPath exists, and if it's a directory. Throws errors if it's not.
	 * @param {string} outputPath The path to check.
	 * @returns {Promise<boolean>} A promise which wraps a generator function. The promise resolution equals true if the checks were successful, otherwise appropriate errors are thrown.
	 * @memberof CodeGenerator
	 */
	checkOutputPath(outputPath) {
		return co(function*() {
			try {
				let dirStats = yield fs.lstat(outputPath)
				if (!dirStats.isDirectory()) {
					throw {customMessage: 'The provided outputPath path exists, but is not a directory.'}
				}
			} catch (e) {
				if (!e || (e.customMessage !== 'The provided output path exists, but is not a directory.')) {
					yield fs.mkdirp(outputPath)
				} else {
					throw e
				}
			}
			return true
		})
	}

	/**
	 * Generates a project config file from a template file.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @param {string} outputFileName The name of the generated file 
	 * @param {string} templateFilePath The path to put the config template file. An error will be thrown if no file exists at it.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateConfigFile(outputPath, outputFileName, templateFilePath) {
		const instance = this
		return co(function*() {
			let configTemplate = yield fs.readFile(templateFilePath)
			yield instance.checkOutputPath(outputPath)
			let fd = yield fs.open(path.join(outputPath, outputFileName), 'w')
			yield fs.writeFile(fd, configTemplate)
			yield fs.close(fd)
			return true
		})
	}

	/**
	 * Generates a project config file based on the "config/index.js" template. The purpose of this file is to merge the common config with the current profile config.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateIndexConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'index.js', path.join(__dirname, './templates/config/index.js'))
	}

	/**
	 * Generates a project config file based on the "config/common.js" template. The purpose of this file is to contain configuration options for the project, which are shared across all config profiles (i.e. are common for the project).
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateCommonConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'common.js', path.join(__dirname, './templates/config/common.js'))
	}

	/**
	 * Generates a project config file based on the "config/profiles/<profileName>.js" template. The purpose of this file is to contain profile-specific configuration options. If some of them match the keys of certain configuration options from the common config file, the ones in the common config file will be overwritten.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @param {string} profileName The name of the config profile, whose template is to be used. An error will be thrown if it does not exist.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateProfileConfigFile(outputPath, profileName) {
		if ((typeof profileName !== 'string') || !profileName.length) {
			throw {customMessage: 'The profileName argument must be a non-empty string.'}
		}
		return this.generateConfigFile(path.join(outputPath, './profiles'), `${profileName}.js`, path.join(__dirname, `./templates/config/profiles/${profileName}.js`))
	}

	/**
	 * Generates an NGINX config file based on the "config/nginx/images.conf" template. The purpose of this file is to set up the serving of static image assets and image-not-found placeholders.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateImagesRedirectNGINXConfig(outputPath) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			let outputFilePath = path.join(outputPath, './images.conf')
			yield instance.checkOutputPath(outputPath)
			let outputFile = yield fs.open(outputFilePath, 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, './templates/config/nginx/images.conf')))
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates the main NGINX config file based on the configuration variables in the project's config, as well as the ones in the specified clientModule's config. This file is meant to be used directly, or with minor adjustments, as the full NGINX config for your client server.
	 * @param {string} clientModuleName The name of the client module whose config will be used.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
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
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './templates/config/nginx/global-storage.conf'))).toString())
				prependToServerConfig += template({globalStoragePath: globalStoragePath.replace(/\\/g, '\\\\')})
			}

			if (webpackHost) {
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './templates/config/nginx/bundle.conf'))).toString())
				bundleConfig += template({webpackHost, webpackFolder: webpackBuildFolderName || 'dist'})
			}

			if (addDistToStaticConfigInWebserver) {
				distToStaticConfig = yield fs.readFile(path.join(__dirname, './templates/config/nginx/distToStatic.conf'))
			}

			let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './templates/config/nginx/main.conf'))).toString())
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

	/**
	 * Generates a webpack config file based on template in "config/webpack/<type>.js". The generated file will contain the webpack config to be used when building the project (or module) 's front-end code.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @param {string} type The type of the webpack config - "react", angular", etc. It must exist in "config/webpack", otherwise an error will be thrown.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateWebpackConfig(outputPath, type) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let configFileData = null
			try {
				configFileData = yield fs.readFile(path.join(__dirname, `templates/config/webpack/${type}.js`))
			} catch(e) {
				throw {customMessage: 'Invalid webpack config type.'}
			}
			let outputFilePath = path.join(outputPath, `${type}.js`),
				outputFile = yield fs.open(outputFilePath, 'w')
			yield fs.writeFile(outputFile, configFileData)
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates the webpackBuild and webpackDevserver build tools.
	 * @param {string} outputPath The path to the folder in which the generated files will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateWebpackBuildTools(outputPath) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let outputFile = yield fs.open(path.join(outputPath, `webpackDevserver.js`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/webpackDevserver.js`)))
			yield fs.close(outputFile)
			outputFile = yield fs.open(path.join(outputPath, `webpackBuild.js`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/webpackBuild.js`)))
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates the project's main, entry-point file. It's used to start the node process and run tests.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateProjectMainFile(outputPath) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let outputFile = yield fs.open(path.join(outputPath, `index.js`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/projectMainFile.js`)))
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates the project's gitignore file.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateGitignore(outputPath) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let outputFile = yield fs.open(path.join(outputPath, `.gitignore`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/gitignore`)))
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates the project's basic directory structure.
	 * @param {string} outputPath The path to the folder in which the generated folders will be put. Must be a valid and accessible directory.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateFolders(outputPath) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			yield fs.mkdirp(path.join(outputPath, 'clients'))
			yield fs.mkdirp(path.join(outputPath, 'config/profiles'))
			yield fs.mkdirp(path.join(outputPath, 'logs'))
			yield fs.mkdirp(path.join(outputPath, 'modules/db'))
			yield fs.mkdirp(path.join(outputPath, 'modules/clients'))
			yield fs.mkdirp(path.join(outputPath, 'modules/apis'))
			yield fs.mkdirp(path.join(outputPath, 'modules/emails/templates'))
			yield fs.mkdirp(path.join(outputPath, 'modules/migrations/seedFiles'))
			yield fs.mkdirp(path.join(outputPath, 'modules/migrations/syncHistory'))
			yield fs.mkdirp(path.join(outputPath, 'modules/migrations/backup'))
			yield fs.mkdirp(path.join(outputPath, 'modules/migrations/staticData'))
			yield fs.mkdirp(path.join(outputPath, 'public'))
			yield fs.mkdirp(path.join(outputPath, 'storage/importTemplates'))
			yield fs.mkdirp(path.join(outputPath, 'storage/tmp'))
			return true
		})
	}

	/**
	 * Generates a layout_<configProfile>.pug for a client module, based on the provided configProfile arg.
	 * @param {string} outputPath The path to the folder in which the generated folders will be put. Must be a valid and accessible directory.
	 * @param {string} configProfile The name of the config profile, whose template is to be used. An error will be thrown if it does not exist.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateLayoutFile(outputPath, configProfile) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let outputFile = yield fs.open(path.join(outputPath, `layout_${configProfile || 'local'}.pug`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/clients/site/layout_${configProfile || 'local'}.pug`)))
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates a dbComponentName.model.d.ts file from a ramster dbComponent and puts it in the specified folder.
	 * @param {string} outputPath The path to the folder in which the generated file will be put. Must be a valid and accessible directory.
	 * @param {object} dbComponent The ramster dbComponent to take the data from.
	 * @param {object} Sequelize A static sequelize object to take dataTypes from.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateTypescriptModel(outputPath, dbComponent, Sequelize) {
		const instance = this,
			{sequelizeToTSTypeMap} = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			if ((typeof dbComponent !== 'object') || (dbComponent === null) || !dbComponent.model) {
				throw {customMessage: 'The dbComponent must a be a valid ramster dbComponent object.'}
			}
			yield instance.checkOutputPath(outputPath)
			const attributes = dbComponent.model.attributes
			let dataToWrite = `module.exports = {\n`
			for (const attrName in attributes) {
				const attrData = attributes[attrName]
				dataToWrite += `${attrName}: `
				if (attrData.type === Sequelize.ENUM) {
					
				} else if (attrData.type === Sequelize.ARRAY) {

				} else {

				}
				dataToWrite += ',\n'
			}
			dataToWrite = dataToWrite.substr(0, dataToWrite.length - 2)
			dataToWrite += '\n}\n'
			let outputFile = yield fs.open(path.join(outputPath, `${dbComponent.componentName}.model.d.ts`), 'w')
			yield fs.writeFile(outputFile, dataToWrite)
			yield fs.close(outputFile)
			return true
		})
	}

	/**
	 * Generates a project using the "blank" template, based on the provided configProfile arg. The "blank" template contains all the project's directory structure, the "index", "common" and "profile" project config files, the project main file and the webpack build tools.
	 * @param {string} outputPath The path to the folder in which the generated folders will be put. Must be a valid and accessible directory.
	 * @param {string} configProfile The name of the config profile, whose template is to be used. An error will be thrown if it does not exist.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateBlankProject(outputPath, configProfile) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			yield instance.generateProjectMainFile(outputPath)
			yield instance.generateGitignore(outputPath)
			yield instance.generateFolders(outputPath)
			yield instance.generateIndexConfigFile(path.join(outputPath, 'config'))
			yield instance.generateCommonConfigFile(path.join(outputPath, 'config'))
			yield instance.generateProfileConfigFile(path.join(outputPath, 'config'), configProfile || 'local')
			yield instance.generateWebpackBuildTools(outputPath)
			yield fs.copy(path.join(__dirname, 'templates/modules/emails/templates/sample.pug'), path.join(outputPath, 'modules/emails/templates/sample.pug'))
			return true
		})
	}

	/**
	 * Generates a project using the "basic" template, based on the provided configProfile arg. The "basic" template contains everythign in the "blank" template, plus:
	 * - webpack config for reactjs
	 * - db modules for globalConfig, moduleAccessPoints, moduleCategories, modules, users, userTypes
	 * - a "site" client module with components for layout and users
	 * - email templates for "resetPassword", "updateEmail" and "emailUpdatedSuccessfully"
	 * - a fully functioning access control system based on modules, user types and access points, as well as the code for creating and managing users, and updating their profile, password and email
	 * - full code coverage for the above, realized using mochajs .spec.js files
	 * - a staticData file and a mockStaticData file, containing basic example data for the above functionality
	 * - an empty cronJobs module
	 * - eslintrc, jsbeautifyrc and pug-lintrc
	 * @param {string} outputPath The path to the folder in which the generated folders will be put. Must be a valid and accessible directory.
	 * @param {string} configProfile The name of the config profile, whose template is to be used. An error will be thrown if it does not exist.
	 * @param {string} webpackConfigType (optional) The webpack config type to generate, defaults to 'react' if not provided. Can be 'react' or 'angular'.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof CodeGenerator
	 */
	generateBasicProject(outputPath, configProfile, webpackConfigType) {
		const instance = this
		return co(function*() {
			if ((typeof outputPath !== 'string') || !outputPath.length) {
				throw {customMessage: 'The outputPath argument must be a non-empty string.'}
			}
			yield instance.checkOutputPath(outputPath)
			let dbModules = ['globalConfig', 'moduleAccessPoints', 'moduleCategories', 'modules', 'users', 'userTypes'],
				clientModules = ['layout', 'users'],
				outputFile = null
			yield instance.generateBlankProject(outputPath, configProfile)
			yield fs.copy(path.join(__dirname, 'templates/eslintrc'), path.join(outputPath, '.eslintrc'))
			yield fs.copy(path.join(__dirname, 'templates/jsbeautifyrc'), path.join(outputPath, '.jsbeautifyrc'))
			yield fs.copy(path.join(__dirname, 'templates/pug-lintrc'), path.join(outputPath, '.pug-lintrc'))
			yield fs.copy(path.join(__dirname, 'templates/modules/emails/templates/emailUpdatedSuccessfully.pug'), path.join(outputPath, 'modules/emails/templates/emailUpdatedSuccessfully.pug'))
			yield fs.copy(path.join(__dirname, 'templates/modules/emails/templates/resetPassword.pug'), path.join(outputPath, 'modules/emails/templates/resetPassword.pug'))
			yield fs.copy(path.join(__dirname, 'templates/modules/emails/templates/updateEmail.pug'), path.join(outputPath, 'modules/emails/templates/updateEmail.pug'))
			yield fs.mkdirp(path.join(outputPath, 'config/webpack'))
			yield instance.generateWebpackConfig(path.join(outputPath, 'config/webpack'), webpackConfigType || 'react')
			yield instance.generateLayoutFile(path.join(outputPath, 'clients/site'), configProfile)
			yield fs.copy(path.join(__dirname, 'templates/clients/site/index.js'), path.join(outputPath, 'clients/site/index.js'))
			yield fs.mkdirp(path.join(outputPath, 'public/site'))
			for (const i in dbModules) {
				let moduleName = dbModules[i],
					modulePath = path.join(outputPath, `modules/db/${moduleName}`)
				yield fs.mkdirp(modulePath)
				outputFile = yield fs.open(path.join(modulePath, `index.js`), 'w')
				yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/modules/db/${moduleName}/index.js`)))
				yield fs.close(outputFile)
				outputFile = yield fs.open(path.join(modulePath, `index.spec.js`), 'w')
				yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/modules/db/${moduleName}/index.spec.js`)))
				yield fs.close(outputFile)
			}
			for (const i in clientModules) {
				let moduleName = clientModules[i],
					modulePath = path.join(outputPath, `modules/clients/site/${moduleName}`)
				yield fs.mkdirp(modulePath)
				outputFile = yield fs.open(path.join(modulePath, `index.js`), 'w')
				yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/modules/clients/site/${moduleName}/index.js`)))
				yield fs.close(outputFile)
				outputFile = yield fs.open(path.join(modulePath, `index.spec.js`), 'w')
				yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, `templates/modules/clients/site/${moduleName}/index.spec.js`)))
				yield fs.close(outputFile)
			}
			yield fs.mkdirp(path.join(outputPath, `modules/apis/mobile`))
			let cronJobsPath = path.join(outputPath, 'modules/cronJobs')
			yield fs.mkdirp(cronJobsPath)
			outputFile = yield fs.open(path.join(cronJobsPath, `index.js`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, 'templates/modules/cronJobs/index.js')))
			yield fs.close(outputFile)
			outputFile = yield fs.open(path.join(cronJobsPath, `index.spec.js`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, 'templates/modules/cronJobs/index.spec.js')))
			yield fs.close(outputFile)
			outputFile = yield fs.open(path.join(outputPath, `modules/migrations/staticData/staticData.json`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, 'templates/modules/migrations/staticData/staticData.json')))
			yield fs.close(outputFile)
			outputFile = yield fs.open(path.join(outputPath, `modules/migrations/staticData/mockStaticData.json`), 'w')
			yield fs.writeFile(outputFile, yield fs.readFile(path.join(__dirname, 'templates/modules/migrations/staticData/mockStaticData.json')))
			yield fs.close(outputFile)
			return true
		})
	}
}

module.exports = CodeGenerator
