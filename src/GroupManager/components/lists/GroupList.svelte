<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GroupConfig, GroupCategory } from '../types/data';
  
  export let groups: GroupConfig[] = [];
  export let categories: GroupCategory[] = [];

  const dispatch = createEventDispatcher();

  function handleEdit(group: GroupConfig) { dispatch('editGroup', group); }
  function handleDelete(group: GroupConfig) { dispatch('deleteGroup', group); }
  function handleToggle(group: GroupConfig) { dispatch('toggleGroup', group); }
  function handleMove(index: number, direction: 'up' | 'down') { dispatch('moveGroup', { index, direction }); }
  function handleCategoryUpdate(groupId: string, newCategoryId: string) { dispatch('updateGroupCategory', { groupId, newCategoryId }); }

  /**
   * 新增的辅助函数，用于处理 change 事件
   * 它在 TypeScript 上下文中运行，因此可以安全地进行类型断言
   */
  function onCategoryChange(event: Event, groupId: string) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      handleCategoryUpdate(groupId, target.value);
    }
  }
</script>

<div class="list-container">
  {#each groups as group, index}
    <div class="list-item {group.enabled ? '' : 'disabled'}">
      <!-- 组别选择框 -->
      <select 
        class="category-select"
        value={group.categoryId}
        on:change={(e) => onCategoryChange(e, group.id)}
      >
        {#each categories as category}
          <option value={category.id}>{category.name}</option>
        {/each}
      </select>
      
      <!-- 分组名称 -->
      <span class="item-name">{group.name}</span>
      
      <!-- 优先级显示 -->
      {#if group.priorityEnabled}
        <span class="item-priority-small">🍅{group.priority}</span>
      {/if}
      
      <!-- 操作按钮 -->
      <div class="item-actions-compact">
        <button class="action-btn-small move-up" on:click={() => handleMove(index, 'up')} disabled={index === 0}>
          ↑
        </button>
        <button class="action-btn-small move-down" on:click={() => handleMove(index, 'down')} disabled={index === groups.length - 1}>
          ↓
        </button>
        <button class="action-btn-small edit" on:click={() => handleEdit(group)}>
          编辑
        </button>
        <button class="action-btn-small delete" on:click={() => handleDelete(group)}>
          删除
        </button>
        <button 
          class="action-btn-small {group.enabled ? 'enable' : 'disable'}" 
          on:click={() => handleToggle(group)}
        >
          {group.enabled ? '已启用' : '已禁用'}
        </button>
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <span class="empty-text">暂无分组配置</span>
      <div class="empty-hint">
        点击右下方按钮添加新的SQL分组，或从其他已有分组中移动已有SQL分组。
      </div>
    </div>
  {/each}
</div>

<style>
  /* 样式部分保持不变 */
  .list-container {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 6px;
    background: var(--b3-theme-surface);
    margin-bottom: 12px;
    width: 100%;
  }
  
  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 12px;
    border-bottom: 1px solid var(--b3-theme-surface-light);
    transition: all 0.2s ease;
  }
  
  .list-item:last-child {
    border-bottom: none;
  }
  
  .list-item.disabled {
    opacity: 0.6;
  }
  
  .category-select {
    padding: 5px 8px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    font-size: 13px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    width: 100px;
    flex-shrink: 0;
  }
  
  .item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-priority-small {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-primary-light);
    padding: 3px 6px;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .item-actions-compact {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
  }
  
  .action-btn-small {
    padding: 5px 10px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    white-space: nowrap;
    min-width: 45px;
  }
  
  .action-btn-small.move-up,
  .action-btn-small.move-down {
    font-size: 14px;
    font-weight: bold;
    padding: 5px 8px;
    min-width: 30px;
  }
  
  .action-btn-small:hover {
    background: var(--b3-theme-surface-hover);
  }
  
  .action-btn-small:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .action-btn-small.enable {
    background: var(--b3-theme-success);
    color: white;
    border-color: var(--b3-theme-success);
  }
  
  .action-btn-small.disable {
    background: transparent;
    color: var(--b3-theme-on-surface-light);
  }
  
  .action-btn-small.delete {
    background: transparent;
    color: var(--b3-theme-error);
    border-color: var(--b3-theme-error);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30px 20px;
    text-align: center;
  }
  
  .empty-text {
    color: var(--b3-theme-on-surface-light);
    font-style: italic;
    margin-bottom: 6px;
  }
  
  .empty-hint {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
    max-width: 250px;
  }
</style>
