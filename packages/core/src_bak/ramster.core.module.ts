import fs from 'fs/promises'
import path from 'path'

// import { getNested, setNested } from '@ramster/general-tools'
import merge from 'deepmerge'

import {
  RamsterComponentUnloaded,
  RamsterModule,
  RamsterModuleType,
  RamsterModuleUnloaded
} from './ramster.core.definitions'

interface DependencyGraph {
  [moduleName: string]: DependencyGraph
}

interface UnloadedModuleItem {
  unloadedComponents: { [componentName: string]: RamsterComponentUnloaded }
  unloadedModule: RamsterModuleUnloaded
  unloadedSubmodules: Record<string, UnloadedModuleItem>
}

/**
 * The core ramster class. Creating an instance of this is used to start your app.
 */
export class Ramster extends RamsterModule<{}, {}> {
  /**
   * Contains a map of the loaded modules by priority.
   */
  modulesByPriority: { [priority: string]: string[] }
  type = RamsterModuleType.Core

  /**
   * Creates an instance of Ramster. Sets the "modules" property to an empty object.
   */
  constructor() {
    super('ramster', {}, {})
    this.modules = {}
    this.modulesByPriority = {}
  }

  /**
   * Loads all modules in the modules directory by executing the following steps:
   * 1. Starting from the root modules directory, goes through all modules and their submodules, importing them, their
   * components and their submodules, and mapping the list by the names of the modules, chained by a dot.
   * 2. Iterates through the list of imported modules, mapping their priority of loading based on the dependencies.
   * 3. Iterates through the modules mapped by priority, initializing them and their components, and injecting their dependencies that were initialized in previous iterations.
   */
  async _init(): Promise<void> {
    // const { modulesByPriority } = this
    const modulesPath = path.join(process.cwd(), 'modules')
    // const { modulesMap: unloadedModulesMap } = await this.importModules(modulesPath)
    await this.importModules(modulesPath)
    // automap priority based on dependencies and throw an error for circular ones
    // for (const moduleName in unloadedModulesMap) {
    //   const { unloadedModule } = unloadedModulesMap[moduleName]
    //   if (unloadedModule.dependencies) {
    //     // TODO: support injection via factory (i.e. RamsterModuleDependency)
    //     unloadedModule.dependencies.forEach(item => {
    //       if (typeof item === 'string') {
    //         // if ()
    //       }
    //     })
    //   }
    // }
  }
  /**
   * Loads all modules in the modules directory recursively. Goes through all modules in a directory, importing them,
   * their components and their submodules, and mapping the list by the names of the modules, chained by a dot.
   */
  async importModules(
    modulesPath: string,
    modulesMapPath?: string,
    rootDependencyMap?: DependencyGraph
  ): Promise<{
    dependencyMap: DependencyGraph
    modulesMap: Record<string, UnloadedModuleItem>
  }> {
    const dependencyMap: DependencyGraph = {}
    const isRoot = !!!modulesMapPath
    const modulesDir = await fs.readdir(modulesPath)
    let modulesMap: Record<string, UnloadedModuleItem> = {}
    // let parentModuleName = ''
    let mapKeyBase = ''
    if (isRoot) {
      // const parentModules = modulesMapPath!.split('.')
      mapKeyBase = `${modulesMapPath}.`
      // parentModuleName = parentModules[parentModules.length ? parentModules.length - 1 : 0]
    }
    for (const i in modulesDir) {
      const unloadedComponents: { [componentName: string]: RamsterComponentUnloaded } = {}
      const moduleName = modulesDir[i]
      const modulePath = path.join(modulesPath, moduleName)
      const componentsPath = path.join(modulePath, 'components')
      // TODO: possibly, remove this
      // const dependencyMapKey = isRoot ? moduleName : parentModuleName
      const dependencyMapKey = moduleName
      const mapKey = `${mapKeyBase}${moduleName}`
      const submodulesPath = path.join(modulePath, 'modules')
      const unloadedModule = (await import(path.join(modulePath, `${moduleName}.module`))) as RamsterModuleUnloaded
      let componentsDir: string[] = []
      let hasSubmodules = false
      // map dependencies
      if (typeof dependencyMap[dependencyMapKey] === 'undefined') {
        dependencyMap[dependencyMapKey] = {}
      }
      if (unloadedModule.dependencies) {
        unloadedModule.dependencies.forEach(dependencyItem => {
          const dependencyName = typeof dependencyItem === 'string' ? dependencyItem : dependencyItem.name
          if (!isRoot && !rootDependencyMap?.[dependencyName]) {
            throw new Error(
              `At module path ${mapKey}: invalid dependency ${dependencyName} - ` +
                'dependencies must be root-level modules.'
            )
          }
          if (typeof dependencyMap[dependencyMapKey][dependencyName] === 'undefined') {
            dependencyMap[dependencyMapKey][dependencyName] = {}
          }
        })
      }
      // find and import components
      try {
        componentsDir = await fs.readdir(componentsPath)
      } catch (e) {}
      for (const i in componentsDir) {
        const componentName = componentsDir[i]
        const componentPath = path.join(componentsPath, componentName)
        const UnloadedComponent = (await import(
          path.join(componentPath, `${componentName}.component`)
        )) as RamsterComponentUnloaded
        unloadedComponents[componentName] = UnloadedComponent
      }
      // find and import submodules
      try {
        await fs.lstat(submodulesPath)
        hasSubmodules = true
      } catch (e) {}
      modulesMap[mapKey] = { unloadedComponents, unloadedModule, unloadedSubmodules: {} }
      if (hasSubmodules) {
        const { dependencyMap: submodulesDependencyMap, modulesMap: submodulesMap } = await this.importModules(
          path.join(submodulesPath),
          mapKey,
          isRoot ? dependencyMap : rootDependencyMap
        )
        dependencyMap[moduleName] = merge(dependencyMap[moduleName], submodulesDependencyMap)
        modulesMap = { ...modulesMap, ...submodulesMap }
        // TODO: consider removing this, or removing the map keys
        modulesMap[mapKey].unloadedSubmodules = submodulesMap
      }
    }
    return { dependencyMap, modulesMap }
  }
}
