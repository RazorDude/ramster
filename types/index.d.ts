/**
 * The core module. Contains the Core class.
 */
declare module "coreModule" {
    /**
     * The core ramster class. Creating an instance of this is used to start your app.
     */
    class Core {
    }
}

/**
 * The api module. Contains the APIModule class.
 */
declare module "apiModule" {
    /**
     * The ramster APIModule class. It has its own server and contains a bunch of components, in which api endpoits are defined.
     */
    class APIModule {
        /**
         * An object, containing all api server components.
         */
        components: {
            [key: string]: BaseApiComponent;
        };
    }
}

/**
 * The base-api.component module. Contains the BaseAPIComponent class.
 */
declare module "baseApiComponent" {
    /**
     * The BaseAPIComponent class. It contains common API methods and inherits the BaseServerComponent class.
     */
    class BaseAPIComponent {
        /**
         * The currently initialized instance of the ApiModule.
         */
        module: ApiModule;
    }
}

/**
 * The base-client.component module. It contains the BaseClientComponent class.
 */
declare module "baseClientComponent" {
    /**
     * The BaseClientComponent class. It contains common client methods and inherits the BaseServerComponent class.
     */
    class BaseClientComponent {
        /**
         * The currently initialized instance of the ClientModule.
         */
        module: ClientModule;
    }
}

/**
 * The client.component module. It contains the ClientModule class.
 */
declare module "clientComponent" {
    /**
     * The ClientModule class. It has its own server and contains a bunch of components, in which client server api endpoits are defined.
     */
    class ClientModule {
        /**
         * An object, containing all client server components.
         */
        components: {
            [key: string]: BaseClientComponent;
        };
    }
}

/**
 * The codeGenerator module. Contains the CodeGenerator class.
 */
declare module "codeGeneratorModule" {
    /**
     * The CodeGenerator class. Contains various methods for building and generating a wide variety of code files for a new or an existing project.
     */
    class CodeGenerator {
        /**
         * The full project config.
         */
        config: any;
        /**
         * An array containing class method names for which a project config is required to execute sucessfuly.
         */
        configRequiredForMethods: string[];
        /**
         * A map of PostgreSQL data types to typescript data types.
         */
        pgToTSMap: {
            [key: string]: string;
        };
    }
}

/**
 * The aferRoutesMethodNamesTestComponentMobileAppAPIComponentModule. Contains the AfterRoutesMethodNamesTestComponentMobileAppAPIComponent class.
 */
declare module "aferRoutesMethodNamesTestComponentMobileAppAPIComponentModule" {
    /**
     * The AfterRoutesMethodNamesTestComponentMobileAppAPIComponent class.
     */
    class AfterRoutesMethodNamesTestComponentMobileAppAPIComponent {
    }
}

/**
 * The aferRoutesMethodNamesTestComponentSiteClientComponentModule. Contains the AfterRoutesMethodNamesTestComponentSiteClientComponent class.
 */
declare module "aferRoutesMethodNamesTestComponentSiteClientComponentModule" {
    /**
     * The AfterRoutesMethodNamesTestComponentSiteClientComponent class.
     */
    class AfterRoutesMethodNamesTestComponentSiteClientComponent {
    }
}

/**
 * The layoutSiteClientComponentModule. Contains the LayoutSiteClientComponent class.
 */
declare module "layoutSiteClientComponentModule" {
    /**
     * The LayoutSiteClientComponent class. Contains routes and logic for rendering the layout.html file.
     */
    class LayoutSiteClientComponent {
    }
}

/**
 * The usersSiteClientComponentModule. Contains the UsersSiteClientComponent class.
 */
declare module "usersSiteClientComponentModule" {
    /**
     * The UsersSiteClientComponent class.
     */
    class UsersSiteClientComponent {
    }
}

/**
 * The accessPointsDBComponentModule. Contains the AccessPointsDBComponent class.
 */
declare module "accessPointsDBComponentModule" {
    /**
     * The AccessPointsDBComponent class. Contains the sequelize db model and the business logic for the accessPoints. AccessPoints are assigned to userTypes and filtered in the server module's accessFilter method, effectively creating a modular, role-based permissions system. Optionally, they can have displayModules assigned to them as part of the dynamic permissions system.
     */
    class AccessPointsDBComponent {
    }
}

/**
 * The displayModuleCategoriesDBComponentModule. Contains the DisplayModuleCategoriesDBComponent class.
 */
