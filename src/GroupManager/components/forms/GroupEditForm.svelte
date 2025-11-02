<script lang="ts">
  import type { GroupConfig } from '../types/data';
  import { createEventDispatcher } from 'svelte';
  import HelpTooltip from '../common/HelpTooltip.svelte'; // <!-- 1. 引入新组件

  export let editingGroup: GroupConfig;
  export let plugin: any;

  const dispatch = createEventDispatcher();

  function handleSave() {
    if (editingGroup) {
      dispatch('save', editingGroup);
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleOpenInDocument() {
    if (!editingGroup) return;
    plugin.handleOpenInDocument(editingGroup);
  }
  
  async function handleBatchPriority() {
    if (!editingGroup) return;
    
    try {
      await plugin.handleBatchPriority(editingGroup);
    } catch (error) {
      console.error('批量设置优先级失败:', error);
      alert('批量设置优先级失败，请检查控制台');
    }
  }
</script>

{#if editingGroup}
  <div class="config-form compact-form">
    <!-- 第一行：分组名称 + 启用分组 + 在文档流中打开按钮 -->
    <div class="form-row form-row-with-button">
      <div class="form-field form-field-main-input">
        <label class="field-label">
          分组名称
        </label>
        <input 
          class="field-input" 
          bind:value={editingGroup.name}
          placeholder="输入分组名称"
        />
      </div>
      <div class="form-field compact" style="flex: 0 0 auto;">
        <label class="toggle-label small-text">
          <input type="checkbox" bind:checked={editingGroup.enabled}>
          <span class="toggle-text">启用分组</span>
        </label>
      </div>
      <!-- 2. 将按钮和提示图标包裹起来 -->
      <div class="button-with-help">
        <button class="func-button open-in-document" on:click={handleOpenInDocument}>
          在文档流中打开（原始）
        </button>
        <HelpTooltip>
          <b>所见即所得:</b>
          <ul>
            <li>基于原始 SQL，不包含闪卡过滤。</li>
            <li>不进行递归处理。</li>
          </ul>
        </HelpTooltip>
      </div>
    </div>
    
    <!-- 第二行：优先级设置 + 启用优先级扫描 + 批量设置优先级按钮 -->
    <div class="form-row form-row-with-button">
      <div class="form-field form-field-short-input">
        <label class="field-label">
          🍅优先级
        </label>
        <input 
          class="field-input"
          type="number"
          bind:value={editingGroup.priority}
          placeholder="优先级 (默认50)"
          min="0"
          max="100"
        />
      </div>
      <div class="form-field compact" style="flex: 0 0 auto;">
        <label class="toggle-label small-text">
          <!-- ❗ 注意: 您原始代码是 priorityEnabled，我保持不变 -->
          <input type="checkbox" bind:checked={editingGroup.priorityEnabled}>
          <span class="toggle-text">启用优先级扫描</span>
        </label>
      </div>
      <!-- 3. 将按钮和提示图标包裹起来 -->
      <div class="button-with-help">
        <button class="func-button batch-priority" on:click={handleBatchPriority}>
          批量设置优先级（所有）
        </button>
        <HelpTooltip>
          <b>包含闪卡过滤:</b>
          <ul>
            <li>包含到期和未到期的闪卡。</li>
            <li>包含了递归处理。</li>
          </ul>
        </HelpTooltip>
      </div>
    </div>
    
    <!-- SQL查询语句 -->
    <div class="form-field full-width">
      <div class="field-header">
        <!-- ❗ 注意: 您原始代码是 sqlQuery，我保持不变 -->
        <span class="field-label">SQL查询语句</span>
      </div>
      <textarea 
        class="sql-textarea" 
        bind:value={editingGroup.sqlQuery}
        placeholder="输入SQL查询语句，例如：SELECT * FROM blocks WHERE tag LIKE '%#标签#%'"
      ></textarea>
      <div class="field-hint">
        提示：查询结果应为blocks表的数据
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
  /* --- 您的所有原始样式保持不变 --- */
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
  
  .form-row {
    display: flex;
    gap: 20px;
    align-items: flex-end;
  }
  
  .form-row-with-button {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .toggle-label.small-text .toggle-text {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }
  
  .form-field-main-input {
    flex: 1 1 auto;
    min-width: 150px;
    max-width: 200px;
  }

  .form-field-short-input {
    flex: 0 0 200px;
  }

  .form-field.compact {
    flex: 1;
    margin-bottom: 0;
  }
  
  .form-field.full-width {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 8px;
  }
  
  .field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
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
  
  .sql-textarea {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.4;
    resize: vertical;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    min-height: 120px;
    width: 100%;
  }
  
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    margin-bottom: 4px;
  }
  
  .toggle-text {
    font-size: 14px;
    color: var(--b3-theme-on-surface);
  }
  
  .field-hint {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-top: 4px;
  }
  
  .func-button {
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    cursor: pointer;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    transition: all 0.2s ease;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .func-button.batch-priority {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
  
  .func-button.batch-priority:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
  
  .func-button.open-in-document {
    background: var(--b3-theme-secondary-light);
    border-color: var(--b3-theme-secondary);
    color: var(--b3-theme-secondary);
  }
  
  .func-button.open-in-document:hover {
    background: var(--b3-theme-secondary);
    color: white;
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

  /* --- 4. 添加用于集成的最小化样式 --- */
  .button-with-help {
    display: flex;
    align-items: center; /* 确保按钮和?图标垂直对齐 */
    gap: 4px; /* 按钮和图标之间的间距 */
  }

  /* 可选：美化提示框内的列表样式 */
  :global(.tooltip-content ul) {
    padding-left: 18px;
    margin: 4px 0 0;
  }
  :global(.tooltip-content li) {
    margin-bottom: 4px;
  }
</style>
