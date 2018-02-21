'use strict'
const
	argv = require('optimist').argv,
	co = require('co'),
	getWebpackConfig = require(`./config/${argv.webpackConfigType}`),
	merge = require('deepmerge'),
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
let config = merge(require('./config/common'), require(`./config/profiles/${argv.configProfile || 'local'}`)),
	buildForClientModules = argv.buildForClientModules || ''

co(function* () {
	buildForClientModules = buildForClientModules.split(',')
	for (const moduleName in config.clients) {
		let moduleConfig = config.clients[moduleName]
		if (buildForClientModules.indexof(moduleName) === -1) {
			continue
		}

		let webpackConfig = getWebpackConfig(moduleConfig, config.name)
		if (!webpackConfig.plugins) {
			webpackConfig.plugins = []
		}
		webpackConfig.plugins = webpackConfig.plugins.concat(webpackConfig.productionPlugins || [])
		for (const key in webpackConfig) {
			if (key.indexOf('Plugins') !== -1) {
				delete webpackConfig[key]
			}
		}
		delete webpackConfig.devtool
		yield build(webpackConfig, moduleName)
	}
	return true
}).then((result) => console.log('All builds succeeded'), (error) => console.log('Error while building: ', error))
