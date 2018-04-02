# 1.0.0
- Added a shields.io node version badge.
- Added a shields.io npm package version badge.
- Added a david-dm dependencies badge.
- Added a .travis.yml build file and a travis-ci build badge.
- Added shields.io downloads count badges.
- Removed inconsistencies that were left in up till now for the sake of backwards compatibility.
- Renamed index.js to core.js. Added a new index.js file that exports everything like the old one used to.
- Moved the whole project from optimist to yargs.
- Config changes:
	- *BREAKING* - renamed globalPublicPath to clientModulesPublicPath.
	- *BREAKING* - renamed mountGlobalStorage to mountGlobalStorageInWebserver.
	- *BREAKING* - renamed protocol to hostProtocol.
	- *BREAKING* - in the db config, it is now mandatory to specify "dbType"; it no longer defaults to 'postgres'.
	- *BREAKING* - in the db config, it is now mandatory to specify "schema"; it no longer defaults to 'public'.
	- *BREAKING* - all client configs must be grouped in a "clients" object.
	- *BREAKING* - all api configs must be grouped in an "apis" object.
	- *BREAKING* - removed the "webpackDevserverModuleList" array; added a startWebpackDevserver variable to each client module config that does the same thing as the removed array.
	- *BREAKING* - changed "pass" to "password" in the postgreSQL config.
	- *BREAKING* - changed "unauthorizedRedirectRoute" to "unauthorizedPageRedirectRoute" in the client modules config.
	- *BREAKING* - added "redirectUnauthorizedPagesToNotFound" to the client modules config, which is required to be set to true if you want to redirect unauthorized layout and non-layout direct routes to the not found route. Previously this was the default behavior.
	- *BREAKING* - renamed "useModuleConfigForAuthTokens" to "useApiModuleConfigForAuthTokens" in the client modules config.
	- *BREAKING* - moved "wsPort" from the client modules config to the root config object.
	- *BREAKING* - removed the defaultConfig. From now on, ramster will blow up if you don't give it a config.
	- Added a "tokensSecret" variable to the db config. It's used in the user token-related methods (tokenLogin, resetPassword, updateEmail) to sign and verify the login tokens.
	- Added a lot of tests, complete code coverage.
- Added config templates.
- Added templates for the following db modules: users, userTypes, moduleCategories, modules, moduleAccessPoints, globalConfig.
- Added a codeGenerator module, which generates config files, db modules, client server layout files, nginx config files, webpack config files, utility scripts and more. Added tests for it.
- Added an .npmignore file, that keeps the "test" folder out of the final package (it's for testing ramster and you don't need it in the build). It's still in the repo, though.
- Removed the buildLayoutFile and generateNGINXConfig methods from the client module, as the codeGenerator now covers this functionality.
- *BREAKING* - loadDependencies now returns a promise that must be handled. This was done so that generalStore.createClient() can be called before the modules that depend on the generalStore and loaded.
- *BREAKING* - removed the loadModules method and broke it down into four separate ones - loadDB, loadMailClient, loadClients and loadAPIs. This way it's easier to debug and test the ramster initialization process.
- The core module (ramster) now has a runTests method, which executes defined tests for all db, client and api modules' components.
- Added tests and validations to the generalStore and errorLogger modules.
- Moved the findVertexById method from the migrations module to the toolbelt and renamed it to findVertexByIdDFS.
- tokenManager:
	- *BREAKING* - the constructor is now in the format (config, generalStore, errorLogger), rather than ({generalStore}).
	- *BREAKING* - signToken is now in the format signToken(userData, secret[, expiresInMinutes]), rather than signToken({userId, userData, secret, expiresInMinutes}).
	- *BREAKING* - userId removed from signToken options; userData is now required, must be an object and must contain at least one key.
	- *BREAKING* - verifyToken is now in the format verifyToken(token, secret), rather than verifyToken({token, secret}).
	- *BREAKING* - createToken is now in the format createToken(type, userData, secret, moduleName[, expiresInMinutes]), rather than createToken({type, userId, userData, secret, moduleName, expiresInMinutes}).
	- *BREAKING* - deleteToken is now in the format deleteTokens(userId, moduleName), rather than deleteTokens({userId, moduleName}).
	- Added extra validations for the input parameters in all methods.
	- Made some consistency and deprecation fixes.
	- Fixed numerous errors in the refresh token functionality (validate method).
	- Added a lot of tests, complete code coverage.
