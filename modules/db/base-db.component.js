'use strict'

const
	co = require('co'),
	merge = require('deepmerge'),
	moment = require('moment')

class BaseDBComponent {
	constructor() {
		this.defaults = {
			orderBy: 'id',
			orderDirection: 'DESC',
			page: 1,
			perPage: 10
		}
		this.allowedFilterKeywordOperators = ['$not', '$gt', '$gte', '$lt', '$lte']
		this.associationDefaults = {
			belongsTo: {requiredKeys: ['foreignKey'], dependencyCategory: 'slaveOf'},
			hasOne: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			hasMany: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			belongsToMany: {requiredKeys: ['through', 'foreignKey', 'otherKey'], dependencyCategory: 'equalWith'}
		}
	}

	associate(components) {
		const {associationsConfig, associationDefaults, componentName, model} = this
		let dependencyMap = {slaveOf: [], masterOf: [], equalWith: [], associationKeys: []}
		if (associationsConfig) {
			for (const alias in associationsConfig) {
				const itemData = associationsConfig[alias],
					targetComponentName = itemData.componentName || alias,
					typeConfig = associationDefaults[itemData.type]
				// do various validations
				if (!typeConfig) {
					throw {customMessage: `At "${componentName}" component relation "${alias}": invalid association type.`}
				}
				const {requiredKeys} = typeConfig
				let associationOptionsObject = {as: alias}
				for (const i in requiredKeys) {
					let key = requiredKeys[i],
						value = itemData[key]
					if ((typeof value !== 'string') || !value.length) {
						throw {customMessage: `At "${componentName}" component relation "${alias}: the provided config is missing a required property - "${key}".`}
					}
					associationOptionsObject[key] = value
				}
				const targetComponent = components[targetComponentName]
				if (!targetComponent) {
					throw {customMessage: `At "${componentName}" component relation "${alias}": invalid target component name - "${targetComponentName}".`}
				}
				// create the association
				model[itemData.type](targetComponent.model, associationOptionsObject)
				dependencyMap[typeConfig.dependencyCategory].push(targetComponentName)
				dependencyMap.associationKeys.push(alias)
			}
		}
		this.dependencyMap = dependencyMap
	}

	mapNestedRelations(sourceComponent, config) {
		const components = this.db.components,
			sourceComponentName = sourceComponent.componentName,
			associationKeys = sourceComponent.dependencyMap.associationKeys
		let mappedArray = []
		config.forEach((item, index) => {
			const {associationName, required, attributes, where, order, include} = item,
				targetAssociation = sourceComponent.associationsConfig[associationName]
			let relationObject = {}
			if ((typeof associationName !== 'string') || !associationName.length) {
				throw {customMessage: `At "${sourceComponentName}": invalid association name - "${associationName}".`}
			}
			if (!targetAssociation) {
				throw {customMessage: `At "${sourceComponentName}": the associated does not have an association named "${associationName}".`}
			}
			const targetComponent = components[targetAssociation.componentName || associationName]
			relationObject = {model: targetComponent.model, as: associationName, required: required === true}
			if (attributes) {
				if (!(attributes instanceof Array)) {
					throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": the "attributes" object in the relation config must be an array.`}
				}
				for (const i in attributes) {
					let attribute = attributes[i]
					if ((typeof attribute !== 'string') || !attribute.length) {
						throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": "attributes" object with invalid contents provided in the relation config.`}
					}
				}
				relationObject.attributes = attributes
			}
			if (where) {
				if (typeof where !== 'object') {
					throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": the "where" object in the relation config must be an object or an array.`}
				}
				relationObject.where = where
			}
			if (order) {
				if (!(order instanceof Array)) {
					throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": the "order" object in the relation config must be an array.`}
				}
				let orderItemsAreArrayOfStrings = true
				for (const i in order) {
					let orderItem = order[i]
					if (!(orderItem instanceof Array)) {
						orderItemsAreArrayOfStrings = false
						break
					}
					for (const j in orderItem) {
						let innerOrderItem = orderItem[j]
						if ((typeof innerOrderItem !== 'string') || !innerOrderItem.length) {
							orderItemsAreArrayOfStrings = false
							break
						}
					}
				}
				if (!orderItemsAreArrayOfStrings) {
					throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": "order" object with invalid contents provided in the relation config.`}
				}
				relationObject.order = order
			}
			if (include) {
				if (!(include instanceof Array)) {
					throw {customMessage: `At "${sourceComponentName}" component relation "${associationName}": the "include" object in the relation config must be an array.`}
				}
				relationObject.include = this.mapNestedRelations(targetComponent, include)
			}
			mappedArray.push(relationObject)
		})
		return mappedArray
	}

	mapRelations(components) {
		const {associationsConfig, componentName} = this,
			relationsConfig = this.relationsConfig && Object.assign({}, this.relationsConfig) || {}
		if (!associationsConfig) {
			return
		}
		let relations = {}
		for (const alias in associationsConfig) {
			const itemData = associationsConfig[alias],
				targetModelName = itemData.componentName || alias,
				targetComponent = components[targetModelName],
				relationConfig = relationsConfig[alias]
			if (relationConfig && (typeof relationConfig === 'object')) {
				relations[alias] = (this.mapNestedRelations(this, [relationConfig]))[0]
				delete relationsConfig[alias]
				continue
			}
			relations[alias] = {model: targetComponent.model, as: alias}
		}
		for (const alias in relationsConfig) {
			if (relations[alias]) {
				throw {customMessage: `At "${componentName}" component: duplicate relation "${alias}".`}
			}
			relations[alias] = (this.mapNestedRelations(this, [Object.assign({associationName: alias}, relationsConfig[alias])]))[0]
		}
		this.relReadKeys = Object.keys(relations)
		this.relations = relations
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
			// protect against objects nested in arrays
			if (fieldValue instanceof Array) {
				for (let i in fieldValue) {
					if (typeof fieldValue[i] === 'object') {
						return false
					}
				}
				return true
			}

			// allow enabled keyword operators
			const allowedFilterKeywordOperators = this.allowedFilterKeywordOperators
			for (const i in allowedFilterKeywordOperators) {
				const opName = allowedFilterKeywordOperators[i],
					opValue = fieldValue[opName]
				if ((typeof opValue !== 'undefined') && (typeof opValue !== 'object')) {
					return true
				}
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

	setFilterValue(container, filter, field, value, exactMatch) {
		// check if the filter has a value and if it's acceptable
		if (!this.checkFilterValue(value)) {
			return
		}
		let exactMatchFields = exactMatch instanceof Array ? exactMatch : []
		// match filter
		if (filter.like && (exactMatchFields.indexOf(field) === -1)) {
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
			container[actualField][(exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatchFields ? '$gte' : '$gt'] = value
			return
		}
		if (filter.betweenTo) {
			let actualField = field.replace('To', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][actualField, (exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatchFields ? '$lte' : '$lt'] = value
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
				this.setFilterValue(searchContainer, element, field, fieldValue, exactMatch)
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
