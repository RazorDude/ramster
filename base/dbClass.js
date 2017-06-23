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

	checkQueryItem({fieldData}) {
		if (typeof fieldData === 'undefined') {
			return false
		}
		

		if (typeof fieldData === 'object') {
			if (fieldData instanceof Array) {
				for (let i in fieldData) {
					if (typeof fieldData[i] === 'object') {
						return false
					}
				}
				return true
			}

			if ((typeof fieldData.$not !== 'undefined') && (typeof fieldData.$not !== 'object')) {
				return true
			}
			
			if (fieldData.$not instanceof Array) {
				let not = fieldData.$not
				for (let i in not) {
					if (typeof not[i] === 'object') {
						return false
					}
				}
				return true
			}
			
			if (fieldData.$and instanceof Array) {
				let and = fieldData.$and
				for (let i in and) {
					if ((typeof and[i] === 'object') && !this.checkQueryItem({fieldData: and[i]})) {
						return false
					}
				}
				return true
			}

			return false
		}

		return true
	}

	getWhereQuery({filters, relSearch, exactMatch}) {
		let where = {}
		if ((typeof filters === 'object') && Object.keys(filters).length > 0) {
			this.searchFields.forEach((element, index) => {
				let fieldData = filters[element.field],
					field = element.field,
					searchHolder = where,
					hasValue = this.checkQueryItem({fieldData})

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
					if (element.like && (exactMatch.indexOf(element.field) === -1)) {
						let prefix = '',
							suffix = ''
						if (element.like[0] === '%') {
							prefix = '%'
						}
						if (element.like[1] === '%') {
							suffix = '%'
						}
						searchHolder[field] = {[element.caseSensitive ? '$like' : '$iLike']: `${prefix}${fieldData}${suffix}`}
						return;
					}
					searchHolder[field] = fieldData
					return;
				}

				if (element.between) {
					let from = {field: `${element.field}${element.between[0]}`, condition: '$gt'},
						to = {field: `${element.field}${element.between[1]}`, condition: '$lt'},
						clause = {}
					if (exactMatch.indexOf(field) !== -1) {
						from.condition = '$gte'
						to.condition = '$lte'
					} else {
						if (exactMatch.indexOf(from.field) !== -1) {
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

	bulkCreate({dbObjects, options}) {
		let instance = this
		return co(function*() {
			let opt = {}
			if (options.transaction) {
				opt.transaction = options.transaction
			}
			return yield instance.model.bulkCreate(data, opt)
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
				totalPages = 0
			if (data.readAll) {
				totalPages = 1
				page = 1
				perPage = totalCount
			} else {
				totalPages = Math.ceil(totalCount / perPage)
				if ((totalPages > 0) && (page > totalPages)) {
					page = totalPages
				}
				options.offset = (page - 1) * perPage
				options.limit = perPage + 1
			}

			let results = yield instance.model.findAll(options)
			if (results.length === (perPage + 1)) {
				results.pop()
				more = true
			}
			return {totalPages, page, perPage, more, results}
		})
	}

	update({dbObject, where, transaction}) {
		let instance = this
		return co(function*() {
			if ((typeof where !== 'object') || (Object.keys(where).length === 0)) {
				throw {customMessage: 'Cannot update without criteria.'}
			}
			let options = {
				where,
				returning: true
			}
			if (transaction) {
				options.transaction = transaction
			}
			return yield instance.model.update(dbObject, options)
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
