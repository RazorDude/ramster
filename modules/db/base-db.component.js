'use strict'

const
	co = require('co'),
	merge = require('deepmerge'),
	moment = require('moment'),
	spec = require('./base-db.component.spec')

class BaseDBComponent {
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.defaults = {
			orderBy: 'id',
			orderDirection: 'desc',
			page: 1,
			perPage: 10
		}
		this.allowedFilterKeywordOperators = ['$and', '$not', '$gt', '$gte', '$lt', '$lte']
		this.associationDefaults = {
			belongsTo: {requiredKeys: ['foreignKey'], dependencyCategory: 'slaveOf'},
			hasOne: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			hasMany: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			belongsToMany: {requiredKeys: ['through', 'foreignKey', 'otherKey'], dependencyCategory: 'equalWith'}
		}
		this.specMethodNames = []
	}

	associate() {
		const components = this.db.components,
			{associationsConfig, associationDefaults, componentName, model} = this
		let dependencyMap = {slaveOf: [], masterOf: [], equalWith: [], associationKeys: []}
		if (associationsConfig && (typeof associationsConfig === 'object')) {
			for (const alias in associationsConfig) {
				const itemData = associationsConfig[alias],
					targetComponentName = itemData.componentName || alias,
					typeConfig = associationDefaults[itemData.type]
				// do various validations
				if (!typeConfig) {
					throw {customMessage: `At "${componentName}" component, relation "${alias}": invalid association type.`}
				}
				const {requiredKeys} = typeConfig
				let associationOptionsObject = {as: alias}
				for (const i in requiredKeys) {
					let key = requiredKeys[i],
						value = itemData[key]
					if ((typeof value !== 'string') || !value.length) {
						throw {customMessage: `At "${componentName}" component, relation "${alias}: the provided config is missing a required property - "${key}".`}
					}
					associationOptionsObject[key] = value
				}
				const targetComponent = components[targetComponentName]
				if (!targetComponent) {
					throw {customMessage: `At "${componentName}" component, relation "${alias}": invalid target component name - "${targetComponentName}".`}
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
		if (!sourceComponent || (typeof sourceComponent !== 'object')) {
			throw {customMessage: 'Invalid sourceComponent object provided.'}
		}
		if (!(config instanceof Array)) {
			throw {customMessage: 'Invalid config array provided.'}
		}
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
				throw {customMessage: `At "${sourceComponentName}": the component does not have an association named "${associationName}".`}
			}
			const targetComponent = components[targetAssociation.componentName || associationName]
			relationObject = {model: targetComponent.model, as: associationName, required: required === true}
			if (attributes) {
				if (!(attributes instanceof Array) || !attributes.length) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": the "attributes" object in the relation config must be a non-empty array.`}
				}
				for (const i in attributes) {
					let attribute = attributes[i]
					if ((typeof attribute !== 'string') || !attribute.length) {
						throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": "attributes" array with invalid contents provided in the relation config.`}
					}
				}
				relationObject.attributes = attributes
			}
			if (where) {
				if ((typeof where !== 'object') || !Object.keys(where).length) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": the "where" object in the relation config must be a non-empty object or array.`}
				}
				relationObject.where = where
			}
			if (order) {
				if (!(order instanceof Array) || !order.length) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": the "order" object in the relation config must be a non-empty array.`}
				}
				let orderItemsAreArrayOfStrings = true,
					actualOrder = JSON.parse(JSON.stringify(order))
				for (const i in actualOrder) {
					let orderItem = actualOrder[i]
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
					// order by model, field and direction (need for inner ordering queries)
					if (orderItem.length === 3) {
						let innerComponentName = orderItem[0],
							innerComponent = components[innerComponentName]
						if (!innerComponent) {
							throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": no component named "${innerComponentName}" exists, cannot order results by it.`}
						}
						actualOrder[i][0] = {model: innerComponent.model, as: associationName}
					} else if (orderItem.length !== 2) {
						throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": "order" object with invalid length provided in the relation config.`}
					}
				}
				if (!orderItemsAreArrayOfStrings) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": "order" object with invalid contents provided in the relation config.`}
				}
				relationObject.order = actualOrder
			}
			if (include) {
				if (!(include instanceof Array) || !include.length) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": the "include" object in the relation config must be a non-empty array.`}
				}
				relationObject.include = this.mapNestedRelations(targetComponent, include)
			}
			mappedArray.push(relationObject)
		})
		return mappedArray
	}

	mapRelations() {
		const components = this.db.components,
			{associationsConfig, componentName} = this,
			relationsConfig = this.relationsConfig && JSON.parse(JSON.stringify(this.relationsConfig)) || {}
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
				if (!relationConfig.associationName) {
					relationConfig.associationName = alias
				}
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
			relations[alias] = (this.mapNestedRelations(this, [relationsConfig[alias]]))[0]
		}
		this.relReadKeys = Object.keys(relations)
		this.relations = relations
	}

	// this method enables the use of certain objects as filters, but protects against JSON injection
	checkFilterValue(fieldValue) {
		if (typeof fieldValue === 'undefined') {
			return false
		}
		if ((typeof fieldValue === 'object') && (fieldValue !== null) && !(fieldValue instanceof Date)) {
			if (!Object.keys(fieldValue).length) {
				return false
			}
			// protect against bad objects nested in arrays
			if (fieldValue instanceof Array) {
				for (let i in fieldValue) {
					if (!this.checkFilterValue(fieldValue[i])) {
						return false
					}
				}
				return true
			}
			// allow enabled keyword operators
			const allowedFilterKeywordOperators = this.allowedFilterKeywordOperators
			for (const key in fieldValue) {
				if ((allowedFilterKeywordOperators.indexOf(key) === -1) || !this.checkFilterValue(fieldValue[key])) {
					return false
				}
			}
		}
		return true
	}

	setFilterValue(container, filter, field, value, exactMatch) {
		// check if the filter has a value and if it's acceptable
		if (!this.checkFilterValue(value)) {
			return false
		}
		if (!filter || (typeof filter !== 'object')) {
			throw {customMessage: 'Invalid filter object provided.'}
		}
		if ((typeof field !== 'string') || !field.length) {
			throw {customMessage: 'Invalid field string provided.'}
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
			return true
		}
		// range filter
		if (filter.betweenFrom) {
			let actualField = field.replace('From', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][(exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatchFields ? '$gte' : '$gt'] = value
			return true
		}
		if (filter.betweenTo) {
			let actualField = field.replace('To', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][actualField, (exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatchFields ? '$lte' : '$lt'] = value
			return true
		}
		// equality filter
		container[field] = value
		return true
	}

	getWhereObjects(filters, exactMatch) {
		let where = {},
			requiredRelationsData = {}
		if ((typeof filters === 'object') && Object.keys(filters).length > 0) {
			this.searchFields.forEach((element, index) => {
				let field = element.field,
					fieldValue = filters[field]
				if ((field[0] === '$') && (field[field.length - 1] === '$')) {
					let tempContainer = {}
					if (this.setFilterValue(tempContainer, element, field, fieldValue, exactMatch)) {
						let fieldKey = Object.keys(tempContainer)[0],
							actualFieldKey = field.replace(/\$/g, '').split('.')
						actualFieldKey = actualFieldKey[actualFieldKey.length - 1]
						field = field.replace(/\$/g, '').split('.')
						field.pop()
						requiredRelationsData[field[0]] = {path: field.join('.'), field: actualFieldKey, value: tempContainer[fieldKey]}
					}
				} else {
					this.setFilterValue(where, element, field, fieldValue, exactMatch)
				}
			})
		}
		return {where, requiredRelationsData}
	}

	assignModelToDereferencedRelationRecursively(relItem) {
		let includeItem = JSON.parse(JSON.stringify(relItem)),
			innerInclude = includeItem.include
		includeItem.model = relItem.model
		if (innerInclude instanceof Array) {
			for (const i in innerInclude) {
				innerInclude[i] = this.assignModelToDereferencedRelationRecursively(relItem.include[i])
			}
		}
		return includeItem
	}

	getRelationObjects(data, requiredRelationsData) {
		let include = [],
			order = [],
			actualData = ((typeof data !== 'object') || (data === null)) ? {} : data
		this.relReadKeys.forEach((key, index) => {
			let relationData = requiredRelationsData[key]
			if (relationData) {
				let splitPath = relationData.path.split('.'),
					includeItem = JSON.parse(JSON.stringify(this.relations[key])),
					relationItem = {include: [includeItem]},
					nonChangeableRelationItem = {include: [this.relations[key]]}, // we need this one, so we can get the models for each one, because they're otherwise destroyed in JSON.parse(JSON.stringify())
					currentItemName = this.componentName
				splitPath.forEach((keyFromPath, pcIndex) => {
					if (!(relationItem.include instanceof Array)) {
						throw {customMessage: `Invalid include array in "${currentItemName}"'s relations item.`}
					}
					let nextRelationItemFound = false
					for (const i in relationItem.include) {
						let thisItem = relationItem.include[i]
						if (thisItem.as === keyFromPath) {
							nextRelationItemFound = true
							nonChangeableRelationItem = nonChangeableRelationItem.include[i]
							relationItem = thisItem
							relationItem.model = nonChangeableRelationItem.model
							relationItem.required = true
							if (relationItem.order) {
								for (const j in relationItem.order) {
									let orderItem = relationItem.order[j]
									if (orderItem.length === 3) {
										orderItem[0].model = nonChangeableRelationItem.order[j][0].model
									}
								}
								order = order.concat(relationItem.order)
								delete relationItem.order
							}
							currentItemName = keyFromPath
							if (pcIndex === (splitPath.length - 1) && (typeof relationData.field !== 'undefined')) {
								relationItem.where = {[relationData.field]: relationData.value}
							}
							break
						}
					}
					if (!nextRelationItemFound) {
						throw {customMessage: `Invalid relation "${keyFromPath}" for "${currentItemName}".`}
					}
				})
				include.push(includeItem)
				return
			}
			if (actualData[key]) {
				include.push(this.assignModelToDereferencedRelationRecursively(this.relations[key]))
			}
		})
		return {include, order}
	}

	create(data, options) {
		const instance = this
		return co(function*() {
			if ((typeof options === 'object') && (options !== null)) {
				if (options.userId) {
					data.changeUserId = options.userId
				}
				return yield instance.model.create(data, options)
			}
			return yield instance.model.create(data)
		})
	}

	bulkCreate(data, options) {
		const instance = this
		return co(function*() {
			if ((typeof options === 'object') && (options !== null)) {
				if (options.userId) {
					data.forEach((item, index) => data[index].changeUserId = options.userId)
				}
				return yield instance.model.bulkCreate(data, options)
			}
			return yield instance.model.bulkCreate(data)
		})
	}

	read({filters, relReadKeys, exactMatch, transaction}) {
		const instance = this
		return co(function*() {
			let {where, requiredRelationsData} = instance.getWhereObjects(filters, (exactMatch instanceof Array) && exactMatch || []),
				{include, order} = instance.getRelationObjects(relReadKeys, requiredRelationsData),
				readOptions = {where, include, order}
			if (!Object.keys(where).length) {
				throw {customMessage: 'No filters provided.'}
			}
			if (transaction) {
				readOptions.transaction = transaction
			}
			return yield instance.model.findOne(readOptions)
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
				more = false,
				{where, requiredRelationsData} = instance.getWhereObjects(data.filters || {}, (data.exactMatch instanceof Array) && data.exactMatch || []),
				includeQueryData = instance.getRelationObjects(data.relReadKeys || {}, requiredRelationsData),
				readListOptions = {
					where,
					include: includeQueryData.include,
					order: order.concat(includeQueryData.order)
				},
				countOptions = {where, include: includeQueryData.include}
			if (!Object.keys(where).length) {
				throw {customMessage: 'No filters provided.'}
			}

			if (data.transaction) {
				readListOptions.transaction = data.transaction
				countOptions.transaction = data.transaction
			}
			if (data.fields) {
				readListOptions.attributes = data.fields
			}
			if ((data.excludeIdsFromSearch instanceof Array) && data.excludeIdsFromSearch.length) {
				if (typeof readListOptions.where.id !== 'undefined') {
					readListOptions.where.id = {$and: [readListOptions.where.id, {$not: data.excludeIdsFromSearch}]}
				} else {
					readListOptions.where.id = {$not: data.excludeIdsFromSearch}
				}
				countOptions.where = readListOptions.where
			}

			let totalCount = yield instance.model.count(countOptions),
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
				readListOptions.offset = (page - 1) * perPage
				readListOptions.limit = perPage + 1
			}

			let results = yield instance.model.findAll(readListOptions)
			if (results.length === (perPage + 1)) {
				results.pop()
				more = true
			}
			return {totalPages, page, perPage, more, results}
		})
	}

	update({dbObject, where, userId, transaction}) {
		const instance = this
		return co(function*() {
			if ((typeof where !== 'object') || (where === null) || (Object.keys(where).length === 0)) {
				throw {customMessage: 'Cannot update without criteria.'}
			}
			let options = {
				where,
				returning: true
			}
			if (transaction) {
				options.transaction = transaction
			}
			if (userId) {
				dbObject.changeUserId = userId
			}
			return yield instance.model.update(dbObject, options)
		})
	}

	bulkUpsert(dbObjects, options) {
		if (!(dbObjects instanceof Array)) {
			throw {customMessage: `Invalid array of "${this.componentName}" to update.`}
		}
		if (!options || !options.transaction) {
			return this.db.sequelize.transaction((t) => this.bulkUpsert(dbObjects, {transaction: t}))
		}
		const instance = this,
			t = options.transaction,
			userId = options.userId
		return co(function*() {
			let objectsToCreate = []
			for (const i in dbObjects) {
				let dbObject = dbObjects[i],
					id = parseInt(dbObject.id, 10)
				if (!dbObject.id) {
					objectsToCreate.push(dbObject)
					continue
				}
				yield instance.model.update(dbObject, {where: {id}, userId, transaction: t})
			}
			yield instance.model.bulkCreate(objectsToCreate, {userId, transaction: t})
			return {success: true}
		})
	}

	delete({id, checkForRelatedModels, transaction}) {
		const instance = this,
			{associationsConfig, componentName, dependencyMap, relations} = this,
			masterOf = dependencyMap.masterOf
		return co(function*() {
			let findAllOptions = {where: {id}, attributes: ['id']},
				deleteOptions = {where: {id}},
				systemCriticalIds = instance.systemCriticalIds || []
			if (transaction) {
				findAllOptions.transaction = transaction
				deleteOptions.transaction = transaction
			}
			if (checkForRelatedModels && masterOf.length) {
				let include = [],
					componentNameToAssociationNameMap = {},
					includedRelationNames = []
				for (const alias in associationsConfig) {
					const assocItem = associationsConfig[alias]
					componentNameToAssociationNameMap[assocItem.componentName || alias] = alias
				}
				masterOf.forEach((item, index) => {
					let relName = componentNameToAssociationNameMap[item]
					include.push(Object.assign({limit: 1}, relations[relName]))
					includedRelationNames.push(relName)
				})
				if (include.length) {
					findAllOptions.include = include
				}
				let existingItems = yield instance.model.findAll(findAllOptions)
				for (const i in existingItems) {
					const item = (existingItems[i]).dataValues
					if (systemCriticalIds.indexOf(item.id) !== -1) {
						throw {customMessage: `Cannot delete the "${componentName}" item with id ${item.id} - it is system-critical.`}
					}
					for (const j in includedRelationNames) {
						const key = includedRelationNames[j],
							relItem = item[key]
						if ((typeof relItem === 'object') && (relItem !== null) && (!(relItem instanceof Array) || ((relItem instanceof Array) && relItem.length))) {
							throw {customMessage: `Cannot delete a "${componentName}" item that has related "${key}" items in the database.`}
						}
					}
				}
				return {deleted: yield instance.model.destroy(deleteOptions)}
			}
			if (systemCriticalIds.length) {
				let existingItems = yield instance.model.findAll(findAllOptions)
				for (const i in existingItems) {
					const item = (existingItems[i]).dataValues
					if (systemCriticalIds.indexOf(item.id) !== -1) {
						throw {customMessage: `Cannot delete the "${componentName}" item with id ${item.id} - it is system-critical.`}
					}
				}
			}
			return {deleted: yield instance.model.destroy(deleteOptions)}
		})
	}
}

module.exports = BaseDBComponent
