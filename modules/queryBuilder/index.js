'use strict'

class QueryBuilder {
	constructor({queryInterface, mainModel, mainModelAlias, mainModelScope}) {
		this.queryInterface = queryInterface
		this.mainModel = mainModel
		this.mainModelTable = this.mainModel.getTableName()
		this.mainModelAlias = mainModelAlias
		this.selectQuery = 'SELECT '
		this.fromQuery = ` FROM "${this.mainModelTable}" AS "${this.mainModelAlias}"`
		this.countQuery = `SELECT count("${this.mainModelAlias}"."id")`
		this.joinQuery = ''
		this.whereQuery = ` WHERE "${this.mainModelAlias}"."deletedAt" IS NULL`
		this.orderByQuery = ''
		this.paginationQuery = ''
		this.multipleResultAssociations = []
		this.noTargetModelAssociations = []
		this.mainModelScope = mainModelScope

		this.addToSelectQuery({rawAttributes: this.mainModel.rawAttributes, modelAlias: this.mainModelAlias, scope: this.mainModelScope})
	}

	addToSelectQuery({rawAttributes, modelAlias, scope}) {
		if (!scope) {
			scope = {}
		}
		if (!scope.attributes) {
			scope.attributes = []
		}
		for (let key in rawAttributes) {
			let attributeData = rawAttributes[key]
			if ((attributeData.type && attributeData.type.hasOwnProperty('returnType')) || (scope.attributes.length && (scope.attributes.indexOf(key) === -1))) {
				continue
			}
			this.selectQuery += `"${modelAlias}"."${key}" AS "${modelAlias}.${key}", `
		}
	}

	getListStringFromArray({array}) {
		if (!(array instanceof Array) || (array.length === 0)) {
			return ''
		}
		let listString = '(',
			instance = this
		array.forEach((element, index) => {
			listString += `${instance.queryInterface.escape(element)},`
		})
		return listString.substr(0, listString.length - 1) + ')'
	}

	getConditionClause({table, field, value}) {
		let clause = ` AND "${table}"."${field}" `
		if (typeof value === 'object') {
			if (value.$like) {
				clause += ` LIKE '${this.queryInterface.escape(value.$like)}'`
				return clause
			}
			if (value.$gt) {
				clause += ` > '${this.queryInterface.escape(value.$gt)}'`
				return clause
			}
			if (value.$gte) {
				clause += ` >= '${this.queryInterface.escape(value.$gte)}'`
				return clause
			}
			if (value.$lt) {
				clause += ` < '${this.queryInterface.escape(value.$lt)}'`
				return clause
			}
			if (value.$lte) {
				clause += ` <= '${this.queryInterface.escape(value.$lte)}'`
				return clause
			}
			if (value.$not) {
				if (value.$not instanceof Array) {
					return clause += ` NOT IN ${this.getListStringFromArray({array: value.$not})}`
				}
				return clause += ` != '${this.queryInterface.escape(value.$not)}'`
			}
			if (value instanceof Array) {
				return clause += ` IN ${this.getListStringFromArray({array: value.$not})}`
			}
			return ''
		}
		return clause += ` = '${this.queryInterface.escape(value)}'`
	}

