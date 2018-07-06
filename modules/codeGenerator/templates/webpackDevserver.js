'use strict'
console.log('[webpackDevserver info]: Starting script...')
const
	argv = require('yargs').argv,
	co = require('co'),
	getWebpackConfig = require(`./config/webpack/${argv.webpackConfigType}`),
	merge = require('deepmerge'),
	path = require('path'),
	webpack = require('webpack'),
	WebpackDevServer = require('webpack-dev-server')

const
	listenPromise = (moduleName, moduleConfig, webpackConfig) => new Promise((resolve, reject) => {
		new WebpackDevServer(webpack(webpackConfig), {
			publicPath: webpackConfig.output.publicPath,
			// hot: true,
			historyApiFallback: true,
			stats: {
				colors: true
			}
		}).listen(moduleConfig.webpackDevserverPort, moduleConfig.hostName, function (err) {
			if (err) {
				console.log(`[${moduleName}]`, err)
				reject(err)
				return
			}
			console.log(`[${moduleName}] Listening at ${moduleConfig.webpackHost}`)
			resolve()
		})
	})

console.log('[webpackDevserver info]: Modules loaded. Loading config...')
let config = merge(require('./config/common'), require(`./config/profiles/${argv.configProfile || 'local'}`)),
	startForClientModules = argv.startForClientModules || ''

co(function*() {
	console.log('[webpackDevserver info]: Config loaded, build starting...')
	startForClientModules = startForClientModules.split(',')
	for (const moduleName in config.clients) {
		let moduleConfig = config.clients[moduleName]
		if (!moduleConfig.startWebpackDevserver && (startForClientModules.indexOf(moduleName) === -1)) {
			continue
		}

		moduleConfig.clientPath = path.join(config.clientModulesPublicSourcesPath, moduleName)
		moduleConfig.publicPath = path.join(config.clientModulesPublicPath, moduleName)
		moduleConfig.nodeModulesPath = path.join(__dirname, 'node_modules')
		moduleConfig.mode = 'development'
		let webpackConfig = getWebpackConfig(moduleConfig)
		if (!webpackConfig.plugins) {
			webpackConfig.plugins = []
		}
		webpackConfig.plugins = webpackConfig.plugins.concat(webpackConfig[`${config.name}Plugins`] || [])
		for (const key in webpackConfig) {
			if (key.indexOf('Plugins') !== -1) {
				delete webpackConfig[key]
			}
		}
	
		webpackConfig.entry.unshift('webpack-dev-server/client?' + moduleConfig.webpackHost)
		webpackConfig.output.publicPath = moduleConfig.webpackHost + webpackConfig.output.publicPath
	
		yield listenPromise(moduleName, moduleConfig, webpackConfig)
	}
	return true
}).then((res) => console.log('[webpackDevserver info]: All builds succeeded.'), (err) => console.log('[webpackDevserver info]: Error while building: ', err))
