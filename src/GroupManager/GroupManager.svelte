<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import SqlGroupsTab from './components/tabs/SqlGroupsTab.svelte';
  import GlobalConfigTab from './components/tabs/GlobalConfigTab.svelte';
  import GroupEditForm from './components/forms/GroupEditForm.svelte';
  import CategoryEditForm from './components/forms/CategoryEditForm.svelte';
  import type { GroupConfig, GroupCategory } from '../types/data';

  export let plugin: any;
  export let dataManager: any;
  export let onConfigUpdate: (groups: GroupConfig[]) => void;
  
  const dispatch = createEventDispatcher();
  
  // 状态管理
  let groupCategories: GroupCategory[] = [];
  let groups: GroupConfig[] = [];
  let editingGroup: GroupConfig | null = null;
  let editingCategory: GroupCategory | null = null;
  let isEditing = false;
  let isEditingCategory = false;
  let postponeDays: number = 2;
  let postponeEnabled: boolean = true;
  let scanInterval: number = 15;
  let priorityScanEnabled: boolean = true;
  let priorityScanInterval: number = 15;
  let cacheUpdateInterval: number = 30;
  let activeTab: 'global' | 'sql' = 'sql';
  let activeCategoryId: string = '';

  onMount(async () => {
    await loadData();
    await loadConfig();
  });

  async function loadData() {
    try {
      // 使用 dataManager 获取数据
      groupCategories = dataManager.getGroupCategories();
      groups = dataManager.getGroups();
      
      if (groupCategories.length === 0) {
        // 如果没有类别，创建一个默认类别
        const defaultCategory = dataManager.getDefaultCategoryTemplate();
        await dataManager.saveCategory(defaultCategory);
        groupCategories = [defaultCategory]; // 更新本地状态
      }
      
      activeCategoryId = groupCategories[0]?.id || '';
      
      // 确保所有分组都有 categoryId
      let groupsUpdated = false;
      const updatedGroups = groups.map(group => {
        if (!group.categoryId) {
          groupsUpdated = true;
          return { ...group, categoryId: activeCategoryId };
        }
        return group;
      });

      if (groupsUpdated) {
        groups = updatedGroups;
        await dataManager.updateGroups(groups); // 批量更新一次
      }
    } catch (error) {
      console.error('加载分组配置失败:', error);
      // 使用 dataManager 的默认模板
      const defaultCategory = dataManager.getDefaultCategoryTemplate();
      await dataManager.saveCategory(defaultCategory);
      groupCategories = [defaultCategory];
      groups = [];
      activeCategoryId = groupCategories[0].id;
    }
  }

  async function loadConfig() {
    try {
      // 使用 dataManager 获取全局配置
      const globalSettings = dataManager.getGlobalSettings();
      postponeDays = globalSettings.postponeDays;
      postponeEnabled = globalSettings.postponeEnabled;
      scanInterval = globalSettings.scanInterval;
      priorityScanEnabled = globalSettings.priorityScanEnabled;
      priorityScanInterval = globalSettings.priorityScanInterval;
      cacheUpdateInterval = globalSettings.cacheUpdateInterval;
    } catch (error) {
      console.error('加载配置失败:', error);
      // 使用 dataManager 的默认值
      postponeDays = 2;
      postponeEnabled = true;
      scanInterval = 15;
      priorityScanEnabled = true;
      priorityScanInterval = 15;
      cacheUpdateInterval = 30;
    }
  }
  
  function notifyConfigUpdate() {
    if (onConfigUpdate) {
      onConfigUpdate(groups);
    }
    dispatch('configUpdated', { groups });
  }
  
  // 组别管理函数
  function addCategory() {
    editingCategory = dataManager.getDefaultCategoryTemplate();
    isEditingCategory = true;
  }
  
  function editCategory(category: GroupCategory) {
    editingCategory = { ...category };
    isEditingCategory = true;
  }
  
  async function deleteCategory(categoryId: string) {
    const categoryGroups = groups.filter(group => group.categoryId === categoryId);
    if (categoryGroups.length > 0) {
      if (!confirm(`该组别包含 ${categoryGroups.length} 个分组，确定要删除吗？（分组也将被一并删除）`)) {
        return;
      }
    } else {
       if (!confirm('确定要删除这个组别吗？')) {
         return;
       }
    }
    
    await dataManager.deleteCategory(categoryId);
    await loadData(); // 重新加载数据
    
    // 如果删除的是当前激活的组别，切换到第一个
    if (activeCategoryId === categoryId && groupCategories.length > 0) {
      activeCategoryId = groupCategories[0].id;
    } else if (groupCategories.length === 0) {
      activeCategoryId = '';
    }
    
    notifyConfigUpdate();
  }
  
  async function saveCategory(category: GroupCategory) {
    if (!category.name.trim()) {
      alert('组别名称不能为空');
      return;
    }
    
    const isNewCategory = !groupCategories.some(c => c.id === category.id);
    
    await dataManager.saveCategory(category);
    await loadData();
    
    if (isNewCategory) {
      activeCategoryId = category.id;
    }
    
    cancelEditCategory();
    notifyConfigUpdate();
  }
  
  function cancelEditCategory() {
    editingCategory = null;
    isEditingCategory = false;
  }
  
  function switchCategory(categoryId: string) {
    activeCategoryId = categoryId;
  }
  
  // 分组管理函数
  function addGroup() {
    editingGroup = dataManager.getDefaultGroupTemplate(activeCategoryId);
    isEditing = true;
  }
  
  function editGroup(group: GroupConfig) {
    editingGroup = { ...group };
    isEditing = true;
  }
  
  async function deleteGroup(group: GroupConfig) {
    if (confirm('确定要删除这个分组吗？')) {
      await dataManager.deleteGroup(group.id);
      await loadData();
      notifyConfigUpdate();
    }
  }
  
  async function toggleGroup(groupToToggle: GroupConfig) {
    const groupIndex = groups.findIndex(g => g.id === groupToToggle.id);
    if (groupIndex === -1) return;
    
    const updatedGroup = { ...groups[groupIndex], enabled: !groups[groupIndex].enabled };
    await dataManager.saveGroup(updatedGroup);
    
    // 局部更新UI，避免全量刷新
    groups[groupIndex] = updatedGroup;
    groups = [...groups]; // 触发Svelte的响应式更新
    notifyConfigUpdate();
  }
  
  async function saveGroup(group: GroupConfig) {
    if (!group.sqlQuery.trim()) {
      alert('SQL查询语句不能为空');
      return;
    }
    
    if (!group.name.trim()) {
      alert('分组名称不能为空');
      return;
    }
    
    await dataManager.saveGroup(group);
    await loadData();
    cancelEdit();
    notifyConfigUpdate();
  }
  
  function cancelEdit() {
    editingGroup = null;
    isEditing = false;
  }
  
  async function updateGroupCategory(detail: { groupId: string, newCategoryId: string }) {
    const { groupId, newCategoryId } = detail;
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex >= 0) {
      const updatedGroup = { ...groups[groupIndex], categoryId: newCategoryId };
      await dataManager.saveGroup(updatedGroup);
      
      // 局部更新UI
      groups[groupIndex] = updatedGroup;
      groups = [...groups];
      notifyConfigUpdate();
    }
  }
  
  async function moveGroup(detail: { index: number, direction: 'up' | 'down' }) {
    const { index, direction } = detail;
    const categoryGroups = groups.filter(group => group.categoryId === activeCategoryId);
    const globalGroups = [...groups];
    let changed = false;
    
    if (direction === 'up' && index > 0) {
      const group1 = categoryGroups[index];
      const group2 = categoryGroups[index - 1];
      const index1 = globalGroups.findIndex(g => g.id === group1.id);
      const index2 = globalGroups.findIndex(g => g.id === group2.id);
      if (index1 !== -1 && index2 !== -1) {
        [globalGroups[index1], globalGroups[index2]] = [globalGroups[index2], globalGroups[index1]];
        changed = true;
      }
    } else if (direction === 'down' && index < categoryGroups.length - 1) {
      const group1 = categoryGroups[index];
      const group2 = categoryGroups[index + 1];
      const index1 = globalGroups.findIndex(g => g.id === group1.id);
      const index2 = globalGroups.findIndex(g => g.id === group2.id);
       if (index1 !== -1 && index2 !== -1) {
        [globalGroups[index1], globalGroups[index2]] = [globalGroups[index2], globalGroups[index1]];
        changed = true;
      }
    }

    if(changed) {
      groups = globalGroups;
      await dataManager.updateGroups(groups);
      notifyConfigUpdate();
    }
  }
  
  async function saveGlobalConfig() {
    await dataManager.updateGlobalSettings({
      postponeDays,
      postponeEnabled,
      scanInterval,
      priorityScanEnabled,
      priorityScanInterval,
      cacheUpdateInterval
    });
  }
