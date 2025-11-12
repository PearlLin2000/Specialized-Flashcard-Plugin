// src/stores/groupManagerStore.ts

import { writable, get } from 'svelte/store';
import type { GroupConfig, GroupCategory, GlobalSettings } from '../types/data';

// --- 辅助工具：防抖函数 ---
function debounce(func, delay = 500) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// --- 状态接口定义 ---
export interface GroupManagerState {
  groupCategories: GroupCategory[];
  groups: GroupConfig[];
  globalSettings: GlobalSettings;
  activeTab: 'global' | 'sql' | 'instructions';
  activeCategoryId: string;
  isEditingGroup: boolean;
  editingGroup: GroupConfig | null;
  isEditingCategory: boolean;
  editingCategory: GroupCategory | null;
  isInitialLoad: boolean;
}

// --- 初始状态 ---
const initialState: GroupManagerState = {
  groupCategories: [],
  groups: [],
  globalSettings: {
    postponeDays: 2,
    postponeEnabled: true,
    scanInterval: 15,
    priorityScanEnabled: true,
    priorityScanInterval: 15,
    cacheUpdateInterval: 30,
  },
  activeTab: 'sql',
  activeCategoryId: '',
  isEditingGroup: false,
  editingGroup: null,
  isEditingCategory: false,
  editingCategory: null,
  isInitialLoad: true,
};

