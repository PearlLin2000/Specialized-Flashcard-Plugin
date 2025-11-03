<script lang="ts">
  export let postponeDays: number;
  export let postponeEnabled: boolean;
  export let priorityScanEnabled: boolean;
  export let priorityScanInterval: number;
  export let cacheUpdateInterval: number;
</script>

<div class="global-config">
  
  <!-- 区块1: 自动推迟配置 -->
  <div class="config-section">
    <div class="section-description">
      自动推迟今日创建的闪卡（以避免过多新卡片干扰复习）
    </div>
    
    <div class="form-field">
      <label class="toggle-label">
        <input type="checkbox" bind:checked={postponeEnabled}>
        <span class="toggle-text">🍅启用自动推迟</span>
      </label>
    </div>

    <div class="section-description">
      推迟天数（0-30天，0为不启用）
    </div>
    
    <div class="form-field">
      <label class="field-label" for="postpone-days-input">自动推迟天数</label>
      <input 
        id="postpone-days-input"
        class="field-input"
        type="number" 
        bind:value={postponeDays}
        placeholder="2"
        min="1"
        max="30"
        disabled={!postponeEnabled}
      />
    </div>
  </div>
  
  <!-- 区块2: 自动优先级配置 -->
  <div class="config-section">
    <div class="section-description">
      为【今日创建】、【位于指定分组】的闪卡自动设置【指定】优先级。
    </div>
    
    <div class="form-field">
      <label class="toggle-label">
        <input type="checkbox" bind:checked={priorityScanEnabled}>
        <span class="toggle-text">🍅启用自动优先级扫描</span>
      </label>
    </div>

    <div class="section-description">
      后台扫描间隔时长（可配置范围：5-120分钟）。
    </div>
    
    <div class="form-field">
      <label class="field-label" for="priority-scan-interval-input">优先级扫描间隔(分钟)</label>
      <input 
        id="priority-scan-interval-input"
        class="field-input"
        type="number" 
        bind:value={priorityScanInterval}
        placeholder="15"
        min="5"
        max="120"
        disabled={!priorityScanEnabled}
      />
    </div>
  </div>
  
  <!-- 区块3: SQL缓存配置 -->
  <div class="config-section">
    <div class="section-description-group">
      <div class="description-line">
        SQL所查询的缓存数据保存时间（可配置5-240分钟）。
        越短，则打开闪卡分组界面所显示的闪卡越“新”，但也越可能影响思源的使用性能。
      </div>
      <div class="description-line">一言以蔽之：没想法，用默认的30分钟。觉得思源卡，把这个数字调大；觉得该有的卡片没出现，把这个数字调小。</div>
    </div>
    
    <div class="form-field">
      <label class="field-label" for="cache-update-interval-input">SQL缓存更新间隔(分钟)</label>
      <input 
        id="cache-update-interval-input"
        class="field-input"
        type="number" 
        bind:value={cacheUpdateInterval}
        placeholder="30"
        min="5"
        max="240"
      />
    </div>
  </div>
  
</div>

<style>
  .global-config {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  
  .config-section {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-on-background);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    width: 80%;
  }
  
  .section-description {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
    margin-bottom: 12px;
    line-height: 1;
  }
  
  .section-description-group {
    margin-bottom: 12px;
  }
  
  .description-line {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
    line-height: 1.4;
    margin-bottom: 4px;
  }
  
  .description-line:last-child {
    margin-bottom: 0;
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
  
  .field-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  
</style>
