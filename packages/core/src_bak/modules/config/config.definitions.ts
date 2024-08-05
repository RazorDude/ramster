export interface CommonConfig {
  appName: string // formerly - projectName
  logsPath: string

  // move to ramster package: server
  // apis: {
  //   [moduleName: string]: {
  //     anonymousAccessRoutes: string[]
  //     doNotLogRequestDataRoutes: string[]
  //     logForwardedForHeader: boolean
  //     loggedInUserFieldsToDisplayInRequestInfo: string[]
  //     logRemoteAddress: boolean
  //     nonLayoutDirectRoutes: string[]
  //     unauthorizedPageRedirectRoute: string
  //     passErrorToNext: boolean
  //   }
  // }
  // clients: {
  //   [moduleName: string]: {
  //     clientPath: string
  //     publicPath: string
  //     anonymousAccessRoutes: string[]
  //     doNotLogRequestDataRoutes: string[]
  //     logForwardedForHeader: boolean
  //     loggedInUserFieldsToDisplayInRequestInfo: string[]
  //     logRemoteAddress: boolean
  //     nonLayoutDirectRoutes: string[]
  //     notFoundRedirectRoutes: {
  //       default?: string
  //       authenticated?: string
  //     }
  //     redirectUnauthorizedPagesToNotFound: boolean
  //     passErrorToNext: boolean
  //   }
  // }

  // move to ramster package: cron-jobs
  // cronJobs: {
  //   path: string
  //   start?: boolean
  // }

  // move to ramster package: db
  // db: {
  //   modulePath: string
  //   dbType: string
  //   schema?: string
  //   pool?: {
  //     max: number
  //     min: number
  //     acquire: number
  //     idle: number
  //   }
  //   injectModules: {
  //     [moduleName: string]: {
  //       [moduleConfigFieldName: string]: unknown
  //     }
  //   }
  //   defaultImageOutputFileType?: string
  //   imageResizingOptions?: unknown[]
  // }

  // move to ramster package: email-client
  // emailClient: {}

  // move to ramster package: db
  // migrations: {
  //   startAPI: boolean
  //   gcpBackupsBucketName: string
  //   baseMigrationsPath: string
  //   seedFilesPath: string
  //   syncHistoryPath: string
  //   backupPath: string
  //   staticDataPath: string
  // }

  // move to ramster package: pubsub-client
  // pubSubClient?: {
  //   appName: string
  //   architectureName: string
  // }

  // move to ramster package: redis-store
  // redis: {
  //   // addProjectKeyPrefixToHandles?: boolean
  //   host?: string
  //   password?: string
  //   port?: number
  // }

  // misc stuff that may not be needed anymore:
  // apiModulesPath: string
  // clientModulesPath: string
  // clientModulesPublicPath: string
  // clientModulesPublicSourcesPath: string
  // devserver?: {
  //   stats: {
  //     all: boolean
  //     modules: boolean
  //     maxModules: number
  //     errors: boolean
  //     warnings: boolean
  //     moduleTrace: boolean
  //     errorDetails: true
  //   }
  // }
  // globalStoragePath: string
  // globalUploadPath: string
  // minimumRequiredCoverageLevel?: number
  // moduleList: string[]
  // projectVerion: number
  // webserver?: string
}

type _Config = CommonConfig & ProfileConfig
export interface Config extends _Config {}

export interface ProfileConfig {
  configProfileName: string
}
