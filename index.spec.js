'use strict'

const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	{runTestConditionally} = require('./modules/toolbelt')

module.exports = {
	testMe: function() {
		const instance = this
		describe('core', function() {
			co(function*() {
				yield instance.testConfig()
				yield instance.testLoadModules()
				// yield instance.listen()
				return true
			}).then()
		})
	},
	testConfig: function() {
		const instance = this,
			config = this.config
		return new Promise((resolve, reject) => {
			let testsHaveFailed = false
			describe('config', function() {
				describe('general items', function() {
					it('should have a non-empty projectName string', function() {
						const projectName = config.projectName
						assert((typeof projectName === 'string') && (projectName.length > 0))
					})

					// uncategorized config items that usually come from the profile config
					it('should have a non-empty (profile) name string', function() {
						const name = config.name
						assert((typeof name === 'string') && (name.length > 0))
					})
					it('should have a valid hostProtocol ("http" || "https")', function() {
						const hostProtocol = config.hostProtocol
						assert((hostProtocol === 'http') || (hostProtocol === 'https'))
					})
					it('should have a non-empty hostAddress string', function() {
						const hostAddress = config.hostAddress
						assert((typeof hostAddress === 'string') && (hostAddress.length > 0))
					})
				})


				describe('client modules', function() {
					let runClientModulesTests = (typeof config.clientModulesPath !== 'undefined')
					runTestConditionally(runClientModulesTests, 'should have a valid directory at the clientModulesPath, if specified', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(config.clientModulesPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runClientModulesTests, 'should have a valid directory at the clientModulesPublicSourcesPath, if clientModulesPath is specified', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(config.clientModulesPublicSourcesPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runClientModulesTests, 'should have a valid directory at the clientModulesPublicPath, if clientModulesPath is specified', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(config.clientModulesPublicPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
				})


				describe('api modules', function() {
					let runApiModulesTests = (typeof config.apiModulesPath !== 'undefined')
					runTestConditionally(runApiModulesTests, 'should have a valid directory at the apiModulesPath, if specified', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(config.apiModulesPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
				})


				describe('global variables', function() {
					runTestConditionally(
						(typeof config.globalStoragePath !== 'undefined') || config.mountGlobalStorageInWebserver,
						'should have a valid directory at the globalStoragePath, if specified or mountGlobalStorageInWebserver is true',
						function() {
							return co(function*() {
								let dirStats = yield fs.lstat(config.globalStoragePath)
								assert(dirStats.isDirectory())
								return true
							})
						}
					)
					runTestConditionally(
						typeof config.globalUploadPath !== 'undefined',
						'should have a valid directory at the globalUploadPath, if specified',
						function() {
							return co(function*() {
								let dirStats = yield fs.lstat(config.globalUploadPath)
								assert(dirStats.isDirectory())
								return true
							})
						}
					)
					runTestConditionally(
						typeof config.logsPath !== 'undefined',
						'should have a valid directory at the logsPath, if specified',
						function() {
							return co(function*() {
								let dirStats = yield fs.lstat(config.logsPath)
								assert(dirStats.isDirectory())
								return true
							})
						}
					)
					runTestConditionally(
						typeof config.csvFileDelimiter !== 'undefined',
						'should have a non-empty csvFileDelimiter, if specified',
						function() {
							const csvFileDelimiter = config.csvFileDelimiter
							assert((typeof csvFileDelimiter === 'string') && (csvFileDelimiter.length > 0))
						}
					)
					runTestConditionally(
						config.cronJobs && (typeof config.cronJobs.path !== 'undefined'),
						'should have a valid directory at the cronJobs path, if specified',
							function() {
							return co(function*() {
								let dirStats = yield fs.lstat(config.cronJobs.path)
								assert(dirStats.isDirectory())
								return true
							})
						}
					)
				})


				describe('webserver-related data', function() {
					const webserver = config.webserver
					let runWebserverTests = (typeof webserver !== 'undefined')
					runTestConditionally(runWebserverTests, 'should have a non-empty webserver, if webserver is specified', function() {
						assert((typeof webserver === 'string') && (webserver.length > 0))
					})
					runTestConditionally(runWebserverTests, 'should have a valid directory at wsConfigFolderPath, if webserver is specified', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(config.wsConfigFolderPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
				})


				describe('emails module', function() {
					const emailsConfig = config.emails
					let runEmailsTests = (typeof emailsConfig === 'object') && (emailsConfig !== null),
						isUsingACustomModule = runEmailsTests && (typeof emailsConfig.customModulePath !== 'undefined')
					runTestConditionally(runEmailsTests, 'should have a non-empty emailServiceProvider string', function() {
						const emailServiceProvider = emailsConfig.emailServiceProvider
						assert((typeof emailServiceProvider === 'string') && (emailServiceProvider.length > 0))
					})
					runTestConditionally(
						runEmailsTests && (emailsConfig.emailServiceProvider === 'sendgrid'),
						'should have a non-empty sendgridApiKey string, if emailServiceProvider is "sendgrid"',
						function() {
							const sendgridApiKey = emailsConfig.sendgridApiKey
							assert((typeof sendgridApiKey === 'string') && (sendgridApiKey.length > 0))
						}
					)
					runTestConditionally(runEmailsTests, 'should have a non-empty emailSender string', function() {
						const emailSender = emailsConfig.emailSender
						assert((typeof emailSender === 'string') && (emailSender.length > 0))
					})
					runTestConditionally(isUsingACustomModule, 'should have a valid directory at customModulePath, if provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(emailsConfig.customModulePath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(
						runEmailsTests && (!isUsingACustomModule || (typeof emailsConfig.templatesPath !== 'undefined')),
						'should have a valid directory at templatesPath, if specified or not using a custom module',
						function() {
							return co(function*() {
								let dirStats = yield fs.lstat(emailsConfig.templatesPath)
								assert(dirStats.isDirectory())
								return true
							})
						}
					)
					runTestConditionally(
						runEmailsTests && (typeof emailsConfig.useClientModule !== 'undefined'),
						'should have a valid client module config for useClientModule, if specified',
						function() {
							assert(typeof config[emailsConfig.useClientModule] !== 'undefined')
						}
					)
				})


				describe('cronJobs module', function() {
					const cronJobsConfig = config.cronJobs
					let runCronJobsTests = (typeof cronJobsConfig === 'object') && (cronJobsConfig !== null)
					runTestConditionally(runCronJobsTests, 'should have a valid directory at the cronJobs path, if cronJobs config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(cronJobsConfig.path)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runCronJobsTests, 'should have a valid index.js file in the directory at the cronJobs path, if cronJobs config is provided', function() {
						return co(function*() {
							let dirContents = yield fs.readdir(cronJobsConfig.path),
								hasIndexJsFile = false
							for (const i in dirContents) {
								if (dirContents[i] === 'index.js') {
									hasIndexJsFile = true
									break
								}
							}
							assert(hasIndexJsFile)
							return true
						})
					})
				})


				describe('migrations module', function() {
					const migrationsConfig = config.migrations
					let runMigrationsTests = (typeof migrationsConfig === 'object') && (migrationsConfig !== null)
					runTestConditionally(runMigrationsTests, 'should have a valid directory at baseMigrationsPath, if migrations config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(migrationsConfig.baseMigrationsPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runMigrationsTests, 'should have a valid directory at seedFilesPath, if migrations config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(migrationsConfig.seedFilesPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runMigrationsTests, 'should have a valid directory at syncHistoryPath, if migrations config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(migrationsConfig.syncHistoryPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runMigrationsTests, 'should have a valid directory at backupPath, if migrations config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(migrationsConfig.backupPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
					runTestConditionally(runMigrationsTests, 'should have a valid directory at staticDataPath, if migrations config is provided', function() {
						return co(function*() {
							let dirStats = yield fs.lstat(migrationsConfig.staticDataPath)
							assert(dirStats.isDirectory())
							return true
						})
					})
				})

				afterEach(function() {
					if ((this.currentTest.state === 'failed') && !testsHaveFailed) {
						testsHaveFailed = true
					}
				})
	
				after(function() {
					if (testsHaveFailed) {
						reject(false)
					} else {
						resolve(true)
					}
				})
			})
		})
	},
	testLoadModules: function() {
		const instance = this
		return new Promise((resolve, reject) => {
			let testsHaveFailed = false
			describe('loadModules', function() {
				it('should complete successfully', function() {
					return co(function*() {
						yield instance.loadModules()
						assert(true)
						return true
					})
				})

				afterEach(function() {
					if ((this.currentTest.state === 'failed') && !testsHaveFailed) {
						testsHaveFailed = true
					}
				})
	
				after(function() {
					if (testsHaveFailed) {
						reject(false)
					} else {
						resolve(true)
					}
				})
			})
		})
	}
}
