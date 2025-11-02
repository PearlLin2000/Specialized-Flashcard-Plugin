<script lang="ts">
  import CategoryTabs from '../lists/CategoryTabs.svelte';
  import GroupList from '../lists/GroupList.svelte';
  import type { GroupConfig, GroupCategory } from '../../types/index.js';

  export let groupCategories: GroupCategory[] = []; // 添加默认值
  export let groups: GroupConfig[] = []; // 添加默认值
  export let activeCategoryId: string = ''; // 添加默认值
  export let onAddCategory: () => void;
  export let onEditCategory: (category: GroupCategory) => void;
  export let onDeleteCategory: (categoryId: string) => void;
  export let onSwitchCategory: (categoryId: string) => void;
  export let onAddGroup: () => void;
  export let onEditGroup: (group: GroupConfig) => void;
  export let onDeleteGroup: (index: number) => void;
  export let onToggleGroup: (index: number) => void;
  export let onMoveGroup: (index: number, direction: 'up' | 'down') => void;
  export let onUpdateGroupCategory: (groupId: string, newCategoryId: string) => void;

  // 计算每个组别的分组数量 - 添加空值检查
  $: groupCounts = (groupCategories || []).reduce((acc, category) => {
    acc[category.id] = (groups || []).filter(group => group.categoryId === category.id).length;
    return acc;
  }, {} as Record<string, number>);

  // 获取当前激活组别的分组 - 添加空值检查
  $: currentGroups = (groups || []).filter(group => group.categoryId === activeCategoryId);
</script>

<div class="sql-groups">
  <!-- 组别切换栏 -->
  <CategoryTabs
    categories={groupCategories} 
    {activeCategoryId}
    {groupCounts}
    onSwitchCategory={onSwitchCategory}
    onEditCategory={onEditCategory}
    onDeleteCategory={onDeleteCategory}
    onAddCategory={onAddCategory}
  />
  
  <!-- 分组列表 -->
  <GroupList
    groups={currentGroups}
    categories={groupCategories} 
    {activeCategoryId}
    onEditGroup={onEditGroup}
    onDeleteGroup={onDeleteGroup}
    onToggleGroup={onToggleGroup}
    onMoveGroup={onMoveGroup}
    onUpdateGroupCategory={onUpdateGroupCategory}
  />
  
  <!-- 添加分组按钮 -->
  <div class="add-group-footer">
    <button class="add-button-small" on:click={onAddGroup}>
      添加分组
    </button>
  </div>
</div>

<style>
  /* 样式保持不变 */
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