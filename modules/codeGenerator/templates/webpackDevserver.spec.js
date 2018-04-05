const
	assert = require('assert'),
	breakpoints = [
		'[webpackDevserver info]: Starting script...',
		'[webpackDevserver info]: Modules loaded. Loading config...',
		'[webpackDevserver info]: Config loaded, build starting...',
		'[webpackDevserver info]: All builds succeeded.'
	],
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	request = require('request-promise-native'),
	{spawn} = require('child_process'),
	spawnPromise = (dirName, args) => new Promise((resolve, reject) => {
		const proc = spawn('node', [path.join(dirName, 'webpackDevserver.js')].concat(args))
		let lastBreakpoint = null,
			error = null
		proc.stdout.on('data', (data) => {
			const stringData = data.toString().replace(/\n/g, ''),
				stringDataIndex = breakpoints.indexOf(stringData)
			// console.log('data:', data.toString())
			if (stringDataIndex !== -1) {
				lastBreakpoint = stringDataIndex
			}
			if (lastBreakpoint === 3) {
				resolve({code: 0, lastBreakpoint, proc})
				return
			}
			if (stringData.indexOf('[webpackDevserver info]: Error while building:') !== -1) {
				error = data.toString()
			}
		})
		proc.stderr.on('err', (err) => {
			// console.log('err:', err)
			error = err
		})
		proc.on('close', (code) => {
			// console.log('close code:', code)
			if (error) {
				reject(error)
				return
			}
			if (lastBreakpoint !== 3) {
				resolve({code, lastBreakpoint, proc})
			}
		})
	})

module.exports = {
	testMe: function(config, dirName) {
		describe('webpackDevserver', function() {
			it('should throw an error if the provided webpackConfigType does not exist', function() {
				this.timeout(10000)
				return co(function*() {
					let result = yield spawnPromise(dirName, [])
					assert((result.code !== 0) && (result.lastBreakpoint === 0))
					return true
				})
			})
			it('should throw an error if the provided configProfile does not exist', function() {
				this.timeout(10000)
				return co(function*() {
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react', '--configProfile=absolutelyFake'])
					assert((result.code !== 0) && (result.lastBreakpoint === 1))
					return true
				})
			})
			it('should execute successfully and start the devserver if all parameters are correct, webpackConfigType is react, configProfile is not set and buildForClientModules is set correctly', function() {
				this.timeout(20000)
				return co(function*() {
					let siteIndexJSFilePath = path.join(config.clientModulesPath, 'site/index.js'),
						fd = yield fs.open(siteIndexJSFilePath, 'w')
					yield fs.writeFile(fd, 'console.log("test")')
					yield fs.close(fd)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react']),
						stats = yield request({
							method: 'get',
							uri: `${config.clients.site.webpackHost}/dist/main.js`,
							resolveWithFullResponse: true
						})
					result.proc.kill()
					assert((result.code === 0) && (result.lastBreakpoint === 3) && (stats.statusCode === 200))
					return true
				})
			})
			it('should execute successfully and start the devserver if all parameters are correct, webpackConfigType is react, configProfile is set and valid and buildForClientModules is set correctly', function() {
				this.timeout(20000)
				return co(function*() {
					let siteIndexJSFilePath = path.join(config.clientModulesPath, 'site/index.js'),
						fd = yield fs.open(siteIndexJSFilePath, 'w')
					yield fs.writeFile(fd, 'console.log("test")')
					yield fs.close(fd)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react', '--buildForClientModules=site']),
						stats = yield request({
							method: 'get',
							uri: `${config.clients.site.webpackHost}/dist/main.js`,
							resolveWithFullResponse: true
						})
					result.proc.kill()
					assert((result.code === 0) && (result.lastBreakpoint === 3) && (stats.statusCode === 200))
					return true
				})
			})
		})
	}
}
