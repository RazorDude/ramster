'use strict'

const
	bodyParser = require('body-parser'),
	co = require('co'),
	express = require('express'),
	fs = require('fs-extra'),
	http = require('http'),
	merge = require('deepmerge'),
	path = require('path'),
	requestLogger = require('morgan'),
	wrap = require('co-express')

class Migrations {
	constructor(config, db) {
		this.config = config
		this.moduleConfig = config.migrations
		this.db = db
	}

	listen() {
		this.app = express()
		this.router = express.Router()
		this.paths = ['/seed', '/sync', '/generateSeed', '/generateBackup', '/insertStaticData']
		const {config, moduleConfig} = this
		let instance = this,
			app = this.app,
			router = this.router

		app.use(requestLogger(`[Migrations Module API] :method request to :url; result: :status; completed in: :response-time; :date`))
		app.use(bodyParser.json())


		router.get('/seed', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.seed({
					seedFolder: req.query.seedFolder && decodeURIComponent(req.query.seedFolder) || instance.config.migrations.seedfilesFolder,
					seedFile: req.query.seedFile && decodeURIComponent(req.query.seedFile) || instance.config.migrations.defaultSeedfileName
				})})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		router.get('/sync', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.sync()})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		router.get('/generateSeed', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.generateSeed({
					seedFile: req.query.seedFile && decodeURIComponent(req.query.seedFile) || instance.config.migrations.defaultSeedfileName
				})})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		router.get('/generateBackup', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.generateBackup()})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		router.get('/insertStaticData', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.insertStaticData()})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		app.use('/', router)
		app.use(this.paths, (req, res) => {
			if (req.locals && req.locals.error) {
				console.log(req.locals.error)
				return res.status(500).end()
			}
			res.status(200).end()
		})

		let migrationsApiServer = http.createServer(app)
		migrationsApiServer.listen(moduleConfig.serverPort, () => {
			console.log(`[Migrations Module API] Server started.`)
			console.log(`[Migrations Module API] Port:`, moduleConfig.serverPort)
			console.log(`[Migrations Module API] Configuration profile:`, config.name)
		})
	}

	getFullTableData() {
		try {
			const instance = this
			return co(function*() {
				let data = {},
					schemas = yield instance.db.sequelize.query('SELECT "t"."table_name" FROM "information_schema"."tables" AS "t" ' +
						'WHERE "t"."table_schema"=\'' + instance.config.db.schema + '\'')
				for (let i = 0; i < schemas[0].length; i++) {
					data[schemas[0][i].table_name] = (yield instance.db.sequelize.query('SELECT * FROM "' +
						instance.config.db.schema + '"."' + schemas[0][i].table_name + '"'))[0]
				}
				return data
			})
		} catch (e) {
			console.log(e)
		}
	}

	getTableLayout(t) {
		try {
			const instance = this
			return co(function*() {
				let data = {},
					schemas = yield instance.db.sequelize.query('SELECT "t"."table_name","c"."column_name" FROM "information_schema"."tables" AS "t" ' +
						'INNER JOIN "information_schema"."columns" AS "c" ON "t"."table_name"="c"."table_name"' +
						'WHERE "t"."table_schema"=\'' + instance.config.db.schema + '\'', {transaction: t})
				for (let i = 0; i < schemas[0].length; i++) {
					if (typeof(data[schemas[0][i].table_name]) === 'undefined') {
						data[schemas[0][i].table_name] = []
					}
					data[schemas[0][i].table_name].push(schemas[0][i].column_name)
				}
				return data
			})
		} catch (e) {
			console.log(e)
		}
	}

	runQueryFromColumnData(instance, tableName, inserts, queryInterface, deleteTableContents, t, dontSetIdSequence) {
		return co(function*() {
			if (inserts.values.length > 0) {
				console.log('Query series starting, rows to execute:', inserts.values.length)
				if (deleteTableContents.indexOf(tableName) !== -1) {
					yield instance.db.sequelize.query('DELETE FROM "' + tableName + '";', {transaction: t})
				}

				let queryTemplate = 'INSERT INTO "' + tableName + '" (',
					query = ''
				for (let i in inserts.columns) {
					queryTemplate += '"' + (queryInterface.escape(inserts.columns[i])).replace(/'/g, '') + '",'
				}
				queryTemplate = queryTemplate.substr(0, queryTemplate.length - 1)
				queryTemplate += ') VALUES '
				query += queryTemplate

				for (let i in inserts.values) {
					let valuesItem = inserts.values[i]
					query += ' ('
					for (let j in valuesItem) {
						query += valuesItem[j] + ','
					}
					query = query.substr(0, query.length - 1)
					query += ')'
					if (parseInt(i, 10) % 100 === 0) {
						query += ';'
						yield instance.db.sequelize.query(query, {transaction: t})
						query = '' + queryTemplate
						continue;
					}
					query += ','
				}
				if (query[query.length - 1] === ',') {
					query = query.substr(0, query.length - 1)
					query += ';'
					yield instance.db.sequelize.query(query, {transaction: t})
				}
				console.log('All queries executed successfully.')

				if (!dontSetIdSequence) {
					yield instance.db.sequelize.query('SELECT setval(\'"' + tableName + '_id_seq"\'::regclass, (SELECT "id" FROM "' + tableName + '" ORDER BY "id" DESC LIMIT 1))', {transaction: t})
				}
			}
		})
	}

	prepareDataObjectForQuery(dataObject, tableLayout, queryInterface) {
		let columns = [],
			values = []
		for (let column in dataObject) {
			if (tableLayout.indexOf(column) !== -1) {
				columns.push(column)
				let columnValue = dataObject[column]
				if ((typeof columnValue === 'object') && (columnValue !== null) && (typeof columnValue.length === 'undefined')) {
					values.push(queryInterface.escape(JSON.stringify(columnValue)))
					continue
				}
				values.push(queryInterface.escape(columnValue))
			}
		}
		return {columns, values}
	}

	// simple DFS; using BFS here will beat the shit out of the server's ram and blow us up
	findVertexById(vertexId, dependencyGraph, action) {
		if (!dependencyGraph || (typeof dependencyGraph !== 'object')) {
			return null
		}
		if (dependencyGraph[vertexId]) {
			if (action === 'get') {
				return dependencyGraph[vertexId]
			}
			if (action === 'delete') {
				delete dependencyGraph[vertexId]
				return true
			}
			return true
		}
		for (const id in dependencyGraph) {
			let targetVertex = this.findVertexById(vertexId, dependencyGraph[id].vertices, 'get')
			if (targetVertex) {
				return targetVertex
			}
		}
		return null
	}

	// DFS again - we want to keep it very strict here, so that the dependencies are followed and the data is inserted in the correct order
	getColumnDataSetsFromDependencyGraph(sets, currentSet, dependencyGraph) {
		for (const id in dependencyGraph) {
			let vertex = dependencyGraph[id],
				stringifiedColumns = JSON.stringify(vertex.columns)
			// we need this if because the root-level vertices won't have columns and values
			if (vertex.values && vertex.columns) {
				if (!currentSet.stringifiedColumns) {
					currentSet.stringifiedColumns = stringifiedColumns
					currentSet.columns = vertex.columns
				} else if (currentSet.stringifiedColumns !== stringifiedColumns) {
					sets.push(currentSet)
					currentSet = {values: []}
				}
				currentSet.values.push(vertex.values)
			}
			this.getColumnDataSetsFromDependencyGraph(sets, currentSet, vertex.vertices)
		}
	}

	prepareColumnData(inserts, data, tableLayout, sameTablePrimaryKey, queryInterface) {
		const instance = this
		let actualData = []
		// if we've got a self dependency for this table, make a graph of which records should be inserted first and in what order
		if (sameTablePrimaryKey) {
			let dependencyGraph = {}
			inserts.dependentSets = []
			// create the dependency graph and the queries for the dependent objects
			let dataLength = data.length
			for (let index = 0; index < dataLength; index++) {
				let dataRow = data[index],
					parentKeyValue = dataRow[sameTablePrimaryKey],
					thisVertex = null
				if (parentKeyValue) {
					let parentVertex = instance.findVertexById(parentKeyValue, dependencyGraph, 'get')
					if (!parentVertex) {
						dependencyGraph[parentKeyValue] = {vertices: {}}
						parentVertex = dependencyGraph[parentKeyValue]
					}
					thisVertex = parentVertex.vertices[dataRow.id]
					if (!thisVertex) {
						thisVertex = instance.findVertexById(dataRow.id, dependencyGraph, 'get')
						// delete the vertex if it exists outside of its parent and add it to the parent
						if (thisVertex) {
							parentVertex.vertices[dataRow.id] = JSON.parse(JSON.stringify(thisVertex))
							thisVertex = parentVertex.vertices[dataRow.id]
							instance.findVertexById(dataRow.id, dependencyGraph, 'delete')
						} else {
							parentVertex.vertices[dataRow.id] = {vertices: {}}
							thisVertex = parentVertex.vertices[dataRow.id]
						}
					}
					let {columns, values} = instance.prepareDataObjectForQuery(dataRow, tableLayout, queryInterface)
					thisVertex.columns = columns
					thisVertex.values = values
					continue
				}
				actualData.push(dataRow)
			}
			// go through the dependencyGraph and prepare the data for query build (dependentSets)
			instance.getColumnDataSetsFromDependencyGraph(instance.dependentSets, {values: []}, dependencyGraph)
		} else {
			actualData = data
		}
		// prepare the rest of the data (non-dependent on parents) for query build
		let actualDataLength = actualData.length
		for (let index = 0; index < actualDataLength; index++) {
			let {columns, values} = instance.prepareDataObjectForQuery(actualData[index], tableLayout, queryInterface),
				stringifiedColumns = JSON.stringify(columns)
			if (typeof(inserts[stringifiedColumns]) === 'undefined') {
				inserts[stringifiedColumns] = {columns, values: []}
			}
			inserts[stringifiedColumns].values.push(values)
		}
	}

	insertData(data, options) {
		try {
			const instance = this
			return instance.db.sequelize.transaction(function (t) {
				return co(function*() {
					const queryInterface = instance.db.sequelize.getQueryInterface(),
						dbComponents = instance.db.components,
						seedingOrder = instance.db.seedingOrder
					let models = Object.keys(dbComponents),
						inserts = {},
						noSync = options && options.noSync || false,
						deleteTableContents = options && options.deleteTableContents || []

					if (!noSync) {
						yield instance.db.sequelize.sync({force: true}, {transaction: t})
					}

					let tableLayout = yield instance.getTableLayout(t)

					// seed the main tables first
					for (let i = 0; i < seedingOrder.length; i++) {
						let modelName = seedingOrder[i]
						const dbComponent = dbComponents[modelName]
						let tableName = dbComponent.model.getTableName()
						if (data[tableName]) {
							if (!inserts[tableName]) {
								inserts[tableName] = {}
							}
							instance.prepareColumnData(inserts[tableName], data[tableName], tableLayout[tableName], dbComponent.sameTablePrimaryKey, queryInterface)
							delete data[tableName]
							delete models[modelName]
						}
					}
					for (let tableName in inserts) {
						let tableInserts = inserts[tableName]
						for (let c in tableInserts) {
							if (c !== 'dependentSets') {
								yield instance.runQueryFromColumnData(instance, tableName, tableInserts[c], queryInterface, deleteTableContents, t)
								continue
							}
							let dependentSets = tableInserts[c]
							if (!(dependentSets instanceof Array)) {
								continue
							}
							for (const i in dependentSets) {
								yield instance.runQueryFromColumnData(instance, tableName, dependentSets[i], queryInterface, deleteTableContents, t)
							}
						}
					}
					inserts = {}

					// seed the rest of the tables from instance.db
					for (let i = 0; i < models.length; i++) {
						const dbComponent = dbComponents[modelName]
						let modelName = models[i],
							tableName = dbComponent.model.getTableName()
						if (data[tableName]) {
							if (typeof(inserts[tableName]) === 'undefined') {
								inserts[tableName] = {}
							}
							instance.prepareColumnData(inserts[tableName], data[tableName], tableLayout[tableName], dbComponent.sameTablePrimaryKey, queryInterface)
							delete data[tableName]
						}
					}
					for (let tableName in inserts) {
						let tableInserts = inserts[tableName]
						for (let c in tableInserts) {
							if (c !== 'dependentSets') {
								yield instance.runQueryFromColumnData(instance, tableName, tableInserts[c], queryInterface, deleteTableContents, t)
								continue
							}
							let dependentSets = tableInserts[c]
							if (!(dependentSets instanceof Array)) {
								continue
							}
							for (const i in dependentSets) {
								yield instance.runQueryFromColumnData(instance, tableName, dependentSets[i], queryInterface, deleteTableContents, t)
							}
						}
					}
					inserts = {}

					// seed the remaining data (junction tables and other tables without sequelize models)
					for (let tableName in data) {
						if (typeof(inserts[tableName]) === 'undefined') {
							inserts[tableName] = {}
						}
						instance.prepareColumnData(inserts[tableName], data[tableName], tableLayout[tableName], null, queryInterface)
					}
					for (let tableName in inserts) {
						let tableInserts = inserts[tableName]
						for (let c in tableInserts) {
							yield instance.runQueryFromColumnData(instance, tableName, tableInserts[c], queryInterface, deleteTableContents, t, true)
						}
					}

					return true
				})
			})
		} catch (e) {
			console.log(e)
		}
	}

	sync() {
		const instance = this
		return co(function*() {
			let data = yield instance.getFullTableData(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `${(new Date()).getTime()}.json`), 'w'),
				bytesWritten = yield fs.write(fileDescriptor, JSON.stringify(data))
			yield fs.close(fileDescriptor)
			return {
				success: yield instance.insertData(data)
			}
		})
	}

	seed({seedFolder, seedFile}) {
		const instance = this
		return co(function*() {
			return yield instance.insertData(JSON.parse((yield fs.readFile(path.join(instance.config.migrations.baseMigrationsPath, seedFolder, `${seedFile}.json`))).toString()))
		})
	}

	generateSeed({seedFile}) {
		const instance = this
		return co(function*() {
			let seed = JSON.stringify(yield instance.getFullTableData()),
				now = new Date().getTime(),
				oldFilePath = path.join(instance.config.migrations.seedFilesPath, `${seedFile}_${now}.json`)
			try {
				//write a backup copy to preserve the old seed as history, then to the file that will be used for seeding
				let fileDescriptor = yield fs.open(oldFilePath, 'w')
				yield fs.write(fileDescriptor, (yield fs.readFile(path.join(instance.config.migrations.seedFilesPath, `${seedFile}.json`))).toString())
				yield fs.close(fileDescriptor)
			} catch (e) {
				yield fs.unlink(oldFilePath)
			}
			let newFileDescriptor = yield fs.open(path.join(instance.config.migrations.seedFilesPath, `${seedFile}.json`), 'w'),
			 	result = yield fs.write(newFileDescriptor, seed)
			yield fs.close(newFileDescriptor)
			return {success: true}
		})
	}

	generateBackup() {
		const instance = this
		return co(function*() {
			let seed = JSON.stringify(yield instance.getFullTableData()),
				now = new Date().getTime(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.backupPath, `backup_${now}.json`), 'w'),
				result = yield fs.write(fileDescriptor, seed)
			yield fs.close(fileDescriptor)
			return result
		})
	}

	insertStaticData() {
		const instance = this,
			sequelize = this.db.sequelize
		return sequelize.transaction((t) => {
			return co(function*() {
				// write a backup of the current database data for safety reasons
				let currentData = yield instance.getFullTableData(),
					now = new Date().getTime(),
					fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `pre_static_data_insert_${now}.json`), 'w')
				yield fs.write(fileDescriptor, JSON.stringify(currentData))
				yield fs.close(fileDescriptor)

				// get the data from the file and merge it with the current data
				let staticData = JSON.parse((yield fs.readFile(path.join(instance.config.migrations.staticDataPath, 'staticData.json'))).toString())
				for (const tableName in staticData) {
					const tableStaticData = staticData[tableName],
						primaryKeys = tableStaticData.primaryKeys
					let currentTableData = currentData[tableName]
					if (typeof currentTableData === 'undefined') {
						currentTableData = []
						currentData[tableName] = currentTableData
					}
					let currentTableDataPKIndexMap = {}
					if (primaryKeys.length) {
						currentTableData.forEach((row, index) => {
							let currentKey = ''
							primaryKeys.forEach((pk, pkIndex) => {
								currentKey += `${row[pk]}-`
							})
							currentKey = currentKey.substr(0, currentKey.length - 1)
							currentTableDataPKIndexMap[currentKey] = index
						})
						tableStaticData.data.forEach((row, index) => {
							let currentKey = ''
							primaryKeys.forEach((pk, pkIndex) => {
								currentKey += `${row[pk]}-`
							})
							currentKey = currentKey.substr(0, currentKey.length - 1)
							let cdIndex = currentTableDataPKIndexMap[currentKey]
							if (typeof cdIndex === 'undefined') {
								currentTableData.push(row)
								return
							}
							currentTableData[cdIndex] = merge(currentTableData[cdIndex], row)
						})
						continue
					}
					currentTableData = currentTableData.concat(tableStaticData.data)
				}

				// seed the merged data
				return yield instance.insertData(currentData)
			})
		})
	}
}

module.exports = Migrations
