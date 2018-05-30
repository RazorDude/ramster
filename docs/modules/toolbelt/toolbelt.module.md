<a name="module_toolbeltModule"></a>

## toolbeltModule
The toolbelt module. Contains various utility functions.


* [toolbeltModule](#module_toolbeltModule)
    * [~changeKeyCase(keyMap, input, outputType)](#module_toolbeltModule..changeKeyCase) ⇒ <code>string</code>
    * [~checkRoutes(route, routes)](#module_toolbeltModule..checkRoutes) ⇒ <code>boolean</code>
    * [~describeSuiteConditionally(condition, suiteText, suiteMethod)](#module_toolbeltModule..describeSuiteConditionally) ⇒ <code>number</code>
    * [~emptyToNull(data)](#module_toolbeltModule..emptyToNull) ⇒ <code>any</code>
    * [~getFolderSize(folderPath, unit)](#module_toolbeltModule..getFolderSize) ⇒ <code>number</code>
    * [~getNested(parent, field)](#module_toolbeltModule..getNested) ⇒ <code>any</code>
    * [~generateRandomNumber(length)](#module_toolbeltModule..generateRandomNumber) ⇒ <code>number</code>
    * [~generateRandomString(length, stringType)](#module_toolbeltModule..generateRandomString) ⇒ <code>number</code>
    * [~parseDate(date)](#module_toolbeltModule..parseDate) ⇒ <code>object</code>
    * [~runTestConditionally(condition, testText, testMethod)](#module_toolbeltModule..runTestConditionally) ⇒ <code>number</code>
    * [~setNested(parent, field, value)](#module_toolbeltModule..setNested) ⇒ <code>number</code>
    * [~toolbeltArraySortSortingOptionsObject](#module_toolbeltModule..toolbeltArraySortSortingOptionsObject) ⇒ <code>Array.&lt;any&gt;</code>
    * [~toolbeltVertexObject](#module_toolbeltModule..toolbeltVertexObject) ⇒ <code>null</code> \| <code>boolean</code> \| <code>toolbeltVertexObject</code>

<a name="module_toolbeltModule..changeKeyCase"></a>

### toolbeltModule~changeKeyCase(keyMap, input, outputType) ⇒ <code>string</code>
Changes the case of all keys in an object between loweCamelCase and UpperCamelCase.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>string</code> - The stringified object with changed keys.  

| Param | Type | Description |
| --- | --- | --- |
| keyMap | <code>object</code> | The map of which key maps to which in different camel cases. |
| input | <code>object</code> | The object to change the keys of. |
| outputType | <code>stirng</code> | The type of conversion - "lower" or "upper". |

<a name="module_toolbeltModule..checkRoutes"></a>

### toolbeltModule~checkRoutes(route, routes) ⇒ <code>boolean</code>
Checks whether a route exists in a list of routes.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>boolean</code> - True/false, based on the check result.  

| Param | Type | Description |
| --- | --- | --- |
| route | <code>string</code> | The route to check. |
| routes | <code>Array.&lt;string&gt;</code> | The list of routes to check in. |

<a name="module_toolbeltModule..describeSuiteConditionally"></a>

### toolbeltModule~describeSuiteConditionally(condition, suiteText, suiteMethod) ⇒ <code>number</code>
Run chai describe or describe.skip, based on a provided condition.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - 1 or -1, based on whether the suite was ran.  

| Param | Type | Description |
| --- | --- | --- |
| condition | <code>boolean</code> | The condition that determines whether the suite will be executed or not. |
| suiteText | <code>string</code> | The description of the suite. |
| suiteMethod | <code>function</code> | The method containing the tests to be ran for the suite. |

<a name="module_toolbeltModule..emptyToNull"></a>

### toolbeltModule~emptyToNull(data) ⇒ <code>any</code>
Takes an object or value and transforms undefined, null and empty strings to null. Recursively does so for objects without mutating the provided data.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>any</code> - The object or value, with any instances of undefined, null and '' set to null.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>any</code> | The object or value to transform. |

<a name="module_toolbeltModule..getFolderSize"></a>

### toolbeltModule~getFolderSize(folderPath, unit) ⇒ <code>number</code>
Get the size of a folder in bytes, kB, etc.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - The folder size.  

| Param | Type | Description |
| --- | --- | --- |
| folderPath | <code>string</code> | The path to the folder. |
| unit | <code>number</code> | (optional) The times the size in bytes should be divided by 1000. |

<a name="module_toolbeltModule..getNested"></a>

### toolbeltModule~getNested(parent, field) ⇒ <code>any</code>
Get a nested object property's value by its keys path in the object.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>any</code> - The value or null if not found.  

| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | The object to search in. |
| field | <code>string</code> | The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'. |

<a name="module_toolbeltModule..generateRandomNumber"></a>

### toolbeltModule~generateRandomNumber(length) ⇒ <code>number</code>
Generate a random decimal number with the specified digit count (length).

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - The generated number.  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>number</code> | The digit count of the generated number. |

<a name="module_toolbeltModule..generateRandomString"></a>

### toolbeltModule~generateRandomString(length, stringType) ⇒ <code>number</code>
Generate a random string with the specified length.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - The generated string.  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>number</code> | The length of the generated string. |
| stringType | <code>string</code> | (optional) The argument to provide to buffer.toString() - nothing, 'base64', etc. |

<a name="module_toolbeltModule..parseDate"></a>

### toolbeltModule~parseDate(date) ⇒ <code>object</code>
Parse a string/Date date and create a moment object. Supports YYYY-MM-DD and DD/MM/YYYY strings.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>object</code> - A momentjs object.  

| Param | Type | Description |
| --- | --- | --- |
| date | <code>string</code> \| <code>object</code> | The date to parse. |

<a name="module_toolbeltModule..runTestConditionally"></a>

### toolbeltModule~runTestConditionally(condition, testText, testMethod) ⇒ <code>number</code>
Similarly to describeSuiteConditionally, runs a mocha 'it' or it.skip if a condition is met.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - 1 or -1, based on whether the test was ran.  

| Param | Type | Description |
| --- | --- | --- |
| condition | <code>boolean</code> | The condition that determines whether the test will be executed or not. |
| testText | <code>string</code> | The description of the text. |
| testMethod | <code>function</code> | The method containing the code to be execute for the test. |

<a name="module_toolbeltModule..setNested"></a>

### toolbeltModule~setNested(parent, field, value) ⇒ <code>number</code>
Set a value in an object under a certain key, based on its key path in the object.

**Kind**: inner method of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>number</code> - 1 or -1, based on whether the test was ran.  

| Param | Type | Description |
| --- | --- | --- |
| parent | <code>object</code> | The object to search in. |
| field | <code>string</code> | The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'. |
| value | <code>any</code> | The value to set. |

<a name="module_toolbeltModule..toolbeltArraySortSortingOptionsObject"></a>

### toolbeltModule~toolbeltArraySortSortingOptionsObject ⇒ <code>Array.&lt;any&gt;</code>
Sorts an array by a list of inner properties.

**Kind**: inner typedef of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>Array.&lt;any&gt;</code> - The sorted array.  

| Param | Type | Description |
| --- | --- | --- |
| array | <code>Array.&lt;any&gt;</code> | The array to sort. |
| orderBy | <code>Array.&lt;toolbeltArraySortSortingOptionsObject&gt;</code> | The sorting options. |
| caseSensitiveOption | <code>boolean</code> | (optional) Whether string sorting should be case sensitive or not. |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| 0 | <code>string</code> | The field name to sort by. |
| 1 | <code>string</code> | The ordering direction - 'asc' or 'desc'. Case insensitive. |
| 2 | <code>string</code> | (optional) The "sortingType". Can be 'haveValuesOnly'. |

<a name="module_toolbeltModule..toolbeltVertexObject"></a>

### toolbeltModule~toolbeltVertexObject ⇒ <code>null</code> \| <code>boolean</code> \| <code>toolbeltVertexObject</code>
Finds or deletes a vertex in a graph by its id. Returns null if not found.

**Kind**: inner typedef of [<code>toolbeltModule</code>](#module_toolbeltModule)  
**Returns**: <code>null</code> \| <code>boolean</code> \| <code>toolbeltVertexObject</code> - The found vertex if its found and the action is 'get', null if not found. True if no action is provided or the action is 'delete' and the vertex is found. Null if the vertex is not found.  

| Param | Type | Description |
| --- | --- | --- |
| vertexId | <code>any</code> | The id of the vertext to search for. |
| graph | <code>toolbeltVertexObject</code> | The graph to search in. |
| action | <code>string</code> | The action to perform - can be 'get' and 'delete'. |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| vertices | <code>toolbeltVertexObject</code> | The vertex's list of connected vertices. |

