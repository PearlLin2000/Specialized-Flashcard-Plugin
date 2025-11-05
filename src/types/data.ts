// 文件：src/types/data.ts

/**
 * 分组配置接口
 */
export interface GroupConfig {
  id: string;
  name: string;
  sqlQuery: string;
  enabled: boolean;
  priority: number;
  priorityEnabled: boolean;
  categoryId: string;
  useCache: boolean; //  [新增] 是否优先使用缓存
}

/**
 * 分组类别接口
 */
export interface GroupCategory {
  id: string;
  name: string;
}

/**
 * 缓存数据接口
 */
export interface CacheData {
  [groupId: string]: {
    blockIds: string[];
    timestamp: number;
  };
}

/**
 * 插件配置接口（用户设置）
 */
export interface PluginConfig {
  groups: GroupConfig[];
  groupCategories: GroupCategory[];
  postponeDays: number;
  postponeEnabled: boolean;
  scanInterval: number;
  priorityScanEnabled: boolean;
  priorityScanInterval: number;
  cacheUpdateInterval: number;
}

/**
 * 完整插件数据接口（包含配置和缓存）
 */
export interface PluginData {
  config: PluginConfig;
  cache: CacheData;
}

/**
 * 默认分组配置
 */
export const DEFAULT_GROUPS: GroupConfig[] = [
  {
    id: "1",
    name: "含指定标签（tag）",
    sqlQuery: "select * from blocks where tag like '#指定标签#'",
    enabled: true,
    priority: 50,
    priorityEnabled: true,
    categoryId: "default",
    useCache: true, // [新增] 默认启用
  },
  {
    id: "2",
    name: "所有闪卡",
    sqlQuery:
      "SELECT * FROM blocks WHERE id in (SELECT block_id FROM attributes WHERE name = 'custom-riff-decks')",
    enabled: true,
    priority: 5,
    priorityEnabled: false,
    categoryId: "default",
    useCache: true, // [新增] 默认启用
  },
];

/**
 * 默认分组类别
 */
export const DEFAULT_CATEGORIES: GroupCategory[] = [
  {
    id: "default",
    name: "默认组别（双击重命名）",
  },
];

/**
 * 默认插件配置
 */
export const DEFAULT_CONFIG: PluginConfig = {
  groups: DEFAULT_GROUPS,
  groupCategories: DEFAULT_CATEGORIES,
  postponeDays: 2,
  postponeEnabled: false,
  scanInterval: 15,
  priorityScanEnabled: false,
  priorityScanInterval: 15,
  cacheUpdateInterval: 30,
};

/**
 * 默认缓存数据
 */
export const DEFAULT_CACHE: CacheData = {};

/**
 * 默认完整数据
 */
export const DEFAULT_PLUGIN_DATA: PluginData = {
  config: DEFAULT_CONFIG,
  cache: DEFAULT_CACHE,
};

/**
 * 存储文件常量
 */
export const STORAGE_NAMES = {
  CONFIG: "plugin-config.json",
  CACHE: "cache-data.json",
} as const;
