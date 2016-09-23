'use strict'

let co = require('co')

class Base {
	constructor({mailClient, cfg, logger, queryBuilder}) {
		this.defaults = {
			orderBy: 'id',
			orderDirection: 'DESC',
			page: 1,
			perPage: 10
		}
		this.mailClient = mailClient
		this.cfg = cfg
		this.logger = logger
		this.queryBuilder = queryBuilder
	}

	associate(components) {
		let rel = this.model.associate(components)
		this.relations = rel[rel.key]
		return rel.key
	}

	setDb(db) {
		this.db = db
	}

	generateHandle(name) {
		return name.toLowerCase().split(' ').join('-')
	}

	generateRandomNumber(length) {
		let number = ''
		for (let i = 0; i < length; i++) {
			number += Math.floor(Math.random() * 9)
		}
		return parseInt(number, 10)
	}

	generateRandomString(length) {
		let buf = new Buffer(length)
		for (let i = 0; i < buf.length; i++) {
			buf[i] = Math.floor(Math.random() * 256)
		}
		return buf
	}

	assembleSearchConditionsFromFilterObject({filters, exactMatch}) {
		let instance = this,
			rel = instance.relations,
			result = {},
			relFilters = {}

		for (let key in rel) {
			relFilters[key] = {}
		}

		if ((typeof filters === 'object') && Object.keys(filters).length > 0) {
			instance.searchFields.forEach((element, index) => {
				let fieldData = filters[element.field],
					field = element.field,
					searchHolder = result,
					hasValue = (typeof fieldData !== 'undefined') && (typeof fieldData !== 'object')

				if (element.associatedModel && (hasValue || element.between)) {
					searchHolder = relFilters[element.associatedModel]
					field = element.associatedModelField
					if (typeof element.innerIndex !== 'undefined') {
						if (!searchHolder.nestedIncludeFields) {
							searchHolder.nestedIncludeFields = {}
						}
						if (!searchHolder.nestedIncludeFields[element.innerIndex]) {
							searchHolder.nestedIncludeFields[element.innerIndex] = {}
						}
						searchHolder = searchHolder.nestedIncludeFields[element.innerIndex]
					}
				}

				if (hasValue) {
					if (element.like && (exactMatch.indexOf(field) === -1)) {
						let prefix = '',
							suffix = ''
						if (element.like[0] === '%') {
							prefix = '%'
						}
						if (element.like[1] === '%') {
							suffix = '%'
						}
						searchHolder[field] = {$like: `${prefix}${fieldData}${suffix}`}
						return
					}
					searchHolder[field] = fieldData
					return
				}

				if (element.between) {
					let from = {field: `${field}${element.between[0]}`, condition: '$gt'},
						to = {field: `${field}${element.between[1]}`, condition: '$lt'}
					if (exactMatch.indexOf(field) !== -1) {
						from.condition = '$gte'
						to.condition = '$lte'
					} else {
						if (exactMatch.indexOf(to.field) !== -1) {
							from.condition = '$gte'
						}
						if (exactMatch.indexOf(to.field) !== -1) {
							to.condition = '$lte'
						}
					}
					if ((typeof filters[from.field] !== 'undefined') && (typeof filters[from.field] !== 'object')) {
						searchHolder[from.field] = {[from.condition]: filters[from.field]}
					}
					if ((typeof filters[to.field] !== 'undefined') && (typeof filters[to.field] !== 'object')) {
						searchHolder[to.field] = {[to.condition]: filters[to.field]}
					}
				}
			})
		}

		result.relFilters = relFilters
		return result
	}

	create(data) {
		let instance = this
		return co(function*() {
			return yield instance.model.create(data)
		})
	}

	bulkCreate(data) {
		let instance = this
		return co(function*() {
			return yield instance.model.bulkCreate(data)
		})
	}

	read(data) {
		let instance = this
		return co(function*() {
			let where = {},
				include = [],
				rel = instance.relations

			//assemble the where clause
			instance.searchFields.forEach((element, index) => {
				if (typeof data[element.field] !== 'undefined') {
					where[element.field] = data[element.field]
				}
			})

			//assemble the join query
			instance.relReadKeys.forEach((key, index) => {
				if (data[key]) {
					include.push(rel[key].include)
				}
			})

			let options = {
				where: where,
				include: include
			}

			return yield instance.model.findOne(options)
		})
	}

