<a name="module_dbModule"></a>

## dbModule
The db module. Contains the DBModule class.


* [dbModule](#module_dbModule)
    * [~DBModule](#module_dbModule..DBModule)
        * [new DBModule()](#new_module_dbModule..DBModule_new)
        * [.config](#module_dbModule..DBModule+config) : <code>object</code>
        * [.moduleConfig](#module_dbModule..DBModule+moduleConfig) : <code>object</code>
        * [.seedingOrder](#module_dbModule..DBModule+seedingOrder) : <code>Array.&lt;string&gt;</code>
        * [.logger](#module_dbModule..DBModule+logger) : <code>Logger</code>
        * [.generalStore](#module_dbModule..DBModule+generalStore) : <code>GeneralStore</code>
        * [.tokenManager](#module_dbModule..DBModule+tokenManager) : <code>TokenManager</code>
        * [.components](#module_dbModule..DBModule+components) : <code>Object.&lt;string, BaseDBComponent&gt;</code>
        * [.fieldCaseMap](#module_dbModule..DBModule+fieldCaseMap) : <code>object</code>
        * [.Sequelize](#module_dbModule..DBModule+Sequelize) : <code>Sequelize</code>
        * [.sequelize](#module_dbModule..DBModule+sequelize) : <code>Sequelize</code>

<a name="module_dbModule..DBModule"></a>

### dbModule~DBModule
**Kind**: inner class of [<code>dbModule</code>](#module_dbModule)  

* [~DBModule](#module_dbModule..DBModule)
    * [new DBModule()](#new_module_dbModule..DBModule_new)
    * [.config](#module_dbModule..DBModule+config) : <code>object</code>
    * [.moduleConfig](#module_dbModule..DBModule+moduleConfig) : <code>object</code>
    * [.seedingOrder](#module_dbModule..DBModule+seedingOrder) : <code>Array.&lt;string&gt;</code>
    * [.logger](#module_dbModule..DBModule+logger) : <code>Logger</code>
    * [.generalStore](#module_dbModule..DBModule+generalStore) : <code>GeneralStore</code>
    * [.tokenManager](#module_dbModule..DBModule+tokenManager) : <code>TokenManager</code>
    * [.components](#module_dbModule..DBModule+components) : <code>Object.&lt;string, BaseDBComponent&gt;</code>
    * [.fieldCaseMap](#module_dbModule..DBModule+fieldCaseMap) : <code>object</code>
    * [.Sequelize](#module_dbModule..DBModule+Sequelize) : <code>Sequelize</code>
    * [.sequelize](#module_dbModule..DBModule+sequelize) : <code>Sequelize</code>

<a name="new_module_dbModule..DBModule_new"></a>

#### new DBModule()
The DBModule class. This class connects to the database, loads all db components, creates associations and synchronizes the db tables. After it's fully loaded, it contains all dbComponents under its components key.

<a name="module_dbModule..DBModule+config"></a>

#### dbModule.config : <code>object</code>
The project config object.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+moduleConfig"></a>

#### dbModule.moduleConfig : <code>object</code>
The db config. It's a shortcut to the "db" sub-object of the project config object.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+seedingOrder"></a>

#### dbModule.seedingOrder : <code>Array.&lt;string&gt;</code>
The order of tables in which rows are to be inserted when doing a full database sync.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+logger"></a>

#### dbModule.logger : <code>Logger</code>
An instance of the Logger class.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+generalStore"></a>

#### dbModule.generalStore : <code>GeneralStore</code>
An instance of the GeneralStore class.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+tokenManager"></a>

#### dbModule.tokenManager : <code>TokenManager</code>
An instance of the TokenManager class.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+components"></a>

#### dbModule.components : <code>Object.&lt;string, BaseDBComponent&gt;</code>
An object, containing all dbComponents.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+fieldCaseMap"></a>

#### dbModule.fieldCaseMap : <code>object</code>
An object containing settings for how to parse upper to lower camel case and vice versa.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+Sequelize"></a>

#### dbModule.Sequelize : <code>Sequelize</code>
A Sequelize object.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
<a name="module_dbModule..DBModule+sequelize"></a>

#### dbModule.sequelize : <code>Sequelize</code>
A Sequelize instance.

**Kind**: instance property of [<code>DBModule</code>](#module_dbModule..DBModule)  
