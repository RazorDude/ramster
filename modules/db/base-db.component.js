'use strict'

const
	co = require('co'),
	moment = require('moment')

class BaseDBComponent {
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

	parseDate(date) {
		if (typeof date === 'string') {
			if (date.indexOf('/') !== -1) {
				let tempDate = moment.utc(date, 'DD/MM/YYYY')
				if (tempDate.isValid()) {
					return tempDate
				}
			}
			return moment.utc(date, 'YYYY-MM-DD')
		}
		if (date && (typeof date === 'object')) {
			return moment.utc(date.getTime(), 'x')
		}
		return moment.utc('Invalid date', 'YYYY-MM-DD')
	}

	// this method enables the use of certain objects as filters, but protects against JSON injection
	checkFilterValue(fieldValue) {
		if (typeof fieldValue === 'undefined') {
			return false
		}
		

		if ((typeof fieldValue === 'object') && (fieldValue !== null)) {
			if (fieldValue instanceof Array) {
				for (let i in fieldValue) {
					if (typeof fieldValue[i] === 'object') {
						return false
					}
				}
				return true
			}

			if ((typeof fieldValue.$not !== 'undefined') && (typeof fieldValue.$not !== 'object')) {
				return true
			}
			
			if (fieldValue.$not instanceof Array) {
				let not = fieldValue.$not
				for (let i in not) {
					if (typeof not[i] === 'object') {
						return false
					}
				}
				return true
			}
			
			if (fieldValue.$and instanceof Array) {
				let and = fieldValue.$and
				for (let i in and) {
					if ((typeof and[i] === 'object') && !this.checkFilterValue(and[i])) {
						return false
					}
				}
				return true
			}

			return false
		}

		return true
	}

	setFilterValue(container, filter, field, value) {
		// check if the filter has a value and if it's acceptable
		if (!this.checkFilterValue(value)) {
			return
		}
		// match filter
		if (filter.like && (exactMatch.indexOf(field) === -1)) {
			let prefix = '',
				suffix = ''
			if (filter.like[0] === '%') {
				prefix = '%'
			}
			if (filter.like[1] === '%') {
				suffix = '%'
			}
			container[field] = {[filter.caseSensitive ? '$like' : '$iLike']: `${prefix}${value}${suffix}`}
			return
		}
		// range filter
		if (filter.betweenFrom) {
			let actualField = field.replace('From', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][exactMatch.indexOf(actualField) === -1 ? '$gte' : '$gt'] = value
			return
		}
		if (filter.betweenTo) {
			let actualField = field.replace('To', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][actualField, exactMatch.indexOf(actualField) === -1 ? '$lte' : '$lt'] = value
			return
		}
		// equality filter
		container[field] = value
	}

	getWhereQuery({filters, relSearch, exactMatch}) {
		let where = {}
		if ((typeof filters === 'object') && Object.keys(filters).length > 0) {
			this.searchFields.forEach((element, index) => {
				let fieldValue = filters[element.field],
					field = element.field,
					searchContainer = where,
					hasValue = this.checkFilterValue(fieldValue)
				if (element.associatedModel) {
					if (!this.checkFilterValue(fieldValue)) {
						return
					}
					searchContainer = relSearch[element.associatedModel]
					field = element.associatedModelField
					if (element.nestedInclude) {
						if (!searchContainer.nestedIncludeFields) {
							searchContainer.nestedIncludeFields = {}
						}
						searchContainer = searchContainer.nestedIncludeFields
					}
				}
				this.setFilterValue(searchContainer, element, field, fieldValue)
			})
		}
		return where
	}

	getIncludeQuery({data, rel, relSearch}) {
		let include = [],
			countInclude = [],
			order = []
		this.relReadKeys.forEach((key, index) => {
			let relSearchLength = relSearch[key] && Object.keys(relSearch[key]).length || 0
			if (data[key] || relSearchLength) {
				let thisInclude = {},
					relS = relSearch[key]
				for (let iKey in rel[key].include) {
					if (iKey === 'order') {
						order = order.concat(rel[key].include[iKey])
						continue
					}
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
					countInclude.push(thisInclude)
				}

				include.push(thisInclude)
			}
		})
		return {include, countInclude, order}
	}

	create(data) {
		const instance = this
		return co(function*() {
			return yield instance.model.create(data)
		})
	}

	bulkCreate({dbObjects, options}) {
		const instance = this
		return co(function*() {
			let opt = {}
			if (options.transaction) {
				opt.transaction = options.transaction
			}
			return yield instance.model.bulkCreate(data, opt)
		})
	}

	read(data) {
		const instance = this
		return co(function*() {
			let where = {},
				include = [],
				rel = instance.relations,
				relSearch = {},
				exactMatch = (data.exactMatch instanceof Array) && data.exactMatch || []

			for (let key in rel) {
				relSearch[key] = {}
			}
			let whereQueryData = instance.getWhereQuery({filters: data, relSearch, exactMatch}),
				includeQueryData = instance.getIncludeQuery({data, rel, relSearch}),
				options = {
					where: whereQueryData,
					include: includeQueryData.include,
					order: includeQueryData.order
				}

			return yield instance.model.findOne(options)
		})
	}

	readList(data) {
		const instance = this
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

			let whereQueryData = instance.getWhereQuery({filters, relSearch, exactMatch}),
				includeQueryData = instance.getIncludeQuery({data, rel, relSearch}),
				options = {
					where: whereQueryData,
					include: includeQueryData.include,
					order: order.concat(includeQueryData.order)
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

			let totalCount = yield instance.model.count({where: options.where, include: includeQueryData.countInclude}),
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
		const instance = this
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
		const instance = this
		return co(function*() {
			return {deleted: yield instance.model.destroy({where: {id: data.id}})}
		})
	}
}

module.exports = BaseDBComponent
