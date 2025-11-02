<script lang="ts">
  export let postponeDays: number;
  export let scanInterval: number;
  export let priorityScanEnabled: boolean;
  export let onSaveGlobalConfig: () => void;
</script>

<div class="global-config">
  <h3 class="section-title">全局设置</h3>
  
  <div class="config-section">
    <div class="form-field">
      <label class="field-label">🍅自动推迟天数</label>
      <input 
        class="field-input"
        type="number" 
        bind:value={postponeDays}
        placeholder="2"
        min="1"
        max="30"
      />
      <div class="field-hint">
        今日创建的闪卡自动推迟的天数
      </div>
    </div>
    
    <div class="form-field">
      <label class="field-label">扫描间隔(分钟)</label>
      <input 
        class="field-input"
        type="number" 
        bind:value={scanInterval}
        placeholder="15"
        min="5"
        max="120"
      />
      <div class="field-hint">
        自动扫描和更新闪卡的间隔时间
      </div>
    </div>
    
    <div class="form-field">
      <label class="toggle-label">
        <input type="checkbox" bind:checked={priorityScanEnabled}>
        <span class="toggle-text">🍅启用自动优先级扫描</span>
      </label>
      <div class="field-hint">
        自动为今日创建的闪卡设置分组优先级
      </div>
    </div>
  </div>
  
  <div class="form-actions">
    <button class="save-button" on:click={onSaveGlobalConfig}>
      保存全局配置
    </button>
  </div>
</div>

<style>
  .global-config {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .section-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--b3-theme-on-background);
  }
  
  .config-section {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    width: 100%;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
  }
  
  .form-field:last-child {
    margin-bottom: 0;
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
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: auto;
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