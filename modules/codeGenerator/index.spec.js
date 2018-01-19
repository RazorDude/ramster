const
	assert = require('assert'),
	co = require('co'),
	{describeSuiteConditionally, runTestConditionally} = require('../toolbelt'),
	path = require('path'),
	fs = require('fs-extra')

module.exports = {
	testMe: function() {
		const instance = this
		describe('codeGenerator', function() {
			it('testGenerateConfigFile should execute successfully', function() {
				instance.testGenerateConfigFile()
				assert(true)
			})
			it('testGenerateIndexConfigFile should execute successfully', function() {
				instance.testGenerateIndexConfigFile()
				assert(true)
			})
			it('testGenerateCommonConfigFile should execute successfully', function() {
				instance.testGenerateCommonConfigFile()
				assert(true)
			})
			it('testGenerateProfileConfigFile should execute successfully', function() {
				instance.testGenerateProfileConfigFile()
				assert(true)
			})
		})
	},
	testGenerateConfigFile: function() {
		const instance = this
		describe('generateConfigFile', function() {
			it('should throw an error if the provided outputPath already exists by is not a directory', function() {
				return co(function*() {
					let threwAnError = false
					try {
						yield instance.generateConfigFile(path.join(__dirname, './index.spec.js'), 'fake.js', 'fake2.js')
					} catch(e) {
						threwAnError = true
					}
					assert(threwAnError)
					return
				})
			})
			it('should create a directory if the provided outputPath is valid, but does not exist', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test')
					yield instance.generateConfigFile(outputPath, 'index.js', path.join(__dirname, '../shared/templates/config/index.js'))
					let dirData = yield fs.lstat(outputPath)
					if (!dirData.isDirectory()) {
						try {
							yield fs.remove(outputPath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(outputPath)
					assert(true)
					return true
				})
			})
			it('should create a directory if the provided outputPath is valid, but does not exist, and should work for nested non-existent directories', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test/nestedTest')
					yield instance.generateConfigFile(outputPath, 'index.js', path.join(__dirname, '../shared/templates/config/index.js'))
					let dirData = yield fs.lstat(outputPath)
					if (!dirData.isDirectory()) {
						try {
							yield fs.remove(path.join(__dirname, './test'))
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(path.join(__dirname, './test'))
					assert(true)
					return true
				})
			})
			it('should create a file with the correct name at the provided outputPath', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test')
					yield instance.generateConfigFile(outputPath, 'index.js', path.join(__dirname, '../shared/templates/config/index.js'))
					let fileData = yield fs.lstat(path.join(outputPath, 'index.js'))
					if (!fileData.isFile()) {
						try {
							yield fs.remove(outputPath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(outputPath)
					assert(true)
					return true
				})
			})
		})
	},
	testGenerateIndexConfigFile: function() {
		const instance = this
		describe('generateIndexConfigFile', function() {
			it('should execute successfully', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test')
					yield instance.generateIndexConfigFile(outputPath)
					let fileData = yield fs.lstat(path.join(outputPath, 'index.js'))
					if (!fileData.isFile()) {
						try {
							yield fs.remove(outputPath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(outputPath)
					assert(true)
					return true
				})
			})
		})
	},
	testGenerateCommonConfigFile: function() {
		const instance = this
		describe('generateCommonConfigFile', function() {
			it('should execute successfully', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test')
					yield instance.generateCommonConfigFile(outputPath)
					let fileData = yield fs.lstat(path.join(outputPath, 'common.js'))
					if (!fileData.isFile()) {
						try {
							yield fs.remove(outputPath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(outputPath)
					assert(true)
					return true
				})
			})
		})
	},
	testGenerateProfileConfigFile: function() {
		const instance = this
		describe('generateProfileConfigFile', function() {
			it('should execute successfully', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test', 'local')
					yield instance.generateProfileConfigFile(outputPath, 'local')
					let fileData = yield fs.lstat(path.join(outputPath, '/profiles/local.js'))
					if (!fileData.isFile()) {
						try {
							yield fs.remove(path.join(__dirname, './test'))
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(path.join(__dirname, './test'))
					assert(true)
					return true
				})
			})
		})
	}
}