</script>

<div class="group-manager">
  <div class="b3-dialog__content">
    {#if isEditing}
      <!-- 编辑分组表单 -->
      <GroupEditForm
        editingGroup={editingGroup}
        {plugin}
        on:save={e => saveGroup(e.detail)}
        on:cancel={cancelEdit}
      />
    {:else if isEditingCategory}
      <!-- 编辑组别表单 -->
      <CategoryEditForm
        editingCategory={editingCategory}
        on:save={e => saveCategory(e.detail)}
        on:cancel={cancelEditCategory}
      />
    {:else}
      <!-- 选项卡布局 -->
      <div class="tab-layout">
        <!-- 左侧选项卡导航 -->
        <div class="tab-nav">
          <div 
            class="tab-item {activeTab === 'sql' ? 'active' : ''}"
            on:click={() => activeTab = 'sql'}
          >
            <span class="tab-icon">🗃️</span>
            <span class="tab-label">SQL分组配置</span>
          </div>
          <div 
            class="tab-item {activeTab === 'global' ? 'active' : ''}"
            on:click={() => activeTab = 'global'}
          >
            <span class="tab-icon">🔧</span>
            <span class="tab-label">全局配置</span>
          </div>
        </div>
        
        <!-- 右侧内容区域 -->
        <div class="tab-content">
          {#if activeTab === 'global'}
            <!-- 全局配置标签页 -->
            <GlobalConfigTab
              bind:postponeDays
              bind:postponeEnabled
              bind:priorityScanEnabled
              bind:priorityScanInterval
              bind:cacheUpdateInterval
              on:saveGlobalConfig={saveGlobalConfig}
            />
          {:else}
            <!-- SQL分组配置标签页 -->
            <SqlGroupsTab
              {groupCategories}
              {groups}
              {activeCategoryId}
              on:addCategory={addCategory}
              on:editCategory={e => editCategory(e.detail)}
              on:deleteCategory={e => deleteCategory(e.detail)}
              on:switchCategory={e => switchCategory(e.detail)}
              on:addGroup={addGroup}
              on:editGroup={e => editGroup(e.detail)}
              on:deleteGroup={e => deleteGroup(e.detail)}
              on:toggleGroup={e => toggleGroup(e.detail)}
              on:moveGroup={e => moveGroup(e.detail)}
              on:updateGroupCategory={e => updateGroupCategory(e.detail)}
            />
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .group-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
    width: 100%;
  }
  
  .b3-dialog__content {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  /* 选项卡布局样式 */
  .tab-layout {
    display: flex;
    height: 100%;
    gap: 0;
    width: 100%;
  }
  
  .tab-nav {
    width: 180px;
    background: var(--b3-theme-surface);
    border-right: 1px solid var(--b3-theme-surface-light);
    padding: 20px 0;
    flex-shrink: 0;
  }
  
  .tab-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
  }
  
  .tab-item:hover {
    background: var(--b3-theme-surface-hover);
  }
  
  .tab-item.active {
    background: var(--b3-theme-primary-light);
    border-left-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
  
  .tab-icon {
    font-size: 16px;
  }
  
  .tab-label {
    font-weight: 500;
    font-size: 14px;
  }
  
  .tab-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
