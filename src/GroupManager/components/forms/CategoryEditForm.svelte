<script lang="ts">
  import type { CategoryEditFormProps } from '../../types/index.js';
  
  export let editingCategory: CategoryEditFormProps['editingCategory'];
  export let onSave: CategoryEditFormProps['onSave'];
  export let onCancel: CategoryEditFormProps['onCancel'];

  function handleSave() {
    if (editingCategory) {
      if (!editingCategory.name.trim()) {
        alert('组别名称不能为空');
        return;
      }
      onSave(editingCategory);
    }
  }
</script>

{#if editingCategory}
  <div class="config-form">
    <div class="form-field">
      <label class="field-label">组别名称</label>
      <input 
        class="field-input" 
        bind:value={editingCategory.name}
        placeholder="输入组别名称"
      />
    </div>
    
    <div class="form-actions">
      <button class="cancel-button" on:click={onCancel}>
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
  
  .form-field {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }
  
  .field-label {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--b3-theme-on-background);
    font-size: 14px;
    white-space: nowrap;
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