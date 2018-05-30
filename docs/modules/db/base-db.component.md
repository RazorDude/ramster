<a name="module_baseDbComponentModule"></a>

## baseDbComponentModule
The base-db.component module. Contains the BaseDBComponent class.


* [baseDbComponentModule](#module_baseDbComponentModule)
    * [~BaseDBComponent](#module_baseDbComponentModule..BaseDBComponent)
        * [new BaseDBComponent()](#new_module_baseDbComponentModule..BaseDBComponent_new)
        * [.allowedFilterKeywordOperators](#module_baseDbComponentModule..BaseDBComponent+allowedFilterKeywordOperators) : <code>Array.&lt;string&gt;</code>
        * [.specMethodNames](#module_baseDbComponentModule..BaseDBComponent+specMethodNames) : <code>Array.&lt;string&gt;</code>
        * [.relReadKeys](#module_baseDbComponentModule..BaseDBComponent+relReadKeys) : <code>Array.&lt;string&gt;</code>
        * [.componentName](#module_baseDbComponentModule..BaseDBComponent+componentName) : <code>string</code>
        * [.model](#module_baseDbComponentModule..BaseDBComponent+model) : <code>Sequelize.Model</code>
        * [.db](#module_baseDbComponentModule..BaseDBComponent+db) : <code>DBModule</code>
    * [~baseDBComponentDefaultsObject](#module_baseDbComponentModule..baseDBComponentDefaultsObject) : <code>baseDBComponentDefaultsObject</code>
    * [~baseDBComponentAssociationDefaultsObject](#module_baseDbComponentModule..baseDBComponentAssociationDefaultsObject) : <code>Object.&lt;string, baseDBComponentAssociationDefaultsObject&gt;</code>
    * [~baseDBComponentAssociationsConfigItem](#module_baseDbComponentModule..baseDBComponentAssociationsConfigItem) : <code>Object.&lt;string, baseDBComponentAssociationsConfigItem&gt;</code>
    * [~baseDBComponentRelationsConfigItem](#module_baseDbComponentModule..baseDBComponentRelationsConfigItem) : <code>Object.&lt;string, baseDBComponentRelationsConfigItem&gt;</code>
    * [~baseDBComponentSearchFiltersObject](#module_baseDbComponentModule..baseDBComponentSearchFiltersObject) : <code>Array.&lt;baseDBComponentSearchFiltersObject&gt;</code>
    * [~baseDBComponentDependencyMap](#module_baseDbComponentModule..baseDBComponentDependencyMap) : <code>baseDBComponentDependencyMap</code>

<a name="module_baseDbComponentModule..BaseDBComponent"></a>

### baseDbComponentModule~BaseDBComponent
**Kind**: inner class of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  

* [~BaseDBComponent](#module_baseDbComponentModule..BaseDBComponent)
    * [new BaseDBComponent()](#new_module_baseDbComponentModule..BaseDBComponent_new)
    * [.allowedFilterKeywordOperators](#module_baseDbComponentModule..BaseDBComponent+allowedFilterKeywordOperators) : <code>Array.&lt;string&gt;</code>
    * [.specMethodNames](#module_baseDbComponentModule..BaseDBComponent+specMethodNames) : <code>Array.&lt;string&gt;</code>
    * [.relReadKeys](#module_baseDbComponentModule..BaseDBComponent+relReadKeys) : <code>Array.&lt;string&gt;</code>
    * [.componentName](#module_baseDbComponentModule..BaseDBComponent+componentName) : <code>string</code>
    * [.model](#module_baseDbComponentModule..BaseDBComponent+model) : <code>Sequelize.Model</code>
    * [.db](#module_baseDbComponentModule..BaseDBComponent+db) : <code>DBModule</code>

<a name="new_module_baseDbComponentModule..BaseDBComponent_new"></a>

#### new BaseDBComponent()
The BaseDBComponent class. Contains various methods that lay the groundwork for the business logic and the CRUD.

<a name="module_baseDbComponentModule..BaseDBComponent+allowedFilterKeywordOperators"></a>

#### baseDBComponent.allowedFilterKeywordOperators : <code>Array.&lt;string&gt;</code>
The list of keyword operators to check and parse when escaping objects for filters. Anything not included in this list will be skipped.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..BaseDBComponent+specMethodNames"></a>

#### baseDBComponent.specMethodNames : <code>Array.&lt;string&gt;</code>
The list of method names that are taken from the .spec.js file accompanying the component file. The methods in this list will be executed when running tests for the project.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..BaseDBComponent+relReadKeys"></a>

#### baseDBComponent.relReadKeys : <code>Array.&lt;string&gt;</code>
The list of association keys for this component. Used in various places, most notably read and readList calls, where the keys of this array help modularly fetch associated components' data.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..BaseDBComponent+componentName"></a>

#### baseDBComponent.componentName : <code>string</code>
The name of the component. Automatically set to the folder name in which the component file is located.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..BaseDBComponent+model"></a>

#### baseDBComponent.model : <code>Sequelize.Model</code>
The sequelize model for the component.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..BaseDBComponent+db"></a>

#### baseDBComponent.db : <code>DBModule</code>
The currently initialized instance of the DBModule.

**Kind**: instance property of [<code>BaseDBComponent</code>](#module_baseDbComponentModule..BaseDBComponent)  
<a name="module_baseDbComponentModule..baseDBComponentDefaultsObject"></a>

### baseDbComponentModule~baseDBComponentDefaultsObject : <code>baseDBComponentDefaultsObject</code>
The defaults config object.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| orderBy | <code>string</code> | The default column name to order database searches by. |
| orderDirection | <code>string</code> | The default direction to order database seraches in. |
| page | <code>number</code> | The default page of results to show in paginated calls. Must be a non-zero integer. |
| perPage | <code>number</code> | The default number of results to show per page in paginated calls. Must be a non-zero integer. |

<a name="module_baseDbComponentModule..baseDBComponentAssociationDefaultsObject"></a>

### baseDbComponentModule~baseDBComponentAssociationDefaultsObject : <code>Object.&lt;string, baseDBComponentAssociationDefaultsObject&gt;</code>
The default settings for bulding associations. They describe the required keys and the dependency category of which association type. The keys are the association types - belongsTo, hasOne, hasMany and belongsToMany.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| requiredKeys | <code>Array.&lt;string&gt;</code> | An array of keys that are required to be present in the associationsConfig object for this association. |
| dependencyCategory | <code>string</code> | Determines the dependency category - slaveOf, masterOf or equalWith. |

<a name="module_baseDbComponentModule..baseDBComponentAssociationsConfigItem"></a>

### baseDbComponentModule~baseDBComponentAssociationsConfigItem : <code>Object.&lt;string, baseDBComponentAssociationsConfigItem&gt;</code>
The configuration object for creating associations. The object keys are the association names and will be added to instance.relReadKeys.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | The type of the association - belongsTo, hasOne, hasMany or belongsToMany. |
| componentName | <code>string</code> | (optional) The name of the component to associate to, in case it doesn't match the association name. |
| foreignKey | <code>string</code> | The name of the field that will be used as a foreign key. |
| through | <code>string</code> | The name of the junction table, works only for belongsToMany associations. |
| otherKey | <code>string</code> | The name of the field that will be used to represent the key of this component in the association, works only for belongsToMany associations. |

<a name="module_baseDbComponentModule..baseDBComponentRelationsConfigItem"></a>

### baseDbComponentModule~baseDBComponentRelationsConfigItem : <code>Object.&lt;string, baseDBComponentRelationsConfigItem&gt;</code>
The configuration object for fine-tuning associations and adding different data requirements for the joined associations when fetching data from the database. The object keys are the relation names and will be added to instance.relReadKeys.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| associationName | <code>string</code> | The name of the association that this relation extends. |
| attributes | <code>Array.&lt;string&gt;</code> | (optional) The list of fields to fetch from the database. If not provided, all fields will be fetched. |
| required | <code>boolean</code> | (optional) If set to true, the SQL JOIN will be of type INNER. It is false by default. |
| where | <code>object</code> | (optional) If provided, the joined results will be filtered by these criteria. |
| include | <code>Array.&lt;baseDBComponentRelationsConfigItem&gt;</code> | (optional) An array contained nested relation configs. The items described here (and their sub-items, and so on) will be JOIN-ed and fetched from the database too. |

<a name="module_baseDbComponentModule..baseDBComponentSearchFiltersObject"></a>

### baseDbComponentModule~baseDBComponentSearchFiltersObject : <code>Array.&lt;baseDBComponentSearchFiltersObject&gt;</code>
The configuration array for the fields to search by, used in the read & readList methods.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | The name of the field to search by. Use $relationName.fieldName$ to search by related component fields. |
| like | <code>string</code> | (optional) The match patter for SQL LIKE. Can be '%-', '-%' or '%%. |
| betweenFrom | <code>boolean</code> | (optional) If set to true, this field will be treated as a range start filter and the "From" suffix will be removed from the field name (if present). It is false by default. |
| betweenTo | <code>boolean</code> | (optional) If set to true, this field will be treated as a range end filter and the "To" suffix will be removed from the field name (if present). It is false by default. |
| exactMatch | <code>boolean</code> | (optional) If set to true and is a range filter, it will be inclusive. I.e. >= instead of >. |

<a name="module_baseDbComponentModule..baseDBComponentDependencyMap"></a>

### baseDbComponentModule~baseDBComponentDependencyMap : <code>baseDBComponentDependencyMap</code>
A map of all associations the component has.

**Kind**: inner typedef of [<code>baseDbComponentModule</code>](#module_baseDbComponentModule)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| slaveOf | <code>Array.&lt;string&gt;</code> | The names of the components that the component is in a belongsTo association. |
| masterOf | <code>Array.&lt;string&gt;</code> | The names of the components that the component is in a hasOne or hasMany association. |
| equalWith | <code>Array.&lt;string&gt;</code> | The names of the components that the component is in a belongsToMany association. |
| associationKeys | <code>Array.&lt;string&gt;</code> | The full list of association keys (aliases) for this component. |

