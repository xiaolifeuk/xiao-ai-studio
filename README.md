# Xiao AI Studio 3.6

在 3.6 多图版基础上新增 AI 配音。

## AI 配音
- 输入或粘贴中文脚本
- 选择声音、语速和表达风格
- 在线试听
- 下载 MP3
- 每次最多 4096 个字符

配音通过 Cloudflare Worker 调用 OpenAI Text-to-Speech API，需要配置 `OPENAI_API_KEY`。可选变量：`OPENAI_TTS_MODEL`，默认 `gpt-4o-mini-tts`。