- emails module:
	- Reworked to no longer rely on the db module.
	- Added a mock execution mode (set in the constructor).
	- Added the bcc array to the optional list of arguments.
	- Added a lot of tests, complete code coverage.
- migrations module:
	- *BREAKING* Constructor is now in the form constructor(config, sequelize, dbComponents, seedingOrder), rather than (config, db).
	- Reworked to no longer rely on the db module. This way we can add it to the db module and avoid circularization.
	- Improved the queries and made the code more consistent. Refactored a lot of things, beacuase some parts were untouched since the first releases of ramster.
	- Removed the dependentSets property from the module.
	- Added a removeAllTables method.
	- Changes to runQueryFromColumnData:
		- *BREAKING* - the method is now in the following format: runQueryFromColumnData(queryInterface, tableName, inserts, t, options), where options is in the format {deleteTableContents, dontSetIdSequence}.
		- Added a load of validations.
		- Made logging optional for ramster logs, based on the already existing config.postgreSQL.logging variable.
	- Actually made escapeRecursively it work, by returning the proper escaped value for non-objects based on the value's data type.
	- Changes in prepareDataObjectForQuery:
		- *BREAKING* It's now in the format prepareDataObjectForQuery(tableLayout, dataObject).
		- Added validations.
		- Removed escaping from the method - data is now escaped in the runQueryFromColumnData method.
	- *BREAKING* removed the getColumnDataSetsFromDependencyGraph method.
	- Added a new method - getLinearArrayFromDependencyGraph. It partially replaces getColumnDataSetsFromDependencyGraph by transforming the dependencyGraph into a linear array, based on the dependency order.
	- Changes in prepareColumnData:
		- *BREAKING* - it's now in the format prepareColumnData(data, tableLayout, sameTablePrimaryKey), rather than prepareColumnData(inserts, data, tableLayout, sameTablePrimaryKey, queryInterface).
		- *BREAKING* - it now returns the inserts object, rather than setting the values into the provided argument.
		- The dependencyGraph it creates now contains the row data for each item.
		- Using getLinearArrayFromDependencyGraph, the graph is transformed into an ordered array of rows for insertion and added in a separate dependentDataSets array.
		- *BREAKING* - it now returns an inserts object if sameTablePrimaryKey is not provided, or a depentDataSets array if it is.
	- Improved the code quality in insertData, added validations and adapted it to use the updated methods from above.
	- Changes in the gnerateSeed method:
		- *BREAKING* - it's now in the format generateSeed(seedFileName), instead of seed({seedFolder, seedFile}).
		- It throws an error if attempting to seed without a seedFolder or seedFile.
		- It no longer rediculously returns all the data it has successfully seeded.
	- The sync, seed and insertStaticData now all generate syncHistory files prior to attempting the data insert. It the latter fails, they attempt to restore the previous state as well.
	- Changes in the seed method:
		- *BREAKING* - it's now in the format seed(seedFolderName, seedFileName), instead of seed({seedFolder, seedFile}).
		- It throws an error if attempting to seed without a seedFolder or seedFile.
		- It no longer rediculously returns all the data it has successfully seeded.
	- Added a lot of tests, complete code coverage.