declare module "displayModuleCategoriesDBComponentModule" {
    /**
     * The DisplayModuleCategoriesDBComponent class. Contains the sequelize db model and the business logic for the displayModuleCategories. DisplayModuleCategory items are used to visually group system modules for display in menus in a dynamic, non-hardcoded way.
     */
    class DisplayModuleCategoriesDBComponent {
    }
}

/**
 * The displayModulesDBComponentModule. Contains the DisplayModulesDBComponent class.
 */
declare module "displayModulesDBComponentModule" {
    /**
     * The DisplayModulesDBComponent class. Contains the sequelize db model and the business logic for the displayModules. DisplayModules are system entities which are used to logically group server components in the front-end as menu items if needed, creating dynamic, perimission-based menus, rather than hardcoded ones. Optionally, they can have access points assigned to them for a dynamic permissions system.
     */
    class DisplayModulesDBComponent {
    }
}

/**
 * The globalConfigDBComponentModule. Contains the GlobalConfigDBComponent class.
 */
declare module "globalConfigDBComponentModule" {
    /**
     * The GlobalConfigDBComponent class. Contains the sequelize db model and the business logic for the globalConfig. GlobalConfig items hold valuable platform-wide variables that would otherwise be hardcoded.
     */
    class GlobalConfigDBComponent {
    }
}

/**
 * The userTypesDBComponentModule. Contains the UserTypesDBComponent class.
 */
declare module "userTypesDBComponentModule" {
    /**
     * The UserTypesDBComponent class. Contains the sequelize db model and the business logic for the usersTypes. UserType items are central to the whole platform - they serve as the basis for the permissions system. Access points for different display modules are linked to them.
     */
    class UserTypesDBComponent {
        /**
         * A list of userType ids, which are considered system-critial and cannot be deactivated or deleted.
         */
        systemCriticalIds: number[];
        /**
         * A list of userType ids, which are considered fixed-access, meaning that no accessPoints can be added or removed to them.
         */
        fixedAccessIds: number[];
    }
}

/**
 * The usersDBComponentModule. Contains the UsersDBComponent class.
 */
declare module "usersDBComponentModule" {
    /**
     * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
     */
    class UsersDBComponent {
        /**
         * An array, containing the fields allowed for update in the updateProfile method.
         */
        profileUpdateFields: string[];
    }
}

/**
 * Just a test module, containing a test class.
 */
declare module "testModule" {
    /**
     * The test class.
     */
    class TestClass {
        /**
         * The project config object.
         */
        config: any;
        /**
         * A flag which is used to determine whether the class instance is running in test (mock) mode. Set based on mockMode === true, where mockMode comes from the constructor args.
         */
        runningInMockMode: boolean;
        /**
         * The list of method names that are taken from the .spec.js file accompanying the component file. The methods in this list will be executed when running tests for the project.
         */
        specMethodNames: string[];
    }
}

/**
 * The csvPromise module. Contains the CSVPromise class.
 */
declare module "csvPromiseModule" {
    /**
     * The CSVPromise class - a promise wrapper around the "csv" npm package's parse and stringify methods.
     */
    class CSVPromise {
    }
}

/**
 * The base-db.component module. Contains the BaseDBComponent class.
 */
