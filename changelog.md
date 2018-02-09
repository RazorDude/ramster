# 1.0.0
- Added a fury.io npm version badge.
- Added a base .travis.yml file.
- Removed inconsistencies that were left in up till now for the sake of backwards compatibility.
- Config changes:
	- *BREAKING* - renamed globalPublicPath to clientModulesPath.
	- *BREAKING* - renamed mountGlobalStorage to mountGlobalStorageInWebserver.
	- *BREAKING* - renamed moduleList to webpackDevserverModuleList.
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
	- Added a lot of tests, complete code coverage.
- Added config templates.
- Added templates for the following db modules: users, userTypes, moduleCategories, modules, moduleAccessPoints, globalConfig.
- Added a codeGenerator module, which generates config files, db modules, client server layout files, nginx config files, webpack config files and utility scripts. Added tests for it.
- Added an .npmignore file, that keeps the "test" folder out of the final package (it's for testing ramster and you don't need it in the build). It's still in the repo, though.
- Removed the buildLayoutFile and generateNGINXConfig methods from the client module, as the codeGenerator now covers this functionality.
- *BREAKING* - loadDependencies now returns a promise that must be handled. This was done so that generalStore.createClient() can be called before the modules that depend on the generalStore and loaded.
- *BREAKING* - removed the loadModules method and broke it down into four separate ones - loadDB, loadMailClient, loadClients and loadAPIs. This way it's easier to debug and test the ramster initialization process.
- *BREAKING* - Renamed cfg and settings to config in client modules.
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
	- Added a lot of tests, complete code coverage.
- migrations modules:
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
- DB module and components:
	- *BREAKING* - the constructor is now in the format constructor(config, logger, generalStore, tokenManager), rather than constructor(config, {logger, generalStore, tokenManager}).
	- *BREAKING* - migrated to sequelize v4. See their migration guide for further info.
	- *BREAKING* - renamed cfg to config.
	- *BREAKING* - renamed all occurences of "postgres" (except for the default root user & pass for postgreSQL) to "postgreSQL".
	- *BREAKING* - split loadComponents into three methods for better testing and debugging - connectToDB, loadComponents and createAssociations.
	- loadComponents:
		- It now loads index.spec.js files from each component's directory. It must be a valid js file, whose exports are a json with test methods for mochajs. See ramster's own index.spec.js in the root folder for reference.
		- It now does various checks to ensure the basic validity of the loaded components and throws errors accordingly.
		- It now sets the componentName property automatically.
	- (new) createAssociations:
		- Runs each component's associate and mapRelations methods.
		- Generates the module-wide the seedingOrder.
	- *BREAKING* - the base-db.component contructor is now in the format constructor(), rather than constructor({logger, config, mailClient}).
	- *BREAKING* - removed logger, config and mailClient from the base-db.component (and all db componennts, subsequentially), as they're all accessible as properties in each dbComponent's db property.
	- *BREAKING* - component.model.associate is no longer supported.
	- *BREAKING* - component.associate reworked completely - it now takes a configurtion object from component.associationsConfig and generates the seeding order and a dependencyMap property for each component.
	- *BREAKING* - removed the component.generateHandle method.
	- Added a component.mapRelations method, which generates the relations object and the relReadKeys for each component.
	- Added a setDBInComponents method, which is used to set the db property of components instead of setComponentProperties. The major difference is that it creates a shallow copy of the db object for each component and removes the component in question from the copied object's component list to avoid circularization.
	- Added a specMethodNames object to all db components, which will be used to execute tests from the user-defined spec for each component automatically.
	- Added a lot of tests, complete code coverage.
- Added moduleType to req.locals in client and api modules, it's used to get the proper config (remember, we moved the module configs to sub-objects in config.clients and config.apis).

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