- DB module and components:
	- *BREAKING* - the constructor is now in the format constructor(config, logger, generalStore, tokenManager), rather than constructor(config, {logger, generalStore, tokenManager}).
	- *BREAKING* - migrated to sequelize v4. See their migration guide for further info.
	- *BREAKING* - renamed cfg to config.
	- *BREAKING* - renamed all occurences of "postgres" (except for the default root user & pass for postgreSQL) to "postgreSQL".
	- *BREAKING* - split loadComponents into three methods for better testing and debugging - connectToDB, loadComponents and createAssociations.
	- loadComponents:
		- It now loads index.spec.js files from each component's directory. It must be a valid js file, whose exports are a json with test methods for mochajs. See ramster's own core.spec.js in the root folder for reference.
		- It now does various checks to ensure the basic validity of the loaded components and throws errors accordingly.
		- It now sets the componentName property automatically.
	- (new) createAssociations:
		- Runs each component's associate and mapRelations methods.
		- Generates the module-wide the seedingOrder.
	- *BREAKING* - the base-db.component contructor is now in the format constructor(), rather than constructor({logger, config, mailClient}).
	- *BREAKING* - removed logger, config and mailClient from the base-db.component (and all db componennts, subsequentially), as they're all accessible as properties in each dbComponent's db property.
	- *BREAKING* - removed the component.generateHandle method.
	- *BREAKING* - moved the generateRandomNumber, generateRandomString and parseDate methods to the toolbelt. Also, generateRandomString now returns a string and accepts an optional second argument for the string type.
	- *BREAKING* - component.model.associate is no longer supported.
	- *BREAKING* - component.associate reworked completely - it now takes a configurtion object from component.associationsConfig and generates the seeding order and a dependencyMap property for each component.
	- *BREAKING* - all relations that are for reading purposes only - i.e. they are not factual DB associations, but just aliases with different fields and more/less properties, should now be configured in component.relationsConfig. The component.associationsConfig object should be used just for the actual DB associations.
	- Added a component.mapRelations method, which generates the relations object and the relReadKeys for each component.
	- Added a setDBInComponents method, which is used to set the db property of components instead of setComponentProperties. The major difference is that it creates a shallow copy of the db object for each component and removes the component in question from the copied object's component list to avoid circularization.
	- Added a specMethodNames object to all db components, which will be used to execute tests from the user-defined spec for each component automatically.
	- Reworked component.checkFilterValues to fully encompass the range of allowed possibilities. It now returns true if the value was set.
	- *BREAKING* - component.getWhereQuery is now named getWhereObjects and is in the format getWhereObjects(filters, exactMatch), rather than getWhereQuery({filters, relSearch, exactMatch}). It no longer populates an external relSearch object, but returns 2 objects - the "where" object and an array, containing the paths of required relations.
	- *BREAKING* - component.getIncludeQuery is now named getRelationObjects and is in the format getRelationObjects(data, requiredRelationPaths), rather than getIncludeQuery({data, rel, relSearch}). It has changed greatly and does not populate the relSearch object and "where" clauses in relations items.
	- *BREAKING* - in component.searchFields, for filtering by related items' fields, a new syntax should be used. Example below:
		- Old syntax, the following will instruct ramster to build the include object's "where" clause based on realtions.product.include[0], which would hopefully be productType:
			```javascript
			{
				field: 'productTypeName',
				associatedModel: 'product',
				associatedModelField: 'name',
				nestedInclude: true
				like: '-%'
			}
			```
		- New syntax, from now on Ramster automatically maps relations and creates the proper include objects:
			```javascript
			/* example associationsConfig */
			{product: {componentName: 'products', include: [{componentName: 'productTypes', associationName: 'type'}]}}

			/* for the above, in component.searchFields we'd have */
			{
				field: '$product.type.name$',
				like: '-%'
			}
			```
	- Added an optional options argument to component.create, which can be used to provide an external transaction to the method.
	- *BREAKING* - bulkCreate is now in the format bulkCreate(data, options), rather than bulkCreate({dbObjects, options}).
	- Changes in the read method:
		- *BREAKING* - data should now be in the format {filters, relReadKeys, exactMatch, transaction}, where filters are required.
		- Added transaction support - pass {transaction: t} to data to make use of this functionality.
		- Reworked the method to make use of the new getWhereObjects and getRelationObjects methods.
	- Changes in the readList method:
		- *BREAKING* - data should now be in the format {filters, relReadKeys, exactMatch, page, perPage, readAll, orderBy, orderDirection, transaction}, where filters are required.
		- Added transaction support - pass {transaction: t} to data to make use of this functionality.
		- Reworked the method to make use of the new getWhereObjects and getRelationObjects methods.
	- Added a bulkUpdate method, used to update multiple objects one by one in the same transactions.
	- Changes in the delete method:
		- Added transaction support - pass {transaction: t} to data to make use of this functionality.
		- Added checkForRelatedModels to data - set it to true to perfor a check if the items to be deleted have items for their hasOne and hasMany relations. If they do, throw errors accordingly. E.g. "Cannot delete a userType that has users".
	- Added changeUserId to all base methods.
	- Added a lot of tests, complete code coverage.
