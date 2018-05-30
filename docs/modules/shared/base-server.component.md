<a name="module_baseServerComponentModule"></a>

## baseServerComponentModule
The base-server.component module. Contains the BaseServerComponent class.


* [baseServerComponentModule](#module_baseServerComponentModule)
    * [~BaseServerComponent](#module_baseServerComponentModule..BaseServerComponent)
        * [new BaseServerComponent()](#new_module_baseServerComponentModule..BaseServerComponent_new)
        * [.allowedMethods](#module_baseServerComponentModule..BaseServerComponent+allowedMethods) : <code>Array.&lt;string&gt;</code>
        * [.componentName](#module_baseServerComponentModule..BaseServerComponent+componentName) : <code>string</code>
        * [.dbComponent](#module_baseServerComponentModule..BaseServerComponent+dbComponent) : <code>BaseDBComponent</code>
        * [.module](#module_baseServerComponentModule..BaseServerComponent+module) : <code>BaseServerModule</code>

<a name="module_baseServerComponentModule..BaseServerComponent"></a>

### baseServerComponentModule~BaseServerComponent
**Kind**: inner class of [<code>baseServerComponentModule</code>](#module_baseServerComponentModule)  

* [~BaseServerComponent](#module_baseServerComponentModule..BaseServerComponent)
    * [new BaseServerComponent()](#new_module_baseServerComponentModule..BaseServerComponent_new)
    * [.allowedMethods](#module_baseServerComponentModule..BaseServerComponent+allowedMethods) : <code>Array.&lt;string&gt;</code>
    * [.componentName](#module_baseServerComponentModule..BaseServerComponent+componentName) : <code>string</code>
    * [.dbComponent](#module_baseServerComponentModule..BaseServerComponent+dbComponent) : <code>BaseDBComponent</code>
    * [.module](#module_baseServerComponentModule..BaseServerComponent+module) : <code>BaseServerModule</code>

<a name="new_module_baseServerComponentModule..BaseServerComponent_new"></a>

#### new BaseServerComponent()
The base class for server (client and api) components. It contains common methods that are server-type agnostic.

<a name="module_baseServerComponentModule..BaseServerComponent+allowedMethods"></a>

#### baseServerComponent.allowedMethods : <code>Array.&lt;string&gt;</code>
The list of allowed HTTP methods for routes.

**Kind**: instance property of [<code>BaseServerComponent</code>](#module_baseServerComponentModule..BaseServerComponent)  
<a name="module_baseServerComponentModule..BaseServerComponent+componentName"></a>

#### baseServerComponent.componentName : <code>string</code>
The name of the component.

**Kind**: instance property of [<code>BaseServerComponent</code>](#module_baseServerComponentModule..BaseServerComponent)  
<a name="module_baseServerComponentModule..BaseServerComponent+dbComponent"></a>

#### baseServerComponent.dbComponent : <code>BaseDBComponent</code>
A reference to the dbComponent related to this server component (if any).

**Kind**: instance property of [<code>BaseServerComponent</code>](#module_baseServerComponentModule..BaseServerComponent)  
<a name="module_baseServerComponentModule..BaseServerComponent+module"></a>

#### baseServerComponent.module : <code>BaseServerModule</code>
The currently initialized instance of the BaseServerModule.

**Kind**: instance property of [<code>BaseServerComponent</code>](#module_baseServerComponentModule..BaseServerComponent)  