	readAssociated(data) {
		let instance = this
		return co(function*() {
			let order = [
					[data.orderBy || instance.defaults.orderBy, data.orderDirection || instance.defaults.orderDirection]
				],
				page = data.page ? parseInt(data.page, 10) : instance.defaults.page,
				perPage = data.perPage ? parseInt(data.perPage, 10) : instance.defaults.perPage,
				where = {},
				filter = {},
				include = [],
				more = false,
				relComponent = instance.db.components[data.associatedModel],
				rel = relComponent.relations

			if (!rel || !relComponent || !rel[data.modelAlias]) {
				throw {customMessage: 'Associated model not found.'}
			}

			if (!data.filters || !data.filters.id) {
				return {
					totalPages: 0,
					page: page,
					perPage: perPage,
					more: false,
					results: []
				}
			}

			include.push(rel[data.modelAlias].include)
			include[0].attributes = ['id']

			//assemble the where clause
			if (data.associatedModelFilters) {
				relComponent.searchFields.forEach((element, index) => {
					if (typeof data.associatedModelFilters[element.field] !== 'undefined') {
						where[element.field] = data.associatedModelFilters[element.field]
					}
				})
			}

			//assemble the filter clause
			instance.searchFields.forEach((element, index) => {
				if (typeof data.filters[element.field] !== 'undefined') {
					filter[element.field] = data.filters[element.field]
				}
			})

			include[0].where = filter

			//assemble the join query
			if (data.associatedModels) {
				instance.relReadKeys.forEach((key, index) => {
					if (data.associatedModels.indexOf(key) !== -1) {
						include.push(rel[key].include)
					}
				})
			}

			let options = {
				where: where,
				include: include,
				offset: (page - 1) * perPage,
				limit: perPage + 1,
				order: order
			}

			if (data.fields) {
				options.attributes = data.fields
			}

			let results = yield relComponent.model.findAll(options),
				totalCount = yield relComponent.model.count({where: options.where, include: options.include})
			if (results.length === (perPage + 1)) {
				results.pop()
				more = true
			}

			return {
				totalPages: Math.ceil(totalCount / perPage),
				page: page,
				perPage: perPage,
				more: more,
				results: results
			}
		})
	}

	readList(data) {
		let instance = this
		return co(function*() {
			// if (data.fields) {
			// 	options.attributes = data.fields
			// }

			let queryBuilder = new instance.db.QueryBuilder({queryInterface: instance.db.sequelize.getQueryInterface(), mainModel: instance.model, mainModelAlias: instance.modelName, mainModelScope: instance.scopes && (instance.scopes[data.scope] || instance.scopes.default) || {}}),
				more = false,
				exactMatch = (data.exactMatch instanceof Array) && data.exactMatch || [], //disables 'like' and makes 'between' >= <=, instead of > <
				filters = instance.assembleSearchConditionsFromFilterObject({filters: data.filters || {}, exactMatch}),
				relFilters = filters.relFilters

			//assemble the join query
			instance.relReadKeys.forEach((key, index) => {
				let relFiltersLength = relFilters[key] && Object.keys(relFilters[key]).length || 0
				if (data[key] || relFiltersLength) {
					queryBuilder.buildJoinQuery({relationsData: instance.relations[key], filters: relFiltersLength ? relFilters[key] : null, targetTableAliasPrefix: `${instance.modelName}.`})
				}
			})

			queryBuilder.buildWhereQuery({filters})
			queryBuilder.buildOrderByQuery({orderBy: data.orderBy || instance.defaults.orderBy, orderDirection: data.orderDirection || instance.defaults.orderDirection})
			queryBuilder.buildPaginationQuery({page: data.page && parseInt(data.page, 10) || instance.defaults.page, perPage: data.perPage && parseInt(data.perPage, 10) || instance.defaults.perPage})

			let results = yield instance.db.sequelize.query(queryBuilder.getFullQuery()),
				totalCount = yield instance.db.sequelize.query(queryBuilder.getCountQuery())

			results = queryBuilder.getFormattedResults({resultData: results})
			if (results.length === (queryBuilder.perPage + 1)) {
				results.pop()
				more = true
			}

			totalCount = totalCount && totalCount[0] && totalCount[0][0] && totalCount[0][0].count || 0
			return {
				totalPages: Math.ceil(totalCount / queryBuilder.perPage),
				page: queryBuilder.page,
				perPage: queryBuilder.perPage,
				more: more,
				results: results
			}
		})
	}

	update({dbObject, where}) {
		let instance = this
		return co(function*() {
			return yield instance.model.update(dbObject, {
				where: where,
				returning: true
			})
		})
	}

	delete(data) {
		let instance = this
		return co(function*() {
			return {deleted: yield instance.model.destroy({where: {id: data.id}})}
		})
	}
}

module.exports = Base
