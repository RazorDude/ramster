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
	- *BREAKING* - all client configs must be grouped in a "clients" object.
	- *BREAKING* - all api configs must be grouped in an "apis" object.
	- *BREAKING* - removed the "webpackDevserverModuleList" array; added a startWebpackDevserver variable to each client module config that does the same thing as the removed array.
	- *BREAKING* - changed "pass" to "password" in the postgres config.
	- *BREAKING* - changed "unauthorizedRedirectRoute" to "unauthorizedPageRedirectRoute" in the client modules config.
	- *BREAKING* - added "redirectUnauthorizedPagesToNotFound" to the client modules config, which is required to be set to true if you want to redirect unauthorized layout and non-layout direct routes to the not found route. Previously this was the default behavior.
	- *BREAKING* - renamed "useModuleConfigForAuthTokens" to "useApiModuleConfigForAuthTokens" in the client modules config.
	- *BREAKING* - moved "wsPort" from the client modules config to the root config object.
	- *BREAKING* - removed the defaultConfig. From now on, ramster will blow up if you don't give it a config.
- Added config templates.
- Added templates for the following db modules: users.
- Added a codeGenerator module, which generates config files, client server layout files and nginx config files. Added tests for it.
- Added an .npmignore file, that keeps the "test" folder out of the final package (it's for testing ramster and you don't need it in the build). It's still in the repo, though.
- Removed the buildLayoutFile and generateNGINXConfig methods from the client module, as the codeGenerator now covers this functionality.
- *BREAKING* - Renamed cfg to config in db modules.
- *BREAKING* - Renamed cfg and settings to config in client modules.
- Added tests and validations to the generalStore and errorLogger modules.
- A number of changes in the tokenManager, many of them *BREAKING*:
	- *BREAKING* - the constructor is now in the format (config, generalStore, errorLogger), rather than ({generalStore}).
	- *BREAKING* - signToken is now in the format signToken(userData, secret[, expiresInMinutes]), rather than signToken({userId, userData, secret, expiresInMinutes}).
	- *BREAKING* - userId removed from signToken options; userData is now required, must be an object and must contain at least one key.
	- *BREAKING* - verifyToken is now in the format verifyToken(token, secret), rather than verifyToken({token, secret}).
	- *BREAKING* - createToken is now in the format createToken(type, userData, secret, moduleName[, expiresInMinutes]), rather than createToken({type, userId, userData, secret, moduleName, expiresInMinutes}).
	- *BREAKING* - deleteToken is now in the format deleteTokens(userId, moduleName), rather than deleteTokens({userId, moduleName}).
	- Added extra validations for the input parameters in all methods.
	- Made some consistency and deprecation fixes.
	- Fixed numerous errors in the refresh token functionality (validate method).
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
