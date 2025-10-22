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
  }
  
  let groups: GroupConfig[] = [];
  let editingGroup: GroupConfig | null = null;
  let isEditing = false;
  
  onMount(async () => {
    await loadGroups();
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
  
  function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  function addGroup() {
    editingGroup = {
      id: generateId(),
      name: '新分组',
      sqlQuery: 'SELECT * FROM blocks WHERE',
      enabled: true
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
        groups: groups
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
  
  function testSqlQuery() {
    if (editingGroup && editingGroup.sqlQuery.trim()) {
      // 这里可以添加SQL语法测试逻辑
      alert('SQL查询语法检查功能待实现');
    } else {
      alert('请输入SQL查询语句');
    }
  }
</script>

<div class="group-manager">
  <div class="b3-dialog__content">
    {#if isEditing}
      <!-- 编辑分组 -->
      <div class="config-form">
        <div class="b3-label" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="b3-label__text">分组名称</div>
            <input 
              class="b3-text-field" 
              style="width: 200px;"
              bind:value={editingGroup.name}
              placeholder="输入分组名称"
            />
          </div>
          <label class="b3-switch">
            <input type="checkbox" bind:checked={editingGroup.enabled}>
            <span class="b3-switch__text">启用该分组</span>
          </label>
        </div>
        
        <div class="b3-label">
          <div class="b3-label__text">
            SQL查询语句
            <button class="b3-button b3-button--outline fn__right" on:click={testSqlQuery}>
              测试查询
            </button>
          </div>
          <textarea 
            class="b3-text-field fn__block" 
            rows="6"
            bind:value={editingGroup.sqlQuery}
            placeholder="输入SQL查询语句，例如：SELECT * FROM blocks WHERE tag LIKE '%#标签#%'"
          ></textarea>
          <div class="b3-label__text" style="font-size: 12px; color: var(--b3-theme-on-surface-light);">
            提示：查询结果应为blocks表的数据
          </div>
        </div>
        
        <div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel" on:click={cancelEdit}>
            取消
          </button>
          <div class="fn__space"></div>
          <button class="b3-button b3-button--text" on:click={saveGroup}>
            保存
          </button>
        </div>
      </div>
    {:else}
      <!-- 分组列表 -->
      <div class="groups-list">
        <div class="b3-list">
          {#each groups as group, index}
            <div class="b3-list-item">
              <span class="b3-list-item__text {group.enabled ? '' : 'b3-list-item__text--disabled'}">
                {group.name}
              </span>
              <span class="b3-list-item__action">
                <button class="b3-button b3-button--small" on:click={() => moveGroup(index, 'up')} disabled={index === 0}>
                  ↑
                </button>
                <button class="b3-button b3-button--small" on:click={() => moveGroup(index, 'down')} disabled={index === groups.length - 1}>
                  ↓
                </button>
                <button class="b3-button b3-button--small" on:click={() => editGroup(group)}>
                  编辑
                </button>
                <button class="b3-button b3-button--small b3-button--error" on:click={() => deleteGroup(index)}>
                  删除
                </button>
                <button 
                  class="b3-button b3-button--small {group.enabled ? 'b3-button--success' : 'b3-button--outline'}" 
                  on:click={() => toggleGroup(index)}
                >
                  {group.enabled ? '启用' : '禁用'}
                </button>
              </span>
            </div>
          {:else}
            <div class="b3-list-item b3-list-item--center">
              <span class="b3-list-item__text">暂无分组配置</span>
            </div>
          {/each}
        </div>
        
        <div class="b3-dialog__action">
          <button class="b3-button b3-button--text" on:click={addGroup}>
            <svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>
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
  }
  
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }
  
  .groups-list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .b3-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .b3-list-item__action {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  
  .b3-list-item__text--disabled {
    opacity: 0.6;
  }
  
  .fn__right {
    float: right;
  }
  
  .b3-button--success {
    background-color: var(--b3-theme-success) !important;
    color: white !important;
  }
  
  .b3-button--outline {
    background-color: transparent !important;
    color: var(--b3-theme-on-surface) !important;
    border: 1px solid var(--b3-theme-on-surface-light) !important;
  }
</style>