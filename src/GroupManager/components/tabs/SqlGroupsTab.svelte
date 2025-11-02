<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GroupConfig, GroupCategory } from '../../types/data'; // 路径也需要向上两级
  import CategoryTabs from '../lists/CategoryTabs.svelte'; // 更正路径
  import GroupList from '../lists/GroupList.svelte';       // 更正路径

  export let groupCategories: GroupCategory[] = [];
  export let groups: GroupConfig[] = [];
  export let activeCategoryId: string = '';

  const dispatch = createEventDispatcher();

  // 辅助函数和计算属性
  let filteredGroups: GroupConfig[] = [];
  let groupCounts: { [categoryId: string]: number } = {};

  // 当 props 变化时，重新计算派生状态
  $: {
    // 1. 筛选出当前激活分类下的分组
    filteredGroups = groups.filter(g => g.categoryId === activeCategoryId);

    // 2. 计算每个分类下的分组数量
    groupCounts = groupCategories.reduce((acc, category) => {
      acc[category.id] = groups.filter(g => g.categoryId === category.id).length;
      return acc;
    }, {});
  }
</script>

<div class="sql-groups-tab">
  <!-- 类别标签页 -->
  <CategoryTabs
    categories={groupCategories}
    {activeCategoryId}
    {groupCounts}
    on:addCategory={() => dispatch('addCategory')}
    on:editCategory={e => dispatch('editCategory', e.detail)}
    on:deleteCategory={e => dispatch('deleteCategory', e.detail)}
    on:switchCategory={e => dispatch('switchCategory', e.detail)}
  />

  <!-- 分组列表 -->
  <GroupList
    groups={filteredGroups}
    categories={groupCategories}
    {activeCategoryId}
    on:editGroup={e => dispatch('editGroup', e.detail)}
    on:deleteGroup={e => dispatch('deleteGroup', e.detail)}
    on:toggleGroup={e => dispatch('toggleGroup', e.detail)}
    on:moveGroup={e => dispatch('moveGroup', e.detail)}
    on:updateGroupCategory={e => dispatch('updateGroupCategory', e.detail)}
  />

  <!-- 添加新分组按钮 -->
  <div class="tab-actions">
    <button class="add-group-btn" on:click={() => dispatch('addGroup')}>
      + 添加新分组
    </button>
  </div>
</div>

<style>
  .sql-groups-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .tab-actions {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }

  .add-group-btn {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .add-group-btn:hover {
    background: var(--b3-theme-primary-hover);
  }
</style>
