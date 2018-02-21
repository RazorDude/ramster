'use strict'

const
	bodyParser = require('body-parser'),
	co = require('co'),
	express = require('express'),
	{findVertexByIdDFS} = require('../toolbelt'),
	fs = require('fs-extra'),
	http = require('http'),
	merge = require('deepmerge'),
	path = require('path'),
	requestLogger = require('morgan'),
	spec = require('./index.spec'),
	wrap = require('co-express')

class Migrations {
	constructor(config, sequelize, dbComponents, seedingOrder) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
		this.schema = config.db.schema
		this.moduleConfig = config.migrations
		this.sequelize = sequelize
		this.dbComponents = dbComponents
		this.seedingOrder = seedingOrder
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
				res.json({data: yield instance.seed(
					req.query.seedFolder && decodeURIComponent(req.query.seedFolder),
					req.query.seedFile && decodeURIComponent(req.query.seedFile)
				)})
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
				res.json({data: yield instance.generateSeed(
					req.query.seedFile && decodeURIComponent(req.query.seedFile)
				)})
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

		this.server = http.createServer(app)
		this.server.listen(moduleConfig.serverPort, () => {
			console.log(`[Migrations Module API] Server started.`)
			console.log(`[Migrations Module API] Port:`, moduleConfig.serverPort)
			console.log(`[Migrations Module API] Configuration profile:`, config.name)
		})
	}

	getFullTableData(t) {
		if (!t) {
			return this.sequelize.transaction((t) => this.getFullTableData(t))
		}
		const instance = this
		return co(function*() {
			let data = {},
				schema = (yield instance.sequelize.query(`select "t"."table_name" from "information_schema"."tables" as "t" where "t"."table_schema"='${instance.schema}';`, {transaction: t}))[0]
			if (!schema) {
				return data
			}
			for (let i = 0; i < schema.length; i++) {
				let tableName = schema[i].table_name
				data[tableName] = (yield instance.sequelize.query(`select * from "${instance.schema}"."${tableName}"`, {transaction: t}))[0]
			}
			return data
		})
	}

	getTableLayout(t) {
		if (!t) {
			return this.sequelize.transaction((t) => this.getTableLayout(t))
		}
		const instance = this
		return co(function*() {
			let data = {},
				schema = (yield instance.sequelize.query(`
					select "t"."table_name", "c"."column_name" from "information_schema"."tables" AS "t"
					inner join "information_schema"."columns" AS "c" on "t"."table_name"="c"."table_name"
					where "t"."table_schema"='${instance.schema}';`,
					{transaction: t}
				))[0]
			if (!schema) {
				return data
			}
			for (let i = 0; i < schema.length; i++) {
				let tableName = schema[i].table_name
				if (typeof data[tableName] === 'undefined') {
					data[tableName] = []
				}
				data[tableName].push(schema[i].column_name)
			}
			return data
		})
	}

	removeAllTables(t) {
		if (!t) {
			return this.sequelize.transaction((t) => this.removeAllTables(t))
		}
		const instance = this
		return co(function*() {
			let tables = (yield instance.sequelize.query(`select "t"."table_name" FROM "information_schema"."tables" AS "t" where "t"."table_schema"='${instance.config.db.schema}';`, {transaction: t}))[0],
				dropQuery = ''
			tables.forEach((row, index) => {
				dropQuery += `drop table "${row.table_name}" cascade;`
			})
			yield instance.sequelize.query(dropQuery, {transaction: t})
			return true
		})
	}

	runQueryFromColumnData(queryInterface, tableName, inserts, t, options) {
		const instance = this,
			{config, sequelize} = this
		return co(function*() {
			if (!queryInterface || (typeof queryInterface !== 'object') || (typeof queryInterface.escape !== 'function')) {
				throw {customMessage: `Invalid queryInterface object provided.`}
			}
			if ((typeof tableName !== 'string') || !tableName.length) {
				throw {customMessage: 'Invalid tableName string provided.'}
			}
			if (!inserts || (typeof inserts !== 'object')) {
				throw {customMessage: `At table "${tableName}": invalid inserts object provided.`}
			}
			const {columns, values} = inserts
			if (!(columns instanceof Array) || !columns.length) {
				throw {customMessage: `At table "${tableName}": inserts.columns must be a non-empty array.`}
			}
			if (!(values instanceof Array)) {
				throw {customMessage: `At table "${tableName}": inserts.values must be an array.`}
			}
			const actualOptions = options || {},
				{deleteTableContents, dontSetIdSequence} = actualOptions
			if ((typeof deleteTableContents !== 'undefined') && !(deleteTableContents instanceof Array)) {
				throw {customMessage: `At table "${tableName}": if provided, deleteTableContents must be an array.`}
			}
			if (values.length > 0) {
				if (config.postgreSQL.logging) {
					console.log(`Query series starting, rows to execute: ${values.length} for table ${tableName}...`)
				}
				if (deleteTableContents && deleteTableContents.indexOf(tableName) !== -1) {
					yield sequelize.query(`delete from "${tableName}";`, {transaction: t})
				}

				const columnCount = columns.length
				let queryTemplate = `insert into "${tableName}" (`,
					query = ''
				for (let i in columns) {
					queryTemplate += `"${(queryInterface.escape(columns[i])).replace(/^'|'$/g, '')}",`
					// queryTemplate += `"${columns[i]}",`
				}
				queryTemplate = queryTemplate.substr(0, queryTemplate.length - 1)
				queryTemplate += ') values '
				query += queryTemplate

				for (let i in values) {
					let valuesItem = values[i]
					if (!(valuesItem instanceof Array)) {
						throw {customMessage: `At table "${tableName}", item no. ${i}: inserts.values items must be arrays.`}
					}
					if (valuesItem.length !== columnCount) {
						throw {customMessage: `At table "${tableName}", item no. ${i}: the number of fields in this item does not match the number of columns in inserts.columns.`}
					}
					query += ' ('
					for (let j in valuesItem) {
						query += `${queryInterface.escape(valuesItem[j])},`
					}
					query = query.substr(0, query.length - 1)
					query += ')'
					if ((i > 0) && (parseInt(i, 10) % 100 === 0)) {
						query += ';'
						yield sequelize.query(query, {transaction: t})
						query = '' + queryTemplate
						continue;
					}
					query += ','
				}
				if (query[query.length - 1] === ',') {
					query = query.substr(0, query.length - 1)
					query += ';'
					yield sequelize.query(query, {transaction: t})
				}
				if (config.postgreSQL.logging) {
					console.log('All queries executed successfully.')
				}

				if (dontSetIdSequence !== true) {
					yield sequelize.query(`select setval('"${tableName}_id_seq"'::regclass, (select "id" from "${tableName}" order by "id" desc limit 1));`, {transaction: t})
				}
			}
		})
	}

	escapeRecursively(queryInterface, value) {
		if ((typeof value === 'undefined') || (value === null)) {
			return value
		}
		if (value instanceof Array) {
			let escapedObject = []
			value.forEach((item, index) => escapedObject.push(this.escapeRecursively(queryInterface, item)))
			return escapedObject
		}
		if (typeof value === 'object') {
			let escapedObject = {}
			for (const key in value) {
				escapedObject[key] = this.escapeRecursively(queryInterface, value[key])
			}
			return escapedObject
		}
		if (typeof value !== 'string') {
			return value
		}
		return queryInterface.escape(value).replace(/^'|'$/g, '')
	}

	prepareDataObjectForQuery(tableLayout, dataObject) {
		let columns = [],
			values = []
		if (!tableLayout || !(tableLayout instanceof Array)) {
			throw {customMessage: 'Invalid tableLayout array provided.'}
		}
		if (!dataObject || (typeof dataObject !== 'object')) {
			throw {customMessage: 'Invalid dataObject provided.'}
		}
		for (let column in dataObject) {
			if (tableLayout.indexOf(column) !== -1) {
				columns.push(column)
				let columnValue = dataObject[column]
				if ((typeof columnValue === 'object') && (columnValue !== null)) {
					values.push(JSON.stringify(columnValue))
					continue
				}
				values.push(columnValue)
			}
		}
		return {columns, values}
	}

	getLinearArrayFromDependencyGraph(dependencyGraph) {
		if (!dependencyGraph || (typeof dependencyGraph !== 'object')) {
			throw {customMessage: 'Invalid dependencyGraph object provided.'}
		}
		let arr = []
		for (const id in dependencyGraph) {
			let vertex = dependencyGraph[id]
			if (!vertex.data || (typeof vertex.data !== 'object')) {
				throw {customMessage: `At vertex id ${id}: invalid data object.`}
			}
			arr.push(vertex.data)
			if (vertex.vertices && (typeof vertex.vertices === 'object')) {
				arr = arr.concat(this.getLinearArrayFromDependencyGraph(vertex.vertices))
			}
		}
		return arr
	}

	prepareColumnData(data, tableLayout, sameTablePrimaryKey) {
		if (!(data instanceof Array)) {
			throw {customMessage: 'Invalid data array provided.'}
		}
		if (!(tableLayout instanceof Array)) {
			throw {customMessage: 'Invalid tableLayout array provided.'}
		}
		if ((typeof sameTablePrimaryKey !== 'undefined') && ((typeof sameTablePrimaryKey !== 'string') || !sameTablePrimaryKey.length)) {
			throw {customMessage: 'Invalid sameTablePrimaryKey string provided.'}
		}
		const instance = this,
			dataLength = data.length
		// if we've got a self dependency for this table, make a graph of which records should be inserted first and in what order
		if (sameTablePrimaryKey) {
			let dependentDataSets = [],
				dependencyGraph = {}
			// create the dependency graph, containing the data to be inserted for each row
			for (let index = 0; index < dataLength; index++) {
				let dataRow = data[index],
					parentKeyValue = dataRow[sameTablePrimaryKey],
					thisVertex = null
				// if the row is dependent on another row from the same table, add it to the dependency graph
				if (parentKeyValue) {
					let parentVertex = findVertexByIdDFS(parentKeyValue, dependencyGraph, 'get')
					if (!parentVertex) {
						dependencyGraph[parentKeyValue] = {vertices: {}}
						parentVertex = dependencyGraph[parentKeyValue]
					}
					thisVertex = parentVertex.vertices[dataRow.id]
					if (!thisVertex) {
						thisVertex = findVertexByIdDFS(dataRow.id, dependencyGraph, 'get')
						// delete the vertex if it exists outside of its parent and add it to the parent
						if (thisVertex) {
							parentVertex.vertices[dataRow.id] = JSON.parse(JSON.stringify(thisVertex))
							thisVertex = parentVertex.vertices[dataRow.id]
							findVertexByIdDFS(dataRow.id, dependencyGraph, 'delete')
						} else {
							parentVertex.vertices[dataRow.id] = {vertices: {}}
							thisVertex = parentVertex.vertices[dataRow.id]
						}
					}
					thisVertex.data = dataRow
					continue
				}
				// otherwise, add a top-level vertex
				dependencyGraph[dataRow.id] = {data: dataRow, vertices: {}}
			}
			// go through the dependencyGraph and transform it into a linear array
			let currentSet = {values: []},
				linearArray = instance.getLinearArrayFromDependencyGraph(dependencyGraph)
			// compile the sequential items with identical column lists into data sets
			linearArray.forEach((item, iIndex) => {
				let {columns, values} = instance.prepareDataObjectForQuery(tableLayout, item),
					stringifiedColumns = JSON.stringify(columns)
				if (!currentSet.stringifiedColumns) {
					currentSet.stringifiedColumns = JSON.stringify(columns)
					currentSet.columns = columns
				} else if (currentSet.stringifiedColumns !== stringifiedColumns) {
					dependentDataSets.push(currentSet)
					currentSet = {values: [], stringifiedColumns, columns}
				}
				currentSet.values.push(values)
			})
			dependentDataSets.push(currentSet)
			return dependentDataSets
		}
		// prepare the data for query build by mapping the inserts by column list
		let inserts = {}
		for (let index = 0; index < dataLength; index++) {
			let {columns, values} = instance.prepareDataObjectForQuery(tableLayout, data[index]),
				stringifiedColumns = JSON.stringify(columns)
			if (typeof(inserts[stringifiedColumns]) === 'undefined') {
				inserts[stringifiedColumns] = {columns, values: []}
			}
			inserts[stringifiedColumns].values.push(values)
		}
		return inserts
	}

	insertData(data, options) {
		const instance = this,
			{sequelize, dbComponents, seedingOrder} = this
		return instance.sequelize.transaction(function (t) {
			return co(function*() {
				if (!data || (typeof data !== 'object')) {
					throw {customMessage: 'Invalid data object provided.'}
				}
				const queryInterface = sequelize.getQueryInterface()
				let models = Object.keys(dbComponents),
					noSync = options && options.noSync || false,
					deleteTableContents = options && options.deleteTableContents || []

				if (noSync !== true) {
					yield sequelize.sync({force: true, transaction: t})
				}

				let tableLayout = yield instance.getTableLayout(t)

				// seed the tables for the components from seedingOrder
				for (const i in seedingOrder) {
					let componentName = seedingOrder[i]
					const dbComponent = dbComponents[componentName]
					let tableName = dbComponent.model.getTableName()
					if (!data[tableName]) {
						continue
					}
					let preparedData = instance.prepareColumnData(data[tableName], tableLayout[tableName], dbComponent.sameTablePrimaryKey)
					for (const j in preparedData) {
						yield instance.runQueryFromColumnData(queryInterface, tableName, preparedData[j], t, {deleteTableContents})
					}
					delete data[tableName]
					delete models[componentName]
				}

				// seed the tables for the rest of the components
				for (const i in models) {
					let componentName = models[i]
					const dbComponent = dbComponents[componentName]
					let tableName = dbComponent.model.getTableName()
					if (data[tableName]) {
						let preparedData = instance.prepareColumnData(data[tableName], tableLayout[tableName], dbComponent.sameTablePrimaryKey)
						for (const j in preparedData) {
							yield instance.runQueryFromColumnData(queryInterface, tableName, preparedData[j], t, {deleteTableContents})
						}
						delete data[tableName]
					}
				}

				// seed the remaining data (junction tables and other tables without sequelize models)
				for (let tableName in data) {
					let thisTableLayout = tableLayout[tableName]
					if (!thisTableLayout) {
						continue
					}
					let preparedData = instance.prepareColumnData(data[tableName], thisTableLayout)
					for (const j in preparedData) {
						yield instance.runQueryFromColumnData(queryInterface, tableName, preparedData[j], t, {deleteTableContents, dontSetIdSequence: true})
					}
				}

				return true
			})
		})
	}

	sync() {
		const instance = this
		return co(function*() {
			let data = yield instance.getFullTableData(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `preSync_${(new Date()).getTime()}.json`), 'w')
			yield fs.write(fileDescriptor, JSON.stringify(data))
			yield fs.close(fileDescriptor)
			yield instance.insertData(data)
			return {success: true}
		})
	}

	generateSeed(seedFileName) {
		const instance = this
		return co(function*() {
			if ((typeof seedFileName !== 'string') || !seedFileName.length) {
				throw {customMessage: 'Invalid seedFileName string provided.'}
			}
			let seed = JSON.stringify(yield instance.getFullTableData()),
				now = new Date().getTime(),
				oldFilePath = path.join(instance.config.migrations.seedFilesPath, `${seedFileName}_${now}.json`)
			try {
				// write a backup copy to preserve the old seed as history, then to the file that will be used for seeding
				let fileDescriptor = yield fs.open(oldFilePath, 'w')
				yield fs.write(fileDescriptor, (yield fs.readFile(path.join(instance.config.migrations.seedFilesPath, `${seedFileName}.json`))).toString())
				yield fs.close(fileDescriptor)
			} catch (e) {
				yield fs.unlink(oldFilePath)
			}
			let newFileDescriptor = yield fs.open(path.join(instance.config.migrations.seedFilesPath, `${seedFileName}.json`), 'w'),
				result = yield fs.write(newFileDescriptor, seed)
			yield fs.close(newFileDescriptor)
			return {success: true}
		})
	}

	seed(seedFolderName, seedFileName) {
		const instance = this
		return co(function*() {
			if ((typeof seedFolderName !== 'string') || !seedFolderName.length) {
				throw {customMessage: 'Invalid seedFolderName string provided.'}
			}
			if ((typeof seedFileName !== 'string') || !seedFileName.length) {
				throw {customMessage: 'Invalid seedFileName string provided.'}
			}
			let oldData = yield instance.getFullTableData(),
				newData = JSON.parse((yield fs.readFile(path.join(instance.config.migrations.baseMigrationsPath, seedFolderName, `${seedFileName}.json`))).toString()),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `preSeed_${(new Date()).getTime()}.json`), 'w')
			yield fs.write(fileDescriptor, JSON.stringify(oldData))
			yield fs.close(fileDescriptor)
			yield instance.insertData(newData)
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
			sequelize = this.sequelize,
			dbComponents = this.dbComponents
		return co(function*() {
			// write a backup of the current database data for safety reasons
			let currentData = yield instance.getFullTableData(),
				now = new Date().getTime(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `preStaticDataInsert_${now}.json`), 'w')
			yield fs.write(fileDescriptor, JSON.stringify(currentData))
			yield fs.close(fileDescriptor)

			// get the data from the file and merge it with the current data
			let staticData = JSON.parse((yield fs.readFile(path.join(instance.config.migrations.staticDataPath, 'staticData.json'))).toString())
			// insert the staticData according to the seeding order
			instance.seedingOrder.forEach((componentName, index) => {
				const tableName = dbComponents[componentName].model.getTableName()
				if (staticData[tableName]) {
					const tableStaticData = JSON.parse(JSON.stringify(staticData[tableName])),
						primaryKeys = tableStaticData.primaryKeys
					delete staticData[tableName]
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
						return
					}
					currentTableData = currentTableData.concat(tableStaticData.data)
				}
			})
			// insert the rest of the staticData
			if (Object.keys(staticData).length) {
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
			}

			// seed the merged data
			yield instance.insertData(currentData)
			return {success: true}
		})
	}
}

module.exports = Migrations
