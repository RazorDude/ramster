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
			it('should execute testBuildLayoutFile successfully', function() {
				instance.testBuildLayoutFile()
				assert(true)
			})
			it('should execute testCheckConfig successfully', function() {
				instance.testCheckConfig()
				assert(true)
			})
			it('should execute testCheckOutputPath successfully', function() {
				instance.testCheckOutputPath()
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
			it('should execute testGenerateImagesRedirectNGINXConfig successfully', function() {
				instance.testGenerateImagesRedirectNGINXConfig()
				assert(true)
			})
			it('should execute testGenerateNGINXConfig successfully', function() {
				instance.testGenerateNGINXConfig()
				assert(true)
			})
			it('should execute testGenerateWebpackConfig successfully', function() {
				instance.testGenerateWebpackConfig()
				assert(true)
			})
			it('should execute testGenerateWebpackBuildTools successfully', function() {
				instance.testGenerateWebpackBuildTools()
				assert(true)
			})
			it('should execute testGenerateProjectMainFile successfully', function() {
				instance.testGenerateProjectMainFile()
				assert(true)
			})
			it('should execute testGenerateGitignore successfully', function() {
				instance.testGenerateGitignore()
				assert(true)
			})
			it('should execute testGenerateFolders successfully', function() {
				instance.testGenerateFolders()
				assert(true)
			})
			it('should execute testGenerateLayoutFile successfully', function() {
				instance.testGenerateLayoutFile()
				assert(true)
			})
			it('should execute testGenerateBlankProject successfully', function() {
				instance.testGenerateBlankProject()
				assert(true)
			})
			it('should execute testGenerateBasicProject successfully', function() {
				instance.testGenerateBasicProject()
				assert(true)
			})
		})
	},
	testBuildLayoutFile: function() {
		const instance = this
		describe('codeGenerator.buildLayoutFile', function() {
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
					// yield fs.remove(outputPath)
					assert(true)
					return true
				})
			})
		})
	},
	testCheckConfig: function() {
		const instance = this
		describe('codeGenerator.checkConfig', function() {
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
	testCheckOutputPath: function() {
		const instance = this
		describe('codeGenerator.checkOutputPath', function() {
			it('should throw an error when the outputPath argument is not a string or is empty', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.checkOutputPath()
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
						yield instance.checkOutputPath(path.join(__dirname, './index.js'))
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return true if the sub-config for the provided api module is an object and is not null', function() {
				assert(instance.checkOutputPath(__dirname))
			})
		})
	},
	testGenerateConfigFile: function() {
		const instance = this
		describe('codeGenerator.generateConfigFile', function() {
			it('should create a directory if the provided outputPath is valid, but does not exist, and should work for nested non-existent directories', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test/nestedTest')
					yield instance.generateConfigFile(outputPath, 'index.js', path.join(__dirname, './templates/config/index.js'))
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
					yield instance.generateConfigFile(outputPath, 'index.js', path.join(__dirname, './templates/config/index.js'))
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
		describe('codeGenerator.generateIndexConfigFile', function() {
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
		describe('codeGenerator.generateCommonConfigFile', function() {
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
		describe('codeGenerator.generateProfileConfigFile', function() {
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
	testGenerateImagesRedirectNGINXConfig: function() {
		const instance = this
		describe('codeGenerator.generateImagesRedirectNGINXConfig', function() {
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
		const instance = this,
			{config} = this
		describe('codeGenerator.generateNGINXConfig', function() {
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
					let isAFile = false
					yield instance.generateNGINXConfig('site')
					let configFilePath = path.join(config.wsConfigFolderPath, `${config.projectName}-site.conf`),
						fileStats = yield fs.lstat(configFilePath)
					isAFile = fileStats.isFile()
					try {
						yield fs.remove(configFilePath)
					} catch (e) {
					}
					assert(isAFile)
					return true
				})
			})
		})
	},
	testGenerateWebpackConfig: function() {
		const instance = this
		describe('codeGenerator.generateWebpackConfig', function() {
			it('should throw an error with the correct message if the config type argument is invalid', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateWebpackConfig(path.join(__dirname, './test'))
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid webpack config type.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputFilePath = path.join(outputPath, './react.js')
					yield instance.generateWebpackConfig(outputPath, 'react')
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
	testGenerateWebpackBuildTools: function() {
		const instance = this
		describe('codeGenerator.generateWebpackBuildTools', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						devserverOutputFilePath = path.join(outputPath, './webpackDevserver.js'),
						builOutputFilePath = path.join(outputPath, './webpackBuild.js')
					yield instance.generateWebpackBuildTools(outputPath)
					let fileData = yield fs.lstat(devserverOutputFilePath)
					if (!fileData.isFile()) {
						try {
							yield fs.remove(devserverOutputFilePath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					fileData = yield fs.lstat(builOutputFilePath)
					if (!fileData.isFile()) {
						try {
							yield fs.remove(builOutputFilePath)
						} catch (e) {
						}
						assert(false)
						return false
					}
					yield fs.remove(devserverOutputFilePath)
					yield fs.remove(builOutputFilePath)
					assert(true)
					return true
				})
			})
		})
	},
	testGenerateProjectMainFile: function() {
		const instance = this
		describe('codeGenerator.generateProjectMainFile', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputFilePath = path.join(outputPath, './index.js')
					yield instance.generateProjectMainFile(outputPath)
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
	testGenerateGitignore: function() {
		const instance = this
		describe('codeGenerator.generateGitignore', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputFilePath = path.join(outputPath, './.gitignore')
					yield instance.generateGitignore(outputPath)
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
	testGenerateFolders: function() {
		const instance = this
		describe('codeGenerator.generateFolders', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputPaths = [
							{path: path.join(outputPath, 'clients'), type: false},
							{path: path.join(outputPath, 'config/profiles'), type: false},
							{path: path.join(outputPath, 'logs'), type: false},
							{path: path.join(outputPath, 'modules/db'), type: false},
							{path: path.join(outputPath, 'modules/clients'), type: false},
							{path: path.join(outputPath, 'modules/apis'), type: false},
							{path: path.join(outputPath, 'modules/emails/templates'), type: false},
							{path: path.join(outputPath, 'modules/migrations/seedFiles'), type: false},
							{path: path.join(outputPath, 'modules/migrations/syncHistory'), type: false},
							{path: path.join(outputPath, 'modules/migrations/backup'), type: false},
							{path: path.join(outputPath, 'modules/migrations/staticData'), type: false},
							{path: path.join(outputPath, 'public'), type: false},
							{path: path.join(outputPath, 'storage/importTemplates'), type: false},
							{path: path.join(outputPath, 'storage/tmp'), type: false}
						],
						dataIsGood = true
					yield instance.generateFolders(outputPath)
					for (const i in outputPaths) {
						let item = outputPaths[i],
							itemData = yield fs.lstat(item.path)
						if (itemData.isFile() !== item.type) {
							console.log(`Bad value for isFile - expected ${item.type} for item no. ${i}.`)
							dataIsGood = false
							break
						}
					}
					yield fs.remove(outputPath)
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testGenerateLayoutFile: function() {
		const instance = this
		describe('codeGenerator.generateLayoutFile', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, 'test/clients/site'),
						outputFilePath = path.join(outputPath, 'layout_local.pug')
					yield instance.generateLayoutFile(outputPath)
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
	testGenerateBlankProject: function() {
		const instance = this
		describe('codeGenerator.generateBlankProject', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputPaths = [
							{path: path.join(outputPath, 'index.js'), type: true},
							{path: path.join(outputPath, 'webpackDevserver.js'), type: true},
							{path: path.join(outputPath, 'webpackBuild.js'), type: true},
							{path: path.join(outputPath, '.gitignore'), type: true},
							{path: path.join(outputPath, 'clients'), type: false},
							{path: path.join(outputPath, 'config/index.js'), type: true},
							{path: path.join(outputPath, 'config/common.js'), type: true},
							{path: path.join(outputPath, 'config/profiles'), type: false},
							{path: path.join(outputPath, 'config/profiles/local.js'), type: true},
							{path: path.join(outputPath, 'logs'), type: false},
							{path: path.join(outputPath, 'modules/db'), type: false},
							{path: path.join(outputPath, 'modules/clients'), type: false},
							{path: path.join(outputPath, 'modules/apis'), type: false},
							{path: path.join(outputPath, 'modules/emails/templates/sample.pug'), type: true},
							{path: path.join(outputPath, 'modules/migrations/seedFiles'), type: false},
							{path: path.join(outputPath, 'modules/migrations/syncHistory'), type: false},
							{path: path.join(outputPath, 'modules/migrations/backup'), type: false},
							{path: path.join(outputPath, 'modules/migrations/staticData'), type: false},
							{path: path.join(outputPath, 'public'), type: false},
							{path: path.join(outputPath, 'storage/importTemplates'), type: false},
							{path: path.join(outputPath, 'storage/tmp'), type: false}
						],
						dataIsGood = true
					yield instance.generateBlankProject(outputPath)
					for (const i in outputPaths) {
						let item = outputPaths[i],
							itemData = yield fs.lstat(item.path)
						if (itemData.isFile() !== item.type) {
							console.log(`Bad value for isFile - expected ${item.type} for item no. ${i}.`)
							dataIsGood = false
							break
						}
					}
					yield fs.remove(outputPath)
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testGenerateBasicProject: function() {
		const instance = this
		describe('codeGenerator.generateBasicProject', function() {
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					let outputPath = path.join(__dirname, './test'),
						outputPaths = [
							{path: path.join(outputPath, 'index.js'), type: true},
							{path: path.join(outputPath, 'webpackDevserver.js'), type: true},
							{path: path.join(outputPath, 'webpackBuild.js'), type: true},
							{path: path.join(outputPath, '.gitignore'), type: true},
							{path: path.join(outputPath, 'clients/site/layout_local.pug'), type: true},
							{path: path.join(outputPath, 'config/index.js'), type: true},
							{path: path.join(outputPath, 'config/common.js'), type: true},
							{path: path.join(outputPath, 'config/profiles'), type: false},
							{path: path.join(outputPath, 'config/profiles/local.js'), type: true},
							{path: path.join(outputPath, 'config/webpack/react.js'), type: true},
							{path: path.join(outputPath, 'logs'), type: false},
							{path: path.join(outputPath, 'modules/apis/mobile'), type: false},
							{path: path.join(outputPath, 'modules/clients'), type: false},
							{path: path.join(outputPath, 'modules/clients/site/layout/index.js'), type: true},
							{path: path.join(outputPath, 'modules/clients/site/layout/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/clients/site/users/index.js'), type: true},
							{path: path.join(outputPath, 'modules/clients/site/users/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/cronJobs/index.js'), type: true},
							{path: path.join(outputPath, 'modules/cronJobs/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db'), type: false},
							{path: path.join(outputPath, 'modules/db/globalConfig/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/globalConfig/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db/moduleAccessPoints/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/moduleAccessPoints/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db/moduleCategories/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/moduleCategories/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db/modules/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/modules/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db/users/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/users/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/db/userTypes/index.js'), type: true},
							{path: path.join(outputPath, 'modules/db/userTypes/index.spec.js'), type: true},
							{path: path.join(outputPath, 'modules/emails/templates/sample.pug'), type: true},
							{path: path.join(outputPath, 'modules/migrations/seedFiles'), type: false},
							{path: path.join(outputPath, 'modules/migrations/syncHistory'), type: false},
							{path: path.join(outputPath, 'modules/migrations/backup'), type: false},
							{path: path.join(outputPath, 'modules/migrations/staticData'), type: false},
							{path: path.join(outputPath, 'modules/migrations/staticData/staticData.json'), type: true},
							{path: path.join(outputPath, 'modules/migrations/staticData/mockStaticData.json'), type: true},
							{path: path.join(outputPath, 'public/site'), type: false},
							{path: path.join(outputPath, 'storage/importTemplates'), type: false},
							{path: path.join(outputPath, 'storage/tmp'), type: false},
						],
						dataIsGood = true
					yield instance.generateBasicProject(outputPath)
					for (const i in outputPaths) {
						let item = outputPaths[i],
							itemData = yield fs.lstat(item.path)
						if (itemData.isFile() !== item.type) {
							console.log(`Bad value for isFile - expected ${item.type} for item no. ${i}.`)
							dataIsGood = false
							break
						}
					}
					yield fs.remove(outputPath)
					assert(dataIsGood)
					return true
				})
			})
		})
	}
}