declare module "baseDbComponentModule" {
    /**
     * The BaseDBComponent class. Contains various methods that lay the groundwork for the business logic and the CRUD.
     */
    class BaseDBComponent {
        /**
         * The list of keyword operators to check and parse when escaping objects for filters. Anything not included in this list will be skipped.
         */
        allowedFilterKeywordOperators: string[];
        /**
         * The list of keyword operators to check and parse when escaping objects for filters. Anything not included in this list will be skipped.
         */
        allowedFilterContainerKeys: string[];
        /**
         * The default list of image file type extensions allowed for processing by the saveImage method.
         */
        allowedImageTypes: string[];
        /**
         * The list of method names that are taken from the .spec.js file accompanying the component file. The methods in this list will be executed when running tests for the project.
         */
        specMethodNames: string[];
        /**
         * The list of association keys for this component. Used in various places, most notably read and readList calls, where the keys of this array help modularly fetch associated components' data.
         */
        relReadKeys: string[];
        /**
         * The name of the component. Automatically set to the folder name in which the component file is located.
         */
        componentName: string;
        /**
         * The sequelize model for the component.
         */
        model: Sequelize.Model;
        /**
         * The currently initialized instance of the DBModule.
         */
        db: DBModule;
        /**
         * An array of image resizing options, according to npmjs/sharp's docs, to be passed to .resize() in saveImage(). Can also be provided globally in the dbConfig. Providing it on a per-class basis always overrides the globalConfig value. If not provided, the image will not be resized.
         */
        imageResizingOptions: any[];
        /**
         * A map of allowed image output file formats and their corresponding methods in sharp.js.
         */
        imageOutputFileFormatsMethodNameMap: any;
    }
    /**
     * The defaults config object.
     * @property orderBy - The default column name to order database searches by.
     * @property orderDirection - The default direction to order database seraches in.
     * @property page - The default page of results to show in paginated calls. Must be a non-zero integer.
     * @property perPage - The default number of results to show per page in paginated calls. Must be a non-zero integer.
     */
    type baseDBComponentDefaultsObject = baseDBComponentDefaultsObject;
    /**
     * The default settings for bulding associations. They describe the required keys and the dependency category of which association type. The keys are the association types - belongsTo, hasOne, hasMany and belongsToMany.
     * @property requiredKeys - An array of keys that are required to be present in the associationsConfig object for this association.
     * @property dependencyCategory - Determines the dependency category - slaveOf, masterOf or equalWith.
     */
    type baseDBComponentAssociationDefaultsObject = {
        [key: string]: baseDBComponentAssociationDefaultsObject;
    };
    /**
     * The configuration object for creating associations. The object keys are the association names and will be added to instance.relReadKeys.
     * @property type - The type of the association - belongsTo, hasOne, hasMany or belongsToMany.
     * @property componentName - (optional) The name of the component to associate to, in case it doesn't match the association name.
     * @property foreignKey - The name of the field that will be used as a foreign key.
     * @property through - The name of the junction table, works only for belongsToMany associations.
     * @property otherKey - The name of the field that will be used to represent the key of this component in the association, works only for belongsToMany associations.
     */
    type baseDBComponentAssociationsConfigItem = {
        [key: string]: baseDBComponentAssociationsConfigItem;
    };
    /**
     * The configuration object for fine-tuning associations and adding different data requirements for the joined associations when fetching data from the database. The object keys are the relation names and will be added to instance.relReadKeys.
     * @property associationName - The name of the association that this relation extends.
     * @property attributes - (optional) The list of fields to fetch from the database. If not provided, all fields will be fetched.
     * @property required - (optional) If set to true, the SQL JOIN will be of type INNER. It is false by default.
     * @property where - (optional) If provided, the joined results will be filtered by these criteria.
     * @property include - (optional) An array contained nested relation configs. The items described here (and their sub-items, and so on) will be JOIN-ed and fetched from the database too.
     */
    type baseDBComponentRelationsConfigItem = {
        [key: string]: baseDBComponentRelationsConfigItem;
    };
    /**
     * The configuration array for the fields to search by, used in the read & readList methods.
     * @property field - The name of the field to search by. Use $relationName.fieldName$ to search by related component fields.
     * @property like - (optional) The match patter for SQL LIKE. Can be '%-', '-%' or '%%.
     * @property betweenFrom - (optional) If set to true, this field will be treated as a range start filter and the "From" suffix will be removed from the field name (if present). It is false by default.
     * @property betweenTo - (optional) If set to true, this field will be treated as a range end filter and the "To" suffix will be removed from the field name (if present). It is false by default.
     * @property exactMatch - (optional) If set to true and is a range filter, it will be inclusive. I.e. >= instead of >.
     */
    type baseDBComponentSearchFiltersObject = baseDBComponentSearchFiltersObject[];
    /**
     * A map of all associations the component has.
     * @property slaveOf - The names of the components that the component is in a belongsTo association.
     * @property masterOf - The names of the components that the component is in a hasOne or hasMany association.
     * @property equalWith - The names of the components that the component is in a belongsToMany association.
     * @property associationKeys - The full list of association keys (aliases) for this component.
     */
    type baseDBComponentDependencyMap = baseDBComponentDependencyMap;
}

/**
 * The db module. Contains the DBModule class.
 */
