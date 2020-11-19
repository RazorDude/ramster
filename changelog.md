# 1.14.5
- Another, final hotfix for BaseDBComponent.setQueryDataForRelation.

# 1.14.4
- Another hotfix for BaseDBComponent.setQueryDataForRelation.

# 1.14.3
- Hotfix foran edge case in BaseDBComponent.setQueryDataForRelation, where including self didn't work properly.

# 1.14.2
- Hotfix for BaseServerComponent.accessFilter.

# 1.14.1
- Split accessFilter's access filtering functionality into a separate method - filterAccess. This allows the overriding of the accessFilter method without the loss of the access filtering logic.

# 1.14.0
- The BaseServerComponent's accessFilter method now adds the "grantedAccessPointIds" object to req.locals. It's an array of ids, representing the access points which allowed the user to get access.

# 1.13.3
- Typescript type updates.

# 1.13.2
- Added much better typescript types.

# 1.13.1
- Added more typescript types.

# 1.13.0
- Added typescript types.

# 1.12.2
- Changed skipSecondSetup to skipSecondSetupWhenTesting and actually made it work.

# 1.12.1
- Increased the acceptable timeout for the core.runTests master describe block from 50000ms to 300000ms. 

# 1.12.0
- Added support for a "skipSecondSetup" option to the dbInjectedModules' moduleData in the config.
- The migrations module now shuts down all active cron jobs before inserting data and then starts them after the data insertion has been completed

# 1.11.4
- Fix for the precursorMethods.

# 1.11.3
- The BaseClientComponent and BaseApiComponent now correctly apply "this" to the precursorMethods.

# 1.11.2
- BaseServerComponent.readSelectList typo fix.

# 1.11.1
- BaseServerComponent.readSelectList hotfix.

# 1.11.0
- BaseServerComponent.readSelectList now properly processes Date titleFields.
- Added a dateFormat option to BaseServerComponent.readSelectList's list of possible processValue array values. Use "dateFormat_YYYY-MM-DD", for example.

# 1.10.2
- BaseServerComponent.update now supports an array of ids in the route params.

# 1.10.1
- BaseServerComponent.accessFilter hotfix.

# 1.10.0
- BaseServerComponent.accessFilter - changed how the logic works with searchForUserFieldIn. It now correcly sets all the values, instead of taking just the first one.

# 1.9.1
- BaseDBComponent.saveImage typo hotfix.

# 1.9.0
- The BaseDBComponent.saveImage now takes a BaseDBComponentSaveImageOptions object and supports image cropping. Added a deprecation warning for the old syntax, where the fourth argument is the string for the outputFileType.

# 1.8.5
- More logging improvements.

# 1.8.4
- More logging improvements.

# 1.8.3
- More logging improvements.

# 1.8.2
- Minor logging improvements.

# 1.8.1
- Updated all dependencies.
- Moved sharp to peerDependencies, as its version depends on the system's node version.

# 1.8.0
- The mailClient module loading function now supports two setup methods in the MailClient class - preDBSetupResult, which runs prior to db.setDBInComponents, and postDBSetupResult, which runs afterwards.
- In the default mailClient, the sendgrid property is now only set when "config.emails.sendgridApiKey" is provided.
- Moved the @sendgrid/mail npm module requirement from "dependencies" to "peerDependencies". 

# 1.7.6
- Added $like and $iLike support to the BaseDBComponent.

# 1.7.5
- Server modules fix - error handling.

# 1.7.4
- Client modules fix - now always setting req.locals, regardless of redirects.

# 1.7.3
- Logout fix in the modules.clients.site.users.logout - the session cookie is now being properly cleared.

# 1.7.2
- HOTFIX - added the ability to specify do-not-log request data routes - config.clients[moduleName].doNotLogRequestDataRoutes and config.apis[moduleName].doNotLogRequestDataRoutes

# 1.7.1
- Fixed the mailClient tests.

# 1.7.0
- The built-in emails module now allows for injecting a css string into the template. If Emails.sendEmail.options.cssFilePath or config.emails.cssFilePath is provided, the file will be read from disk and added as "_head_style" in the dynamicFields for pug to build. 

# 1.6.5
- dbInjectedModules now properly import their spec.js files.

# 1.6.4
- Hotfix for Core.runTests - dbInjectedModules tests can now be ran for non-array configs.

