<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import SqlGroupsTab from './components/tabs/SqlGroupsTab.svelte';
  import GlobalConfigTab from './components/tabs/GlobalConfigTab.svelte';
  import GroupEditForm from './components/forms/GroupEditForm.svelte';
  import CategoryEditForm from './components/forms/CategoryEditForm.svelte';
  import type { GroupConfig, GroupCategory } from './types/index.js';

  export let plugin: any;
  export let onConfigUpdate: (groups: any[]) => void;
  
  const dispatch = createEventDispatcher();
  
  // 状态管理
  let groupCategories: GroupCategory[] = [];
  let groups: GroupConfig[] = [];
  let editingGroup: GroupConfig | null = null;
  let editingCategory: GroupCategory | null = null;
  let isEditing = false;
  let isEditingCategory = false;
  let postponeDays: number = 2;
  let scanInterval: number = 15;
  let priorityScanEnabled: boolean = true;
  let activeTab: 'global' | 'sql' = 'sql';
  let activeCategoryId: string = '';

  onMount(async () => {
    await loadGroups();
    await loadConfig();
  });

  async function loadGroups() {
    try {
      const storedData = await plugin.loadData('menu-config');
      
      groupCategories = storedData?.groupCategories || [];
      
      if (groupCategories.length === 0) {
        groupCategories = [{ id: generateId(), name: '默认组别' }];
      }
      
      groups = storedData?.groups || [];
      activeCategoryId = groupCategories[0]?.id || '';
      
      if (groups.length > 0 && !groups[0].categoryId) {
        groups = groups.map(group => ({
          ...group,
          categoryId: activeCategoryId
        }));
      }
    } catch (error) {
      console.error('加载分组配置失败:', error);
      groupCategories = [{ id: generateId(), name: '默认组别' }];
      groups = [];
      activeCategoryId = groupCategories[0].id;
    }
  }

  async function loadConfig() {
    try {
      const storedData = await plugin.loadData('menu-config');
      postponeDays = storedData?.postponeDays || 2;
      scanInterval = storedData?.scanInterval || 15;
      priorityScanEnabled = storedData?.priorityScanEnabled !== undefined ? storedData.priorityScanEnabled : true;
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // 组别管理函数
  function addCategory() {
    editingCategory = {
      id: generateId(),
      name: '新组别'
    };
    isEditingCategory = true;
  }
  
  function editCategory(category: GroupCategory) {
    editingCategory = { ...category };
    isEditingCategory = true;
  }
  
  function deleteCategory(categoryId: string) {
    const categoryGroups = groups.filter(group => group.categoryId === categoryId);
    if (categoryGroups.length > 0) {
      if (!confirm(`该组别包含 ${categoryGroups.length} 个分组，确定要删除吗？`)) {
        return;
      }
    }
    
    if (confirm('确定要删除这个组别吗？')) {
      groups = groups.filter(group => group.categoryId !== categoryId);
      groupCategories = groupCategories.filter(cat => cat.id !== categoryId);
      
      if (activeCategoryId === categoryId && groupCategories.length > 0) {
        activeCategoryId = groupCategories[0].id;
      }
      
      saveGroups();
    }
  }
  
  function saveCategory(category: GroupCategory) {
    if (!category.name.trim()) {
      alert('组别名称不能为空');
      return;
    }
    
    const index = groupCategories.findIndex(cat => cat.id === category.id);
    
    if (index >= 0) {
      groupCategories[index] = { ...category };
    } else {
      groupCategories = [...groupCategories, { ...category }];
      activeCategoryId = category.id;
    }
    
    saveGroups();
    cancelEditCategory();
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
    editingGroup = {
      id: generateId(),
      name: '新分组',
      sqlQuery: 'SELECT * FROM blocks WHERE',
      enabled: true,
      priority: 50,
      priorityEnabled: true,
      categoryId: activeCategoryId
    };
    isEditing = true;
  }
  
  function editGroup(group: GroupConfig) {
    editingGroup = { ...group };
    isEditing = true;
  }
  
  function deleteGroup(index: number) {
    if (confirm('确定要删除这个分组吗？')) {
      const categoryGroups = groups.filter(group => group.categoryId === activeCategoryId);
      groups.splice(groups.indexOf(categoryGroups[index]), 1);
      saveGroups();
    }
  }
  
  function toggleGroup(index: number) {
    const categoryGroups = groups.filter(group => group.categoryId === activeCategoryId);
    const groupIndex = groups.indexOf(categoryGroups[index]);
    groups[groupIndex].enabled = !groups[groupIndex].enabled;
    saveGroups();
  }
  
  function saveGroup(group: GroupConfig) {
    if (!group.sqlQuery.trim()) {
      alert('SQL查询语句不能为空');
      return;
    }
    
    if (!group.name.trim()) {
      alert('分组名称不能为空');
      return;
    }
    
    const index = groups.findIndex(g => g.id === group.id);
    
    if (index >= 0) {
      groups[index] = { ...group };
    } else {
      groups = [...groups, { ...group }];
    }
    
    saveGroups();
    cancelEdit();
  }
  
  function cancelEdit() {
    editingGroup = null;
    isEditing = false;
  }
  
  function updateGroupCategory(groupId: string, newCategoryId: string) {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex >= 0) {
      groups[groupIndex].categoryId = newCategoryId;
      saveGroups();
    }
  }
  
  function moveGroup(index: number, direction: 'up' | 'down') {
    const categoryGroups = groups.filter(group => group.categoryId === activeCategoryId);
    
    if (direction === 'up' && index > 0) {
      const group1 = categoryGroups[index];
      const group2 = categoryGroups[index - 1];
      const index1 = groups.indexOf(group1);
      const index2 = groups.indexOf(group2);
      [groups[index1], groups[index2]] = [groups[index2], groups[index1]];
      saveGroups();
    } else if (direction === 'down' && index < categoryGroups.length - 1) {
      const group1 = categoryGroups[index];
      const group2 = categoryGroups[index + 1];
      const index1 = groups.indexOf(group1);
      const index2 = groups.indexOf(group2);
      [groups[index1], groups[index2]] = [groups[index2], groups[index1]];
      saveGroups();
    }
  }
  
  async function saveGroups() {
    try {
      const currentData = await plugin.loadData('menu-config');
      const updatedData = {
        ...currentData,
        groups: groups,
        groupCategories: groupCategories,
        postponeDays: postponeDays,
        scanInterval: scanInterval,
        priorityScanEnabled: priorityScanEnabled
      };
      
      await plugin.saveData('menu-config', updatedData);
      
      if (onConfigUpdate) {
        onConfigUpdate(groups);
      }
      
      dispatch('configUpdated', { groups });
      
      console.log('分组配置已保存');
    } catch (error) {
      console.error('保存分组配置失败:', error);
      alert('保存失败，请检查控制台');
    }
  }

  function saveGlobalConfig() {
    saveGroups();
  }
</script>

<div class="group-manager">
  <div class="b3-dialog__content">
    {#if isEditing}
      <!-- 编辑分组表单 -->
      <GroupEditForm
        {editingGroup}
        {plugin}
        onSave={saveGroup}
        onCancel={cancelEdit}
      />
    {:else if isEditingCategory}
      <!-- 编辑组别表单 -->
      <CategoryEditForm
        {editingCategory}
        onSave={saveCategory}
        onCancel={cancelEditCategory}
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
              {postponeDays}
              {scanInterval}
              {priorityScanEnabled}
              onSaveGlobalConfig={saveGlobalConfig}
            />
          {:else}
            <!-- SQL分组配置标签页 -->
            <SqlGroupsTab
              {groupCategories}
              {groups}
              {activeCategoryId}
              onAddCategory={addCategory}
              onEditCategory={editCategory}
              onDeleteCategory={deleteCategory}
              onSwitchCategory={switchCategory}
              onAddGroup={addGroup}
              onEditGroup={editGroup}
              onDeleteGroup={deleteGroup}
              onToggleGroup={toggleGroup}
              onMoveGroup={moveGroup}
              onUpdateGroupCategory={updateGroupCategory}
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