// --- 自定义 Store 工厂函数 ---
function createGroupManagerStore(dataManager: any, plugin: any) {
  const { subscribe, set, update } = writable<GroupManagerState>(initialState);

  // 防抖版的全局配置保存函数
  const debouncedSaveGlobalConfig = debounce(async () => {
    const currentState = get({ subscribe }); // 获取当前 store 的最新状态
    await dataManager.updateGlobalSettings(currentState.globalSettings);
    // plugin.showMsg('全局配置已自动保存', 2000); // 可以选择性开启提示
  }, 800);

  // 订阅 globalSettings 的变化以触发自动保存
  subscribe(state => {
    // 仅在非初始加载且在全局配置页时触发
    if (!state.isInitialLoad && state.activeTab === 'global') {
      debouncedSaveGlobalConfig();
    }
  });
  
  // --- 暴露给外部的方法 ---
  const methods = {
    // 通知外部更新
    notifyConfigUpdate: () => {
      const { groups } = get({ subscribe });
      // 假设 plugin 有一个事件派发器或回调
      plugin.onConfigUpdate?.(groups);
    },

    // --- 数据加载 ---
    loadInitialData: async () => {
      try {
        const categories = dataManager.getGroupCategories();
        let currentGroups = dataManager.getGroups();
        const settings = dataManager.getGlobalSettings();

        let activeCatId = categories.length > 0 ? categories[0].id : '';

        // 处理默认分类
        if (categories.length === 0) {
          const defaultCategory = dataManager.getDefaultCategoryTemplate();
          await dataManager.saveCategory(defaultCategory);
          categories.push(defaultCategory);
          activeCatId = defaultCategory.id;
        }

        // 迁移旧数据
        let groupsUpdated = false;
        const updatedGroups = currentGroups.map(group => {
          if (!group.categoryId) {
            groupsUpdated = true;
            return { ...group, categoryId: activeCatId };
          }
          return group;
        });

        if (groupsUpdated) {
          currentGroups = updatedGroups;
          await dataManager.updateGroups(currentGroups);
        }

        update(s => ({
          ...s,
          groupCategories: categories,
          groups: currentGroups,
          globalSettings: { ...s.globalSettings, ...settings },
          activeCategoryId: activeCatId,
        }));
        
      } catch (error) {
        console.error('加载配置失败:', error);
        // 出错时依然保证有一个默认分类
        const defaultCategory = dataManager.getDefaultCategoryTemplate();
        await dataManager.saveCategory(defaultCategory);
        update(s => ({ 
            ...s, 
            groupCategories: [defaultCategory],
            activeCategoryId: defaultCategory.id
        }));
      } finally {
        setTimeout(() => update(s => ({ ...s, isInitialLoad: false })), 100);
      }
    },
    
    // --- UI 状态操作 ---
    setActiveTab: (tabId: GroupManagerState['activeTab']) => {
      update(s => ({ ...s, activeTab: tabId }));
    },
    
    // --- 分类 (Category) 操作 ---
    switchCategory: (categoryId: string) => {
      update(s => ({ ...s, activeCategoryId: categoryId }));
    },
    addCategory: () => {
      const newCategory = dataManager.getDefaultCategoryTemplate();
      update(s => ({ ...s, isEditingCategory: true, editingCategory: newCategory }));
    },
    editCategory: (category: GroupCategory) => {
      update(s => ({ ...s, isEditingCategory: true, editingCategory: { ...category } }));
    },
    cancelEditCategory: () => {
      update(s => ({ ...s, isEditingCategory: false, editingCategory: null }));
    },
    saveCategory: async (category: GroupCategory) => {
      if (!category.name.trim()) {
        alert('组别名称不能为空');
        return;
      }
      const isNew = !get({subscribe}).groupCategories.some(c => c.id === category.id);
      await dataManager.saveCategory(category);
      await methods.loadInitialData(); // 重新加载以同步状态
      if(isNew) {
        update(s => ({ ...s, activeCategoryId: category.id }));
      }
      methods.cancelEditCategory();
      methods.notifyConfigUpdate();
    },
    deleteCategory: async (categoryId: string) => {
      // 确认逻辑
      if (!confirm('确定要删除这个组别及其下的所有分组吗？')) return;

      await dataManager.deleteCategory(categoryId);
      await methods.loadInitialData(); // 重新加载
      methods.notifyConfigUpdate();
    },

    // --- 分组 (Group) 操作 ---
    addGroup: () => {
      const activeCatId = get({subscribe}).activeCategoryId;
      const newGroup = dataManager.getDefaultGroupTemplate(activeCatId);
      update(s => ({ ...s, isEditingGroup: true, editingGroup: newGroup }));
    },
    editGroup: (group: GroupConfig) => {
      update(s => ({ ...s, isEditingGroup: true, editingGroup: { ...group } }));
    },
    cancelEdit: () => {
      update(s => ({ ...s, isEditingGroup: false, editingGroup: null }));
    },
    saveGroup: async (group: GroupConfig) => {
      if (!group.sqlQuery.trim() || !group.name.trim()) {
        alert('SQL查询和分组名称不能为空');
        return;
      }
      await dataManager.saveGroup(group);
      await methods.loadInitialData(); // 重新加载
      methods.cancelEdit();
      methods.notifyConfigUpdate();
    },
    deleteGroup: async (group: GroupConfig) => {
      if (confirm('确定要删除这个分组吗？')) {
        await dataManager.deleteGroup(group.id);
        await methods.loadInitialData(); // 重新加载
        methods.notifyConfigUpdate();
      }
    },
    toggleGroup: async (groupToToggle: GroupConfig) => {
      const updatedGroup = { ...groupToToggle, enabled: !groupToToggle.enabled };
      await dataManager.saveGroup(updatedGroup);
      update(s => ({
        ...s,
        groups: s.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g)
      }));
      methods.notifyConfigUpdate();
    },
    updateGroupCategory: async (detail: { groupId: string, newCategoryId: string }) => {
        const { groupId, newCategoryId } = detail;
        const group = get({subscribe}).groups.find(g => g.id === groupId);
        if (group) {
            const updatedGroup = { ...group, categoryId: newCategoryId };
            await dataManager.saveGroup(updatedGroup);
            update(s => ({
                ...s,
                groups: s.groups.map(g => g.id === groupId ? updatedGroup : g)
            }));
            methods.notifyConfigUpdate();
        }
    },
    moveGroup: async (detail: { fromIndex: number, toIndex: number }) => {
        const { fromIndex, toIndex } = detail;
        const state = get({ subscribe });
        const categoryGroups = state.groups.filter(g => g.categoryId === state.activeCategoryId);

        if (fromIndex < 0 || fromIndex >= categoryGroups.length || toIndex < 0 || toIndex >= categoryGroups.length) {
            return; // 无效移动
        }

        const globalFromId = categoryGroups[fromIndex].id;
        const globalToId = categoryGroups[toIndex].id;

        const globalFromIndex = state.groups.findIndex(g => g.id === globalFromId);
        const globalToIndex = state.groups.findIndex(g => g.id === globalToId);
        
        const newGroups = [...state.groups];
        [newGroups[globalFromIndex], newGroups[globalToIndex]] = [newGroups[globalToIndex], newGroups[globalFromIndex]];

        await dataManager.updateGroups(newGroups);
        update(s => ({ ...s, groups: newGroups }));
        methods.notifyConfigUpdate();
    },

    // --- 全局配置操作 ---
    updateGlobalSetting: <T extends keyof GlobalSettings>(key: T, value: GlobalSettings[T]) => {
      update(s => ({
        ...s,
        globalSettings: {
          ...s.globalSettings,
          [key]: value,
        },
      }));
    },
  };
  
  return {
    subscribe,
    ...methods
  };
}

// --- Store 单例导出与初始化 ---
export let groupManagerStore: ReturnType<typeof createGroupManagerStore>;

export function initializeStore(dataManager: any, plugin: any) {
  if (!groupManagerStore) {
    groupManagerStore = createGroupManagerStore(dataManager, plugin);
  }
  return groupManagerStore;
}