declare module "dbModule" {
    /**
     * The DBModule class. This class connects to the database, loads all db components, creates associations and synchronizes the db tables. After it's fully loaded, it contains all dbComponents under its components key.
     */
    class DBModule {
        /**
         * The project config object.
         */
        config: any;
        /**
         * The db config. It's a shortcut to the "db" sub-object of the project config object.
         */
        moduleConfig: any;
        /**
         * The order of tables in which rows are to be inserted when doing a full database sync.
         */
        seedingOrder: string[];
        /**
         * An instance of the Logger class.
         */
        logger: Logger;
        /**
         * An instance of the GeneralStore class.
         */
        generalStore: GeneralStore;
        /**
         * An instance of the TokenManager class.
         */
        tokenManager: TokenManager;
        /**
         * An object, containing all dbComponents.
         */
        components: {
            [key: string]: BaseDBComponent;
        };
        /**
         * An object containing settings for how to parse upper to lower camel case and vice versa.
         */
        fieldCaseMap: any;
        /**
         * A Sequelize object.
         */
        Sequelize: Sequelize;
        /**
         * A Sequelize instance.
         */
        sequelize: Sequelize;
        /**
         * Whether the module is runnign in mockMode or not.
         */
        runningInMockMode: boolean;
    }
}

/**
 * The emails module. Contains the Emails class.
 */
declare module "emailsModule" {
    /**
     * The Emails class. This class takes care of compiling email template files from .pug into .html, inserting local varibles and sending emails afterwards.
     */
    class Emails {
        /**
         * The project config object.
         */
        config: any;
        /**
         * The project db module, if it exists. It's a clone of db itself, with db.mailClient deleted to avoid circular references.
         */
        db: any;
        /**
         * The project config object's emails property.
         */
        emailsConfig: any;
        /**
         * The sendgrid client instance.
         */
        sendgrid: sendgrid;
        /**
         * The email sender's email address. Set in config.emails.emailSender
         */
        sender: string;
        /**
         * The names of the test methods from the spec file.
         */
        specMethodNames: string[];
        /**
         * A flag which is used to determine whether the class instance is running in test (mock) mode. Set based on mockMode === true, where mockMode comes from the constructor args.
         */
        runningInMockMode: boolean;
    }
}

/**
 * The base-server.component module. Contains the BaseServerComponent class.
 */
declare module "baseServerComponentModule" {
    /**
     * The base class for server (client and api) components. It contains common methods that are server-type agnostic.
     */
    class BaseServerComponent {
        /**
         * The currently initialized instance of the BaseServerModule.
         */
        afterRoutesMethodNames: string[];
        /**
         * The list of allowed HTTP methods for routes.
         */
        allowedMethods: string[];
        /**
         * The name of the component.
         */
        componentName: string;
        /**
         * A reference to the dbComponent related to this server component (if any).
         */
        dbComponent: BaseDBComponent;
        /**
         * The currently initialized instance of the BaseServerModule.
         */
        module: BaseServerModule;
    }
}

/**
 * The base-server.module module. Contains the BaseServerModule class.
 */
declare module "baseServerModuleModule" {
    /**
     * The base class for server (client and api) modules. It loads the module components and set some pre- and post-route method defaults.
     */
    class BaseServerModule {
        /**
         * An array of strings, which represent module methods to be mounted after all routes as next() for the whole module.
         */
        afterRoutesMethodNames: string[];
        /**
         * The project config object.
         */
        config: any;
        /**
         * The name of the module.
         */
        moduleName: string;
        /**
         * The type of the module.
         */
        moduleType: string;
        /**
         * The module config object. This is a sub-object of the project config object, specifically config[`${moduleType}`s][moduleName].
         */
        moduleConfig: any;
        /**
         * The list of instances of all baseServerComponents for this module.
         */
        components: {
            [key: string]: BaseServerComponent;
        };
        /**
         * A passportJS instance.
         */
        passport: passport;
        /**
         * An instance of the DBModule class.
         */
        db: DBModule;
        /**
         * An instance of the Logger class.
         */
        logger: Logger;
        /**
         * An instance of the GeneralStore class.
         */
        generalStore: GeneralStore;
        /**
         * An instance of the TokenManager class.
         */
        tokenManager: TokenManager;
        /**
         * A key-value map of how to parse fields between upper and lower camelCase.
         */
        fieldCaseMap: object[];
        /**
         * A list of expressJS-style methods to execute prior to all other methods.
         */
        precursorMethods: object[];
    }
}

/**
 * The tokenManager.module module. Contains the TokenManager class.
 */
declare module "tokenManagerModule" {
    /**
     * This class is used to create, validate and delete JWTs.
     */
    class TokenManager {
        /**
         * The project config object.
         */
        config: any;
        /**
         * An instance of the GeneralStore class.
         */
        generalStore: GeneralStore;
        /**
         * An instance of the Logger class.
         */
        errorLogger: Logger;
    }
}

