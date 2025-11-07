// 文件：src/libs/DataManager.ts

import {
  PluginConfig,
  PluginData,
  CacheData,
  DEFAULT_CONFIG,
  DEFAULT_CACHE,
  DEFAULT_PLUGIN_DATA,
  STORAGE_NAMES,
  GroupConfig,
  GroupCategory,
} from "../types/data";
import * as CardUtils from "../utils/index";

/**
 * 卡包ID类
 */
export enum DeckId {
  DEFAULT = "20230218211946-2kw8jgx",
  TEMPORARY = "20251103121413-a4s0bfv",
}

/**
 * 数据管理器类
 * 职责：统一管理插件配置和缓存数据
 */
export class DataManager {
  private plugin: any;
  private config: PluginConfig;
  private cache: CacheData;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.config = { ...DEFAULT_CONFIG };
    this.cache = { ...DEFAULT_CACHE };
  }

  // ==================== 初始化 ====================

  /**
   * 初始化数据管理器
   */
  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.loadCache();
  }

  // ==================== 配置管理 ====================

  /**
   * 加载配置文件
   */
  private async loadConfig(): Promise<void> {
    try {
      const storedConfig = await this.plugin.loadData(STORAGE_NAMES.CONFIG);

      if (storedConfig) {
        // 合并存储的配置和默认配置，确保新字段有默认值
        this.config = {
          ...DEFAULT_CONFIG,
          ...storedConfig,
          groups: this.mergeGroups(storedConfig.groups || []),
          groupCategories:
            storedConfig.groupCategories || DEFAULT_CONFIG.groupCategories,
        };
      } else {
        this.config = { ...DEFAULT_CONFIG };
      }
    } catch (error) {
      console.error("加载配置失败，使用默认配置:", error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 保存配置数据 (私有，由具体的更新方法调用)
   */
  private async saveConfig(): Promise<void> {
    try {
      await this.plugin.saveData(STORAGE_NAMES.CONFIG, this.config);
    } catch (error) {
      console.error("保存配置失败:", error);
      throw error;
    }
  }

  /**
   * 合并分组数据，确保新字段有默认值
   */
  private mergeGroups(storedGroups: any[]): any[] {
    return storedGroups.map((group) => ({
      ...DEFAULT_CONFIG.groups[0], // 使用第一个默认分组作为模板
      ...group,
    }));
  }

  /**
   * 获取完整插件数据
   */
  getPluginData(): PluginData {
    return {
      config: { ...this.config },
      cache: { ...this.cache },
    };
  }

  /**
   * 获取配置数据
   */
  getConfig(): PluginConfig {
    return { ...this.config };
  }

  /**
   * 更新配置数据
   */
  async updateConfig(newConfig: Partial<PluginConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    await this.saveConfig();
  }

  // ==================== 分组管理 ====================

  /**
   * 获取分组配置
   */
  getGroups(): any[] {
    return [...this.config.groups];
  }

  /**
   * 获取所有启用的分组
   */
  getEnabledGroups(): GroupConfig[] {
    return this.config.groups.filter((group) => group.enabled);
  }

  /**
   * 根据ID获取特定分组
   */
  getGroupById(groupId: string): GroupConfig | undefined {
    return this.config.groups.find((g) => g.id === groupId);
  }

  /**
   * 获取所有启用了"自动优先级调整"的分组
   */
  getPriorityEnabledGroups(): GroupConfig[] {
    return this.getEnabledGroups().filter((group) => group.priorityEnabled);
  }

  /**
   * 更新分组配置
   */
  async updateGroups(groups: any[]): Promise<void> {
    this.config.groups = groups;
    await this.saveConfig();
  }

  /**
   * 保存（新增或更新）单个分组
   */
  async saveGroup(groupToSave: GroupConfig): Promise<void> {
    const index = this.config.groups.findIndex((g) => g.id === groupToSave.id);
    if (index >= 0) {
      this.config.groups[index] = groupToSave;
    } else {
      this.config.groups.push(groupToSave);
    }
    await this.saveConfig();
  }

  /**
   * 删除单个分组
   */
  async deleteGroup(groupId: string): Promise<void> {
    this.config.groups = this.config.groups.filter((g) => g.id !== groupId);
    await this.saveConfig();
  }

  // ==================== 分组类别管理 ====================

  /**
   * 获取分组类别
   */
  getGroupCategories(): any[] {
    return [...this.config.groupCategories];
  }

  /**
   * 更新分组类别
   */
  async updateGroupCategories(categories: any[]): Promise<void> {
    this.config.groupCategories = categories;
    await this.saveConfig();
  }

  /**
   * 保存（新增或更新）单个类别
   */
  async saveCategory(categoryToSave: GroupCategory): Promise<void> {
    const index = this.config.groupCategories.findIndex(
      (c) => c.id === categoryToSave.id
    );
    if (index >= 0) {
      this.config.groupCategories[index] = categoryToSave;
    } else {
      this.config.groupCategories.push(categoryToSave);
    }
    await this.saveConfig();
  }

  /**
   * 删除单个类别（及其下的分组）
   */
  async deleteCategory(categoryId: string): Promise<void> {
    this.config.groupCategories = this.config.groupCategories.filter(
      (c) => c.id !== categoryId
    );
    // 同时删除该类别下的所有分组
    this.config.groups = this.config.groups.filter(
      (g) => g.categoryId !== categoryId
    );
    await this.saveConfig();
  }

  // ==================== 全局设置管理 ====================

  /**
   * 获取全局设置
   */
  getGlobalSettings(): {
    postponeDays: number;
    postponeEnabled: boolean;
    scanInterval: number;
    priorityScanEnabled: boolean;
    priorityScanInterval: number;
    cacheUpdateInterval: number;
  } {
    return {
      postponeDays: this.config.postponeDays,
      postponeEnabled: this.config.postponeEnabled,
      scanInterval: this.config.scanInterval,
      priorityScanEnabled: this.config.priorityScanEnabled,
      priorityScanInterval: this.config.priorityScanInterval,
      cacheUpdateInterval: this.config.cacheUpdateInterval,
    };
  }

  /**
   * 更新全局设置
   */
  async updateGlobalSettings(settings: {
    postponeDays?: number;
    postponeEnabled?: boolean;
    scanInterval?: number;
    priorityScanEnabled?: boolean;
    priorityScanInterval?: number;
    cacheUpdateInterval?: number;
  }): Promise<void> {
    if (settings.postponeDays !== undefined) {
      this.config.postponeDays = settings.postponeDays;
    }
    if (settings.postponeEnabled !== undefined) {
      this.config.postponeEnabled = settings.postponeEnabled;
    }
    if (settings.scanInterval !== undefined) {
      this.config.scanInterval = settings.scanInterval;
    }
    if (settings.priorityScanEnabled !== undefined) {
      this.config.priorityScanEnabled = settings.priorityScanEnabled;
    }
    if (settings.priorityScanInterval !== undefined) {
      this.config.priorityScanInterval = settings.priorityScanInterval;
    }
    if (settings.cacheUpdateInterval !== undefined) {
      this.config.cacheUpdateInterval = settings.cacheUpdateInterval;
    }
    await this.saveConfig();
  }

  // ==================== 缓存管理 ====================

  /**
   * 加载缓存数据
   */
  private async loadCache(): Promise<void> {
    try {
      const storedCache = await this.plugin.loadData(STORAGE_NAMES.CACHE);
      this.cache = storedCache || { ...DEFAULT_CACHE };
    } catch (error) {
      console.error("加载缓存失败，使用空缓存:", error);
      this.cache = { ...DEFAULT_CACHE };
    }
  }

  /**
   * 保存缓存数据
   */
  async saveCache(): Promise<void> {
    try {
      await this.plugin.saveData(STORAGE_NAMES.CACHE, this.cache);
    } catch (error) {
      console.error("保存缓存失败:", error);
      throw error;
    }
  }

  /**
   * 获取缓存数据
   */
  getCache(): CacheData {
    return { ...this.cache };
  }

  /**
   * 获取特定分组的缓存
   */
  getGroupCache(
    groupId: string
  ): { blockIds: string[]; timestamp: number } | null {
    return this.cache[groupId] || null;
  }

  /**
   * 检查缓存是否有效（基于配置中的 cacheUpdateInterval）
   */
  isCacheValid(groupId: string): boolean {
    const cache = this.cache[groupId];
    if (!cache) {
      return false;
    }
    const maxAgeMs = this.config.cacheUpdateInterval * 60 * 1000;
    return Date.now() - cache.timestamp < maxAgeMs;
  }

  /**
   * 更新分组缓存
   */
  async updateGroupCache(groupId: string, blockIds: string[]): Promise<void> {
    this.cache[groupId] = {
      blockIds,
      timestamp: Date.now(),
    };
    await this.saveCache();
  }

  /**
   * 清除特定分组的缓存
   */
  async clearGroupCache(groupId: string): Promise<void> {
    if (this.cache[groupId]) {
      delete this.cache[groupId];
      await this.saveCache();
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    this.cache = { ...DEFAULT_CACHE };
    await this.saveCache();
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache(
    maxAgeMs: number = 24 * 60 * 60 * 1000
  ): Promise<void> {
    const now = Date.now();
    let hasChanges = false;

    for (const groupId in this.cache) {
      if (now - this.cache[groupId].timestamp > maxAgeMs) {
        delete this.cache[groupId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.saveCache();
    }
  }

  // ==================== 缓存数据获取 ====================

  /**
   * 按组传递缓存数据
   * @param groupId 分组ID
   * @param requestType 请求类型：'blockIds' | 'timestamp' | 'cacheData'
   * @returns 根据请求类型返回相应的数据
   */
  getGroupCacheByType(
    groupId: string,
    requestType: "blockIds" | "timestamp" | "cacheData"
  ): string[] | number | { blockIds: string[]; timestamp: number } | null {
    const cache = this.cache[groupId];

    if (!cache) {
      return null;
    }

    switch (requestType) {
      case "blockIds":
        return [...cache.blockIds]; // 返回副本避免外部修改

      case "timestamp":
        return cache.timestamp;

      case "cacheData":
        return {
          blockIds: [...cache.blockIds],
          timestamp: cache.timestamp,
        };

      default:
        console.warn(`未知的请求类型: ${requestType}`);
        return null;
    }
  }

  // ==================== 查询执行 ====================

  /**
   * 执行分组查询（不包含缓存逻辑）
   * @param group 分组配置对象
   * @returns 查询到的块ID数组
   */
  async executeGroupQuery(group: any): Promise<string[]> {
    try {
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);
      return blockIds;
    } catch (error) {
      console.error(`分组 ${group.name} 查询失败:`, error);
      return [];
    }
  }

  /**
   * 执行查询并缓存结果
   */

  // ==================== 分组数据获取 ====================

  /**
   * 提供分组块ID数据（支持强制更新和queryFirst配置）
   * @param group 分组配置对象
   * @param forceUpdate 是否强制更新缓存
   * @returns 块ID数组
   */
  async provideGroupCacheBlockIds(
    group: GroupConfig,
    forceUpdate: boolean = false
  ): Promise<string[]> {
    try {
      // 强制更新：一律执行查询并更新缓存
      if (forceUpdate) {
        const blockIds = await this.executeGroupQuery(group);
        await this.updateGroupCache(group.id, blockIds);
        return blockIds;
      }

      // 非强制更新：根据queryFirst配置决定行为
      if (group.queryFirst) {
        // queryFirst为true：执行查询、更新缓存，然后返回结果
        const blockIds = await this.executeGroupQuery(group);
        await this.updateGroupCache(group.id, blockIds);
        return blockIds;
      } else {
        // queryFirst为false：使用缓存数据（如果缓存有效）
        if (this.isCacheValid(group.id)) {
          const cachedBlockIds = this.getGroupCacheByType(group.id, "blockIds");
          if (cachedBlockIds && Array.isArray(cachedBlockIds)) {
            return cachedBlockIds as string[];
          }
        }

        // 缓存无效或不存在时，执行查询并更新缓存
        const blockIds = await this.executeGroupQuery(group);
        await this.updateGroupCache(group.id, blockIds);
        return blockIds;
      }
    } catch (error) {
      console.error(`获取分组 ${group.name} 数据失败:`, error);
      return [];
    }
  }
  // ==================== 工具方法 ====================

  /**
   * 生成新的分组ID
   */
  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * 获取默认分组配置模板
   */
  getDefaultGroupTemplate(categoryId: string = "default"): any {
    return {
      id: this.generateId(),
      name: "新分组",
      sqlQuery: "SELECT * FROM blocks WHERE",
      enabled: true,
      priority: 50,
      priorityEnabled: true,
      categoryId: categoryId,
    };
  }

  /**
   * 获取默认类别配置模板
   */
  getDefaultCategoryTemplate(): any {
    return {
      id: this.generateId(),
      name: "新组别",
    };
  }

  // ==================== 数据清理 ====================

  /**
   * 清除所有分组和类别（用于卸载）
   */
  async clearGroupsAndCategories(): Promise<void> {
    this.config.groups = [];
    this.config.groupCategories = [];
    await this.saveConfig();
  }

  /**
   * 卸载时彻底清除所有数据文件
   */
  async destroyAllData(): Promise<void> {
    try {
      await this.plugin.removeData(STORAGE_NAMES.CONFIG);
      await this.plugin.removeData(STORAGE_NAMES.CACHE);
      console.log("Plugin data (config and cache) removed successfully.");
    } catch (error) {
      console.error("Failed to remove plugin data during uninstall:", error);
    }
  }
}
