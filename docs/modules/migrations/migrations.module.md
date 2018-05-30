<a name="migrations.module_module"></a>

## module
The migrations module. Contains the Migrations class.


* [module](#migrations.module_module)
    * [~Migrations](#migrations.module_module..Migrations)
        * [new Migrations()](#new_migrations.module_module..Migrations_new)
        * [.config](#migrations.module_module..Migrations+config) : <code>object</code>
        * [.schema](#migrations.module_module..Migrations+schema) : <code>string</code>
        * [.moduleConfig](#migrations.module_module..Migrations+moduleConfig) : <code>object</code>
        * [.sequelize](#migrations.module_module..Migrations+sequelize) : <code>object</code>
        * [.dbComponents](#migrations.module_module..Migrations+dbComponents) : <code>Object.&lt;string, object&gt;</code>
        * [.seedingOrder](#migrations.module_module..Migrations+seedingOrder) : <code>Array.&lt;string&gt;</code>

<a name="migrations.module_module..Migrations"></a>

### module~Migrations
**Kind**: inner class of [<code>module</code>](#migrations.module_module)  

* [~Migrations](#migrations.module_module..Migrations)
    * [new Migrations()](#new_migrations.module_module..Migrations_new)
    * [.config](#migrations.module_module..Migrations+config) : <code>object</code>
    * [.schema](#migrations.module_module..Migrations+schema) : <code>string</code>
    * [.moduleConfig](#migrations.module_module..Migrations+moduleConfig) : <code>object</code>
    * [.sequelize](#migrations.module_module..Migrations+sequelize) : <code>object</code>
    * [.dbComponents](#migrations.module_module..Migrations+dbComponents) : <code>Object.&lt;string, object&gt;</code>
    * [.seedingOrder](#migrations.module_module..Migrations+seedingOrder) : <code>Array.&lt;string&gt;</code>

<a name="new_migrations.module_module..Migrations_new"></a>

#### new Migrations()
The Migrations class. It takes care of synchronizing the actual database tables with the current state of the code models, generating backups and inserting various sets of data. It also starts an api server, if configured, which can be used as an interface for running sync, generateSeed, generateBackup, seed and insertStaticData.

<a name="migrations.module_module..Migrations+config"></a>

#### migrations.config : <code>object</code>
The project config object.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
<a name="migrations.module_module..Migrations+schema"></a>

#### migrations.schema : <code>string</code>
The project config object's db.schema property.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
<a name="migrations.module_module..Migrations+moduleConfig"></a>

#### migrations.moduleConfig : <code>object</code>
The project config object's migrations property.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
<a name="migrations.module_module..Migrations+sequelize"></a>

#### migrations.sequelize : <code>object</code>
A sequelize instance.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
<a name="migrations.module_module..Migrations+dbComponents"></a>

#### migrations.dbComponents : <code>Object.&lt;string, object&gt;</code>
An object, containing the db components by name, taken from the db module's components property.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
<a name="migrations.module_module..Migrations+seedingOrder"></a>

#### migrations.seedingOrder : <code>Array.&lt;string&gt;</code>
An array of dbComponent names, in order of which tables will be inserted in the database.

**Kind**: instance property of [<code>Migrations</code>](#migrations.module_module..Migrations)  
