<script lang="ts">
  import CategoryTabs from '../lists/CategoryTabs.svelte';
  import GroupList from '../lists/GroupList.svelte';
  import type { GroupConfig, GroupCategory } from '../types/data';
  import { createEventDispatcher } from 'svelte';

  export let groupCategories: GroupCategory[] = [];
  export let groups: GroupConfig[] = [];
  export let activeCategoryId: string = '';

  const dispatch = createEventDispatcher();

  // 计算每个组别的分组数量
  $: groupCounts = (groupCategories || []).reduce((acc, category) => {
    acc[category.id] = (groups || []).filter(group => group.categoryId === category.id).length;
    return acc;
  }, {} as Record<string, number>);

  // 获取当前激活组别的分组
  $: currentGroups = (groups || []).filter(group => group.categoryId === activeCategoryId);
</script>

<div class="sql-groups">
  <!-- 组别切换栏 -->
  <CategoryTabs
    categories={groupCategories} 
    {activeCategoryId}
    {groupCounts}
    on:switchCategory={e => dispatch('switchCategory', e.detail)}
    on:editCategory={e => dispatch('editCategory', e.detail)}
    on:deleteCategory={e => dispatch('deleteCategory', e.detail)}
    on:addCategory={() => dispatch('addCategory')}
  />
  
  <!-- 分组列表 -->
  <GroupList
    groups={currentGroups}
    categories={groupCategories} 
    {activeCategoryId}
    on:editGroup={e => dispatch('editGroup', e.detail)}
    on:deleteGroup={e => dispatch('deleteGroup', e.detail)}
    on:toggleGroup={e => dispatch('toggleGroup', e.detail)}
    on:moveGroup={e => dispatch('moveGroup', e.detail)}
    on:updateGroupCategory={e => dispatch('updateGroupCategory', e.detail)}
  />
  
  <!-- 添加分组按钮 -->
  <div class="add-group-footer">
    <button class="add-button-small" on:click={() => dispatch('addGroup')}>
      添加分组
    </button>
  </div>
</div>

<style>
  .sql-groups {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .add-group-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--b3-theme-surface-light);
  }
  
  .add-button-small {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }
</style>
