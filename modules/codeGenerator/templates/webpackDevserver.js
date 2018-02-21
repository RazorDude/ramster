'use strict'
const
	argv = require('optimist').argv,
	co = require('co'),
	getWebpackConfig = require('./config/webpack'),
	webpack = require('webpack'),
	WebpackDevServer = require('webpack-dev-server')

const listenPromise = (moduleName, moduleConfig, webpackConfig) => new Promise((resolve, reject) => {
	new WebpackDevServer(webpack(webpackConfig), {
		publicPath: webpackConfig.output.publicPath,
		hot: true,
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

let config = require('./config/profiles/' + argv.configProfile),
	startForClientModules = argv.startForClientModules || ''

co(function*() {
	startForClientModules = startForClientModules.split(',')
	for (const moduleName in config.clients) {
		let moduleConfig = config.clients[moduleName]
		if (!moduleConfig.startWebpackDevserver && (startForClientModules.indexof(moduleName) === -1)) {
			continue
		}
	
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
}).then((res) => true, (err) => console.log(err))
