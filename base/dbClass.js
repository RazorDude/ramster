'use strict'

let co = require('co')

class Base {
	constructor({mailClient, cfg, logger}) {
		this.defaults = {
			orderBy: 'id',
			orderDirection: 'DESC',
			page: 1,
			perPage: 10
		}
		this.mailClient = mailClient
		this.cfg = cfg
		this.logger = logger
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

	getWhereQuery({filters, relSearch, exactMatch}) {
		let where = {}
		if ((typeof filters === 'object') && Object.keys(filters).length > 0) {
			this.searchFields.forEach((element, index) => {
				let fieldData = filters[element.field],
					field = element.field,
					searchHolder = where,
					hasValue = true
					// hasValue = (typeof fieldData !== 'undefined') && (typeof fieldData !== 'object')

				if (typeof fieldData === 'undefined') {
					hasValue = false
				} else {
					if (typeof fieldData === 'object') {
						if (fieldData instanceof Array) {
							for (let i in fieldData) {
								if (typeof fieldData[i] === 'object') {
									hasValue = false
									break
								}
							}
						} else {
							hasValue = false
						}
					}
				}

				if (element.associatedModel && (hasValue || element.between)) {
					searchHolder = relSearch[element.associatedModel]
					field = element.associatedModelField
					if (element.nestedInclude) {
						if (!searchHolder.nestedIncludeFields) {
							searchHolder.nestedIncludeFields = {}
						}
						searchHolder = searchHolder.nestedIncludeFields
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
						return;
					}
					searchHolder[field] = fieldData
					return;
				}

				if (element.between) {
					let from = {field: `${field}${element.between[0]}`, condition: '$gt'},
						to = {field: `${field}${element.between[1]}`, condition: '$lt'},
						clause = {}
					if (exactMatch.indexOf(field) !== -1) {
						from.condition = '$gte'
						to.condition = '$lte'
					} else {
						if (exactMatch.indexOf(to.field) !== -1) {
							from.condition = '$lte'
						}
						if (exactMatch.indexOf(to.field) !== -1) {
							to.condition = '$lte'
						}
					}
					if ((typeof filters[from.field] !== 'undefined') && (typeof filters[from.field] !== 'object')) {
						clause[from.condition] = filters[from.field]
					}
					if ((typeof filters[to.field] !== 'undefined') && (typeof filters[to.field] !== 'object')) {
						clause[to.condition] = filters[to.field]
					}
					if (Object.keys(clause).length > 0) {
						searchHolder[field] = clause
					}
				}
			})
		}
		return where
	}

	getIncludeQuery({data, rel, relSearch}) {
		let include = []
		this.relReadKeys.forEach((key, index) => {
			let relSearchLength = relSearch[key] && Object.keys(relSearch[key]).length || 0
			if (data[key] || relSearchLength) {
				let thisInclude = {},
					relS = relSearch[key]
				for (let iKey in rel[key].include) {
					thisInclude[iKey] = rel[key].include[iKey]
				}

				if (relSearchLength) {
					if (!thisInclude.where) {
						thisInclude.where = relS
					} else {
						for (let sKey in relS) {
							thisInclude.where[sKey] = relS[sKey]
						}
					}

					if (thisInclude.where.nestedIncludeFields) {
						delete thisInclude.where.nestedIncludeFields
						for (let sKey in relS.nestedIncludeFields) {
							if (!thisInclude.include.where) {
								thisInclude.include.where = relS.nestedIncludeFields
							} else {
								for (let sKey in relS.nestedIncludeFields) {
									thisInclude.include.where[sKey] = relS.nestedIncludeFields[sKey]
								}
							}
						}
					}
				}

				include.push(thisInclude)
			}
		})
		return include
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
				rel = instance.relations,
				relSearch = {},
				exactMatch = (data.exactMatch instanceof Array) && data.exactMatch || []

			for (let key in rel) {
				relSearch[key] = {}
			}
			let options = {
				where: instance.getWhereQuery({filters: data, relSearch, exactMatch}),
				include: instance.getIncludeQuery({data, rel, relSearch})
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
			let order = [
					[data.orderBy || instance.defaults.orderBy, data.orderDirection || instance.defaults.orderDirection]
				],
				page = data.page ? parseInt(data.page, 10) : instance.defaults.page,
				perPage = data.perPage ? parseInt(data.perPage, 10) : instance.defaults.perPage,
				include = [],
				more = false,
				rel = instance.relations,
				relSearch = {},
				filters = data.filters || {},
				exactMatch = (data.exactMatch instanceof Array) && data.exactMatch || [] //disables 'like' and makes 'between' >= <=, instead of > <

			for (let key in rel) {
				relSearch[key] = {}
			}

			let options = {
				where: instance.getWhereQuery({filters, relSearch, exactMatch}),
				include: instance.getIncludeQuery({data, rel, relSearch}),
				order
			}

			if (data.fields) {
				options.attributes = data.fields
			}

			if ((data.excludeIdsFromSearch instanceof Array) && data.excludeIdsFromSearch.length) {
				if (typeof options.where.id !== 'undefined') {
					options.where.id = {$and: [options.where.id, {$not: data.excludeIdsFromSearch}]}
				} else {
					options.where.id = {$not: data.excludeIdsFromSearch}
				}
			}

			let totalCount = yield instance.model.count({where: options.where, include: options.include}),
				totalPages = Math.ceil(totalCount / perPage)
			if ((totalPages > 0) && (page > totalPages)) {
				page = totalPages
			}

			options.offset = (page - 1) * perPage
			options.limit = perPage + 1


			let results = yield instance.model.findAll(options)
			if (results.length === (perPage + 1)) {
				results.pop()
				more = true
			}
			return {totalPages, page, perPage, more, results}
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