	buildJoinQuery({relationsData, filters, targetTableAliasPrefix}) {
		if (relationsData.where && Object.keys(relationsData.where).length) {
			if (!filters) {
				filters = {}
			}
			for (let key in relationsData.where) {
				filters[key] = relationsData.where[key]
			}
		}

		let nestedIncludeFields = null,
			targetTableAlias = `${targetTableAliasPrefix}${relationsData.targetTableAlias || relationsData.targetTable}`

		if (relationsData.targetModel) {
			this.addToSelectQuery({rawAttributes: relationsData.targetModel.rawAttributes, modelAlias: targetTableAlias})
		}

		this.joinQuery += ` ${filters ? 'INNER' : 'LEFT'} JOIN "${relationsData.targetTable}" AS "${targetTableAlias}" ON ${relationsData.targetModel ? '"' + targetTableAlias + '"."deletedAt" IS NULL AND ' : ''}"${targetTableAlias}"."${relationsData.targetTableKey}" = "${relationsData.modelTable}"."${relationsData.modelKey}"`

		if (filters && filters.nestedIncludeFields && (Object.keys(filters.nestedIncludeFields).length > 0)) {
			nestedIncludeFields = filters.nestedIncludeFields
			delete filters.nestedIncludeFields
		}

		for (let key in filters) {
			if (filters[key].equalsFieldFromAnotherAssociation) {
				this.joinQuery += ` AND "${targetTableAlias}"."${key}" = "${filters[key].equalsFieldFromAnotherAssociation.tableAlias}"."${filters[key].equalsFieldFromAnotherAssociation.field}"`
				continue
			}
			this.joinQuery += this.getConditionClause({table: targetTableAlias, field: key, value: filters[key]})
		}

		if (relationsData.multiple) {
			this.multipleResultAssociations.push(targetTableAlias.replace(targetTableAliasPrefix, ''))
		}
		if (!relationsData.model) {
			this.noTargetModelAssociations.push(targetTableAlias.replace(targetTableAliasPrefix, ''))
		}

		if (relationsData.inner instanceof Array) {
			relationsData.inner.forEach((element, index) => {
				if (element.where && (!nestedIncludeFields || !nestedIncludeFields[index])) {
					if (!nestedIncludeFields) {
						nestedIncludeFields = {}
					}
					nestedIncludeFields[index] = element.where
				}
			})
		}
		for (let innerIndex in nestedIncludeFields) {
			this.buildJoinQuery({relationsData: relationsData.inner[innerIndex], filters: nestedIncludeFields[innerIndex], targetTableAliasPrefix: `${targetTableAlias}.`})
		}
	}

	buildWhereQuery({filters}) {
		if (filters.relFilters) {
			delete filters.relFilters
		}
		for (let key in filters) {
			this.whereQuery += this.getConditionClause({table: this.mainModelAlias, field: key, value: filters[key]})
		}
	}

	buildOrderByQuery({orderBy, orderDirection}) {
		this.orderByQuery = ` ORDER BY "${this.mainModelAlias}"."${this.queryInterface.escape(orderBy).replace(/'/g, '')}" ${this.queryInterface.escape(orderDirection).replace(/'/g, '')}`
	}

	buildPaginationQuery({page, perPage}) {
		this.page = page
		this.perPage = perPage
		this.paginationQuery = ` LIMIT ${this.queryInterface.escape(this.perPage + 1)} OFFSET ${this.queryInterface.escape((this.page - 1) * this.perPage)}`
	}

	getFullQuery() {
		this.selectQuery = this.selectQuery.substr(0, this.selectQuery.length - 2) + ' '
		return this.selectQuery + this.fromQuery + this.joinQuery + this.whereQuery + this.orderByQuery + this.paginationQuery
	}

	getCountQuery() {
		return this.countQuery + this.fromQuery + this.joinQuery + this.whereQuery
	}

	getFormattedResults({resultData}) {
		let results = []

		if (resultData && (resultData[0] instanceof Array)) {
			resultData[0].forEach((resultObject, index) => {
				let newResultObject = {}
				for (let key in resultObject) {
					let actualKey = key.replace(`${this.mainModelAlias}.`, ''),
						keyData = actualKey.split('.')
					if (keyData.length) {
						let innerObject = newResultObject
						keyData.forEach((keyElement, keyIndex) => {
							if (keyIndex === (keyData.length - 1)) {
								innerObject[keyElement] = resultObject[key]
								return
							}

							if (typeof innerObject[keyElement] === 'undefined') {
								if (this.multipleResultAssociations.indexOf(keyElement) !== -1) {
									innerObject[keyElement] = [{}]
									innerObject = innerObject[keyElement][0]
									return
								}
								if (innerObject instanceof Array) {
									innerObject.push({})
									innerObject = innerObject[innerObject.length - 1]
									return
								}
								if (this.noTargetModelAssociations.indexOf(keyElement) !== -1) {
									return
								}
								innerObject[keyElement] = {}
								innerObject = innerObject[keyElement]
								return
							}

							if (innerObject[keyElement] instanceof Array) {
								innerObject[keyElement].push({})
								innerObject = innerObject[keyElement][innerObject[keyElement].length - 1]
								return
							}

							innerObject = innerObject[keyElement]	//innerObject here must be an object itself, since its' not an array
						})
						continue
					}
					newResultObject[actualKey] = resultObject[key]
				}
				results.push(newResultObject)
			})
		}

		return results
	}
}

module.exports = QueryBuilder
