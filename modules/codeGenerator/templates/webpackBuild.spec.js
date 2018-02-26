const
	assert = require('assert'),
	breakpoints = [
		'[webpackBuild info]: Starting script...',
		'[webpackBuild info]: Modules loaded. Loading config...',
		'[webpackBuild info]: Config loaded, build starting...',
		'[webpackBuild info]: All builds succeeded.'
	],
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	{spawn} = require('child_process'),
	spawnPromise = (dirName, args) => new Promise((resolve, reject) => {
		const proc = spawn('node', [path.join(dirName, 'webpackBuild.js')].concat(args))
		let lastBreakpoint = null,
			error = null
		proc.stdout.on('data', (data) => {
			const stringData = data.toString().replace(/\n/g, ''),
				stringDataIndex = breakpoints.indexOf(stringData)
			if (stringDataIndex !== -1) {
				lastBreakpoint = stringDataIndex
			}
			if (stringData.indexOf('[webpackBuild info]: Error while building:') !== -1) {
				error = data.toString()
			}
			// console.log('data:', stringData)
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
			resolve({code, lastBreakpoint})
		})
	})

module.exports = {
	testMe: function(config, dirName) {
		describe('webpackBuild', function() {
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
			it('should execute successfully and do nothing if all parameters are correct, configProfile is not set and buildForClientModules is not set', function() {
				this.timeout(10000)
				return co(function*() {
					let siteMainJSFilePath = path.join(config.clientModulesPublicPath, 'site/main.js')
					yield fs.remove(siteMainJSFilePath)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react']),
						didThrowAnError = false
					try {
						yield fs.lstat(siteMainJSFilePath)
					} catch(e) {
						didThrowAnError = true
					}
					assert((result.code === 0) && (result.lastBreakpoint === 3) && didThrowAnError)
					return true
				})
			})
			it('should execute successfully and do nothing if all parameters are correct, configProfile is set and valid and buildForClientModules is not set', function() {
				this.timeout(10000)
				return co(function*() {
					let siteMainJSFilePath = path.join(config.clientModulesPublicPath, 'site/main.js')
					yield fs.remove(siteMainJSFilePath)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react', '--configProfile=local'])
					try {
						yield fs.lstat(siteMainJSFilePath)
					} catch(e) {
						didThrowAnError = true
					}
					assert((result.code === 0) && (result.lastBreakpoint === 3) && didThrowAnError)
					return true
				})
			})
			it('should execute successfully build the main.js file if all parameters are correct, webpackConfigType is react, configProfile is not set and buildForClientModules is set correctly', function() {
				this.timeout(20000)
				return co(function*() {
					let siteMainJSFilePath = path.join(config.clientModulesPublicPath, 'site/main.js'),
						siteIndexJSFilePath = path.join(config.clientModulesPath, 'site/index.js'),
						fd = yield fs.open(siteIndexJSFilePath, 'w')
					yield fs.remove(siteMainJSFilePath)
					yield fs.writeFile(fd, 'console.log("test")')
					yield fs.close(fd)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react', '--buildForClientModules=site']),
						stats = yield fs.lstat(siteMainJSFilePath)
					assert((result.code === 0) && (result.lastBreakpoint === 3) && stats.isFile())
					return true
				})
			})
			it('should execute successfully build the main.js file if all parameters are correct, webpackConfigType is react, configProfile is set and valid and buildForClientModules is set correctly', function() {
				this.timeout(20000)
				return co(function*() {
					let siteMainJSFilePath = path.join(config.clientModulesPublicPath, 'site/main.js'),
						siteIndexJSFilePath = path.join(config.clientModulesPath, 'site/index.js'),
						fd = yield fs.open(siteIndexJSFilePath, 'w')
					yield fs.remove(siteMainJSFilePath)
					yield fs.writeFile(fd, 'console.log("test")')
					yield fs.close(fd)
					let result = yield spawnPromise(dirName, ['--webpackConfigType=react', '--buildForClientModules=site']),
						stats = yield fs.lstat(siteMainJSFilePath)
					assert((result.code === 0) && (result.lastBreakpoint === 3) && stats.isFile())
					return true
				})
			})
		})
	}
}
