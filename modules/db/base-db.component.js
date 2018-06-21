'use strict'
/**
 * The base-db.component module. Contains the BaseDBComponent class.
 * @module baseDbComponentModule
 */

const
	co = require('co'),
	DBModule = require('./db.module'),
	merge = require('deepmerge'),
	moment = require('moment'),
	Sequelize = require('sequelize'),
	spec = require('./base-db.component.spec')

/**
 * The BaseDBComponent class. Contains various methods that lay the groundwork for the business logic and the CRUD.
 * @class BaseDBComponent
 */
class BaseDBComponent {
	/**
	 * Creates an instance of BaseDBComponent. Sets test methods (defined in the accompanying .spec.js file) and the component defaults.
	 * @memberof BaseDBComponent
	 */
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The defaults config object.
		 * @type {baseDBComponentDefaultsObject}
		 * @typedef baseDBComponentDefaultsObject
		 * @property {string} orderBy The default column name to order database searches by.
		 * @property {string} orderDirection The default direction to order database seraches in.
		 * @property {number} page The default page of results to show in paginated calls. Must be a non-zero integer.
		 * @property {number} perPage The default number of results to show per page in paginated calls. Must be a non-zero integer.
		 */
		this.defaults = {
			orderBy: 'id',
			orderDirection: 'desc',
			page: 1,
			perPage: 10
		}
		/**
		 * The list of keyword operators to check and parse when escaping objects for filters. Anything not included in this list will be skipped.
		 * @type {string[]}
		 */
		this.allowedFilterKeywordOperators = ['$and', '$gt', '$gte', '$lt', '$lte', '$not', '$or']
		this.allowedFilterContainerKeys = ['$or']
		/**
		 * The default settings for bulding associations. They describe the required keys and the dependency category of which association type. The keys are the association types - belongsTo, hasOne, hasMany and belongsToMany.
		 * @type {Object.<string, baseDBComponentAssociationDefaultsObject>}
		 * @typedef baseDBComponentAssociationDefaultsObject
		 * @property {string[]} requiredKeys An array of keys that are required to be present in the associationsConfig object for this association.
		 * @property {string} dependencyCategory Determines the dependency category - slaveOf, masterOf or equalWith.
		 */
		this.associationDefaults = {
			belongsTo: {requiredKeys: ['foreignKey'], dependencyCategory: 'slaveOf'},
			hasOne: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			hasMany: {requiredKeys: ['foreignKey'], dependencyCategory: 'masterOf'},
			belongsToMany: {requiredKeys: ['through', 'foreignKey', 'otherKey'], dependencyCategory: 'equalWith'}
		}
		/**
		 * The list of method names that are taken from the .spec.js file accompanying the component file. The methods in this list will be executed when running tests for the project.
		 * @type {string[]}
		 */
		this.specMethodNames = []
		/**
		 * The list of association keys for this component. Used in various places, most notably read and readList calls, where the keys of this array help modularly fetch associated components' data.
		 * @type {string[]}
		 */
		this.relReadKeys = []
		/**
		 * The name of the component. Automatically set to the folder name in which the component file is located.
		 * @type {string}
		 */
		this.componentName = undefined
		/**
		 * The sequelize model for the component.
		 * @type {Sequelize.Model}
		 */
		this.model = undefined
		/**
		 * The configuration object for creating associations. The object keys are the association names and will be added to instance.relReadKeys.
		 * @type {Object.<string, baseDBComponentAssociationsConfigItem>}
		 * @typedef baseDBComponentAssociationsConfigItem
		 * @property {string} type The type of the association - belongsTo, hasOne, hasMany or belongsToMany.
		 * @property {string} componentName (optional) The name of the component to associate to, in case it doesn't match the association name.
		 * @property {string} foreignKey The name of the field that will be used as a foreign key.
		 * @property {string} through The name of the junction table, works only for belongsToMany associations.
		 * @property {string} otherKey The name of the field that will be used to represent the key of this component in the association, works only for belongsToMany associations.
		 */
		this.associationsConfig = undefined
		/**
		 * The configuration object for fine-tuning associations and adding different data requirements for the joined associations when fetching data from the database. The object keys are the relation names and will be added to instance.relReadKeys.
		 * @type {Object.<string, baseDBComponentRelationsConfigItem>}
		 * @typedef baseDBComponentRelationsConfigItem
		 * @property {string} associationName The name of the association that this relation extends.
		 * @property {string[]} attributes (optional) The list of fields to fetch from the database. If not provided, all fields will be fetched.
		 * @property {boolean} required (optional) If set to true, the SQL JOIN will be of type INNER. It is false by default.
		 * @property {object} where (optional) If provided, the joined results will be filtered by these criteria.
		 * @property {baseDBComponentRelationsConfigItem[]} include (optional) An array contained nested relation configs. The items described here (and their sub-items, and so on) will be JOIN-ed and fetched from the database too.
		 */
		this.relationsConfig = undefined
		/**
		 * The configuration array for the fields to search by, used in the read & readList methods.
		 * @type {baseDBComponentSearchFiltersObject[]}
		 * @typedef baseDBComponentSearchFiltersObject
		 * @property {string} field The name of the field to search by. Use $relationName.fieldName$ to search by related component fields.
		 * @property {string} like (optional) The match patter for SQL LIKE. Can be '%-', '-%' or '%%.
		 * @property {boolean} betweenFrom (optional) If set to true, this field will be treated as a range start filter and the "From" suffix will be removed from the field name (if present). It is false by default.
		 * @property {boolean} betweenTo (optional) If set to true, this field will be treated as a range end filter and the "To" suffix will be removed from the field name (if present). It is false by default.
		 * @property {boolean} exactMatch (optional) If set to true and is a range filter, it will be inclusive. I.e. >= instead of >.
		 */
		this.searchFields = undefined
		/**
		 * A map of all associations the component has.
		 * @type {baseDBComponentDependencyMap}
		 * @typedef baseDBComponentDependencyMap
		 * @property {string[]} slaveOf The names of the components that the component is in a belongsTo association.
		 * @property {string[]} masterOf The names of the components that the component is in a hasOne or hasMany association.
		 * @property {string[]} equalWith The names of the components that the component is in a belongsToMany association.
		 * @property {string[]} associationKeys The full list of association keys (aliases) for this component.
		 */
		this.dependencyMap = undefined
		/**
		 * The currently initialized instance of the DBModule.
		 * @type {DBModule}
		 */
		this.db = undefined
	}

	/**
	 * Creates the component model's associations based on the component's association config and generates the component's dependencyMap.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
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
				// self association
				if (targetComponentName === componentName) {
					// create the association
					model[itemData.type](model, associationOptionsObject)
					dependencyMap[typeConfig.dependencyCategory].push(targetComponentName)
					dependencyMap.associationKeys.push(alias)
					continue
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

	/**
	 * Goes through the sourceComponent's relations config (the config arg), checks the validity of each relations item, creates new relations objects and adds them in an array. Triggers itself for each item, if it has an include.
	 * @param {BaseDBComponent} sourceComponent The db component that the relations are being mapped for.
	 * @param {Object} config The relationsConfig for the sourceComponent.
	 * @typedef {Object} BaseDBComponentMapNestedRelationsReturnType
	 * @property {Array<string[]>} order An array containing all ordering items; must be added to the parent container as a property
	 * @property {Array<Object>} include The include array containing the mapped sequelize include items.
	 * @returns {BaseDBComponentMapNestedRelationsReturnType} The mapped include array and the order array to add to the container.
	 * @memberof BaseDBComponent
	 */
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
		let mappedArray = [],
			mappedOrder = []
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
			let targetComponentName = targetAssociation.componentName || associationName,
				targetComponent = components[targetComponentName]
			if (targetComponentName === sourceComponentName) {
				targetComponent = sourceComponent
			}
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
				let orderItemsAreArrayOfStrings = true
				for (const i in order) {
					let orderItem = order[i]
					if (!(orderItem instanceof Array)) {
						orderItemsAreArrayOfStrings = false
						break
					}
					if (orderItem.length !== 2) {
						throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": "order" object with invalid length provided in the relation config at index ${i}.`}
					}
					for (const j in orderItem) {
						let innerOrderItem = orderItem[j]
						if ((typeof innerOrderItem !== 'string') || !innerOrderItem.length) {
							orderItemsAreArrayOfStrings = false
							break
						}
					}
					if (!orderItemsAreArrayOfStrings) {
						break
					}
					mappedOrder.push([{model: targetComponent.model, as: associationName}].concat(orderItem))
				}
				if (!orderItemsAreArrayOfStrings) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": "order" object with invalid contents provided in the relation config.`}
				}
			}
			if (include) {
				if (!(include instanceof Array) || !include.length) {
					throw {customMessage: `At "${sourceComponentName}" component, relation "${associationName}": the "include" object in the relation config must be a non-empty array.`}
				}
				const innerData = this.mapNestedRelations(targetComponent, include)
				relationObject.include = innerData.include
				if (innerData.order.length) {
					if (!relationObject.order) {
						relationObject.order = []
					}
					relationObject.order = relationObject.order.concat(innerData.order)
				}
			}
			mappedArray.push(relationObject)
		})
		return {order: mappedOrder, include: mappedArray}
	}

	/**
	 * Initiates the relations mapping process. Goes through the component's associationsConfig and calls mapNestedRelations for each item. Does the same for the baseDBComponentInstance.relationsConfig, if it exists. Generates and sets "relReadKeys" and "relations" as component properties.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
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
				relationConfig = relationsConfig[alias]
			let targetComponent = components[targetModelName]
			if (targetModelName === componentName) {
				targetComponent = this
			}
			if (relationConfig && (typeof relationConfig === 'object')) {
				if (!relationConfig.associationName) {
					relationConfig.associationName = alias
				}
				const relData = this.mapNestedRelations(this, [relationConfig])
				relations[alias] = {order: relData.mappedOrder, includeItem: relData.include[0]}
				delete relationsConfig[alias]
				continue
			}
			relations[alias] = {order: [], includeItem: {model: targetComponent.model, as: alias}}
		}
		for (const alias in relationsConfig) {
			if (relations[alias]) {
				throw {customMessage: `At "${componentName}" component: duplicate relation "${alias}".`}
			}
			const relData = this.mapNestedRelations(this, [relationsConfig[alias]])
			relations[alias] = {order: relData.mappedOrder, includeItem: relData.include[0]}
		}
		this.relReadKeys = Object.keys(relations)
		this.relations = relations
	}

	/**
	 * Recursively checks whether the filter value is OK, which nables the use of certain objects as filters, but protects against JSON injection.
	 * @param {any} fieldValue The value to check.
	 * @returns {boolean} True if the value is ok, false if it isn't.
	 * @memberof BaseDBComponent
	 */
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

	/**
	 * Mutates the provided container, settting the value for a filter field in it. Peforms validity checks and sets up "between" and "like" type filters.
	 * @param {object} container The container to put the filters in.
	 * @param {object} filter The filter options object (usually taken from component.searchFields).
	 * @param {string} field The field name, as it is in the object containing the filter values.
	 * @param {any} value The filter value, as it is in the object containing the filter values under the "field" key.
	 * @param {string[]} exactMatch (optional) An array of field names, corresponding to the field names specified in component.searchFields. Filter values whose "field" arg match a string in "exactMatch" will be treated as inclusive - >= / <=, rather than > / <.
	 * @returns {boolean} True if the value is ok and has been set successfully, false if it isn't.
	 * @memberof BaseDBComponent
	 */
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

	/**
	 * Creates a sequelize-style "where" object and a "requiredRelationsData" object based on the provided filters and exactMatch conditions.
	 * @param {object} filters The filter key-value object.
	 * @param {string[]} exactMatch (optional) An array of field names, corresponding to the field names specified in component.searchFields. Filter values whose "field" arg match a string in "exactMatch" will be treated as inclusive - >= / <=, rather than > / <.
	 * @typedef {object} BaseDBComponentGetWhereObjectsReturnData
	 * @property {object} where
	 * @property {object} requiredRelationsData
	 * @returns {BaseDBComponentGetWhereObjectsReturnData} Returns an object with keys {where, requiredRelationsData}. More info in the method description.
	 * @memberof BaseDBComponent
	 */
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

	/**
	 * Assigns the instance of the sequelize model to the provided relItem object and its "order" array (if it has one), and invokes itself if the relItem has include items of its own. This is perticularly useful when building the sequelize query options object, as we're using JSON.parse(JSON.stirngify()) to dereference configs, which destroys object instances.
	 * @param {object} relItem The relItem object.
	 * @returns {object} The relItem with the relevant component's model added under the "model" property.
	 * @memberof BaseDBComponent
	 */
	assignModelToDereferencedRelationRecursively(relItem) {
		let includeItem = JSON.parse(JSON.stringify(relItem)),
			innerInclude = includeItem.include
		includeItem.model = relItem.model
		for (const j in relItem.order) {
			let orderItem = relItem.order[j]
			if (orderItem.length === 3) {
				includeItem.order[j] = [{model: orderItem[0].model, as: relItem.as}, orderItem[1], orderItem[2]]
			}
		}
		if (innerInclude instanceof Array) {
			for (const i in innerInclude) {
				innerInclude[i] = this.assignModelToDereferencedRelationRecursively(relItem.include[i])
			}
		}
		return includeItem
	}

	/**
	 * Creates the "include" and "order" sequelize options objects based on the provided search data and the "requiredRelationsData" object compiled by "getWhereObjects" (if any).
	 * @param {object} data The search data.
	 * @param {object} requiredRelationsData The requiredRelationsData object, compiled by "getWhereObjects".
	 * @typedef {object} BaseDBComponentGetRelationObjectsReturnData
	 * @property {object} include
	 * @property {object} order
	 * @returns {BaseDBComponentGetRelationObjectsReturnData} Returns an object with keys {include, order}. More info in the method description.
	 * @memberof BaseDBComponent
	 */
	getRelationObjects(data, requiredRelationsData) {
		let include = [],
			order = [],
			actualData = ((typeof data !== 'object') || (data === null)) ? {} : data
		this.relReadKeys.forEach((key, index) => {
			let relationData = requiredRelationsData[key]
			if (relationData) {
				const relConfig = this.relations[key]
				let splitPath = relationData.path.split('.'),
					includeItem = this.assignModelToDereferencedRelationRecursively(relConfig.includeItem),
					relationItem = {include: [includeItem]},
					currentItemName = this.componentName
				// set required=true for all items in the path and set the filter values to the bottom one
				splitPath.forEach((keyFromPath, pcIndex) => {
					if (!(relationItem.include instanceof Array)) {
						throw {customMessage: `Invalid include array in "${currentItemName}"'s relations item (looking for "${keyFromPath}").`}
					}
					let nextRelationItemFound = false
					for (const i in relationItem.include) {
						let thisItem = relationItem.include[i]
						if (thisItem.as === keyFromPath) {
							nextRelationItemFound = true
							relationItem = thisItem
							relationItem.required = true
							currentItemName = keyFromPath
							if (pcIndex === (splitPath.length - 1) && (typeof relationData.field !== 'undefined')) {
								relationItem.where = {[relationData.field]: relationData.value}
							}
						}
					}
					if (!nextRelationItemFound) {
						throw {customMessage: `Invalid relation "${keyFromPath}" for "${currentItemName}".`}
					}
				})
				// go through all keys on all levels in includeItem and set their models, as they were destroyed during JSON.parse(JSON.stringify())
				include.push(includeItem)
				if (relConfig.order && relConfig.order.length) {
					order = order.concat(relConfig.order)
				}
				return
			}
			if (actualData[key]) {
				const relConfig = this.relations[key]
				if (relConfig.order && relConfig.order.length) {
					order = order.concat(relConfig.order)
				}
				include.push(this.assignModelToDereferencedRelationRecursively(relConfig.includeItem))
			}
		})
		return {include, order}
	}

	/**
	 * Goes recursively through a sequelize query options, dereferences their attributes and stores them, and does on to the object's include array (if any).
	 * @param {object} optionsObject The sequelize query options object.
	 * @typedef {object} BaseDBComponentAttributesByPathMap
	 * @property {string[]} topLevel
	 * @property {BaseDBComponentAttributesByPathMap[]} nested
	 * @returns {BaseDBComponentAttributesByPathMap} {topLevel, nested} = attributesbyPath; topLevel - the attributes array of the object, dereferenced; nested - an array of attributesByPath object, one for each "include" item oof the optionsObject
	 * @memberof BaseDBComponent
	 */
	stripAndMapAttributesFromOptionsObjectRecursively(optionsObject) {
		let attributesByPath = {nested: []}
		if (optionsObject.attributes) {
			attributesByPath.topLevel = JSON.parse(JSON.stringify(attributes))
		}
		optionsObject.attributes = ['id']
		if (optionsObject.include) {
			optionsObject.include.forEach((item, index) => attributesByPath.nested.push(this.stripAndMapAttributesFromOptionsObjectRecursively(item)))
		}
		return attributesByPath
	}

	/**
	 * Mutates the provided optionsObject, going recursively through it and restoring its attributes from the provided map, which in turn was generated by stripAndMapAttributesFromOptionsObjectRecursively.
	 * @param {object} optionsObject The sequelize query options object.
	 * @param {BaseDBComponentAttributesByPathMap} map The map to take the original attributes from.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
	restoreAttributesFromMapRecursively(optionsObject, map) {
		if (map.topLevel) {
			optionsObject.attributes = map.topLevel
		}
		if (map.nested.length) {
			map.nested.forEach((item, index) => this.restoreAttributesFromMapRecursively(optionsObject.include[index], item))
		}
	}

	/**
	 * Creates a new DB item.
	 * @param {object} data The object to create.
	 * @param {object} options Transaction, current userId, as well as other options to be passed to sequelize.
	 * @param {object} options.transaction A sequelize transaction to be passed to sequelize.
	 * @param {number} options.userId The id of the user to be set as "changeUserId", usually the current logged in user.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, the promise returns the created DB item.
	 * @memberof BaseDBComponent
	 */
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

	/**
	 * Creates a batch of DB entries.
	 * @param {object[]} data The array of objects to create.
	 * @param {object} options Transaction, current userId, as well as other options to be passed to sequelize.
	 * @param {object} options.transaction A sequelize transaction to be passed to sequelize.
	 * @param {number} options.userId The id of the user to be set as "changeUserId", usually the current logged in user.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, the promise returns the created DB entries.
	 * @memberof BaseDBComponent
	 */
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

	/**
	 * Fetches a single item from the database. If multiple items match, only the first one will be returned.
	 * @param {object} data The data to search by.
	 * @param {object} data.filters The list of filters to search by, matching the fields defined in component.searchFields. An error will be thrown if not present.
	 * @param {object} data.relReadKeys An object in the format {associationName1: true, associationName2: true}. The relations specified in this way will be added to the "include" options object and will be preent in the response.
	 * @param {string[]} data.exactMatch (optional) An array of field names, corresponding to the field names specified in component.searchFields. Filter values whose "field" arg match a string in "exactMatch" will be treated as inclusive - >= / <=, rather than > / <.
	 * @param {object} data.transaction (optional) A sequelize transaction object to be passed to the model's findOne method.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, the promise returns the found DB item or null if not found.
	 * @memberof BaseDBComponent
	 */
	read(data) {
		const instance = this,
			{filters, relReadKeys, exactMatch, transaction} = data
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

	/**
	 * Fetches a paginated list of items from the database.
	 * @param {object} data The data to search by.
	 * @param {number} data.page The page of results to fetch. Must be a non-zero integer.
	 * @param {number} data.perPage The limit of results to return per page.
	 * @param {boolean} data.readAll (optional) If set to true, page and perPage will be discarded and all results that match the other criteria will be fetched.
	 * @param {object} data.filters The list of filters to search by, matching the fields defined in component.searchFields. An error will be thrown if not present and readAll isn't set.
	 * @param {object} data.relReadKeys An object in the format {associationName1: true, associationName2: true}. The relations specified in this way will be added to the "include" options object and will be preent in the response.
	 * @param {string[]} data.exactMatch (optional) An array of field names, corresponding to the field names specified in component.searchFields. Filter values whose "field" arg match a string in "exactMatch" will be treated as inclusive - >= / <=, rather than > / <.
	 * @param {string} data.orderBy (optional) The field to order by. Defaults to id.
	 * @param {string} data.orderDirection (optional) The direction to order in. Can be 'asc' or 'desc' (case insensitive). Defaults to 'asc'.
	 * @param {boolean} data.idsOnlyMode If set to true, only ids will be returned as attributes of the found DB items and their associated DB items.
	 * @param {object} data.transaction (optional) A sequelize transaction object to be passed to the model's findOne method.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, the promise returns the {totalPages, page, perPage, results} object.
	 * @memberof BaseDBComponent
	 */
	readList(data) {
		const instance = this
		return co(function*() {
			let order = [],
				page = data.page ? parseInt(data.page, 10) : instance.defaults.page,
				perPage = data.perPage ? parseInt(data.perPage, 10) : instance.defaults.perPage,
				more = false,
				{where, requiredRelationsData} = instance.getWhereObjects(data.filters || {}, (data.exactMatch instanceof Array) && data.exactMatch || []),
				includeQueryData = instance.getRelationObjects(data.relReadKeys || {}, requiredRelationsData)
			if (data.orderBy instanceof Array) {
				const orderDirection = data.orderDirection || instance.defaults.orderDirection
				data.orderBy.forEach((item, index) => order.push([item, orderDirection]))
			} else {
				order.push([data.orderBy || instance.defaults.orderBy, data.orderDirection || instance.defaults.orderDirection])
			}
			if (!Object.keys(where).length) {
				// if (!data.readAll || !instance.allowNoFiltersOnReadListReadAll) {
				// 	throw {customMessage: 'No filters provided.'}
				// }
				where = {}
			}
			let readListOptions = {
					where,
					include: includeQueryData.include,
					order: order.concat(includeQueryData.order)
				},
				countOptions = {where, include: includeQueryData.include}

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
			if (!Object.keys(readListOptions.where).length) {
				delete readListOptions.where
			}
			if (!Object.keys(countOptions.where).length) {
				delete countOptions.where
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

			if (data.idsOnlyMode) {
				instance.stripAndMapAttributesFromOptionsObjectRecursively(readListOptions)
			}
			let results = []
			// workaround for this Sequelize bug - https://github.com/sequelize/sequelize/issues/8602
			try {
				results = yield instance.model.findAll(readListOptions)
			} catch(e) {
				if (e && e.message && (
						(e.message.indexOf('missing FROM-clause item for table') !== -1) ||
						(e.message.indexOf('missing FROM-clause entry for table') !== -1)
					) &&
					((typeof readListOptions.offset !== 'undefined') || (typeof readListOptions.limit !== 'undefined'))
				) {
					let {limit, offset, ...goodStuff} = readListOptions
					if (data.idsOnlyMode) {
						let idResults = yield instance.model.findAll(goodStuff)
						for (let i = offset; i <= limit; i++) {
							if (!idResults[i]) {
								break
							}
							results.push(idResults[i])
						}
					} else {
						let originalAttributesByPath = instance.stripAndMapAttributesFromOptionsObjectRecursively(goodStuff),
							idResults = yield instance.model.findAll(goodStuff),
							idsToSearchFor = []
						for (let i = offset; i <= limit; i++) {
							if (!idResults[i]) {
								break
							}
							idsToSearchFor.push(idResults[i].id)
						}
						if (idsToSearchFor.length) {
							instance.restoreAttributesFromMapRecursively(goodStuff, originalAttributesByPath)
							results = yield instance.model.findAll(goodStuff)
						}
					}
				} else {
					throw e
				}
			}
			if (results.length === (perPage + 1)) {
				results.pop()
				more = true
			}
			return {totalPages, page, perPage, more, results}
		})
	}

	/**
	 * Updates a DB item (or multiple items, if more than one matches the provided filters). If component.allowedUpdateFields are set, only these fields will be updated.
	 * @param {object} data The data to search by.
	 * @param {object} data.dbObject The object containing the fields to be updated.
	 * @param {number} data.where The filters to match the object(s) for update by.
	 * @param {number} data.userId The id of the user to be set as "changeUserId", usually the current logged in user.
	 * @param {object} data.transaction A sequelize transaction to be passed to sequelize.
	 * @returns {Promise<array>} A promise which wraps a generator function. When resolved, the promise returns an array of the format [updatedItemsCount: number, updatedItems: array].
	 * @memberof BaseDBComponent
	 */
	update(data) {
		const instance = this,
			{allowedUpdateFields} = this,
			{dbObject, where, userId, transaction} = data
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
			if (allowedUpdateFields instanceof Array) {
				let objectForUpdate = {}
				allowedUpdateFields.forEach((e, i) => {
					if (typeof dbObject[e] !== 'undefined') {
						objectForUpdate[e] = dbObject[e]
					}
				})
				return yield instance.model.update(objectForUpdate, options)
			}
			return yield instance.model.update(dbObject, options)
		})
	}

	/**
	 * Triggers component.update for each dbObject that has an id. Puts the rest into an array and triggers component.bulkCreate for them.
	 * @param {object[]} dbObjects The array of objects to create & update. An error will be thrown if this is not an array.
	 * @param {object} options The options to pass to the component.bulkCreate and component.update methods.
	 * @param {number} options.userId The id of the user to be set as "changeUserId", usually the current logged in user.
	 * @param {object} options.transaction A sequelize transaction to be passed to sequelize.
	 * @returns {Promise<{success: boolean}>} A promise which wraps a generator function. When resolved, the promise returns {success: true}.
	 * @memberof BaseDBComponent
	 */
	bulkUpsert(dbObjects, options) {
		if (!(dbObjects instanceof Array)) {
			throw {customMessage: `Invalid array of "${this.componentName}" items to create & update.`}
		}
		if (!options) {
			return this.db.sequelize.transaction((t) => this.bulkUpsert(dbObjects, {transaction: t}))
		}
		if (!options.transaction) {
			return this.db.sequelize.transaction((t) => this.bulkUpsert(dbObjects, {transaction: t, ...options}))
		}
		const instance = this,
			{userId, transaction, ...otherOptions} = options
		return co(function*() {
			let objectsToCreate = []
			for (const i in dbObjects) {
				let dbObject = dbObjects[i],
					id = parseInt(dbObject.id, 10)
				if (!dbObject.id) {
					objectsToCreate.push(dbObject)
					continue
				}
				yield instance.update({dbObject, where: {id}, userId, transaction, ...otherOptions})
			}
			yield instance.bulkCreate(objectsToCreate, {userId, transaction, ...otherOptions})
			return {success: true}
		})
	}

	/**
	 * Deletes all DB items matching the provided id and additionalFilters.
	 * @param {object} data The data to pass to the component.bulkCreate and component.update methods.
	 * @param {number} data.id The id if the item / items to delete.
	 * @param {object} data.additionalFilters An object containing additonal filters for narrowing down the list of DB items to be deleted.
	 * @param {boolean} data.checkForRelatedModels If set to true, all of the component's hasOne, hasMany and belongsToMany associations will be checked. If a single DB item exists for any of them, an error will be thrown.
	 * @param {object} data.transaction A sequelize transaction to be passed to sequelize.
	 * @returns {Promise<{deleted: number}>} A promise which wraps a generator function. When resolved, the promise returns {deleted: <the number of deleted DB items>}.
	 * @memberof BaseDBComponent
	 */
	delete(data) {
		const instance = this,
			{associationsConfig, componentName, dependencyMap, relations} = this,
			{equalWith, masterOf} = dependencyMap,
			{id, additionalFilters, checkForRelatedModels, transaction} = data
		return co(function*() {
			let readListOptions = {readAll: true, filters: {id}, relReadKeys: {}, idsOnlyMode: true},
				deleteOptions = {where: {}},
				systemCriticalIds = instance.systemCriticalIds || []
			if ((typeof additionalFilters === 'object') && (additionalFilters !== null)) {
				delete additionalFilters.id
				for (const fieldName in additionalFilters) {
					readListOptions.filters[fieldName] = additionalFilters[fieldName]
				}
			}
			if (transaction) {
				readListOptions.transaction = transaction
				deleteOptions.transaction = transaction
			}
			if (checkForRelatedModels && masterOf.length) {
				let componentNameToAssociationNameMap = {},
					idsToDelete = []
				for (const alias in associationsConfig) {
					const assocItem = associationsConfig[alias]
					componentNameToAssociationNameMap[assocItem.componentName || alias] = alias
				}
				masterOf.forEach((item, index) => {
					readListOptions.relReadKeys[componentNameToAssociationNameMap[item]] = true
				})
				let existingItems = (yield instance.readList(readListOptions)).results,
					includedRelationNames = Object.keys(readListOptions.relReadKeys)
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
					idsToDelete.push(item.id)
				}
				deleteOptions.where.id = idsToDelete
				return {deleted: yield instance.model.destroy(deleteOptions)}
			}
			if (systemCriticalIds.length) {
				let existingItems = (yield instance.readList(readListOptions)).results,
					idsToDelete = []
				for (const i in existingItems) {
					const item = (existingItems[i]).dataValues
					if (systemCriticalIds.indexOf(item.id) !== -1) {
						throw {customMessage: `Cannot delete the "${componentName}" item with id ${item.id} - it is system-critical.`}
					}
					idsToDelete.push(item.id)
				}
				deleteOptions.where.id = idsToDelete
			}
			return {deleted: yield instance.model.destroy(deleteOptions)}
		})
	}
}

module.exports = BaseDBComponent
