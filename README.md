### Foreword:

1. Personal Use Plugin: Feature additions and update frequency are limited by the author's needs, life circumstances, and technical capabilities.

2. Bug Reporting:
   - Post on [Chain Drop](https://ld246.com/post?type=0) and mention @PearlLin. (Will definitely be seen)
   - Siyuan Notes Group 3 (538155062), or any group where I am present. (Might miss information)

---

### Core Features

**Targeted Review**: Based on custom SQL queries, flexibly retrieve eligible flashcards for focused and personalized review sessions.

> Only for due flashcards.

### Auxiliary Functions

1. **Automatic Postponement**  
   Allows custom deferral of review dates for newly created flashcards today, preventing disruption to your current study schedule.

2. **Automatic Priority Adjustment**  
   Batch adjusts review priority for flashcards created today based on preset SQL groups, minimizing manual intervention.

3. **Batch Priority Adjustment**  
   One-click adjustment of review priority for all flashcards in a group, based on SQL grouping conditions.

> Implemented using [番茄工具箱](https://github.com/IAliceBobI/sy-tomato-plugin)插件(sy-tomato-plugin).

1. **Quick Query and View**  
   Instantly open SQL group query results for efficient viewing and management of flashcard content.

> Implemented using [文档流](https://github.com/frostime/sy-docs-flow)插件(sy-docs-flow).

### Additional Notes

1. Built-in flashcard retrieval logic eliminates the need to manually filter for flashcard conditions in your SQL queries.

2. Built-in upward propagation: if a block retrieved by SQL is not a flashcard, the system automatically checks its parent blocks until a flashcard is found.

### Acknowledgments

@[frostime](https://github.com/frostime) (F 佬): Provided the plugin template and built-in usage guide; shared numerous excellent foundational tutorials for Siyuan Notes; enabled trigger calls for the Document Flow plugin.

@[IAliceBobI](https://github.com/IAliceBobI) (番茄佬): Repeatedly offered functions and usage guidance for the Tomato Toolbox, inspiring my learning journey and providing functional anchors; facilitated extensive API calls for the Tomato Toolbox plugin.

@[TCOTC](https://github.com/TCOTC) (J 佬): The god of Siyuan enthusiasts! Conducted meticulous reviews and provided detailed modification notes, along with explanations for numerous miscellaneous files I struggled to understand. Chinese users owe thanks to J Lao for avoiding many bugs, message pop-ups, and console.log issues. Non-Chinese users should be even more grateful—besides what Chinese users gained, he additionally made this plugin "visible" to you.

@[dammy](https://ld246.com/member/dammy) (大米老师): Primary helper for Google account recovery (used to obtain Gemini-2.5-pro API configuration), provider of the Gemini-2.5-pro reverse proxy tutorial, and main tester before the plugin's release.

@[DeepSeekR1](https://chat.deepseek.com/), @[Gemini-2.5-pro](https://gemini.google.com/app?utm_source=deepmind.google&utm_medium=referral&utm_campaign=gdm&utm_content=): GitHub usage guides; primary writers, explainers, and instructors for UI and functional code; and emotional supporters. Highly commended.

@[wilsons](https://ld246.com/member/wilsons) (W 佬): Responded to my request for a JS code snippet. Through this example, I learned how to call Siyuan's API.

@[Siyuan Notes API Documentation](https://leolee9086.github.io/siyuan-kernelApi-docs/riff/index.html): Sincere thanks! Compiled flashcard APIs and more into an excellent index table!

@[Siyuan Notes User Guide - Siyuan Notes Public API](https://siyuannote.com/article/1749331310), [Siyuan Community Documentation](https://docs.siyuan-note.club/zh-Hans/reference/api/kernel/): Provided essential scaffolding assistance during my early days of learning to use APIs from GitHub.

@Members of the Siyuan Enthusiasts Tinkering Group (1017854502): Offered help with symbolic link creation tests, clarified differences between plugins and code snippets, and more when I encountered issues. (@[wetoria](https://wetoria.me/), VV, you are here.)
