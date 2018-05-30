<a name="module_baseServerModuleModule"></a>

## baseServerModuleModule
The base-server.module module. Contains the BaseServerModule class.


* [baseServerModuleModule](#module_baseServerModuleModule)
    * [~BaseServerModule](#module_baseServerModuleModule..BaseServerModule)
        * [new BaseServerModule()](#new_module_baseServerModuleModule..BaseServerModule_new)
        * [.config](#module_baseServerModuleModule..BaseServerModule+config) : <code>object</code>
        * [.moduleName](#module_baseServerModuleModule..BaseServerModule+moduleName) : <code>string</code>
        * [.moduleType](#module_baseServerModuleModule..BaseServerModule+moduleType) : <code>string</code>
        * [.moduleConfig](#module_baseServerModuleModule..BaseServerModule+moduleConfig) : <code>object</code>
        * [.components](#module_baseServerModuleModule..BaseServerModule+components) : <code>Object.&lt;string, BaseServerComponent&gt;</code>
        * [.passport](#module_baseServerModuleModule..BaseServerModule+passport) : <code>passport</code>
        * [.db](#module_baseServerModuleModule..BaseServerModule+db) : <code>DBModule</code>
        * [.logger](#module_baseServerModuleModule..BaseServerModule+logger) : <code>Logger</code>
        * [.generalStore](#module_baseServerModuleModule..BaseServerModule+generalStore) : <code>GeneralStore</code>
        * [.tokenManager](#module_baseServerModuleModule..BaseServerModule+tokenManager) : <code>TokenManager</code>
        * [.fieldCaseMap](#module_baseServerModuleModule..BaseServerModule+fieldCaseMap) : <code>Array.&lt;object&gt;</code>
        * [.precursorMethods](#module_baseServerModuleModule..BaseServerModule+precursorMethods) : <code>Array.&lt;object&gt;</code>

<a name="module_baseServerModuleModule..BaseServerModule"></a>

### baseServerModuleModule~BaseServerModule
**Kind**: inner class of [<code>baseServerModuleModule</code>](#module_baseServerModuleModule)  

* [~BaseServerModule](#module_baseServerModuleModule..BaseServerModule)
    * [new BaseServerModule()](#new_module_baseServerModuleModule..BaseServerModule_new)
    * [.config](#module_baseServerModuleModule..BaseServerModule+config) : <code>object</code>
    * [.moduleName](#module_baseServerModuleModule..BaseServerModule+moduleName) : <code>string</code>
    * [.moduleType](#module_baseServerModuleModule..BaseServerModule+moduleType) : <code>string</code>
    * [.moduleConfig](#module_baseServerModuleModule..BaseServerModule+moduleConfig) : <code>object</code>
    * [.components](#module_baseServerModuleModule..BaseServerModule+components) : <code>Object.&lt;string, BaseServerComponent&gt;</code>
    * [.passport](#module_baseServerModuleModule..BaseServerModule+passport) : <code>passport</code>
    * [.db](#module_baseServerModuleModule..BaseServerModule+db) : <code>DBModule</code>
    * [.logger](#module_baseServerModuleModule..BaseServerModule+logger) : <code>Logger</code>
    * [.generalStore](#module_baseServerModuleModule..BaseServerModule+generalStore) : <code>GeneralStore</code>
    * [.tokenManager](#module_baseServerModuleModule..BaseServerModule+tokenManager) : <code>TokenManager</code>
    * [.fieldCaseMap](#module_baseServerModuleModule..BaseServerModule+fieldCaseMap) : <code>Array.&lt;object&gt;</code>
    * [.precursorMethods](#module_baseServerModuleModule..BaseServerModule+precursorMethods) : <code>Array.&lt;object&gt;</code>

<a name="new_module_baseServerModuleModule..BaseServerModule_new"></a>

#### new BaseServerModule()
The base class for server (client and api) modules. It loads the module components and set some pre- and post-route method defaults.

<a name="module_baseServerModuleModule..BaseServerModule+config"></a>

#### baseServerModule.config : <code>object</code>
The project config object.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+moduleName"></a>

#### baseServerModule.moduleName : <code>string</code>
The name of the module.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+moduleType"></a>

#### baseServerModule.moduleType : <code>string</code>
The type of the module.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+moduleConfig"></a>

#### baseServerModule.moduleConfig : <code>object</code>
The module config object. This is a sub-object of the project config object, specifically config[`${moduleType}`s][moduleName].

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+components"></a>

#### baseServerModule.components : <code>Object.&lt;string, BaseServerComponent&gt;</code>
The list of instances of all baseServerComponents for this module.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+passport"></a>

#### baseServerModule.passport : <code>passport</code>
A passportJS instance.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+db"></a>

#### baseServerModule.db : <code>DBModule</code>
An instance of the DBModule class.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+logger"></a>

#### baseServerModule.logger : <code>Logger</code>
An instance of the Logger class.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+generalStore"></a>

#### baseServerModule.generalStore : <code>GeneralStore</code>
An instance of the GeneralStore class.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+tokenManager"></a>

#### baseServerModule.tokenManager : <code>TokenManager</code>
An instance of the TokenManager class.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+fieldCaseMap"></a>

#### baseServerModule.fieldCaseMap : <code>Array.&lt;object&gt;</code>
A key-value map of how to parse fields between upper and lower camelCase.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
<a name="module_baseServerModuleModule..BaseServerModule+precursorMethods"></a>

#### baseServerModule.precursorMethods : <code>Array.&lt;object&gt;</code>
A list of expressJS-style methods to execute prior to all other methods.

**Kind**: instance property of [<code>BaseServerModule</code>](#module_baseServerModuleModule..BaseServerModule)  
