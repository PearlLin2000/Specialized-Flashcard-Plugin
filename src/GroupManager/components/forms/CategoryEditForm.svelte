<script lang="ts">
  import type { GroupCategory } from '../types/data';
  import { createEventDispatcher } from 'svelte';

  export let editingCategory: GroupCategory;  // 注意：这里是 editingCategory 不是 editingGroup
  // 不需要 plugin 属性，因为类别编辑不需要插件功能

  const dispatch = createEventDispatcher();

  function handleSave() {
    if (editingCategory && editingCategory.name.trim()) {
      dispatch('save', editingCategory);
    } else {
      alert('组别名称不能为空');
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if editingCategory}
  <div class="config-form compact-form">
    <!-- 类别名称 -->
    <div class="form-field full-width">
      <label class="field-label" for="category-name-input">
        组别名称
      </label>
      <input 
        id="category-name-input"
        class="field-input" 
        bind:value={editingCategory.name}
        placeholder="输入组别名称"
      />
      <div class="field-hint">
        提示：组别用于分类管理不同的SQL分组
      </div>
    </div>
    
    <!-- 表单操作按钮 -->
    <div class="form-actions">
      <button class="cancel-button" on:click={handleCancel}>
        取消
      </button>
      <button class="save-button" on:click={handleSave}>
        保存
      </button>
    </div>
  </div>
{/if}

<style>
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 20px;
    width: 92%;
  }
  
  .compact-form {
    gap: 12px;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
  }
  
  .form-field.full-width {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .field-label {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--b3-theme-on-background);
    font-size: 14px;
  }
  
  .field-input {
    padding: 8px 10px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    font-size: 14px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    width: 100%;
  }
  
  .field-hint {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-top: 4px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: auto;
    padding-top: 16px;
  }
  
  .cancel-button {
    padding: 8px 16px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  
  .save-button {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
</style>