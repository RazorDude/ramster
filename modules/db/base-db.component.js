/**
 * The base-db.component module. Contains the BaseDBComponent class.
 * @module baseDbComponentModule
 */

const
	co = require('co'),
	_DBModule = require('./db.module'),
	deepmerge = require('deepmerge'),
	fs = require('fs-extra'),
	path = require('path'),
	_Sequelize = require('sequelize'),
	sharp = require('sharp'),
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
		this.allowedFilterKeywordOperators = ['$and', '$gt', '$gte', '$lt', '$lte', '$not', '$or', '$like', '$iLike']
		/**
		 * The list of keyword operators to check and parse when escaping objects for filters. Anything not included in this list will be skipped.
		 * @type {string[]}
		 */
		this.allowedFilterContainerKeys = ['$or']
		/**
		 * The default list of image file type extensions allowed for processing by the saveImage method.
		 * @type {string[]}
		 */
		this.allowedImageTypes = ['.jpg', '.jpeg', '.svg', '.png']
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
		/**
		 * An array of image resizing options, according to npmjs/sharp's docs, to be passed to .resize() in saveImage(). Can also be provided globally in the dbConfig. Providing it on a per-class basis always overrides the globalConfig value. If not provided, the image will not be resized.
		 * @type {any[]}
		 */
		this.imageResizingOptions = undefined
		/**
		 * A map of allowed image output file formats and their corresponding methods in sharp.js.
		 * @type {{[fileFormatName: string]: string}}
		 */
		this.imageOutputFileFormatsMethodNameMap = {
			heif: 'heif',
			jpeg: 'jpeg',
			jpg: 'jpeg',
			png: 'png',
			tiff: 'tiff',
			webp: 'webp'
		}
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
	 * @property {Array<string[]>} order An array containing all ordering items; must be added up with the parent container's model and association name up to the top level
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
			sourceComponentName = sourceComponent.componentName
		let mappedArray = [],
			mappedOrder = []
		config.forEach((item) => {
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
					mappedOrder = mappedOrder.concat(innerData.order.map((orderItem) => [{model: targetComponent.model, as: associationName}].concat(orderItem)))
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
			{associationsConfig, componentName} = this
			// relationsConfig = this.relationsConfig || {}
		if (!associationsConfig) {
			return
		}
		const relationsConfig = this.relationsConfig && JSON.parse(JSON.stringify(this.relationsConfig)) || {}
		let relations = {}
		this.parseDereferencedObjectValues(this.relationsConfig, relationsConfig)
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
				relations[alias] = {order: relData.order, includeItem: relData.include[0]}
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
			relations[alias] = {order: relData.order, includeItem: relData.include[0]}
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
			container[actualField][(exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatch ? '$gte' : '$gt'] = value
			return true
		}
		if (filter.betweenTo) {
			let actualField = field.replace('To', '')
			if (typeof container[actualField] === 'undefined') {
				container[actualField] = {}
			}
			container[actualField][actualField, (exactMatchFields.indexOf(actualField) !== -1) || filter.exactMatch ? '$lte' : '$lt'] = value
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
			this.searchFields.forEach((element) => {
				let field = element.field,
					fieldValue = filters[field]
				if (typeof fieldValue === 'undefined') {
					return
				}
				// handle $associationName.fieldName$ cases
				if ((field[0] === '$') && (field[field.length - 1] === '$')) {
					let tempContainer = {}
					if (this.setFilterValue(tempContainer, element, field, fieldValue, exactMatch)) {
						let fieldKey = Object.keys(tempContainer)[0],
							processedField = field.replace(/\$/g, '').split('.'),
							actualFieldKey = processedField.pop(),
							currentRelationsData = requiredRelationsData
						processedField.forEach((item, index) => {
							if (typeof currentRelationsData[item] === 'undefined') {
								currentRelationsData[item] = {children: {}, values: {}}
							}
							if (index < (processedField.length - 1)) {
								currentRelationsData = currentRelationsData[item].children
								return
							}
							currentRelationsData = currentRelationsData[item]
						})
						currentRelationsData.values[actualFieldKey] = tempContainer[fieldKey]
					}
				} else {
					this.setFilterValue(where, element, field, fieldValue, exactMatch)
				}
			})
			if ((filters.$and instanceof Array) && (filters.$and.length)) {
				where.$and = []
				filters.$and.forEach((andItem) => {
					let whereObjects = this.getWhereObjects(andItem, exactMatch)
					if (Object.keys(whereObjects.where).length) {
						where.$and.push(whereObjects.where)
					}
					if (Object.keys(whereObjects.requiredRelationsData).length) {
						requiredRelationsData = deepmerge(requiredRelationsData, whereObjects.requiredRelationsData)
					}
				})
			}
			if ((filters.$or instanceof Array) && (filters.$or.length)) {
				where.$or = []
				filters.$or.forEach(($orItem) => {
					let whereObjects = this.getWhereObjects($orItem, exactMatch)
					if (Object.keys(whereObjects.where).length) {
						where.$or.push(whereObjects.where)
					}
					if (Object.keys(whereObjects.requiredRelationsData).length) {
						requiredRelationsData = deepmerge(requiredRelationsData, whereObjects.requiredRelationsData)
					}
				})
			}
		}
		return {where, requiredRelationsData}
	}

	/**
	 * Populates the provided order array based on the relation data and the fieldMap.
	 * @param {Array} order The order object to populate.
	 * @param {Array} relationIncludeItem The relation's "include" object, which contains the order object to take the data from and the association alias of the model.
	 * @param {object} fieldMap The order fields field map object.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
	setOrderDataForRelation(order, relationIncludeItem, fieldMap) {
		const relationIncludeItemOrder = relationIncludeItem.order
		for (const i in relationIncludeItemOrder) {
			const relationOrderItem = relationIncludeItemOrder[i],
				fieldName = relationOrderItem[relationOrderItem.length - 2],
				direction = relationOrderItem[relationOrderItem.length - 1]
			let orderMapItem = fieldMap[fieldName]
			if (typeof orderMapItem === 'undefined') {
				let orderItem = []
				// sometimes we have top-level ordering by deeply nested associations - in that case, we would have the models listed in the relation's order item
				if (relationOrderItem.length > 2) {
					for (const j in relationOrderItem) {
						let intIndex = parseInt(j, 10),
							itemAtIndex = relationOrderItem[intIndex]
						if (typeof itemAtIndex.model === 'undefined') {
							break
						}
						orderItem.push({model: itemAtIndex.model, as: itemAtIndex.as})
					}
				} else {
					orderItem.push({model: relationIncludeItem.model, as: relationIncludeItem.as})
				}
				orderItem.push(fieldName)
				orderItem.push(direction)
				orderMapItem = {index: order.length, direction}
				fieldMap[fieldName] = orderMapItem
				order.push(orderItem)
				continue
			}
			if (orderMapItem.direction !== direction) {
				order[orderMapItem.index][2] = direction
			}
		}
	}

	/**
	 * Goes through an object and its nested objects and makes sure Date, Function, SequelizeMethod and Sequelize.Model ones are not recorded as [object Object].
	 * @param {object} sourceObject The object to take the data from.
	 * @param {object} targetObject The object to set the data in.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
	parseDereferencedObjectValues(sourceObject, targetObject) {
		if (
			(typeof sourceObject !== 'object') ||
			(sourceObject === null) ||
			(typeof sourceObject === 'function') ||
			(sourceObject instanceof Date) ||
			(sourceObject instanceof this.db.Sequelize.Utils.SequelizeMethod) ||
			(typeof sourceObject.sequelize !== 'undefined')
		) {
			return
		}
		if (sourceObject instanceof Array) {
			if (!(targetObject instanceof Array) || (targetObject.length < sourceObject.length)) {
				return
			}
			sourceObject.forEach((sourceItem, index) => {
				if (
					(sourceItem instanceof Date) ||
					(typeof sourceItem === 'function') ||
					(sourceItem instanceof this.db.Sequelize.Utils.SequelizeMethod) ||
					(sourceItem && (typeof sourceItem.sequelize !== 'undefined'))
				) {
					targetObject[index] = sourceItem
					return
				}
				this.parseDereferencedObjectValues(sourceItem, targetObject[index])
			})
			return
		}
		for (const key in sourceObject) {
			const sourceItem = sourceObject[key]
			if (
				(sourceItem instanceof Date) ||
				(typeof sourceItem === 'function') ||
				(sourceItem instanceof this.db.Sequelize.Utils.SequelizeMethod) ||
				(sourceItem && (typeof sourceItem.sequelize !== 'undefined'))
			) {
				targetObject[key] = sourceItem
				continue
			}
			this.parseDereferencedObjectValues(sourceItem, targetObject[key])
		}
	}

	/**
	 * Populates the provided include array based on the relation data and the required fields data (if any).
	 * @param {BaseDBComponent} dbComponent The curent DB component. Used to map associations from required fields that aren't explicitly specified in the relationsConfig.
	 * @param {Array} include The include array to populate.
	 * @param {object} associationNameMap The associationNameMap object. This object will be mutated according to the provided relationIncludeItem data.
	 * @param {object} relationIncludeItem The object that contains the relation's sequelize "include" data.
	 * @param {string} relationName The relation name.
	 * @param {object} requiredFieldsData The requiredFieldsData object generated by getWhereObjects.
	 * @returns {void}
	 * @memberof BaseDBComponent
	 */
	setQueryDataForRelation(dbComponent, include, associationNameMap, relationIncludeItem, relationName, requiredFieldsData) {
		let mapItem = associationNameMap[relationIncludeItem.as]
		// create node for the relation if it doesn't exist in the map; the JSON trick here is used to de-reference the relation item so it won't be mutated
		if (typeof mapItem === 'undefined') {
			let includeItem = JSON.parse(JSON.stringify(relationIncludeItem))
			mapItem = {children: {}, index: include.length, orderFieldsMap: {}}
			associationNameMap[includeItem.as] = mapItem
			includeItem.model = relationIncludeItem.model
			if (includeItem.include) {
				delete includeItem.include
			}
			// delete the de-referenced include item's order array (if present) so the setOrderDataForRelation method can work correctly
			if (typeof includeItem.order !== 'undefined') {
				delete includeItem.order
			}
			include.push(includeItem)
		}
		const associationsConfig = dbComponent.associationsConfig,
			dbComponents = dbComponent.db.components,
			innerIncludeItems = relationIncludeItem.include,
			requiredFieldsDataItem = requiredFieldsData[relationName || relationIncludeItem.as] || {},
			requiredFieldsDataItemValues = requiredFieldsDataItem.values
		let includeItem = include[mapItem.index],
			innerInclude = includeItem.include || [],
			mapItemChildren = mapItem.children,
			requiredFieldsDataItemChildren = requiredFieldsDataItem.children || {}
		// if there are required fields for this relation, add them to the "where" object and make the relation required in the query
		if (requiredFieldsDataItemValues && Object.keys(requiredFieldsDataItemValues).length) {
			let where = includeItem.where
			if (typeof includeItem.where === 'undefined') {
				where = {}
				includeItem.where = where
			}
			for (const key in requiredFieldsDataItemValues) {
				let currentValue = where[key]
				if (typeof currentValue === 'undefined') {
					where[key] = requiredFieldsDataItemValues[key]
					continue
				}
				if ((typeof currentValue === 'object') && (currentValue !== null) && (currentValue.$and instanceof Array)) {
					currentValue.$and.push(requiredFieldsDataItemValues[key])
					continue
				}
				where[key] = {$and: [where[key], requiredFieldsDataItemValues[key]]}
			}
			if (!includeItem.required) {
				includeItem.required = true
			}
		}
		// if there are required fields for any of this relation's children - make it required in the query before moving on
		else if (requiredFieldsDataItemChildren && Object.keys(requiredFieldsDataItemChildren).length && !includeItem.required) {
			includeItem.required = true
		}
		// go through all "where" items of the original relationIncludeItem and make sure Date, Function and SequelizeMethod ones are not recorded as [object Object]
		if (relationIncludeItem.where) {
			this.parseDereferencedObjectValues(relationIncludeItem.where, includeItem.where)
		}
		// set the order array's models - otherwise sequelize will ignore the sort
		if (relationIncludeItem.order instanceof Array) {
			let order = includeItem.order
			if (!(order instanceof Array)) {
				order = []
				includeItem.order = order
			}
			this.setOrderDataForRelation(order, relationIncludeItem, mapItem.orderFieldsMap)
		}
		// go through the inner relations and do all of the above for each one
		if (innerIncludeItems instanceof Array) {
			for (const i in innerIncludeItems) {
				const innerIncludeItem = innerIncludeItems[i],
					associationConfigItemComponentName = associationsConfig[innerIncludeItem.as].componentName
				this.setQueryDataForRelation(
					associationConfigItemComponentName == dbComponent.componentName ? dbComponent : dbComponents[associationConfigItemComponentName || innerIncludeItem.as],
					innerInclude,
					mapItemChildren,
					innerIncludeItem,
					null,
					requiredFieldsDataItemChildren
				)
			}
		}
		// go through any required relations that have not been explicitly added in the component's relationConfig and use the target component's relations object to get the relation data
		if (requiredFieldsDataItemChildren) {
			for (const key in requiredFieldsDataItemChildren) {
				if (typeof mapItemChildren[key] === 'undefined') {
					const targetAssociationConfigItem = associationsConfig[key]
					if (typeof targetAssociationConfigItem === 'undefined') {
						throw {customMessage: `No association with name "${key}" found for DB component "${dbComponent.componentName}".`}
					}
					const targetComponentName = targetAssociationConfigItem.componentName || key
					this.setQueryDataForRelation(
						targetComponentName == dbComponent.componentName ? dbComponent : dbComponents[targetComponentName],
						innerInclude,
						mapItemChildren,
						dbComponent.relations[key].includeItem,
						null,
						requiredFieldsDataItemChildren
					)
				}
			}
		}
		if (innerInclude.length) {
			includeItem.include = innerInclude
		}
	}

	/**
	 * Goes through the component's relReadKeys and creates "include" and "order" objects to be consumed by read and readList queries.
	 * The method also takes a "requiredRelationsData" object generated by "getWhereObjects" and uses it to set (deeply nested) relations as required and add filters to them.
	 * Duplicate relations and their nested includes are merged to avoid duplicate query errors. Duplicate order items are overwritten.
	 * @param {object} relReadKeys The search relReadKeys's relReadKeys.
	 * @param {object} requiredRelationsData The requiredRelationsData object, generated by "getWhereObjects".
	 * @typedef {object} BaseDBComponentGetRelationObjectsReturnData
	 * @property {object} include
	 * @property {object} order
	 * @returns {BaseDBComponentGetRelationObjectsReturnData} Returns an object with keys {include, order}. More info in the method description.
	 * @memberof BaseDBComponent
	 */
	getRelationObjects(relReadKeys, requiredRelationsData) {
		const associationsConfig = this.associationsConfig,
			dbComponents = this.db.components
		let associationNameMap = {},
			include = [],
			order = [],
			orderFieldsMap = {}
		if (requiredRelationsData) {
			for (const relationName in requiredRelationsData) {
				const relationData = this.relations[relationName]
				if (!relationData) {
					throw {customMessage: `No relation "${relationName}" exists for component "${this.componentName}".`}
				}
				const associationConfigItemComponentName = associationsConfig[relationData.includeItem.as].componentName
				this.setQueryDataForRelation(
					associationConfigItemComponentName === this.componentName ? this : dbComponents[associationConfigItemComponentName || relationData.includeItem.as],
					include,
					associationNameMap,
					relationData.includeItem,
					relationName,
					requiredRelationsData
				)
				if (relationData.order instanceof Array) {
					this.setOrderDataForRelation(order, {...relationData.includeItem, order: relationData.order}, orderFieldsMap)
				}
			}
		}
		if (relReadKeys) {
			for (const relationName in relReadKeys) {
				let actualRelationName = relationName,
					relationData = null
				// support nested relReadKeys, i.e. "{users.country: true}"
				if (relationName.indexOf('.') !== -1) {
					let relationPath = relationName.split('.')
					actualRelationName = relationPath[0]
					const originalRelationData = this.relations[actualRelationName]
					if (!originalRelationData) {
						throw {customMessage: `No relation "${actualRelationName}" exists for component "${this.componentName}".`, stage: 0}
					}
					relationData = JSON.parse(JSON.stringify(originalRelationData))
					this.parseDereferencedObjectValues(originalRelationData, relationData)
					let currentDBComponent = dbComponents[this.associationsConfig[relationData.includeItem.as].componentName || relationData.includeItem.as],
						currentIncludeItem = relationData.includeItem
					for (let i = 1; i < relationPath.length; i++) {
						const innerRelationName = relationPath[i],
							innerRelation = currentDBComponent.relations[innerRelationName]
						if (!innerRelation) {
							throw {customMessage: `No relation "${innerRelationName}" exists for component "${currentDBComponent.componentName}".`, stage: 1}
						}
						if (!currentIncludeItem.include) {
							currentIncludeItem.include = []
						}
						currentIncludeItem.include.push({...innerRelation.includeItem, order: innerRelation.order})
						currentDBComponent = dbComponents[currentDBComponent.associationsConfig[innerRelation.includeItem.as].componentName || innerRelation.includeItem.as]
						currentIncludeItem = currentIncludeItem.include[currentIncludeItem.include.length - 1]
					}
				} else {
					relationData = this.relations[actualRelationName]
					if (!relationData) {
						throw {customMessage: `No relation "${actualRelationName}" exists for component "${this.componentName}".`, stage: 2}
					}
				}
				const associationConfigItemComponentName = associationsConfig[relationData.includeItem.as].componentName
				this.setQueryDataForRelation(
					associationConfigItemComponentName === this.componentName ? this : dbComponents[associationConfigItemComponentName || relationData.includeItem.as],
					include,
					associationNameMap,
					relationData.includeItem,
					actualRelationName,
					{}
				)
				if (relationData.order instanceof Array) {
					this.setOrderDataForRelation(order, {...relationData.includeItem, order: relationData.order}, orderFieldsMap)
				}
			}
		}
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
			attributesByPath.topLevel = JSON.parse(JSON.stringify(optionsObject.attributes))
		}
		optionsObject.attributes = ['id']
		if (optionsObject.include) {
			optionsObject.include.forEach((item) => attributesByPath.nested.push(this.stripAndMapAttributesFromOptionsObjectRecursively(item)))
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
		} else {
			delete optionsObject.attributes
		}
		if (map.nested.length) {
			map.nested.forEach((item, index) => this.restoreAttributesFromMapRecursively(optionsObject.include[index], item))
		}
	}

	/**
	 * Saves an image in the storage folder based on the provided data, converting it to png.
	 * @param {string} inputFileName The name of the input file as saved in the uploads folder.
	 * @param {string} outputFileName The name of the input file as saved in the uploads folder.
	 * @param {number} dbObjectId The id of the db item the image is for.
	 * @param {BaseDBComponentSaveImageOptions | string} options Additional method execution options, such as image cropping coordinates and the output file type.
	 * @typedef {object} BaseDBComponentSaveImageImageCroppingOptions
	 * @property {number} height The height of the area to crop.
	 * @property {number} startX The X coordinate of the starting point of the area to crop.
	 * @property {number} startY The Y coordinate of the starting point of the area to crop.
	 * @property {number} width The width of the area to crop.
	 * @typedef {object} BaseDBComponentSaveImageOptions
	 * @property {BaseDBComponentSaveImageImageCroppingOptions} imageCroppingOptions (optional) Coordinates for cropping the image.
	 * @property {string} outputFileType (optional) The extension of the output file - png, jpeg, webp, tiff or heif.
	 * @property {object} imageResizingOptions An object containing options regarding image resizing that are to be passed to Sharp.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with true.
	 * @memberof BaseDBComponent
	 */
	saveImage(inputFileName, outputFileName, dbObjectId, options) {
		const instance = this,
			{allowedImageTypes, componentName, db, imageOutputFileFormatsMethodNameMap} = instance
		let actualOptions = {}
		if (typeof options === 'string') {
			console.log(
				'[ramster] DEPRECATION WARNING: BaseDBComponent.saveImage currently supports the outputFileType as a fourth argument ' +
				'only for backwards compatibility purposes and will be removed in the next major release. ' +
				'Please use the newer, options objects syntax for the fourth argument.'
			)
			actualOptions = {outputFileType: options}
		}
		else if ((typeof options === 'object') && (options !== null)) {
			actualOptions = Object.assign({}, options)
		}
		const {imageCroppingOptions, keepInputFile, outputFileType} = actualOptions
		return co(function*() {
			if ((typeof inputFileName !== 'string') || !inputFileName.length) {
				throw {customMessage: 'Invalid inputFileName provided. Please provide a non-empty string.'}
			}
			if ((typeof outputFileName !== 'string') || !outputFileName.length) {
				throw {customMessage: 'Invalid outputFileName provided. Please provide a non-empty string.'}
			}
			if ((typeof dbObjectId !== 'number') || (dbObjectId < 1)) {
				throw {customMessage: 'Invalid dbObjectId provided. Please provide a non-zero integer.'}
			}
			let inputFilePath = path.join(db.config.globalUploadPath, inputFileName),
				outputFolderPath = path.join(db.config.globalStoragePath, `/images/${componentName}/${dbObjectId}`),
				extNameRegex = new RegExp(/\.[^/.]+$/),
				extName = extNameRegex.exec(inputFileName)
			try {
				extName = extName && extName[0] && extName[0].toLowerCase() || ''
				if (allowedImageTypes.indexOf(extName) === -1) {
					throw {customMessage: `Invalid or unsupported image file type "${extName}".`}
				}
				yield fs.mkdirp(outputFolderPath)
				const imageResizingOptions = actualOptions.imageResizingOptions || instance.imageResizingOptions || db.config.db.imageResizingOptions || null,
					outputExtName = outputFileType || db.config.db.defaultImageOutputFileType || 'png'
				let inputFileData = yield fs.readFile(inputFilePath),
					outputFile = yield fs.open(path.join(outputFolderPath, `${outputFileName}.${outputExtName}`), 'w')
				if (extName !== `.${outputExtName}`) {
					inputFileData = yield sharp(inputFileData)[imageOutputFileFormatsMethodNameMap[outputExtName]]().toBuffer()
				}
				if (imageResizingOptions instanceof Array) {
					let op = sharp(inputFileData),
						metadata = yield op.metadata()
					if ((metadata.width > imageResizingOptions[0]) || (metadata.height > imageResizingOptions[1])) {
						inputFileData = yield op.resize.call(op, imageResizingOptions).toBuffer()
					}
				}
				if (imageCroppingOptions) {
					inputFileData = yield sharp(inputFileData).extract({
						left: imageCroppingOptions.startX,
						top: imageCroppingOptions.startY,
						width: imageCroppingOptions.width,
						height: imageCroppingOptions.height
					}).toBuffer()
				}
				yield fs.writeFile(outputFile, inputFileData)
				yield fs.close(outputFile)
				if (keepInputFile !== true) {
					yield fs.remove(inputFilePath)
				}
			} catch (e) {
				if (e && e.customMessage) {
					throw e
				}
				instance.db.logger.error(e)
				throw {customMessage: 'Error saving the image file.'}
			}
			return true
		})
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
			let actualOptions = (typeof options === 'object') && (options !== null) ? options : {},
				hasImageData = data.inputImageFileName && data.outputImageFileName
			if (hasImageData && !actualOptions.transaction) {
				return yield instance.db.sequelize.transaction((t) => instance.create(data, {transaction: t, ...actualOptions}))
			}
			if (actualOptions.userId) {
				data.changeUserId = actualOptions.userId
			}
			const createdItem = (yield instance.model.create(data, actualOptions)).dataValues
			if (hasImageData) {
				yield instance.saveImage(data.inputImageFileName, data.outputImageFileName, createdItem.id)
			}
			return createdItem
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
			if (!Object.keys(where).length && !Object.keys(requiredRelationsData).length) {
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
	 * @param {object} data.relReadKeys An object in the format {associationName1: true, associationName2: true}. The relations specified in this way will be added to the "include" options object and will be present in the response.
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
				totalPages = 1,
				more = false,
				{where, requiredRelationsData} = instance.getWhereObjects(data.filters || {}, (data.exactMatch instanceof Array) && data.exactMatch || []),
				includeQueryData = instance.getRelationObjects(data.relReadKeys || {}, requiredRelationsData),
				readAll = (data.readAll === true) || (data.readAll === 'true'),
				idsOnlyMode = (data.idsOnlyMode === true) || (data.idsOnlyMode === 'true')
			if (data.orderBy instanceof Array) {
				const orderDirection = data.orderDirection || instance.defaults.orderDirection
				data.orderBy.forEach((item) => order.push([item, orderDirection]))
			} else {
				order.push([data.orderBy || instance.defaults.orderBy, data.orderDirection || instance.defaults.orderDirection])
			}
			if (!Object.keys(where).length) {
				where = {}
			}
			let readListOptions = {
					where,
					include: includeQueryData.include,
					order: order.concat(includeQueryData.order)
				}

			if (data.transaction) {
				readListOptions.transaction = data.transaction
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
			}
			if (!Object.keys(readListOptions.where).length) {
				delete readListOptions.where
			}

			let results = []
			if (readAll) {
				if (idsOnlyMode) {
					instance.stripAndMapAttributesFromOptionsObjectRecursively(readListOptions)
				}
				results = yield instance.model.findAll(readListOptions)
				totalPages = 1
				page = 1
				perPage = results.length
				more = false
			} else {
				// workaround for this Sequelize bug - https://github.com/sequelize/sequelize/issues/8602, moved to https://github.com/sequelize/sequelize/issues/9166
				if (readListOptions.include) {
					let originalAttributesMap = instance.stripAndMapAttributesFromOptionsObjectRecursively(readListOptions)
					let idResults = yield instance.model.findAll(readListOptions)
					totalPages = Math.ceil(idResults.length / perPage)
					if ((totalPages > 0) && (page > totalPages)) {
						page = totalPages
					}
					let offset = (page - 1) * perPage,
						limit = offset + perPage
					if (idsOnlyMode) {
						for (let i = offset; i <= limit; i++) {
							if (typeof idResults[i] === 'undefined') {
								break
							}
							results.push(idResults[i])
						}
					} else {
						let idsToSearchFor = []
						for (let i = offset; i <= limit; i++) {
							if (typeof idResults[i] === 'undefined') {
								break
							}
							idsToSearchFor.push(idResults[i].id)
						}
						if (idsToSearchFor.length) {
							instance.restoreAttributesFromMapRecursively(readListOptions, originalAttributesMap)
							readListOptions.where = {id: idsToSearchFor}
							results = yield instance.model.findAll(readListOptions)
						}
					}
				} else {
					totalPages = Math.ceil((yield instance.model.count(readListOptions)) / perPage)
					if ((totalPages > 0) && (page > totalPages)) {
						page = totalPages
					}
					readListOptions.offset = (page - 1) * perPage
					readListOptions.limit = perPage + 1
					results = yield instance.model.findAll(readListOptions)
				}
				if (results.length === (perPage + 1)) {
					results.pop()
					more = true
				} else {
					more = false
				}
			}

			return {totalPages, page, perPage, more, results}
		})
	}

	/**
	 * Updates a DB item (or multiple items, if more than one matches the provided filters). If component.allowedUpdateFields are set, only these fields will be updated.
	 * @param {object} data The data to search by.
	 * @param {object} data.dbObject The object containing the fields to be updated.
	 * @param {number} data.where The filters to match the object(s) for update by (kept for backwards compatibility).
	 * @param {number} data.filters The filters to match the object(s) for update by.
	 * @param {number} data.userId The id of the user to be set as "changeUserId", usually the current logged in user.
	 * @param {object} data.transaction A sequelize transaction to be passed to sequelize.
	 * @returns {Promise<array>} A promise which wraps a generator function. When resolved, the promise returns an array of the format [updatedItemsCount: number, updatedItems: array].
	 * @memberof BaseDBComponent
	 */
	update(data) {
		const instance = this,
			{allowedUpdateFields} = this,
			{dbObject, userId, where, transaction} = data
		let {filters} = data
		return co(function*() {
			if ((typeof filters !== 'object') || (filters === null) || (Object.keys(filters).length === 0)) {
				if ((typeof where !== 'object') || (where === null) || (Object.keys(where).length === 0)) {
					throw {customMessage: 'Cannot update without criteria.'}
				}
				filters = where
				data.filters = where
			}
			const hasImageData = dbObject.inputImageFileName && dbObject.outputImageFileName
			if (hasImageData && !transaction) {
				return yield instance.db.sequelize.transaction((t) => instance.update({transaction: t, ...data}))
			}
			let options = {
				where: {id: (yield instance.readList({readAll: true, filters, idsOnlyMode: true, transaction})).results.map((e) => e.id)},
				returning: true
			}
			if (transaction) {
				options.transaction = transaction
			}
			if (userId) {
				dbObject.changeUserId = userId
			}
			let objectForUpdate = {}
			if (allowedUpdateFields instanceof Array) {
				allowedUpdateFields.forEach((e) => {
					if (typeof dbObject[e] !== 'undefined') {
						objectForUpdate[e] = dbObject[e]
					}
				})
			} else {
				objectForUpdate = dbObject
			}
			const updateResults = yield instance.model.update(objectForUpdate, options)
			if (updateResults[0]) {
				let updateResult = updateResults[1][0].dataValues
				if (dbObject.inputImageFileName && dbObject.outputImageFileName) {
					yield instance.saveImage(dbObject.inputImageFileName, dbObject.outputImageFileName, updateResult.id)
				}
			}
			return updateResults
		})
	}

	/**
	 * Triggers component.update for each dbObject that has an id. Puts the rest into an array and triggers component.bulkCreate for them.
	 * @param {object[]} dbObjects The array of objects to create & update. An error will be thrown if this is not an array.
	 * @param {object} options The options to pass to the component.bulkCreate and component.update methods.
	 * @param {object} options.additionalCreateFields (optional) An object that contains fields to be added to each dbObject.
	 * @param {object} options.updateFilters (optional) An object that contains filters to be added to the "where" update object.
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
			return this.db.sequelize.transaction((t) => this.bulkUpsert(dbObjects, {...options, transaction: t}))
		}
		const instance = this,
			{additionalCreateFields, updateFilters, userId, transaction, ...otherOptions} = options
		return co(function*() {
			const actualUpdateFilters = updateFilters || {}
			let objectsToCreate = [],
				fieldsToAdd = (typeof additionalCreateFields === 'object') && (additionalCreateFields !== null) ? additionalCreateFields : {}
			for (const i in dbObjects) {
				let dbObject = dbObjects[i],
					id = parseInt(dbObject.id, 10)
				if (!dbObject.id) {
					for (const key in fieldsToAdd) {
						dbObject[key] = fieldsToAdd[key]
					}
					objectsToCreate.push(dbObject)
					continue
				}
				let filters = {...actualUpdateFilters, id}
				yield instance.update({dbObject, filters, where: filters, userId, transaction, ...otherOptions})
			}
			yield instance.bulkCreate(objectsToCreate, {userId, transaction, ...otherOptions})
			return {success: true}
		})
	}

	/**
	 * Deletes all DB items matching the provided id and additionalFilters.
	 * @param {object} data The data to determine what to delete by.
	 * @param {number} data.id The id if the item / items to delete.
	 * @param {object} data.additionalFilters An object containing additonal filters for narrowing down the list of DB items to be deleted.
	 * @param {boolean} data.checkForRelatedModels If set to true, all of the component's hasOne, hasMany and belongsToMany associations will be checked. If a single DB item exists for any of them, an error will be thrown.
	 * @param {object} data.transaction A sequelize transaction to be passed to sequelize.
	 * @returns {Promise<{deleted: number}>} A promise which wraps a generator function. When resolved, the promise returns {deleted: <the number of deleted DB items>}.
	 * @memberof BaseDBComponent
	 */
	delete(data) {
		const instance = this,
			{associationsConfig, componentName, db, dependencyMap} = this,
			{masterOf} = dependencyMap,
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
				masterOf.forEach((item) => {
					readListOptions.relReadKeys[componentNameToAssociationNameMap[item]] = true
				})
				let existingItems = (yield instance.readList(readListOptions)).results,
					includedRelationNames = Object.keys(readListOptions.relReadKeys)
				if (!existingItems.length) {
					return {deleted: 0}
				}
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
				const deleted = yield instance.model.destroy(deleteOptions)
				for (const i in existingItems) {
					try {
						yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/${existingItems[i].id}`))
					} catch(e) {
						db.logger.error(e)
					}
				}
				return {deleted}
			}
			if (systemCriticalIds.length) {
				let existingItems = (yield instance.readList(readListOptions)).results,
					idsToDelete = []
				if (!existingItems.length) {
					return {deleted: 0}
				}
				for (const i in existingItems) {
					const item = (existingItems[i]).dataValues
					if (systemCriticalIds.indexOf(item.id) !== -1) {
						throw {customMessage: `Cannot delete the "${componentName}" item with id ${item.id} - it is system-critical.`}
					}
					idsToDelete.push(item.id)
				}
				deleteOptions.where.id = idsToDelete
			}
			let existingItems = (yield instance.readList(readListOptions)).results,
				idsToDelete = []
			if (!existingItems.length) {
				return {deleted: 0}
			}
			for (const i in existingItems) {
				idsToDelete.push((existingItems[i]).dataValues.id)
			}
			deleteOptions.where.id = idsToDelete
			const deleted = yield instance.model.destroy(deleteOptions)
			for (const i in existingItems) {
				try {
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/${existingItems[i].id}`))
				} catch(e) {
					db.logger.error(e)
				}
			}
			return {deleted}
		})
	}
}

module.exports = BaseDBComponent
