'use strict'
console.log('[webpackBuild info]: Starting script...')
const
	argv = require('yargs').argv,
	co = require('co'),
	getWebpackConfig = require(`./config/webpack/${argv.webpackConfigType}`),
	merge = require('deepmerge'),
	path = require('path'),
	webpack = require('webpack')

const
	build = (config, name) => new Promise((resolve, reject) => {
		console.log(`Building ${name}...`)
		webpack(config, (err, stats) => {
			if (err) {
				return reject(err)
			}
			if (stats.hasErrors()) {
				return reject(stats.compilation.errors)
			}
			resolve(stats)
		})
	})

console.log('[webpackBuild info]: Modules loaded. Loading config...')
let config = merge(require('./config/common'), require(`./config/profiles/${argv.configProfile || 'local'}`)),
	buildForClientModules = argv.buildForClientModules || ''

co(function* () {
	console.log('[webpackBuild info]: Config loaded, build starting...')
	buildForClientModules = buildForClientModules.split(',')
	for (const moduleName in config.clients) {
		let moduleConfig = config.clients[moduleName]
		if (buildForClientModules.indexOf(moduleName) === -1) {
			continue
		}

		moduleConfig.clientPath = path.join(config.clientModulesPath, moduleName)
		moduleConfig.publicPath = path.join(config.clientModulesPublicPath, moduleName)
		moduleConfig.nodeModulesPath = path.join(__dirname, 'node_modules')
		let webpackConfig = getWebpackConfig(moduleConfig, config.name)
		if (!webpackConfig.plugins) {
			webpackConfig.plugins = []
		}
		webpackConfig.plugins = webpackConfig.plugins.concat(webpackConfig[`${config.name}Plugins`] || [])
		for (const key in webpackConfig) {
			if (key.indexOf('Plugins') !== -1) {
				delete webpackConfig[key]
			}
		}
		delete webpackConfig.devtool
		yield build(webpackConfig, moduleName)
	}
	return true
}).then((result) => console.log('[webpackBuild info]: All builds succeeded.'), (error) => console.log('[webpackBuild info]: Error while building: ', error))
