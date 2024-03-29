import * as sq from 'sequelize'

export class BaseClientComponent {
    constructor(...args: any[]);

    checkImportFile(): void;

    importFile(additionalOptions?: Record<string, unknown>): void;

    importFileCheck(inputFileName: string, delimiter?: string): Promise<unknown>;

    readList(): void;

}

export class BaseDBComponent<T> {
    constructor();

    associate(): void;

    bulkCreate(data: T[] | Record<string, unknown>[], options?: { transaction?: sq.Transaction; userId?: number }): Promise<T[]>;

    bulkUpsert(
        dbObjects: T[] | Record<string, unknown>[],
        options: {
            additionalCreateFields?: Record<string, unknown>
            transaction?: sq.Transaction
            updateFilters?: Record<string, unknown>
            userId?: number
        }
    ): Promise<{ success: boolean }>;

    checkFilterValue(fitlerValue: unknown): boolean;

    create(data: T | Record<string, unknown>, options?: { transaction?: sq.Transaction; userId?: number }): Promise<T>;

    delete(
        data: {
            additionalFilters?: Record<string, unknown>
            checkForRelatedModels?: boolean
            id: number | number[]
            transaction?: sq.Transaction
        }
    ): Promise<{ deleted: number }>;

    getRelationObjects(relReadKeys: Record<string, boolean>, requiredRelationsData: Record<string, unknown>): {
        include: Record<string, unknown>
        order: Record<string, unknown>
    };

    getWhereObjects(filters: Record<string, unknown>, exactMatch: string[]): {
        where: Record<string, unknown>;
        requiredRelationsData: Record<string, unknown>;
    };

    mapNestedRelations(sourceComponent: BaseDBComponent<unknown>, config: unknown[]): {
        include: Record<string, unknown>[]
        order: string[][]
    };

    mapRelations(): void;

    parseDereferencedObjectValues(sourceObject: Record<string, unknown>, targetObject: Record<string, unknown>): void;

    read(
        data: {
            exactMatch?: string[]
            filters: Record<string, unknown>
            relReadKeys?: Record<string, boolean>
            transaction?: sq.Transaction
        }
    ): Promise<T>;

    readList(
        data: {
            exactMatch?: string[]
            filters?: Record<string, unknown>
            page?: number
            perPage?: number
            readAll?: boolean
            relReadKeys?: Record<string, boolean>
            idsOnlyMode?: boolean
            orderBy?: string
            orderDirection?: string
            transaction?: sq.Transaction
        }
    ): Promise<{ more: boolean; page: number; perPage: number; results: T[]; totalPages: number }>;

    restoreAttributesFromMapRecursively(optionsObject: Record<string, unknown>, map: Record<string, unknown>): void;

    saveImage(
        inputFileName: string,
        outputFileName: string,
        dbObjectId: number,
        options?: {
            imageResizingOptions?: {
                height?: number | string
                startX?: number
                startY?: number
                width?: number | string
            }
            outputFileType?: string
        }
    ): Promise<boolean>;

    setFilterValue(container: Record<string, unknown>, filter: Record<string, unknown>, field: string, value: unknown, exactMatch: string[]): boolean;

    setOrderDataForRelation(order: string[][], relactionIncludeItem: Record<string, unknown>, fieldMap: Record<string, unknown>): void;

    setQueryDataForRelation(
        dbComponent: Record<string, unknown>,
        include: Record<string, unknown>,
        associationNameMap: Record<string, unknown>,
        relationIncludeItem: Record<string, unknown>,
        relationName: string,
        requiredFieldsData: Record<string, unknown>
    ): void;

    stripAndMapAttributesFromOptionsObjectRecursively(optionsObject: Record<string, unknown>): {
        nested: Record<string, unknown>[]
        topLevel: string[]
    };

    update(
        data: {
            dbObject: T | Record<string, unknown>
            filters?: Record<string, unknown>
            transaction?: sq.Transaction
            userId?: number
            where?: Record<string, unknown>
        }
    ): Promise<[number, T[]]>;

}

export class CodeGenerator {
    constructor(...args: any[]);

    buildLayoutFile(...args: any[]): void;

    checkConfig(...args: any[]): void;

    checkOutputPath(...args: any[]): void;

    generateBasicProject(...args: any[]): void;

    generateBlankProject(...args: any[]): void;

    generateCommonConfigFile(...args: any[]): void;

    generateConfigFile(...args: any[]): void;

    generateDocs(...args: any[]): void;

    generateFolders(...args: any[]): void;

    generateGitignore(...args: any[]): void;

    generateImagesRedirectNGINXConfig(...args: any[]): void;

    generateIndexConfigFile(...args: any[]): void;

    generateLayoutFile(...args: any[]): void;

    generateNGINXConfig(...args: any[]): void;

    generateProfileConfigFile(...args: any[]): void;

    generateProjectMainFile(...args: any[]): void;

    generateTypescriptModels(...args: any[]): void;