# 1.6.3
- Extended the BaseDBComponent.saveImage's capabilities by adding support for multiple image file formats, apart from png - heif, jpeg/jpg, tiff and webp.
-> The method now accepts a fourth optional argument - outputFileType. This is the type that will be converted to.
-> config.db now has a new option - defaultImageOutputFileType. This will be used as fallback if outputFileType is not provided. Finally, if defaultImageOutputFileType is not present in the config either, the method will fall back to using .png, as it did before.
-> The BaseDBComponent class now has a new property - imageOutputFileFormatsMethodNameMap. The keys of this object are the accepted output file extensions and the values are the sharp.js method names for the given file formats.

# 1.6.2
- Another hotfix for the same thing.

# 1.6.1
- HOTFIX - now re-running the dbInjected modules' setup methods post static data insert again.

# 1.6.0
- Added support for image resizing to BaseDBComponent.saveImage. If a valid imageResizingOptions array of method arguments is provided either through config.db.imageResizingOptions or through a DBComponent class property of the same name (which overrides the imageResizingOptions from the config), sharp.resize(imageResizingOptions) will be executed before the data is save to the output file. Please refer to the sharp docs in npmjs for info on the contents of the imageResizingOptions array.

# 1.5.6
- Hotfix for readSelectList - only add concatenating strings for existing titleFields.

# 1.5.5
- Hotfix for readSelectList - no longer executing decodeQueryValues twice.

# 1.5.4
- More hotfixes for the v1.5.2 functionality.

# 1.5.3
- Hotfix.

# 1.5.2
- Config.db.injectModules can now be an object of type {[moduleName: string]: {setuOptions: any}}.

# 1.5.1
- Access points hotfix.

# 1.5.0
- Added the ability to request nested relReadKeys - i.e. realReadKeys: {user: true, 'user.country': true}. From this example, "user: true" can be omitted, as 'user.country': true will add the users relation anyway.
- Fixed and improved the BaseServerComponent.accessFilter method - it now correctly covers all cases.

# 1.4.3
- Removed the deprecation message - not its time yet ;)

# 1.4.2
- Access control method hotfix.

# 1.4.1
- Forgot to remove a console.log I had put in for debugging purposes.

# 1.4.0
- The BaseServerComponent.accessFilters method now supports accessPoint grouping. I.e. instead of numbers only, you can pass arrays of numbers to accessPointIds too - this will block access if one of the accessPoints in the group is present but not all.

# 1.3.2
- The Core.loadDB method now correctly runs the dbInjectedModules' setup methods after the associations have been completed.

# 1.3.1
- The Core.runTests method now re-runs the dbInjectedModules' setup methods after the static data insert.

# 1.3.0
- Important changes to the DB injected modules:
-> They now have the db property set in them, which is a reference to the db module instance with the injected module itself removed from it
-> They now support a setup() method which will be executed after the db property has been set. If it returns a promise, it will be resolved first before the ramster loading process execution continues.
- If exitProcessOnModuleTestFail is set to true when starting in test mode and a module's tests error out, the test execition will stop there - it will not continue further to other modules.

# 1.2.10
- And another BaseDBComponent fix + improved testing for it.

# 1.2.9
- Another HUGELY important fix - completely rewritten the workaround for the sequelize bug BaseDBComponent.readList. This fixes the issue with nested transactions not working (which is another sequelize bug).

# 1.2.8
- HUGELY important fix - added a new method to the BaseDBComponent - parseDereferencedObjectValues. It's used by setQueryDataForRelation to go through an object and its nested objects and makes sure Date, Function, SequelizeMethod and Sequelize.Model ones are not recorded as [object Object].

# 1.2.7
- Updated the toolbelt.decodeQueryValues method to not overwrite the decodedKeys in existing objects.

# 1.2.6
- Session cookies update - fixes the multiple users bug.

# 1.2.5
- BaseDBComponent.getWhereObjects now returns the requiredRelationsData of its recursive calls as well.

# 1.2.4
- The tokenManager now returns the decoded token data when there's a TokenExpiredError - under the "decoded" key in the error object.

# 1.2.3
- Fixed baseDBComponent.read's "No filters provided" logic - it now checks "requiredRelationsData" as well as "where".

# 1.2.2
- Fixed baseServerComponent.delete - it now returns the result of dbComponent.delete, instead of {success: true}

# 1.2.1
- Nested ordering fix for the baseDBComponent.

# 1.2.0
- Nested associations in db components are now being automatically detected when querying (read and readList "relReadKeys"), even if they are not explicitly defined in a db component's "relationsConfig" object.
- Duplicate associations when querying are now being merged - this fixes the "table XXX included more than once" SQL error.

