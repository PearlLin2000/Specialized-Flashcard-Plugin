<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let plugin: any;
  export let onConfigUpdate: (groups: any[]) => void;
  
  const dispatch = createEventDispatcher();
  
  // 分组配置接口
  interface GroupConfig {
    id: string;
    name: string;
    sqlQuery: string;
    enabled: boolean;
    priority: number;
    priorityEnabled: boolean;
  }
  
  let groups: GroupConfig[] = [];
  let editingGroup: GroupConfig | null = null;
  let isEditing = false;
  let postponeDays: number = 2;
  let scanInterval: number = 15;
  let priorityScanEnabled: boolean = true;

  onMount(async () => {
    await loadGroups();
    await loadConfig();
  });

  async function loadGroups() {
    try {
      // 从插件数据中加载分组配置
      const storedData = await plugin.loadData('menu-config');
      groups = storedData?.groups || [];
    } catch (error) {
      console.error('加载分组配置失败:', error);
      groups = [];
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
  
  function addGroup() {
    editingGroup = {
      id: generateId(),
      name: '新分组',
      sqlQuery: 'SELECT * FROM blocks WHERE',
      enabled: true,
      priority: 50,
      priorityEnabled: true
    };
    isEditing = true;
  }
  
  function editGroup(group: GroupConfig) {
    editingGroup = { ...group };
    isEditing = true;
  }
  
  function deleteGroup(index: number) {
    if (confirm('确定要删除这个分组吗？')) {
      groups.splice(index, 1);
      saveGroups();
    }
  }
  
  function toggleGroup(index: number) {
    groups[index].enabled = !groups[index].enabled;
    saveGroups();
  }
  
  function saveGroup() {
    if (editingGroup) {
      const index = groups.findIndex(g => g.id === editingGroup.id);
      
      // 验证SQL查询
      if (!editingGroup.sqlQuery.trim()) {
        alert('SQL查询语句不能为空');
        return;
      }
      
      if (!editingGroup.name.trim()) {
        alert('分组名称不能为空');
        return;
      }
      
      if (index >= 0) {
        // 更新现有分组
        groups[index] = { ...editingGroup };
      } else {
        // 添加新分组
        groups = [...groups, { ...editingGroup }];
      }
      
      saveGroups();
      cancelEdit();
    }
  }
  
  function cancelEdit() {
    editingGroup = null;
    isEditing = false;
  }
  
  async function saveGroups() {
    try {
      // 保存到插件数据
      const currentData = await plugin.loadData('menu-config');
      const updatedData = {
        ...currentData,
        groups: groups,
        postponeDays: postponeDays,
        scanInterval: scanInterval,
        priorityScanEnabled: priorityScanEnabled
      };
      
      await plugin.saveData('menu-config', updatedData);
      
      // 通知父组件配置已更新
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
  
  function moveGroup(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      [groups[index - 1], groups[index]] = [groups[index], groups[index - 1]];
      saveGroups();
    } else if (direction === 'down' && index < groups.length - 1) {
      [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]];
      saveGroups();
    }
  }
</script>

<div class="group-manager">
  <div class="b3-dialog__content">
    {#if isEditing}
      <!-- 编辑分组 -->
      <div class="config-form">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">分组名称</label>
            <input 
              class="field-input" 
              bind:value={editingGroup.name}
              placeholder="输入分组名称"
            />
          </div>
          <div class="form-field compact">
            <label class="toggle-label">
              <input type="checkbox" bind:checked={editingGroup.enabled}>
              <span class="toggle-text">启用该分组</span>
            </label>
          </div>
        </div>
        
        <!-- 新增优先级配置行 -->
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">🍅优先级设置</label>
            <input 
              class="field-input"
              type="number"
              bind:value={editingGroup.priority}
              placeholder="优先级 (默认50)"
              min="0"
              max="100"
            />
            <div class="field-hint">
              今日创建的闪卡将自动设置此优先级
            </div>
          </div>
          <div class="form-field compact">
            <label class="toggle-label">
              <input type="checkbox" bind:checked={editingGroup.priorityEnabled}>
              <span class="toggle-text">🍅启用优先级扫描</span>
            </label>
          </div>
        </div>
        
        <div class="form-field full-width">
          <div class="field-header">
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
        
        <div class="form-actions">
          <button class="cancel-button" on:click={cancelEdit}>
            取消
          </button>
          <button class="save-button" on:click={saveGroup}>
            保存
          </button>
        </div>
      </div>
    {:else}
      <!-- 分组列表 -->
      <div class="groups-list">
        <div class="list-container">
          {#each groups as group, index}
            <div class="list-item {group.enabled ? '' : 'disabled'}">
              <div class="item-info">
                <span class="item-name">{group.name}</span>
                {#if group.priorityEnabled}
                  <span class="item-priority">🍅优先级: {group.priority}</span>
                {/if}
              </div>
              <div class="item-actions">
                <button class="action-btn move-up" on:click={() => moveGroup(index, 'up')} disabled={index === 0}>
                  ↑
                </button>
                <button class="action-btn move-down" on:click={() => moveGroup(index, 'down')} disabled={index === groups.length - 1}>
                  ↓
                </button>
                <button class="action-btn edit" on:click={() => editGroup(group)}>
                  编辑
                </button>
                <button class="action-btn delete" on:click={() => deleteGroup(index)}>
                  删除
                </button>
                <button 
                  class="action-btn {group.enabled ? 'enable' : 'disable'}" 
                  on:click={() => toggleGroup(index)}
                >
                  {group.enabled ? '启用' : '禁用'}
                </button>
              </div>
            </div>
          {:else}
            <div class="empty-state">
              <span class="empty-text">暂无分组配置</span>
            </div>
          {/each}
        </div>
        
        <!-- 配置区域 - 调整为一行显示 -->
        <div class="config-section compact">
          <div class="form-row compact">
            <div class="form-field compact">
              <label class="field-label">🍅自动推迟天数</label>
              <input 
                class="field-input compact"
                type="number" 
                bind:value={postponeDays}
                placeholder="2"
                min="1"
                max="30"
              />
            </div>
            
            <div class="form-field compact">
              <label class="field-label">扫描间隔(分钟)</label>
              <input 
                class="field-input compact"
                type="number" 
                bind:value={scanInterval}
                placeholder="15"
                min="5"
                max="120"
              />
            </div>
            
            <div class="form-field compact">
              <label class="toggle-label">
                <input type="checkbox" bind:checked={priorityScanEnabled}>
                <span class="toggle-text">🍅自动优先级扫描</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="add-action">
          <button class="add-button" on:click={addGroup}>
            添加分组
          </button>
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
  }
  
  .b3-dialog__content {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* 编辑表单样式 */
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
    padding: 20px;
  }
  
  .form-row {
    display: flex;
    gap: 20px;
    align-items: flex-end;
  }
  
  .form-row.compact {
    gap: 15px;
    align-items: center;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .form-field.compact {
    flex: 1;
    margin-bottom: 0;
  }
  
  .form-field.full-width {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .field-label {
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--b3-theme-on-background);
    font-size: 14px;
  }
  
  .field-input {
    padding: 10px 12px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    font-size: 14px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
  }
  
  .field-input.compact {
    padding: 8px 10px;
    font-size: 13px;
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
  }
  
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    margin-top: 8px;
  }
  
  .toggle-text {
    font-size: 14px;
    color: var(--b3-theme-on-surface);
  }
  
  .field-hint {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-top: 6px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: auto;
    padding-top: 20px;
  }
  
  .cancel-button {
    padding: 10px 20px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-button {
    padding: 10px 20px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* 分组列表样式 */
  .groups-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
  }
  
  .list-container {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 6px;
    background: var(--b3-theme-surface);
    margin-bottom: 20px;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-theme-surface-light);
  }
  
  .list-item:last-child {
    border-bottom: none;
  }
  
  .list-item.disabled {
    opacity: 0.6;
  }
  
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .item-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }
  
  .item-priority {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-primary-light);
    padding: 2px 8px;
    border-radius: 10px;
    align-self: flex-start;
  }
  
  .item-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    padding: 6px 12px;
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    white-space: nowrap;
  }
  
  .action-btn.move-up,
  .action-btn.move-down {
    font-size: 14px;
    font-weight: bold;
    padding: 6px 10px;
  }
  
  .action-btn:hover {
    background: var(--b3-theme-surface-hover);
  }
  
  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .action-btn.enable {
    background: var(--b3-theme-success);
    color: white;
    border-color: var(--b3-theme-success);
  }
  
  .action-btn.disable {
    background: transparent;
    color: var(--b3-theme-on-surface-light);
  }
  
  .action-btn.delete {
    background: transparent;
    color: var(--b3-theme-error);
    border-color: var(--b3-theme-error);
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
  }
  
  .empty-text {
    color: var(--b3-theme-on-surface-light);
    font-style: italic;
  }
  
  /* 配置区域样式 */
  .config-section {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .config-section.compact {
    padding: 12px 16px;
  }
  
  .config-section .form-field {
    margin-bottom: 0;
  }
  
  .add-action {
    display: flex;
    justify-content: center;
  }
  
  .add-button {
    padding: 12px 24px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
</style>