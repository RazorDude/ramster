'use strict'

let co = require('co'),
	fs = require('fs-promise'),
	path = require('path'),
	express = require('express'),
	wrap = require('co-express'),
	bodyParser = require('body-parser'),
	requestLogger = require('morgan'),
	getAuthMiddleware = (passKey) => (req, res, next) => {
		if (req.header('X-Auth-Passkey') !== passKey) {
			return res.status(401).end()
		}
		next()
	}

class Migrations {
	constructor(config, db) {
		let instance = this

		this.config = config
		this.db = db

		this.app = express()
		this.router = express.Router()
		this.paths = ['/seed', '/sync', '/generateSeed', '/generateBackup']

		this.app.use(requestLogger(`[Migrations Module API] :method request to :url; result: :status; completed in: :response-time; :date`))
		this.app.use(bodyParser.json())


		this.router.get('/seed', wrap(function* (req, res, next) {
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

		this.router.get('/sync', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.sync()})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		this.router.get('/generateSeed', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.generateSeed({
					seedFile: req.query.seedFile && decodeURIComponent(req.query.seedFile) || instance.config.migrations.defaultSeedfileName
				})})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		this.router.get('/generateBackup', wrap(function* (req, res, next) {
			try {
				res.json({data: yield instance.generateBackup()})
			} catch (error) {
				req.locals = {error}
				next()
			}
		}))

		this.app.use('/', this.router)
		this.app.use(this.paths, (req, res) => {
			if (req.locals && req.locals.error) {
				console.log(req.locals.error)
				return res.status(500).end()
			}
			res.status(200).end()
		})
	}

	getFullTableData() {
		try {
			let instance = this
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
			let instance = this
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

	runQueryFromColumnData(instance, tableName, c, inserts, queryInterface, deleteTableContents, t, dontSetIdSequence) {
		return co(function*() {
			if (inserts[tableName][c].values.length > 0) {
				console.log('Query series starting, rows to execute:', inserts[tableName][c].values.length)
				if (deleteTableContents.indexOf(tableName) !== -1) {
					yield instance.db.sequelize.query('DELETE FROM "' + tableName + '";', {transaction: t})
				}

				let queryTemplate = 'INSERT INTO "' + tableName + '" (',
					query = ''
				for (let i in inserts[tableName][c].columns) {
					queryTemplate += '"' + (queryInterface.escape(inserts[tableName][c].columns[i])).replace(/'/g, '') + '",'
				}
				queryTemplate = queryTemplate.substr(0, queryTemplate.length - 1)
				queryTemplate += ') VALUES '
				query += queryTemplate

				for (let i in inserts[tableName][c].values) {
					query += ' ('
					for (let j in inserts[tableName][c].values[i]) {
						query += inserts[tableName][c].values[i][j] + ','
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

	prepareColumnData(inserts, data, tableName, tableLayout, queryInterface) {
		for (let j = 0; j < data[tableName].length; j++) {
			let columns = [], values = []
			for (let column in data[tableName][j]) {
				if (tableLayout[tableName].indexOf(column) !== -1) {
					columns.push(column)
					if ((data[tableName][j][column] instanceof Object === true) && (typeof data[tableName][j][column].length === 'undefined')) {
						values.push(queryInterface.escape(JSON.stringify(data[tableName][j][column])))
						continue
					}
					values.push(queryInterface.escape(data[tableName][j][column]))
				}
			}
			let stringifiedColumns = JSON.stringify(columns)
			if (typeof(inserts[tableName][stringifiedColumns]) === 'undefined') {
				inserts[tableName][stringifiedColumns] = {columns: columns, values: []}
			}
			inserts[tableName][stringifiedColumns].values.push(values)
		}
	}

	insertData(data, options) {
		try {
			let instance = this
			return instance.db.sequelize.transaction(function (t) {
				return co(function*() {
					let queryInterface = instance.db.sequelize.getQueryInterface(),
						dbComponents = instance.db.components,
						models = Object.keys(dbComponents),
						inserts = {},
						noSync = options && options.noSync || false,
						deleteTableContents = options && options.deleteTableContents || []

					if (!noSync) {
						yield instance.db.sequelize.sync({force: true}, {transaction: t})
					}

					let tableLayout = yield instance.getTableLayout(t)

					//seed the main tables first
					for (let i = 0; i < instance.db.seedingOrder.length; i++) {
						let modelName = instance.db.seedingOrder[i],
							tableName = dbComponents[modelName].model.getTableName()
						if (data[tableName]) {
							if (!inserts[tableName]) {
								inserts[tableName] = {}
							}
							instance.prepareColumnData(inserts, data, tableName, tableLayout, queryInterface)
							delete data[tableName]
							delete models[modelName]
						}
					}
					for (let tableName in inserts) {
						for (let c in inserts[tableName]) {
							yield instance.runQueryFromColumnData(instance, tableName, c, inserts, queryInterface, deleteTableContents, t)
						}
					}
					inserts = {}

					//seed the rest of the tables from instance.db
					for (let i = 0; i < models.length; i++) {
						let modelName = models[i],
							tableName = dbComponents[modelName].model.getTableName()
						if (data[tableName]) {
							if (typeof(inserts[tableName]) === 'undefined') {
								inserts[tableName] = {}
							}
							instance.prepareColumnData(inserts, data, tableName, tableLayout, queryInterface)
							delete data[tableName]
						}
					}
					for (let tableName in inserts) {
						for (let c in inserts[tableName]) {
							yield instance.runQueryFromColumnData(instance, tableName, c, inserts, queryInterface, deleteTableContents, t)
						}
					}
					inserts = {}

					//seed the remaining data (junction tables and other tables without sequelize models)
					for (let tableName in data) {
						if (typeof(inserts[tableName]) === 'undefined') {
							inserts[tableName] = {}
						}
						instance.prepareColumnData(inserts, data, tableName, tableLayout, queryInterface)
					}
					for (let tableName in inserts) {
						for (let c in inserts[tableName]) {
							yield instance.runQueryFromColumnData(instance, tableName, c, inserts, queryInterface, deleteTableContents, t, true)
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
		let instance = this
		return co(function*() {
			let data = yield instance.getFullTableData(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.syncHistoryPath, `${(new Date()).getTime()}.json`), 'w'),
				bytesWritten = yield fs.write(fileDescriptor, JSON.stringify(data))
			return true
			yield fs.close(fileDescriptor)
			return {
				bytesWritten,
				success: yield instance.insertData(data)
			}
		})
	}

	seed({seedFolder, seedFile}) {
		let instance = this
		return co(function*() {
			return yield instance.insertData(JSON.parse((yield fs.readFile(path.join(instance.config.migrations.baseMigrationsPath, seedFolder, `${seedFile}.json`))).toString()))
		})
	}

	generateSeed({seedFile}) {
		let instance = this
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
			return result
		})
	}

	generateBackup() {
		let instance = this
		return co(function*() {
			let seed = JSON.stringify(yield instance.getFullTableData()),
				now = new Date().getTime(),
				fileDescriptor = yield fs.open(path.join(instance.config.migrations.backupPath, `backup_${now}.json`), 'w'),
				result = yield fs.write(fileDescriptor, seed)
			yield fs.close(fileDescriptor)
			return result
		})
	}
}

module.exports = Migrations