# 1.1.5
- Migrations fix.

# 1.1.4
- Reverted the fix from 1.0.45 because it breaks JSON columns.

# 1.1.3
- Urgent hotfix for the BaseDBComponent.readList method - added a nested transaction for the findAll method in the try-catch block, as the handled sequelize error there produces a transaction error but does not roll back the transaction itself (because the error is handled).

# 1.1.2
- Just updating before pushing with the previous version.

# 1.1.1
- Fix for baseServerComponent.streamReadList.

# 1.1.0
- Added streamReadList to the base server component.

# 1.0.45
- Fix for the latter

# 1.0.44
- Updated how the migrations module handles Array columns - it now parses string column values that start with '[' and end with ']', and replaces them with '{' and '}'.

# 1.0.43
- Removed bodyParser.raw() from the client and api module and added a custom middleware.

# 1.0.42
- Added bodyParser.raw() for client and api requests.

# 1.0.41
- Another improvement of the same type.

# 1.0.40
- Added an improved error message for Sequelize unique contraint errors.

# 1.0.39
- Moved decodeQueryValues from the base-server.component to the toolbelt, updated it to support _json query params (when you pass _json_something={key: value} it will now parse it it query.something = {key: value}) and added it by default for all get requests both in the client and in the api modules. Left it as property of base-server.component for backwards compatibility, will be removed in the next major release.

# 1.0.38
- Fixed the attributes probem in base-db.component.restoreAttributesFromMapRecursively.

# 1.0.37
- Fixed the deep recursion in the base-db.component.getRelationObjects.

# 1.0.36
- Small fix.

# 1.0.35
- Small fix in baseServerComponent.decodeQueryValues - passing 'null' now returns null, instead of 'null'.

# 1.0.34
- Added the ability to test cronJobs. See the example syntax in modules/codeGenerator/templates/modules/cronJobs for more info.

# 1.0.33
- Actually made the fix :D

# 1.0.32
- Fixed baseServerComponent.readSelectList - it used to send relReadKeys as an empty array by default, instead of an empy object by default.

# 1.0.31
- Restored support for "where" in baseDBComponent.bulkUpert and baseServerCompnent.bulkUpsert for backwards-compatibility purposes.

# 1.0.30
- Another improvement of the same type in baseServerComponent.accessFilter.

# 1.0.29
- Fixed the baseServerComponent.accessFilter method to update the request field values when they're arrays to contain only the items the user has access to. 

# 1.0.28
- Another fix for the latter.
- Turns out testGetWhereObjects was being executed twice, instead of once and then executing getRelationObjects, hence why the bug wasn't found. Fixed.

# 1.0.27
- Fixed baseDbComponent.getRelationObjects - it now correctly works with items from the relationsConfig, not just ones from the associationsConfig.

# 1.0.26
- Fix for the latter.

# 1.0.25
- Updated baseServerComponent.update to better structure the req.body before passing it to the dbComponent. It now accepts both the fields to update plainly in the body for legacy reasons, and a "dbObject" object containing the fields to update in the body - the preferred way to di it.

# 1.0.24
- toolbelt.getNested now supports multiple consecutive unindexed arrays in the path.

# 1.0.23
- Another really minor fix for baseServerComponent.update.
- Minor fix for the baseServerComponent.accessFilter method.
- Increased the test timeout of the success test in mailClient.sendEmail to 10000 to avoid test errors due to slow pug compilation.

# 1.0.22
- Another fix for serverComponent.update.

# 1.0.21
- Restored "where" in serverComponent.update for backwards compatibility. Still, it's recommended that you use "filters".
- Travis build error fixes.

# 1.0.20
- toobelt.getNested now supports providing arrays without indexes in the path, which caused the method to cycle through all items of the encountered array and return an array with the found values.

# 1.0.19
- Fix for the latest update.

# 1.0.18
- Restored "where" in dbComponent.update for backwards compatibility. Still, it's recommended that you use "filters".

# 1.0.17
- Added the ability to inject modules in the db module. Set the injectModules property in the db config - an array of strings, representing the names of the modules to be injected. Each module must be present in project_root/modules.

# 1.0.16
- Upgraded the baseDbComponent.bulkUpsert method to support updateFilters filters for updating items and additionalCreateFields for creating items.

# 1.0.15
- Exlucded test/storage/test/example.* from the .gitignore, so that Travis can test properly.