- server modules and components (clients and apis):
	- Added moduleType to req.locals, as the module-specific configs are now in config.clients, rather than just in config.
	- *BREAKING* - only the componentName as the first and single argument is now passed to the components' constructors by loadComponents.
	- The componentName is now automatically set by loadComponents. You still need to set componentNameSingular manually in the component's constructor, however.
	- The loadComponents method now loads index.spec.js files from each component's directory. It must be a valid js file, whose exports are a json with test methods for mochajs. See ramster's own core.spec.js in the root folder for reference.
	- *BREAKING* - renamed accessControlOrigin to accessControlAllowOrigin.
	- Fixed the changeFieldCase method - it now parses the changeKeyCase output (which is a json string).
	- Moved the routes setup to a new method in base-server.component (no longer present in the base client and api components) - setRoutes. Added validations in it.
	- Added appendComponentNameToRoutes to the base-server.component component constructor. If set to true, it will add /componentName to all provided routes.
	- *BRAEKING* - the componentName is now always prepended to the additionalDefaultRoutes.
	- *BREAKING* - base-server.component.decodeQueryValues now accepts only the object to be decoded as an argument, and returns the decoded object.
	- Added the accessFilter method to the base-server.component. Use it to set moduleAccessPoints for routes and secure access based on that.
	- Added the readSelectList method to the base-server.component. Use it to get a list of items in the form {value, text}, prepared for use in UI selects.
	- *BREAKING* - the base client component constructor no longer accepts moduleName and moduleNameSingular.
	- *BREAKING* - all routes are now prefixed by the componentName by default. Removed routePrefix from the component constructor.
	- *BREAKING* - removed moduleName, cfg, settings, fieldCaseMap, logger, mailClient, generalStore, tokenManager, db and passport from req.locals, as they are present in the module's this (instance) context.
	- All components have the module property automatically set by loadComponents.
	- Added req.user to client server routes, when the user is authenticated.
	- *BREAKING* - base-client.component.importFileCheck is now in the format importFileCheck(inputFileName, delimiter), rather than importFileCheck({locals, inputFileName, delimiter}).
	- *BREAKING* - base-client.component.importFileCheck now returns the actual file data (without the columns row) under the fileData key.
	- Made the server components api actually restful:
		- *BREAKING* - moved base-client.component.create to the base-sever.component. It now returns {result: <theCreatedObject>}.
		- *BREAKING* - moved base-client.component.read to the base-sever.component. It is now at the route /componentName/item and returns {result: <theFoundObject>}.
		- *BREAKING* - moved base-client.component.readList to the base-sever.component. It is now of type GET and is at the route /componentName.
		- Upgraded base-client.component.readList to store search values in the generalStore, if set in the request.
		- *BREAKING* - moved base-client.component.update to the base-sever.component. It is now named bulkUpsert, is of type PUT and is at the route /componentName. According to REST standards, this means that we will be using this method for bulkCreate, update and bulkUpdate, based on what is provided in the body.
		- Added base-server.component.update PATCH to /update/:id - for updating single items.
		- *BREAKING* - (clients only) base-client.component.checkImportFile now takes "delimiter", as well as "fileName" in the query.
		- *BREAKING* - base-client.component.importFile now takes "fileName" (instead of "locationDataFile") and "delimiter" in the body.
		- *BREAKING* - moved base-client.component.delete to the base-server.component. It is now of type DELETE, at the route /componentName/:id and returns {success: true}
	- All of the above methods now pass userId to the db component methods.
	- Added the ability to run a setup method in client and api components, which can be used to configure things after component.module has been set, as it is executed after ``setModuleInComponents``.
	- Tests, full code coverage.
