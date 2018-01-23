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
			it('should execute testCheckConfig successfully', function() {
				instance.testCheckConfig()
				assert(true)
			})
			it('should execute testGenerateConfigFile successfully', function() {
				instance.testGenerateConfigFile()
				assert(true)
			})
			it('should execute testGenerateIndexConfigFile successfully', function() {
				instance.testGenerateIndexConfigFile()
				assert(true)
			})
			it('should execute testGenerateCommonConfigFile successfully', function() {
				instance.testGenerateCommonConfigFile()
				assert(true)
			})
			it('should execute testGenerateProfileConfigFile successfully', function() {
				instance.testGenerateProfileConfigFile()
				assert(true)
			})
			it('should execute testGenerateProfileConfigFile successfully', function() {
				instance.testGenerateProfileConfigFile()
				assert(true)
			})
			it('should execute testBuildLayoutFile successfully', function() {
				instance.testBuildLayoutFile()
				assert(true)
			})
			it('should execute testGenerateImagesRedirectNGINXConfig successfully', function() {
				instance.testGenerateImagesRedirectNGINXConfig()
				assert(true)
			})
			it('should execute testGenerateNGINXConfig successfully', function() {
				instance.testGenerateNGINXConfig()
				assert(true)
			})
		})
	},
	testCheckConfig: function() {
		const instance = this
		describe('checkConfig', function() {
			it('should return true if the config is an object and is not null', function() {
				assert(instance.checkConfig({}))
			})
			it('should throw an error if the config is null or not an object', function() {
				let threwAnError = false
				try {
					instance.checkConfig()
				} catch (e) {
					threwAnError = true
				}
				assert(threwAnError)
			})
			it('should return true if the sub-config for the provided client module is an object and is not null', function() {
				assert(instance.checkConfig({clients: {test: {}}}, {clientModuleName: 'test'}))
			})
			it('should throw an error if the config does not have sub-config for the provided client module', function() {
				let threwAnError = false
				try {
					instance.checkConfig({}, {clientModuleName: 'test'})
				} catch (e) {
					threwAnError = true
				}
				assert(threwAnError)
			})
			it('should return true if the sub-config for the provided api module is an object and is not null', function() {
				assert(instance.checkConfig({apis: {test: {}}}, {apiModuleName: 'test'}))
			})
			it('should throw an error if the config does not have sub-config for the provided api module', function() {
				let threwAnError = false
				try {
					instance.checkConfig({}, {apiModuleName: 'test'})
				} catch (e) {
					threwAnError = true
				}
				assert(threwAnError)
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
			it('should throw an error when the profileName argument is not a string or is empty', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateProfileConfigFile(path.join(__dirname, './test', 'local'))
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, if all parameters are correct', function() {
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
	},
	testBuildLayoutFile: function() {
		const instance = this
		describe('buildLayoutFile', function() {
			it('should throw an error when the clientModuleName argument is not a string or is empty', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.buildLayoutFile()
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, '../../test/public/site/layout.html')
					yield instance.buildLayoutFile('site')
					let fileData = yield fs.lstat(outputPath)
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
	testGenerateImagesRedirectNGINXConfig: function() {
		const instance = this
		describe('generateImagesRedirectNGINXConfig', function() {
			it('should throw an error when the outputPath argument is not a string or is empty', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateImagesRedirectNGINXConfig()
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error when the outputPath argument points to a file, rather than a directory', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateImagesRedirectNGINXConfig(path.join(__dirname, './index.js'))
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputFilePath = path.join(outputPath, './images.conf')
					yield instance.generateImagesRedirectNGINXConfig(outputPath)
					let fileData = yield fs.lstat(outputFilePath)
					if (!fileData.isFile()) {
						try {
							yield fs.remove(outputFilePath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(outputFilePath)
					assert(true)
					return true
				})
			})
		})
	},
	testGenerateNGINXConfig: function() {
		const instance = this
		describe('generateNGINXConfig', function() {
			it('should throw an error when the clientModuleName argument is not a string or is empty', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateNGINXConfig()
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, if all parameters are correct', function() {
				return co(function*() {
					yield instance.generateNGINXConfig('site')
					assert(true)
					return true
				})
			})
		})
	}
}