# 1.0.14
- Important improvement to the baseDBComponent.update method - now uses baseDBComponent.readList in idsOnlyMode to find results.

# 1.0.13
- Added the missing support for additional filtering in baseServerComponent.update (the body.where object) and baseServerComponent.delete (the body.additonalFilters) object.

# 1.0.12
- Restored the old return values of baseDBComponent.update.

# 1.0.11
- Added support for running additional tests, passed as functions in core.runTests.
- Added functionality for saving images to the baseDBComponent - the saveImageMethod. It is now being used by its create, update and delete methods.
- Improved the quality of the tests in the baseDBComponent.
- The baseDBComponent.update method now returns the first updated object's dataValues.

# 1.0.10
- Small module import fixes for certain modules.
- Upgraded and greatly expanded the tests for the client module's setDefaultsBeforeRequest method redirects.

# 1.0.9
- Small fix for the latest feature.

# 1.0.8
- Moved the client and api server modules' triggering of each component's setup method (if present) to mountRoutes, so they can make use of module.app.

# 1.0.7
- Added the ability to set custom after-routes methods for each server component, as well as a global custom after-routes methods. Each module's handleNextAfterRoutes is still added by default.
- The codeGenerator.generateFolders can now be safely used at all times - it does not overwrite existing folders. From now on, it will create just the ones that don't currently exist, unless overwrite is set to true.

# 1.0.6
- Added configurable file size limit for multipart bodies in client modules. The config variable is fileSizeLimit and must be in the format described in the docs of connect-multiparty.

# 1.0.5
- Fix for a regression bug in toolbelt.setNested and extended tests - it can now correctly set a field's value even if it does not exist in the lowemost parent.

# 1.0.4
- toolbelt.getNested and toolbelt.setNested now corretly work with $$ fields - a field surrounded by $ won't be split if there's a "." in it. I.e. testContainer.$testField.name$ will return the value of the $testField.name$ key in the testContainer object.

# 1.0.3
- Added support for multiple static data files to be executed with the tests - see the projectMainFile.js in modules/codeGenerator/templates for more info.

# 1.0.2
- Redirect fixes - added the query params to all redirects.

# 1.0.1
- Fixed the user permissionsData-related errors for accessPoints not linked to displayModules.
- Added code for stoping access to inactive accesspoints.

# 1.0.0
- Added a shields.io node version badge.
- Added a shields.io npm package version badge.
- Added a david-dm dependencies badge.
- Added a .travis.yml build file and a travis-ci build badge.
- Added shields.io downloads count badges.
- Removed inconsistencies that were left in up till now for the sake of backwards compatibility.
- Renamed index.js to core.js. Added a new index.js file that exports everything like the old one used to.
- Moved the whole project from optimist to yargs.
- Added valid JSDoc comments everywhere.
- Added the ability to run ESLint tests.
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
- Added addProjectKeyPrefixToHandles to the config.redis object and the corresponding functionality to generalStore.
- Moved the findVertexById method from the migrations module to the toolbelt and renamed it to findVertexByIdDFS.
- tokenManager:
	- *BREAKING* - the constructor is now in the format (config, generalStore, errorLogger), rather than ({generalStore}).
	- *BREAKING* - signToken is now in the format signToken(userData, secret[, expiresInMinutes]), rather than signToken({userId, userData, secret, expiresInMinutes}).
	- *BREAKING* - userId removed from signToken options; userData is now required, must be an object and must contain at least one key.
	- *BREAKING* - verifyToken is now in the format verifyToken(token, secret), rather than verifyToken({token, secret}).
	- *BREAKING* - createToken is now in the format createToken(type, userData, secret, moduleName[, expiresInMinutes]), rather than createToken({type, userId, userData, secret, moduleName, expiresInMinutes}).
	- *BREAKING* - deleteToken is now in the format deleteTokens(userId, moduleName), rather than deleteTokens({userId, moduleName}).
	- *BREAKING* - validate now returns a generator function.
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
	- Added ssh tunnel connection support for PostgreSQL.
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
		- Removed the mandatory filters object requirement for readList.
		- Added the ability to get the list comprised of only ids for all DB items and their related DB items. Use the ``idsModeOnly`` search option for this.
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
	- *BREAKING* - removed ``prepareServiceNameTypeResponse`` from the APIModule. "serviceName type response" is a niche thing I had to use for a project a while back, so its deprecation is long due, as it serves no practical purpose.
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
