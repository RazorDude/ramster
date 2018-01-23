'use strict'

const
	assert = require('assert'),
	co = require('co'),
	{describeSuiteConditionally, runTestConditionally} = require('./modules/toolbelt'),
	fs = require('fs-extra'),
	path = require('path')

module.exports = {
	testMe: function() {
		const instance = this
		describe('core', function() {
			it('should execute testConfig successfully', function() {
				instance.testConfig()
				assert(true)
			})
			it('should execute testLoadDependencies successfully', function() {
				instance.testLoadDependencies()
				assert(true)
			})
			it.skip('should execute testLoadModules successfully', function() {
				instance.testLoadModules()
				assert(true)
			})
			it.skip('should execute testListen successfully', function() {
				instance.testListen()
				assert(true)
			})
		})
	},
	testConfig: function() {
		const instance = this,
			config = this.config
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


			const dbConfig = config.db
			describeSuiteConditionally((typeof dbConfig === 'object') && (dbConfig !== null), 'db module', function() {
				it('should have a valid directory at modulePath, if db config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(dbConfig.modulePath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid dbType string, if db config is provided', function() {
					assert(['postgres'].indexOf(dbConfig.dbType) !== -1)
				})
				it('should have a "postgres" configuration object, if db config is provided and "dbType" is postgres', function() {
					assert((typeof config.postgres === 'object') && (config.postgres !== null))
				})
			})


			const postgresConfig = config.postgres
			describeSuiteConditionally((typeof postgresConfig === 'object') && (postgresConfig !== null), 'postgres', function() {
				it('should have a valid, non-empty user string, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.user === 'string') && postgresConfig.user.length)
				})
				it('should have a valid, non-empty password string, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.password === 'string') && postgresConfig.password.length)
				})
				it('should have a valid, non-empty host string, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.host === 'string') && postgresConfig.host.length)
				})
				it('should have a valid, non-empty port, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.port === 'number') && (postgresConfig.port > 0) && (postgresConfig.port < 100000))
				})
				it('should have a valid, non-empty database string, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.database === 'string') && postgresConfig.database.length)
				})
				runTestConditionally(
					typeof postgresConfig.mock_database !== 'undefined',
					'should have a valid, non-empty mock_database string, if db config is provided and mock_database is provided',
					function() {
						assert((typeof postgresConfig.mock_database === 'string') && postgresConfig.mock_database.length)
					}
				)
				it('should have a valid, non-empty schema name string, if db config is provided and dbType is postgres', function() {
					assert((typeof postgresConfig.schema === 'string') && postgresConfig.schema.length)
				})
			})


			const clientModulesPath = config.clientModulesPath,
				clientsConfig = config.clients
			describeSuiteConditionally(typeof clientModulesPath !== 'undefined', 'client modules', function() {
				let hasAClientsConfigObject = (typeof clientsConfig === 'object') && (clientsConfig !== null)
				it('should have a valid directory at the clientModulesPath, if specified', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(clientModulesPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at the clientModulesPublicSourcesPath, if clientModulesPath is specified', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(config.clientModulesPublicSourcesPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at the clientModulesPublicPath, if clientModulesPath is specified', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(config.clientModulesPublicPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a "clients" configuration object, if clientModulesPath is specified', function() {
					assert(hasAClientsConfigObject)
				})
				// test each client module's config
				if (hasAClientsConfigObject) {
					for (const clientModuleName in clientsConfig) {
						const clientConfig = clientsConfig[clientModuleName],
							notFoundRedirectRoutesConfig = clientConfig.notFoundRedirectRoutes,
							prependWSServerConfigFromFilesConfig = clientConfig.prependWSServerConfigFromFiles,
							appendWSServerConfigFromFilesConfig = clientConfig.appendWSServerConfigFromFiles,
							sessionConfig = clientConfig.session
						let hasNotFoundRedirectRoutesConfig = (typeof notFoundRedirectRoutesConfig === 'object') && (notFoundRedirectRoutesConfig !== null),
							hasPrependWSServerConfigFromFiles = typeof prependWSServerConfigFromFilesConfig !== 'undefined',
							hasAppendWSServerConfigFromFiles = typeof appendWSServerConfigFromFilesConfig !== 'undefined'
						describe(`${clientModuleName} config`, function() {
							it('should have a valid directory inside the clientModulesPath', function() {
								return co(function*() {
									let dirStats = yield fs.lstat(path.join(clientModulesPath, clientModuleName))
									assert(dirStats.isDirectory())
									return true
								})
							})
							runTestConditionally(
								typeof clientConfig.uploadPath !== 'undefined',
								'should have a valid directory at the uploadPath, if specified',
								function() {
									return co(function*() {
										let dirStats = yield fs.lstat(clientConfig.uploadPath)
										assert(dirStats.isDirectory())
										return true
									})
								}
							)
							runTestConditionally(
								typeof clientConfig.anonymousAccessRoutes !== 'undefined',
								'should have an array for anonymousAccessRoutes, if specified',
								function() {
									assert(clientConfig.anonymousAccessRoutes instanceof Array)
								}
							)
							runTestConditionally(
								typeof clientConfig.nonLayoutDirectRoutes !== 'undefined',
								'should have an array for nonLayoutDirectRoutes, if specified',
								function() {
									assert(clientConfig.nonLayoutDirectRoutes instanceof Array)
								}
							)
							runTestConditionally(
								typeof clientConfig.unauthorizedPageRedirectRoute !== 'undefined',
								'should have a non-empty unauthorizedPageRedirectRoute string, if specified',
								function() {
									assert((typeof clientConfig.unauthorizedPageRedirectRoute === 'string') && clientConfig.unauthorizedPageRedirectRoute.length)
								}
							)
							runTestConditionally(
								hasNotFoundRedirectRoutesConfig,
								'should have a non-empty "default" string in the notFoundRedirectRoutes config, if notFoundRedirectRoutes is specified',
								function() {
									assert((typeof notFoundRedirectRoutesConfig.default === 'string') && notFoundRedirectRoutesConfig.default.length)
								}
							)
							runTestConditionally(
								hasNotFoundRedirectRoutesConfig && (typeof notFoundRedirectRoutesConfig.authenticated !== 'undefined'),
								'should have a non-empty "authenticated" string in the notFoundRedirectRoutes config, if notFoundRedirectRoutes and authenticated is specified',
								function() {
									assert((typeof notFoundRedirectRoutesConfig.authenticated === 'string') && notFoundRedirectRoutesConfig.authenticated.length)
								}
							)
							runTestConditionally(
								clientConfig.redirectUnauthorizedPagesToNotFound,
								'should have a notFoundRedirectRoutes config object, if redirectUnauthorizedPagesToNotFound is enabled',
								function() {
									assert(hasNotFoundRedirectRoutesConfig)
								}
							)
							runTestConditionally(
								hasPrependWSServerConfigFromFiles,
								'should have an array at prependWSServerConfigFromFiles, if specified',
								function() {
									assert(prependWSServerConfigFromFilesConfig instanceof Array)
								}
							)
							runTestConditionally(
								hasPrependWSServerConfigFromFiles,
								'should have an existing file at every prependWSServerConfigFromFiles path, if prependWSServerConfigFromFiles is specified',
								function() {
									return co(function*() {
										let allAreFiles = true
										for (const i in prependWSServerConfigFromFilesConfig) {
											let fileStats = yield fs.lstat(prependWSServerConfigFromFilesConfig[i])
											if (!fileStats.isFile()) {
												allAreFiles = false
												break
											}
										}
										assert(allAreFiles)
										return true
									})
								}
							)
							runTestConditionally(
								hasAppendWSServerConfigFromFiles,
								'should have an array at appendWSServerConfigFromFiles, if specified',
								function() {
									assert(appendWSServerConfigFromFilesConfig instanceof Array)
								}
							)
							runTestConditionally(
								hasAppendWSServerConfigFromFiles,
								'should have an existing file at every appendWSServerConfigFromFiles path, if appendWSServerConfigFromFiles is specified',
								function() {
									return co(function*() {
										let allAreFiles = true
										for (const i in appendWSServerConfigFromFilesConfig) {
											let fileStats = yield fs.lstat(appendWSServerConfigFromFilesConfig[i])
											if (!fileStats.isFile()) {
												allAreFiles = false
												break
											}
										}
										assert(allAreFiles)
										return true
									})
								}
							)
							runTestConditionally(
								typeof clientConfig.useApiModuleConfigForAuthTokens !== 'undefined',
								'should have an api module config for an api module named with the value of useApiModuleConfigForAuthTokens, if useApiModuleConfigForAuthTokens is specified',
								function() {
									let apiConfig = config.apis[clientConfig.useApiModuleConfigForAuthTokens]
									assert((typeof apiConfig === 'object') && (apiConfig !== null))
								}
							)
							it('should have a valid, non-empty serverPort', function() {
								assert((typeof clientConfig.serverPort === 'number') && (clientConfig.serverPort > 0) && (clientConfig.serverPort < 100000))
							})
							it('should have a non-empty hostAddress string', function() {
								assert((typeof clientConfig.hostAddress === 'string') && (clientConfig.hostAddress.length > 0))
							})
							it('should have a non-empty host string', function() {
								assert((typeof clientConfig.host === 'string') && (clientConfig.host.length > 0))
							})
							runTestConditionally(
								clientConfig.startWebpackDevserver,
								'should have a webpackDevserverPort set, if startWebpackDeserver is enabled',
								function() {
									assert(typeof clientConfig.webpackDevserverPort !== 'undefined')
								}
							)
							runTestConditionally(
								typeof clientConfig.webpackDevserverPort !== 'undefined',
								'should have a valid, non-empty webpackDevserverPort, if specified',
								function() {
									assert((typeof clientConfig.webpackDevserverPort === 'number') && (clientConfig.webpackDevserverPort > 0) && (clientConfig.webpackDevserverPort < 100000))
								}
							)
							runTestConditionally(
								clientConfig.startWebpackDevserver,
								'should have a webpackHost set, if startWebpackDeserver is enabled',
								function() {
									assert(typeof clientConfig.webpackHost !== 'undefined')
								}
							)
							runTestConditionally(
								typeof clientConfig.webpackHost !== 'undefined',
								'should have a non-empty webpackHost string, if specified',
								function() {
									assert((typeof clientConfig.webpackHost === 'string') && (clientConfig.webpackHost.length > 0))
								}
							)
							it('should have a session config object', function() {
								assert((typeof sessionConfig === 'object') && (sessionConfig !== null))
							})
							it('should have a non-empty "key" string in the session config object', function() {
								assert((typeof sessionConfig.key === 'string') && (sessionConfig.key.length > 0))
							})
							it('should have a non-empty "secret" string in the session config object', function() {
								assert((typeof sessionConfig.secret === 'string') && (sessionConfig.secret.length > 0))
							})
						})
					}
				}
			})


			const apiModulesPath = config.apiModulesPath,
				apisConfig = config.apis
			describeSuiteConditionally(typeof apiModulesPath !== 'undefined', 'api modules', function() {
				let hasApisConfigObject = (typeof apisConfig === 'object') && (apisConfig !== null)
				it('should have a valid directory at the apiModulesPath, if specified', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(apiModulesPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have an "apis" configuration object, if apiModulesPath is specified', function() {
					assert(hasApisConfigObject)
				})
				it('should have a valid directory inside the apiModulesPath for every api config object, if apiModulesPath is specified', function() {
					return co(function*() {
						let dirContents = yield fs.readdir(apiModulesPath),
							hasAllDirectories = true
						for (const apiModuleName in apisConfig) {
							let apiModuleDirStats = yield fs.lstat(path.join(apiModulesPath, apiModuleName))
							if (!apiModuleDirStats.isDirectory()) {
								hasAllDirectories = false
								break
							}
						}
						assert(hasAllDirectories)
						return true
					})
				})
				if (hasApisConfigObject) {
					for (const apiModuleName in apisConfig) {
						const apiConfig = apisConfig[apiModuleName],
							jwtConfig = apiConfig.jwt
						describe(`${apiModuleName} config`, function() {
							it('should have a valid directory inside the apiModulesPath', function() {
								return co(function*() {
									let dirStats = yield fs.lstat(path.join(apiModulesPath, apiModuleName))
									assert(dirStats.isDirectory())
									return true
								})
							})
							runTestConditionally(
								typeof apiConfig.anonymousAccessRoutes !== 'undefined',
								'should have an array for anonymousAccessRoutes, if specified',
								function() {
									assert(apiConfig.anonymousAccessRoutes instanceof Array)
								}
							)
							it('should have a "jwt" config object', function() {
								assert((typeof jwtConfig === 'object') && (jwtConfig !== null))
							})
							runTestConditionally(
								typeof jwtConfig.accessTokenExpiresInMinutes !== 'undefined',
								'should have a positive "accessTokenExpiresInMinutes" integer in the "jwt" config object, if specified',
								function() {
									assert((typeof jwtConfig.accessTokenExpiresInMinutes === 'number') && (jwtConfig.accessTokenExpiresInMinutes > 0))
								}
							)
							it('should have a non-empty "secret" string in the "jwt" config object', function() {
								assert((typeof jwtConfig.secret === 'string') && (jwtConfig.secret.length > 0))
							})
							it('should have a valid, non-empty serverPort', function() {
								assert((typeof apiConfig.serverPort === 'number') && (apiConfig.serverPort > 0) && (apiConfig.serverPort < 100000))
							})
							it('should have a non-empty hostAddress string', function() {
								assert((typeof apiConfig.hostAddress === 'string') && (apiConfig.hostAddress.length > 0))
							})
							it('should have a non-empty host string', function() {
								assert((typeof apiConfig.host === 'string') && (apiConfig.host.length > 0))
							})
						})
					}
				}
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
			})


			const webserver = config.webserver
			describeSuiteConditionally(typeof webserver !== 'undefined', 'webserver-related data', function() {
				it('should have a non-empty webserver, if webserver is specified', function() {
					assert((typeof webserver === 'string') && (webserver.length > 0))
				})
				it('should have a valid, non-empty wsPort, if webserver is specified', function() {
					assert((typeof config.wsPort === 'number') && (config.wsPort > 0) && (config.wsPort < 100000))
				})
				it('should have a valid directory at wsConfigFolderPath, if webserver is specified', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(config.wsConfigFolderPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
			})


			const redisConfig = config.redis
			describe('redis config', function() {
				it('should have a "redis" config object', function() {
					assert((typeof redisConfig === 'object') && (redisConfig !== null))
				})
				it('should have a non-empty host string', function() {
					assert((typeof redisConfig.host === 'string') && (redisConfig.host.length > 0))
				})
				it('should have a valid, non-empty wsPort', function() {
					assert((typeof redisConfig.port === 'number') && (redisConfig.port > 0) && (redisConfig.port < 100000))
				})
			})


			const emailsConfig = config.emails
			describeSuiteConditionally((typeof emailsConfig === 'object') && (emailsConfig !== null), 'emails module', function() {
				let isUsingACustomModule = (typeof emailsConfig.customModulePath !== 'undefined')
				it('should have a non-empty emailServiceProvider string', function() {
					const emailServiceProvider = emailsConfig.emailServiceProvider
					assert((typeof emailServiceProvider === 'string') && (emailServiceProvider.length > 0))
				})
				runTestConditionally(
					emailsConfig.emailServiceProvider === 'sendgrid',
					'should have a non-empty sendgridApiKey string, if emailServiceProvider is "sendgrid"',
					function() {
						const sendgridApiKey = emailsConfig.sendgridApiKey
						assert((typeof sendgridApiKey === 'string') && (sendgridApiKey.length > 0))
					}
				)
				it('should have a non-empty emailSender string', function() {
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
					!isUsingACustomModule || (typeof emailsConfig.templatesPath !== 'undefined'),
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
					typeof emailsConfig.useClientModule !== 'undefined',
					'should have a valid client module config for useClientModule, if specified',
					function() {
						assert(typeof config.clients[emailsConfig.useClientModule] !== 'undefined')
					}
				)
			})


			const cronJobsConfig = config.cronJobs
			describeSuiteConditionally((typeof cronJobsConfig === 'object') && (cronJobsConfig !== null), 'cronJobs module', function() {
				it('should have a valid directory at the cronJobs path, if cronJobs config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(cronJobsConfig.path)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have an index.js file in the directory at the cronJobs path, if cronJobs config is provided', function() {
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


			const migrationsConfig = config.migrations
			describeSuiteConditionally((typeof migrationsConfig === 'object') && (migrationsConfig !== null), 'migrations module', function() {
				it('should have a valid directory at baseMigrationsPath, if migrations config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(migrationsConfig.baseMigrationsPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at seedFilesPath, if migrations config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(migrationsConfig.seedFilesPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at syncHistoryPath, if migrations config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(migrationsConfig.syncHistoryPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at backupPath, if migrations config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(migrationsConfig.backupPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				it('should have a valid directory at staticDataPath, if migrations config is provided', function() {
					return co(function*() {
						let dirStats = yield fs.lstat(migrationsConfig.staticDataPath)
						assert(dirStats.isDirectory())
						return true
					})
				})
				runTestConditionally(migrationsConfig.startAPI, 'should have a valid serverPort, if migrations config is provided and startAPI is enabled', function() {
					return co(function*() {
						const port = migrationsConfig.serverPort
						assert((typeof port === 'number') && (port > 0) && (port < 100000))
						return true
					})
				})
			})
		})
	},
	testLoadDependencies: function() {
		const instance = this
		describe('dependencies', function() {
			it('should execute loadDependencies successfully', function() {
				instance.loadDependencies()
				assert(true)
			})
			it('codeGenerator.should execute testMe successfully', function() {
				instance.codeGenerator.testMe()
				assert(true)
			})
		})
	},
	testLoadModules: function() {
		const instance = this
		describe('loadModules', function() {
			it('should execute successfully', function() {
				return co(function*() {
					yield instance.loadModules()
					assert(true)
					return true
				})
			})
		})
	}
}
