class RamsterComponentBase<ModuleContext extends RamsterModule<{}, {}>> {
  /**
   * Contains a reference to the module, without the reference to the component.
   */
  private _moduleContext: ModuleContext

  /**
   * Returns the reference to the module context.
   */
  protected get moduleContext(): typeof this._moduleContext {
    return this._moduleContext
  }

  constructor(moduleContext: ModuleContext) {
    this._moduleContext = moduleContext
  }
}

export class RamsterComponent<
  ModuleContext extends RamsterModule<{}, {}>
> extends RamsterComponentBase<ModuleContext> {}

export type RamsterComponentUnloaded = typeof RamsterComponent

// doesn't look like we need the class to be abstract
// export abstract class RamsterModule {
// can't do it this way because "dependencies" is static, so it can't use generics
// export class RamsterModule<Dependencies extends RamsterModuleNewable[] | undefined> {
/**
 * The base module class that we use to define the core properties of a ramster module.
 * It's not exported on purpose, so that the private things in it are truly private outside of the class.
 * The exported child is RamsterModule, which is its first and only direct descendant.
 * TODO: context, imports, exports
 */
class RamsterModuleBase<
  ComponentsMap extends RamsterModuleComponentsMap,
  DependenciesMap extends RamsterModuleDependenciesMap
> {
  /**
   * Contains all components that belong to the module, mapped by name.
   */
  private _components: ComponentsMap
  /**
   * A flag used to deterimined whether the module has been initialized yet, or not.
   */
  private isInitialized: boolean = false
  /**
   * The name of the module.
   */
  private _moduleName: string
  /**
   * Contains all loaded modules, mapped by name.
   */
  private _modules: DependenciesMap

  /**
   * Sets one or more module components in the named map.
   */
  protected set components(newModules: typeof this._modules) {
    if (this.isInitialized) {
      throw new Error(`Cannot set the injected modules of module ${this.moduleName} after it has been initialized.`)
    }
    this._modules = { ...this._modules, ...newModules }
  }
  /**
   * Sets one or more loaded modules in the named map.
   */
  protected set modules(newModules: typeof this._modules) {
    if (this.isInitialized) {
      throw new Error(`Cannot set the injected modules of module ${this.moduleName} after it has been initialized.`)
    }
    this._modules = { ...this._modules, ...newModules }
  }
  /**
   * Sets the name of the module.
   */
  // protected set moduleName(moduleName: string) {
  //   if (this.isInitialized) {
  //     throw new Error(`Cannot set the name of module ${this.moduleName} after it has been initialized.`)
  //   }
  //   this._moduleName = moduleName
  // }

  /**
   * Returns all components that belong to the module, mapped by name.
   */
  public get components(): typeof this._components {
    return this._components
  }
  public static dependencies?: ('string' | RamsterModuleDependency<unknown>)[]
  /**
   * Singletons will be initialized only once *in their parent context*.
   */
  public static readonly isSingleton?: boolean
  /**
   * Returns the name of the module.
   */
  public get moduleName(): string {
    return this._moduleName
  }
  /**
   * Returns all loaded modules, mapped by name.
   */
  public get modules(): typeof this._modules {
    return this._modules
  }
  // public static readonly priority?: number
  public static readonly type: RamsterModuleType

  // TODO: docs for the function, non-module dependencies and named arguments
  // constructor(...args: RamsterModule[]) {
  //   this._components = {}
  //   this._modules = {}
  //   args.forEach(item => {
  //     this._modules[item.moduleName] = item
  //   })
  // }
  constructor(moduleName: string, dependendencies: DependenciesMap, componetns: ComponentsMap) {
    this._components = componetns
    this._moduleName = moduleName
    this._modules = dependendencies
  }

  /**
   * Performs all necessary asynchronous operations needed to set up dependencies and initial conidtions.
   * Is inteded to be overriden by child classes, as it is executed by the init method.
   */
  protected async _init(): Promise<void> {}

  /**
   * Initializes the module, running the _init function and setting isInitialized to true.
   */
  protected async init(): Promise<void> {
    await this._init()
    this.isInitialized = true
  }
}

export class RamsterModule<
  ComponentsMap extends RamsterModuleComponentsMap,
  DependenciesMap extends RamsterModuleDependenciesMap
> extends RamsterModuleBase<ComponentsMap, DependenciesMap> {}

export interface RamsterModuleComponentsMap {
  [componentName: string]: RamsterComponent<RamsterModule<{}, {}>>
}

export interface RamsterModuleDependenciesMap {
  [componentName: string]: RamsterModule<{}, {}>
}

// export interface RamsterModuleSubmodulesMap { [componentName: string]: RamsterModule }

export interface RamsterModuleDependency<DependencyType> {
  factory: Promise<DependencyType>
  name: string
}

export type RamsterModuleNewable<
  ComponentsMap extends RamsterModuleComponentsMap,
  DependenciesMap extends RamsterModuleDependenciesMap
> = new () => RamsterModule<ComponentsMap, DependenciesMap>

export enum RamsterModuleType {
  Core = 'core', // eslint-disable-line no-unused-vars
  DB = 'db', // eslint-disable-line no-unused-vars
  Other = 'other', // eslint-disable-line no-unused-vars
  Server = 'server' // eslint-disable-line no-unused-vars
}

export type RamsterModuleUnloaded = typeof RamsterModule