/**
 * The toolbelt module. Contains various utility functions.
 */
declare module "toolbeltModule" {
    /**
     * Sorts an array by a list of inner properties.
     * @property 0 - The field name to sort by.
     * @property 1 - The ordering direction - 'asc' or 'desc'. Case insensitive.
     * @property 2 - (optional) The "sortingType". Can be 'haveValuesOnly'.
     * @param array - The array to sort.
     * @param orderBy - The sorting options.
     * @param caseSensitiveOption - (optional) Whether string sorting should be case sensitive or not.
     */
    type toolbeltArraySortSortingOptionsObject = string[];
    /**
     * Changes the case of all keys in an object between loweCamelCase and UpperCamelCase.
     * @param keyMap - The map of which key maps to which in different camel cases.
     * @param input - The object to change the keys of.
     * @param outputType - The type of conversion - "lower" or "upper".
     * @returns The stringified object with changed keys.
     */
    function changeKeyCase(keyMap: any, input: any, outputType: stirng): string;
    /**
     * Checks whether a route exists in a list of routes.
     * @param route - The route to check.
     * @param routes - The list of routes to check in.
     * @returns True/false, based on the check result.
     */
    function checkRoutes(route: string, routes: string[]): boolean;
    /**
     * Run chai describe or describe.skip, based on a provided condition.
     * @param condition - The condition that determines whether the suite will be executed or not.
     * @param suiteText - The description of the suite.
     * @param suiteMethod - The method containing the tests to be ran for the suite.
     * @returns 1 or -1, based on whether the suite was ran.
     */
    function describeSuiteConditionally(condition: boolean, suiteText: string, suiteMethod: (...params: any[]) => any): number;
    /**
     * Takes an object or value and transforms undefined, null and empty strings to null. Recursively does so for objects without mutating the provided data.
     * @param data - The object or value to transform.
     * @returns The object or value, with any instances of undefined, null and '' set to null.
     */
    function emptyToNull(data: any): any;
    /**
     * Finds or deletes a vertex in a graph by its id. Returns null if not found.
     * @property vertices - The vertex's list of connected vertices.
     * @param vertexId - The id of the vertext to search for.
     * @param graph - The graph to search in.
     * @param action - The action to perform - can be 'get' and 'delete'.
     */
    type toolbeltVertexObject = {
        vertices: toolbeltVertexObject;
    };
    /**
     * Get the size of a folder in bytes, kB, etc.
     * @param folderPath - The path to the folder.
     * @param unit - (optional) The times the size in bytes should be divided by 1000.
     * @returns The folder size.
     */
    function getFolderSize(folderPath: string, unit: number): number;
    /**
     * Get a nested object property's value by its keys path in the object.
     * @param parent - The object to search in.
     * @param field - The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'.
     * @returns The value or undefined if not found.
     */
    function getNested(parent: any, field: string): any;
    /**
     * Generate a random decimal number with the specified digit count (length).
     * @param length - The digit count of the generated number.
     * @returns The generated number.
     */
    function generateRandomNumber(length: number): number;
    /**
     * Generate a random string with the specified length.
     * @param length - The length of the generated string.
     * @param stringType - (optional) The argument to provide to buffer.toString() - nothing, 'base64', etc.
     * @returns The generated string.
     */
    function generateRandomString(length: number, stringType: string): number;
    /**
     * Parse a string/Date date and create a moment object. Supports YYYY-MM-DD and DD/MM/YYYY strings.
     * @param date - The date to parse.
     * @returns A momentjs object.
     */
    function parseDate(date: string | any): any;
    /**
     * Similarly to describeSuiteConditionally, runs a mocha 'it' or it.skip if a condition is met.
     * @param condition - The condition that determines whether the test will be executed or not.
     * @param testText - The description of the text.
     * @param testMethod - The method containing the code to be execute for the test.
     * @returns 1 or -1, based on whether the test was ran.
     */
    function runTestConditionally(condition: boolean, testText: string, testMethod: (...params: any[]) => any): number;
    /**
     * Set a value in an object under a certain key, based on its key path in the object.
     * @param parent - The object to search in.
     * @param field - The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'.
     * @param value - The value to set.
     * @returns true or false, based on whether the field was set successfully or not
     */
    function setNested(parent: any, field: string, value: any): boolean;
}

