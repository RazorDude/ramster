import fs from 'fs/promises'
import path from 'path'

import {
  RamsterComponentUnloaded,
  RamsterModule,
  RamsterModuleType,
  RamsterModuleUnloaded
} from './ramster.core.definitions'

interface UnloadedModuleItem {
  unloadedComponents: { [componentName: string]: RamsterComponentUnloaded }
  unloadedModule: RamsterModuleUnloaded
  unloadedSubmodules: Record<string, UnloadedModuleItem>
}

/**
 * The core ramster class.
 * Creating an instance of this is used to start the app.
 */
export class Ramster extends RamsterModule<{}, {}> {
  type = RamsterModuleType.Core

  /**
   * Creates an instance of Ramster.
   * Sets the "modules" property to an empty object.
   */
  constructor() {
    super('ramster', {}, {})
    this.modules = {}
  }

  /**
   * Loads all modules in the modules directory by executing these steps:
   * 1. Imports them recursively via the importModules method.
   * 2. Loads them, their components and their submodules recursively, based on
   * their dependencies, via the loadModules method.
   */
  async _init(): Promise<void> {
    // const { modulesByPriority } = this
    const modulesPath = path.join(process.cwd(), 'modules')
    const moduleMap = await this.importModules(modulesPath)
    await this.loadModules(moduleMap)
  }

  /**
   * Imports all modules in the directory recursively. Goes through all modules
   * in a directory, importing them, their components and their submodules, and
   * mapping the list by the names of the modules, chained by a dot.
   */
  async importModules(modulesPath: string, modulesMapPath?: string):
    Promise<Record<string, UnloadedModuleItem>> {
    const isRoot = !!!modulesMapPath
    const mapKeyBase = isRoot ? `${modulesMapPath}.` : ''
    const modulesDir = await fs.readdir(modulesPath)
    let modulesMap: Record<string, UnloadedModuleItem> = {}
    for (const i in modulesDir) {
      const unloadedComponents: {
        [componentName: string]: RamsterComponentUnloaded
      } = {}
      const moduleName = modulesDir[i]
      const modulePath = path.join(modulesPath, moduleName)
      const componentsPath = path.join(modulePath, 'components')
      const mapKey = `${mapKeyBase}${moduleName}`
      const submodulesPath = path.join(modulePath, 'modules')
      const unloadedModule = (await import(
        path.join(modulePath,
        `${moduleName}.module`
      ))) as RamsterModuleUnloaded
      let componentsDir: string[] = []
      let hasSubmodules = false
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
      modulesMap[mapKey] = {
        unloadedComponents,
        unloadedModule,
        unloadedSubmodules: {}
      }
      if (hasSubmodules) {
        modulesMap[mapKey].unloadedSubmodules = await this.importModules(
          path.join(submodulesPath),
          mapKey
        )
      }
    }
    return modulesMap
  }

  /**
   * Loads a list of modules recuresively, based on a module map as generated
   * by the importModules method.
   */
  async loadModules(
    moduleMap: Record<string, UnloadedModuleItem>,
    loadOrder?: string[]
  ):
    Promise<void> {
    let isRoot = true
    let newLoadOrder: string[] = []
    if (loadOrder) {
      isRoot = false
      newLoadOrder = loadOrder?.map(item => item)
    }
    for (const modulePath in moduleMap) {
      const {
        unloadedComponents,
        unloadedModule,
        unloadedSubmodules
      } = moduleMap[modulePath]
      let moduleIndex = newLoadOrder.indexOf(modulePath)
      if (moduleIndex === -1) {
        newLoadOrder.push(modulePath)
        moduleIndex = +newLoadOrder.length
      }
      if (unloadedModule.dependencies?.length) {
        const { dependencies } = unloadedModule
        for (const dependencyModulePath in dependencies) {
          if (newLoadOrder.indexOf(dependencyModulePath) === -1) {
            newLoadOrder.push(dependencyModulePath)
          }
        }
      }
    }
  }
}