    generateWebpackBuildTools(...args: any[]): void;

    generateWebpackConfig(...args: any[]): void;

}

export class Core {
    constructor(...args: any[]);

    listen(...args: any[]): void;

    loadAPIs(...args: any[]): void;

    loadCRONJobs(...args: any[]): void;

    loadClients(...args: any[]): void;

    loadDB(...args: any[]): void;

    loadDependencies(...args: any[]): void;

    loadMailClient(...args: any[]): void;

    loadMigrations(...args: any[]): void;

    runLintTests(...args: any[]): void;

    runTests(...args: any[]): void;

    startAllCronJobs(...args: any[]): void;

    stopAllCronJobs(...args: any[]): void;

}

export class BaseAPIComponent {
	constructor(...args: any[]);
}

export namespace codeGenerator {
    const configRequiredForMethods: string[];

    const pgToTSMap: {
        bigint: string;
        bigserial: string;
        bit: string;
        bool: string;
        boolean: string;
        box: string;
        bytea: string;
        char: string;
        character: string;
        "character varying": string;
        cidr: string;
        cirle: string;
        date: string;
        decimal: string;
        "double precision": string;
        float8: string;
        inet: string;
        int: string;
        int2: string;
        int4: string;
        int8: string;
        integer: string;
        interval: string;
        json: string;
        jsonb: string;
        line: string;
        lseg: string;
        macaddr: string;
        money: string;
        numeric: string;
        path: string;
        pg_lsn: string;
        point: string;
        polygon: string;
        real: string;
        serial: string;
        serial2: string;
        serial4: string;
        serial8: string;
        smallint: string;
        smallserial: string;
        text: string;
        time: string;
        timestamp: string;
        timestamptz: string;
        timetz: string;
        tsquery: string;
        tsvector: string;
        txid_snapshot: string;
        "user-defined": string;
        uuid: string;
        varbit: string;
        varchar: string;
        xml: string;
    };

    function buildLayoutFile(...args: any[]): void;

    function checkConfig(...args: any[]): void;

    function checkOutputPath(...args: any[]): void;

    function generateBasicProject(...args: any[]): void;

    function generateBlankProject(...args: any[]): void;

    function generateCommonConfigFile(...args: any[]): void;

    function generateConfigFile(...args: any[]): void;

    function generateDocs(...args: any[]): void;

    function generateFolders(...args: any[]): void;

    function generateGitignore(...args: any[]): void;

    function generateImagesRedirectNGINXConfig(...args: any[]): void;

    function generateIndexConfigFile(...args: any[]): void;

    function generateLayoutFile(...args: any[]): void;

    function generateNGINXConfig(...args: any[]): void;

    function generateProfileConfigFile(...args: any[]): void;

    function generateProjectMainFile(...args: any[]): void;

    function generateTypescriptModels(...args: any[]): void;

    function generateWebpackBuildTools(...args: any[]): void;

    function generateWebpackConfig(...args: any[]): void;

    function testBuildLayoutFile(): any;

    function testCheckConfig(): void;

    function testCheckOutputPath(): any;

    function testGenerateBasicProject(): any;

    function testGenerateBlankProject(): any;

    function testGenerateCommonConfigFile(): any;

    function testGenerateConfigFile(): any;

    function testGenerateDocs(): any;

    function testGenerateFolders(): any;

    function testGenerateGitignore(): any;

    function testGenerateImagesRedirectNGINXConfig(): any;

    function testGenerateIndexConfigFile(): any;

    function testGenerateLayoutFile(): any;

    function testGenerateNGINXConfig(): any;

    function testGenerateProfileConfigFile(): any;

    function testGenerateProjectMainFile(): any;

    function testGenerateTypescriptModels(ramster: any): any;

    function testGenerateWebpackBuildTools(): any;

    function testGenerateWebpackConfig(): any;

    function testMe(ramster: any): void;

}

export namespace csvPromise {
    function parse(...args: any[]): void;

    function stringify(...args: any[]): void;

    function testMe(): void;

    function testParse(): any;

    function testStringify(): any;

}

export namespace toolbelt {
    function arraySort(array: unknown[], orderBy: any, caseSensitiveOption: any): any;

    function changeKeyCase(keyMap: any, input: any, outputType: any): any;

    function checkRoutes(route: any, routes: any): any;

    function decodeQueryValues(object: any): any;

    function describeSuiteConditionally(condition: any, suiteText: any, suiteMethod: any): any;

    function emptyToNull(data: any): any;

    function findVertexByIdDFS(vertexId: any, graph: any, action: any): any;

    function generateRandomNumber(length: any): any;

    function generateRandomString(length: any, stringType: any): any;

    function getFolderSize(folderPath: any, unit: any): any;

    function getNested(parent: any, field: any): any;

    function parseDate(date: any): any;

    function runTestConditionally(condition: any, testText: any, testMethod: any): any;

    function setNested(parent: any, field: any, value: any): any;

}

