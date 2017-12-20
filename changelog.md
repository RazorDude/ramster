# 1.0.0
- Added a fury.io npm version badge.
- Added a base .travis.yml file.
- Removed inconsistencies that were left in up till now for the sake of backwards compatibility.

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
