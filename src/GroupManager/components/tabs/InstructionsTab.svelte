<!-- InstructionsTab.svelte (Corrected) -->
<div class="instructions-tab">
  <div class="info-section">
    <div class="section-title">说明：相关依赖</div>
    <div class="section-content">
      <ul>
        <li>凡涉及“优先级”相关功能的使用，均需在番茄工具箱中开启“闪卡优先级”功能。</li>
        <li>凡涉及“文档流”相关功能的使用，均需在安装文档流插件并启用。</li>
      </ul>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 1：为什么点开“到期：专项闪卡Tab”，跟实际拥有的闪卡【数量对不上】？</div>
    <div class="section-content">
      <p>首先，请明确“到期：专项闪卡Tab”仅显示到期闪卡。</p>
      <p>其次，确认“（思源）设置-闪卡-新卡上限+旧卡上限”的上限设置足够大。</p>
      <p>最后，确认SQL语句的末尾添加了“limit 999”。</p>
      <div class="explanation">
        <p><strong>原理说明：</strong></p>
        <ul>
          <li>“（思源）设置-闪卡-新卡上限+旧卡上限”决定了专项SQL检索的【最初检索范畴】。</li>
          <li>“（思源）设置-搜索-搜索显示数”在默认情况下【就是SQL语句没有加limit 数量】决定专项SQL检索的数量上限。</li>
          <li>“闪卡的到期时间（due）”则决定最终呈现的闪卡。</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 2：我不会写 SQL 语句怎么办？</div>
    <div class="section-content">
      <ul>
        <li>
          经验推断：如果你不会写SQL语句，那么你实际需要的SQL语句将相当简单。请在<a href="https://ld246.com/article/1683355095671" target="_blank" rel="noopener noreferrer">思源 SQL 新人指南：SQL 语法 + Query + 模板</a>中“常用 SQL 查询示例”里寻找常见SQL语句。
        </li>
        <li>
          我想定制：如果你只是想要简单定制需要的SQL，请参考：<a href="https://ld246.com/article/1753371318351" target="_blank" rel="noopener noreferrer">闪卡 | 根据 sql 查询，实现指定范围的闪卡批量推迟／提前</a>中的第一步和第二步。
          <p><strong>警告：</strong>在你进行SQL核验之前，不要点击“批量设置优先级”按钮。该操作不可逆。</p>
        </li>
        <li>
          我想学习：参考<a href="https://ld246.com/article/1683355095671" target="_blank" rel="noopener noreferrer">思源 SQL 新人指南：SQL 语法 + Query + 模板</a>。
        </li>
      </ul>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 3：调整闪卡上限后数量太大，影响复习体验怎么办？</div>
    <div class="section-content">
      <ul>
        <li>
          由于<u>右上角角标显示的复习数量</u>干扰心态：你可以在“（思源）设置-外观-代码片段-设置-css”中添加如下css代码片段，并确认启用。
          <!-- FIX: Wrap code with reactive block `{`...`}` to escape curly braces -->
          <pre><code>{`/*隐藏闪卡的计数*/
div[data-type="count"] {
  display: none;
}`}</code></pre>
        </li>
        <li>
          由于<u>数量太大导致初始载入过慢</u>干扰体验：适当调小相关参数。（后续有计划内置一个纯粹的全局到期闪卡复习Tab，限定展示数量。完成时间未定）
        </li>
      </ul>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 4：“内置递归处理”按什么逻辑进行？</div>
    <div class="section-content">
      <p>
        参见<a href="https://ld246.com/article/1759566877456" target="_blank" rel="noopener noreferrer">闪卡 | 做了一个 SQL 执行框的封装，并在内部封装了闪卡的递归处理</a>中“查询采用递归逻辑”。
      </p>
      <p><em>如果你看不懂，那么你就不用知晓“内置递归处理”。</em></p>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 5：对于 SQL 的 limit，我可以将其书写得很大吗？</div>
    <div class="section-content">
      <p>比如 999、9999、99999。</p>
      <ul>
        <li>999可以。</li>
        <li>9999应该可以（至少7000+的卡片可行）。</li>
        <li>99999未经测试（库里没有那么多张卡，非必要也不推荐压力测试）。</li>
      </ul>
    </div>
  </div>

  <div class="info-section">
    <div class="section-title">常见问答 6：如何联系我（反馈bug，询问功能需求等）？</div>
    <div class="section-content">
      <ul>
        <li>你可以在<a href="https://ld246.com/" target="_blank" rel="noopener noreferrer">链滴</a>发帖，说明具体情况，并在最后@PearlLin（链滴 146168 号成员）。</li>
        <li>你可以在<a href="https://github.com/PearlLin2000/Specialized-Flashcard-Plugin/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>中提交 issue。</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .instructions-tab {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px; /* 增加底部内边距，避免滚动条遮挡 */
  }

  .info-section {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-light);
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box; /* 确保 padding 不会影响总宽度 */
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-background);
    margin-bottom: 12px;
  }

  .section-content p,
  .section-content li {
    font-size: 14px;
    color: var(--b3-theme-on-surface);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .section-content ul {
    padding-left: 20px;
    margin-top: 8px;
    list-style-type: disc;
  }
  
  .section-content a {
    color: var(--b3-theme-primary);
    text-decoration: none;
  }

  .section-content a:hover {
    text-decoration: underline;
  }

  .section-content pre {
    background: var(--b3-theme-background-light);
    padding: 12px;
    border-radius: 4px;
    margin: 12px 0;
    font-family: var(--b3-font-family-code);
    white-space: pre-wrap; /* 自动换行 */
    word-break: break-all;
  }

  .section-content code {
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }

  .explanation {
    margin-top: 12px;
    padding: 10px 15px;
    background: var(--b3-theme-background-light);
    border-left: 4px solid var(--b3-theme-surface-light);
    border-radius: 4px;
  }

  .explanation ul {
    margin-top: 4px;
  }
</style>
