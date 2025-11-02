<script lang="ts">
  import type { CategoryTabsProps } from '../../types/index.js';
  
  export let categories: CategoryTabsProps['categories'] = []; // 🟢 添加默认值
  export let activeCategoryId: CategoryTabsProps['activeCategoryId'] = '';
  export let groupCounts: CategoryTabsProps['groupCounts'] = {};
  export let onSwitchCategory: CategoryTabsProps['onSwitchCategory'];
  export let onEditCategory: CategoryTabsProps['onEditCategory'];
  export let onDeleteCategory: CategoryTabsProps['onDeleteCategory'];
  export let onAddCategory: CategoryTabsProps['onAddCategory'];
</script>

<div class="category-tabs">
  {#each categories as category} <!-- 🟢 现在 categories 确保是数组 -->
    <div 
      class="category-tab {activeCategoryId === category.id ? 'active' : ''}"
      on:click={() => onSwitchCategory(category.id)}
      on:dblclick={() => onEditCategory(category)}
    >
      <span class="category-name">{category.name}</span>
      <span class="category-count">
        ({groupCounts[category.id] || 0})
      </span>
      {#if categories.length > 1}
        <button 
          class="category-delete-btn"
          on:click|stopPropagation={() => onDeleteCategory(category.id)}
        >
          ×
        </button>
      {/if}
    </div>
  {/each}
  <button class="add-category-btn" on:click={onAddCategory}>
    +
  </button>
</div>

<style>
  /* 样式保持不变 */
  .category-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 8px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 6px;
    flex-wrap: wrap;
  }
  
  .category-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .category-tab:hover {
    background: var(--b3-theme-surface-hover);
  }
  
  .category-tab.active {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
  
  .category-name {
    font-size: 13px;
    font-weight: 500;
  }
  
  .category-count {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
  }
  
  .category-delete-btn {
    background: none;
    border: none;
    color: var(--b3-theme-on-surface-light);
    cursor: pointer;
    padding: 1px 3px;
    border-radius: 2px;
    font-size: 12px;
    line-height: 1;
  }
  
  .category-delete-btn:hover {
    background: var(--b3-theme-error);
    color: white;
  }
  
  .add-category-btn {
    padding: 6px 10px;
    background: transparent;
    border: 1px dashed var(--b3-theme-surface-light);
    border-radius: 4px;
    cursor: pointer;
    color: var(--b3-theme-on-surface-light);
    font-size: 14px;
    line-height: 1;
  }
  
  .add-category-btn:hover {
    background: var(--b3-theme-surface-hover);
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
</style>