- csvPromise:
	- *BREAKING* - the parse method is now in the format parse(data, options), rather than parse({data, options}).
	- *BREAKING* - the stringify method is now in the format stringify(data, options), rather than stringify({data, options}).
	- Added some validations (there's nothing much to validate here).
	- Tests, full code coverage.
- toolbelt:
	- Added lots of validations.
	- Fixed the arrayStort method - it now correctly sorts when "haveValuesOnly" is set.
	- Fixed the changeKeyCase method - it now correctly processes strings (the "?" regex error; the empty string error).
	- Optimized the checkRoutes method.
	- *BREAKING* - emptyToNull is now in the form emptyToNull(data), rather than emptyToNull(data, outputData). It returns the outputData object instead of altering it.
	- Improved the findVertexByIdDFS method and handled various cases properly.
	- *BREAKING* - fixed the unit conversion in getFolderSize. Your code may not work if you were relying on the old numbers.
	- getNested now always returns null, instead of sometimes null and sometimes undefined.
	- Added setNested.
	- Tests, added full code coverage.

# 0.6.22
- Updated the v1.0.0 roadmap with an additional feature.
- Added a brief migration guide for a smooth v0.5 to v0.6 transition.

# 0.6.21
- In the tokenManager, added more data to req.user - the full decoded object from the token.

# 0.6.20
- Fixed the tokenManager.

# 0.6.19
- Added the ability to encode user data in the jwt (tokenManager).

# 0.6.17 - 0.6.18
- Toolbelt hotfix.

# 0.6.16
- Added the getFolderSize method to the toolbelt.

# 0.6.15
- The import file check in the base-client.component now skips lines that are blank.

# 0.6.14
- Added custom node proxy settings support when generating a config file for nginx.

# 0.6.13
- Very important hotfix for the migrations module - it couldn't escape Sequelize.ARRAY columns properly.

# 0.6.12
- Various server initialization hotfixes.

# 0.6.6 - 0.6.11
- Stupid small fix that I failed to test properly multiple times due to hurrying. (I promise not to do this anymore).

# 0.6.5
- Minor fix in the setFilterValue value (base-db.component) - gte/gt & lte/lt now work correctly.
- Upgraded the migrations module's insertStaticData functionality - it now inserts static data according to the seeding order first, then the rest of the data.
- Added the "arraySort" method to the toolbelt and reworked it for better consistency.
- Enabled filtering by "$gt", "$gte", "$lte" and "$lte" (base-db.component checkFilterValue method).

# 0.6.4
- Fixed to stupid errors caused by rushed release.

# 0.6.3
- Added a base server component and made the base client and api components inherit it.
- Added a decodeQueryValues method to the base server component and rewrote the base client and api read methods to use it.

# 0.6.2
- Additional fixes to the emails module.
- Very important hotfix in the base server module - the passport property of the component settings object is now correctly passed as an instance at component initialization, instead of being serialized.

# 0.6.1
- Changes and improvements to the baseDBComponent's filter assembling methods:
	- Renamed checkQueryItem to checkFilterValue, changed how it accepts arguments and added a brief description.
	- Added a setFilterValue method so that it can be used in child components.
	- Reworked the getWhereQuery to make use of the setFilterValue method.
- Fixed the emails module.

# 0.6.0
- Major rewrite of the core modules, all other modules brought to better standards. This includes numerous fixes to existing functionalities that popped up.
- Updated dependencies and phased out the deprecated ones, namely fs-promise (replaced with fs-extra) and sendgrid v4 (replaced with v6).
- Notable consistency upgrade of the whole codebase.
- Added more documentation and a roadmap.
