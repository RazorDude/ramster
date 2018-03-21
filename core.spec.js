'use strict'

const
	APIModule = require('./modules/api/api.module'),
	assert = require('assert'),
	BaseAPIComponent = require('./modules/api/base-api.component'),
	BaseClientComponent = require('./modules/client/base-client.component'),
	BaseDBComponent = require('./modules/db/base-db.component'),
	BaseServerComponent = require('./modules/shared/base-server.component'),
	BaseServerModule = require('./modules/shared/base-server.module'),
	co = require('co'),
	ClientModule = require('./modules/client/client.module'),
	csvPromise = new (require('./modules/csvPromise'))(),
	{describeSuiteConditionally, runTestConditionally} = require('./modules/toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	{spawn} = require('child_process'),
	toolbeltSpec = require('./modules/toolbelt/index.spec'),
	webpackBuildSpec = require('./modules/codeGenerator/templates/webpackBuild.spec'),
	webpackDevserverSpec = require('./modules/codeGenerator/templates/webpackDevserver.spec')

module.exports = {
	testMe: function() {
		const instance = this
		let aTestHasFailed = false
		afterEach(function() {
			if (!aTestHasFailed && (this.currentTest.state !== 'passed')) {
				aTestHasFailed = true
			}
		})
		after((function() {
			setTimeout(() => {
				if (aTestHasFailed) {
					process.exit(1)
				}
				process.exit(0)
			}, 1000)
		}))
		describe('core', function() {
			it('should execute testConfig successfully', function() {
				instance.testConfig()
				assert(true)
			})
			it('should execute csvPromise.testMe successfully', function() {
				csvPromise.testMe()
				assert(true)
			})
			it('should execute toolbeltSpec.testAll successfully', function() {
				toolbeltSpec.testAll()
				assert(true)
			})
			it('should execute testWebpackBuildTools successfully', function() {
				instance.testWebpackBuildTools()
				assert(true)
			})
			it('should execute testLoadDependencies successfully', function() {
				instance.testLoadDependencies()
				assert(true)
			})
			it('should execute testErrorLogger successfully', function() {
				instance.testErrorLogger()
				assert(true)
			})
			it('should execute testGeneralStore successfully', function() {
				instance.testGeneralStore()
				assert(true)
			})
			it('should execute testTokenManager successfully', function() {
				instance.testTokenManager()
				assert(true)
			})
			it('should execute testCodeGenerator successfully', function() {
				instance.testCodeGenerator()
				assert(true)
			})
			it('should execute testLoadDB successfully', function() {
				instance.testLoadDB()
				assert(true)
			})
			it('should execute testMailClient successfully', function() {
				instance.testMailClient()
				assert(true)
			})
			it('should execute testMigrations successfully', function() {
				instance.testMigrations()
				assert(true)
			})
			it('should execute testDBModule successfully', function() {
				instance.testDBModule()
				assert(true)
			})
			it('should execute testLoadClients successfully', function() {
				instance.testLoadClients()
				assert(true)
			})
			it('should execute testLoadAPIs successfully', function() {
				instance.testLoadAPIs()
				assert(true)
			})
			it('should execute testBaseServerModule successfully', function() {
				instance.testBaseServerModule()
				assert(true)
			})
			it('should execute testClientModule successfully', function() {
				instance.testClientModule()
				assert(true)
			})
			it('should execute testAPIModule successfully', function() {
				instance.testAPIModule()
				assert(true)
			})
			it('should execute testLoadCRONJobs successfully', function() {
				instance.testLoadCRONJobs()
				assert(true)
			})
			it('should execute testListen successfully', function() {
				instance.testListen()
				assert(true)
			})
		})
	},
	testConfig: function() {
		const instance = this,
			config = this.config
		describe('core.config', function() {
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
					assert(['postgreSQL'].indexOf(dbConfig.dbType) !== -1)
				})
				it('should have a "postgreSQL" configuration object, if db config is provided and "dbType" is postgreSQL', function() {
					assert((typeof config.postgreSQL === 'object') && (config.postgreSQL !== null))
				})
			})


			const postgresConfig = config.postgreSQL
			describeSuiteConditionally((typeof postgresConfig === 'object') && (postgresConfig !== null), 'postgreSQL', function() {
				it('should have a valid, non-empty user string, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof postgresConfig.user === 'string') && postgresConfig.user.length)
				})
				it('should have a valid, non-empty password string, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof postgresConfig.password === 'string') && postgresConfig.password.length)
				})
				it('should have a valid, non-empty host string, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof postgresConfig.host === 'string') && postgresConfig.host.length)
				})
				it('should have a valid, non-empty port, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof postgresConfig.port === 'number') && (postgresConfig.port > 0) && (postgresConfig.port < 100000))
				})
				it('should have a valid, non-empty database string, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof postgresConfig.database === 'string') && postgresConfig.database.length)
				})
				it('should have a valid, non-empty config.db.schema string, if db config is provided and dbType is postgreSQL', function() {
					assert((typeof dbConfig.schema === 'string') && dbConfig.schema.length)
				})
				runTestConditionally(
					typeof postgresConfig.mockDatabase !== 'undefined',
					'should have a valid, non-empty mockDatabase string, if db config is provided and mockDatabase is provided',
					function() {
						assert((typeof postgresConfig.mockDatabase === 'string') && postgresConfig.mockDatabase.length)
					}
				)
				it('should have a valid, non-empty schema name string, if db config is provided and dbType is postgreSQL', function() {
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
	testWebpackBuildTools: function() {
		const instance = this
		describe('webpack build tools', function() {
			it('should execute webpackBuildSpec.testMe successfully', function() {
				webpackBuildSpec.testMe(instance.config, path.join(__dirname, 'test'))
				assert(true)
			})
			it('should execute webpackDevserverSpec.testMe successfully', function() {
				webpackDevserverSpec.testMe(instance.config, path.join(__dirname, 'test'))
				assert(true)
			})
		})
	},
	testLoadDependencies: function() {
		const instance = this
		describe('core.dependencies', function() {
			it('should execute loadDependencies successfully', function() {
				return co(function*() {
					yield instance.loadDependencies()
					assert(true)
					return true
				})
			})
		})
	},
	testErrorLogger: function() {
		const instance = this
		describe('core.errorLogger', function() {
			it('should execute testMe successfully', function() {
				instance.logger.testMe()
				assert(true)
			})
		})
	},
	testGeneralStore: function() {
		const instance = this
		describe('core.generalStore', function() {
			it('should execute testMe successfully', function() {
				instance.generalStore.testMe()
				assert(true)
			})
		})
	},
	testTokenManager: function() {
		const instance = this
		describe('core.tokenManager', function() {
			it('should execute testMe successfully', function() {
				instance.tokenManager.testMe()
				assert(true)
			})
		})
	},
	testCodeGenerator: function() {
		const instance = this
		describe('core.codeGenerator', function() {
			it('should execute testMe successfully', function() {
				instance.codeGenerator.testMe()
				assert(true)
			})
		})
	},
	testLoadDB: function() {
		const instance = this
		describe('core.loadDB', function() {
			it('should execute successfully if all parameters and configuration variables are correct', function() {
				return co(function*() {
					yield instance.loadDB()
					assert(true)
					return true
				})
			})
		})
	},
	testMailClient: function() {
		const instance = this
		describe('core.mailClient', function() {
			it.skip('should execute loadMailClient successfully if all parameters and a custom emails module is used', function() {
				return co(function*() {
					yield instance.loadMailClient()
					assert(true)
					return true
				})
			})
			it('should execute loadMailClient successfully if all parameters and a custom emails module is not used', function() {
				return co(function*() {
					yield instance.loadMailClient()
					assert(true)
					return true
				})
			})
			it('should execute testMe successfully', function() {
				instance.mailClient.testMe()
				assert(true)
			})
		})
	},
	testMigrations: function() {
		const instance = this
		describe('core.migrations', function() {
			it('should execute loadMigrations successfully if all parameters and configuration variables are correct', function() {
				instance.loadMigrations()
				assert(true)
			})
			it('should execute testMe successfully', function() {
				instance.migrations.testMe()
				assert(true)
			})
		})
	},
	testDBModule: function() {
		const instance = this
		describe('core.modules.db', function() {
			it('should execute testMe successfully', function() {
				instance.modules.db.testMe()
				assert(true)
			})
			it('should execute BaseDBComponent.testMe successfully', function() {
				let testDBComponent = new BaseDBComponent()
				testDBComponent.sequelize = instance.modules.db.sequelize
				testDBComponent.Sequelize = instance.modules.db.Sequelize
				testDBComponent.testMe()
				assert(true)
			})
		})
	},
	testLoadClients: function() {
		const instance = this
		describe('core.loadClients', function() {
			it('should execute successfully if all parameters and configuration variables are correct', function() {
				return co(function*() {
					yield instance.loadClients()
					assert(true)
					return true
				})
			})
		})
	},
	testLoadAPIs: function() {
		const instance = this
		describe('core.loadAPIs', function() {
			it('should execute successfully if all parameters and configuration variables are correct', function() {
				return co(function*() {
					yield instance.loadAPIs()
					assert(true)
					return true
				})
			})
		})
	},
	testLoadCRONJobs: function() {
		const instance = this
		describe('core.loadCRONJobs', function() {
			it('should execute successfully if all parameters and configuration variables are correct', function() {
				instance.loadCRONJobs()
				assert(true)
			})
		})
	},
	testBaseServerModule: function() {
		const instance = this
		describe('core.modules.base-server.module', function() {
			it('should execute BaseServerModule.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testServerModule = new BaseServerModule(instance.config, 'site', 'client', {db, logger, generalStore, tokenManager})
				testServerModule.testMe()
				assert(true)
			})
			it('should execute BaseServerComponent.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testServerComponent = new BaseServerComponent({})
				testServerComponent.module = new BaseServerModule(instance.config, 'site', 'client', {db, logger, generalStore, tokenManager})
				testServerComponent.testMe()
				assert(true)
			})
		})
	},
	testClientModule: function() {
		const instance = this
		describe('core.modules.client', function() {
			it('should execute ClientModule.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testClientModule = new ClientModule(instance.config, 'site', {db, logger, generalStore, tokenManager})
				testClientModule.testMe()
				assert(true)
			})
			it('should execute BaseClientComponent.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testClientComponent = new BaseClientComponent({componentName: 'testComponent'})
				testClientComponent.module = new ClientModule(instance.config, 'site', {db, logger, generalStore, tokenManager})
				testClientComponent.testMe()
				assert(true)
			})
		})
	},
	testAPIModule: function() {
		const instance = this
		describe('core.modules.api', function() {
			it('should execute APIModule.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testAPIModule = new APIModule(instance.config, 'site', {db, logger, generalStore, tokenManager})
				testAPIModule.testMe()
				assert(true)
			})
			it('should execute BaseAPIComponent.testMe successfully', function() {
				const {logger, generalStore, tokenManager} = instance,
					db = instance.modules.db
				let testAPIComponent = new BaseAPIComponent({componentName: 'testComponent'})
				testAPIComponent.module = new APIModule(instance.config, 'site', {db, logger, generalStore, tokenManager})
				testAPIComponent.testMe()
				assert(true)
			})
		})
	},
	testListen: function() {
		const instance = this
		describe('core.listen', function() {
			it('should execute successfully if all parameters and configuration variables are correct', function() {
				return co(function*() {
					yield instance.listen()
					assert(true)
					return true
				})
			})
		})
	}
}
