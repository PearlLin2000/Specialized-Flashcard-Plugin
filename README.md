### 写在前面：

1. 自用插件：功能新增及更新频率受限于作者需求、生活状况和技术力。
2. bug 反馈：
   - [链滴](https://ld246.com/post?type=0)发帖@PearlLin。（一定会看到）
   - 思源笔记三群（538155062），或任何一个能看到我的群。（可能遗漏信息）

---

### 核心功能

**专项复习**：基于自定义 SQL 查询，灵活检索符合条件的到期闪卡，实现针对性复习。

- 思源原生的闪卡复习只有两类：全部复习/基于文档（及其子文档）复习。
- 现在通过 SQL，可以实现：
  - 基于**标签**进行聚合后复习。
  - 基于**文档**进行聚合后复习。
  - 基于**反链**进行聚合后复习。
  - 基于**数据库**进行聚合后复习。
  - ……
  - 任意 SQL 可实现的检索聚合后复习，比如：**【该文档内/文档反链】所有【标记为红色/加粗/斜线……】的【超级块】闪卡**etc。

### 辅助功能

1. **自动推迟**  
   可自定义推迟今日新创建闪卡的复习日期，避免干扰当前复习计划。

2. **自动调整优先级**  
   对今日创建的闪卡，按预设 SQL 分组批量调整复习优先级，减少手动操作。

3. **批量优先级调整**  
   基于 SQL 分组条件，一键调整组内所有闪卡的复习优先级。

> 基于[番茄工具箱](https://github.com/IAliceBobI/sy-tomato-plugin)插件(sy-tomato-plugin)实现。

4. **快速查询与查看**  
   一键打开 SQL 分组查询结果，便于快速查看与操作相关内容。

> 基于[文档流](https://github.com/frostime/sy-docs-flow)插件(sy-docs-flow)实现。

### 其他说明

1. 内置闪卡检索的判定，因此无需在 sql 输入条件中进行闪卡条件的筛选过滤。
2. 内置向上传递的判定，即：如果 sql 检索出的块非闪卡，则检索其父块，直到检索出闪卡。

### 鸣谢

@[frostime](https://github.com/frostime)(F 佬):插件模板及内置的使用引导；大量思源笔记的优秀基础教程；文档流插件的触发调用。

@[IAliceBobI](https://github.com/IAliceBobI)(番茄佬):多次提供番茄工具箱的相关函数及其使用，使我有了学习的动力和功能抓手；大量番茄工具箱插件的 API 调用。

@[TCOTC](https://github.com/TCOTC)(J 佬)：思源爱好者之神！为我进行了细致的审核和修改说明，还有很多我没搞明白的杂项文件说明。使用者应该感谢 J 佬，他为你们规避了诸多 bug、message 弹窗和 console.log。

@[dammy](https://ld246.com/member/dammy)(大米老师)：谷歌账号找回（用于 Gemini-2.5-pro 的 API 配置获取）的主要帮助者、Gemini-2.5-pro 反代教程的提供者、插件功能上架前的主要测试。

@[DeepSeekR1](https://chat.deepseek.com/)、@[Gemini-2.5-pro](https://gemini.google.com/app?utm_source=deepmind.google&utm_medium=referral&utm_campaign=gdm&utm_content=)：github 使用指导者；UI 及功能代码主要撰写者、讲解者和教导者；以及情绪承担者。高度表扬。

@[wilsons](https://ld246.com/member/wilsons)(w 佬)：回应了我的 js 代码片段的请求。基于这一代码片段的示例，我才学会如何请求调用思源 API。

@[思源笔记 API 文档](https://leolee9086.github.io/siyuan-kernelApi-docs/riff/index.html):高度感谢！将闪卡 API 等做了汇总。很好的索引表！

@[思源笔记用户指南-思源笔记公开 API](https://siyuannote.com/article/1749331310)、[思源社区文档](https://docs.siyuan-note.club/zh-Hans/reference/api/kernel/):在我还不会看 github 中的 API 时期，提供了基本的辅助手脚架。

@思源爱好者折腾群（1017854502）的群友：在我遭遇问题时，提供创建符号链接的帮助测试、插件和代码片段的差异解答等等。（@[wetoria](https://wetoria.me/),vv 你在这里。）
