<a name="module_codeGeneratorModule"></a>

## codeGeneratorModule
The codeGenerator module. Contains the CodeGenerator class.


* [codeGeneratorModule](#module_codeGeneratorModule)
    * [~CodeGenerator](#module_codeGeneratorModule..CodeGenerator)
        * [new CodeGenerator()](#new_module_codeGeneratorModule..CodeGenerator_new)
        * [.config](#module_codeGeneratorModule..CodeGenerator+config) : <code>object</code>
        * [.configRequiredForMethods](#module_codeGeneratorModule..CodeGenerator+configRequiredForMethods) : <code>Array.&lt;string&gt;</code>
        * [.pgToTSMap](#module_codeGeneratorModule..CodeGenerator+pgToTSMap) : <code>Object.&lt;string, string&gt;</code>

<a name="module_codeGeneratorModule..CodeGenerator"></a>

### codeGeneratorModule~CodeGenerator
**Kind**: inner class of [<code>codeGeneratorModule</code>](#module_codeGeneratorModule)  

* [~CodeGenerator](#module_codeGeneratorModule..CodeGenerator)
    * [new CodeGenerator()](#new_module_codeGeneratorModule..CodeGenerator_new)
    * [.config](#module_codeGeneratorModule..CodeGenerator+config) : <code>object</code>
    * [.configRequiredForMethods](#module_codeGeneratorModule..CodeGenerator+configRequiredForMethods) : <code>Array.&lt;string&gt;</code>
    * [.pgToTSMap](#module_codeGeneratorModule..CodeGenerator+pgToTSMap) : <code>Object.&lt;string, string&gt;</code>

<a name="new_module_codeGeneratorModule..CodeGenerator_new"></a>

#### new CodeGenerator()
The CodeGenerator class. Contains various methods for building and generating a wide variety of code files for a new or an existing project.

<a name="module_codeGeneratorModule..CodeGenerator+config"></a>

#### codeGenerator.config : <code>object</code>
The full project config.

**Kind**: instance property of [<code>CodeGenerator</code>](#module_codeGeneratorModule..CodeGenerator)  
**See**: module:configModule  
<a name="module_codeGeneratorModule..CodeGenerator+configRequiredForMethods"></a>

#### codeGenerator.configRequiredForMethods : <code>Array.&lt;string&gt;</code>
An array containing class method names for which a project config is required to execute sucessfuly.

**Kind**: instance property of [<code>CodeGenerator</code>](#module_codeGeneratorModule..CodeGenerator)  
<a name="module_codeGeneratorModule..CodeGenerator+pgToTSMap"></a>

#### codeGenerator.pgToTSMap : <code>Object.&lt;string, string&gt;</code>
A map of PostgreSQL data types to typescript data types.

**Kind**: instance property of [<code>CodeGenerator</code>](#module_codeGeneratorModule..CodeGenerator)  
