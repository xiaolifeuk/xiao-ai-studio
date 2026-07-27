# Xiao AI Studio V6

这是一个完整的 Cloudflare Workers + OpenAI 创作者工作台。

## 已完成
- 全新 V6 软件界面
- 真正的 OpenAI 后端调用
- AI 创作中心
- AI 聊天
- 餐馆多平台宣传
- Google/社交平台评论回复
- 小红书和 TikTok 截图分析
- 手动数据分析
- 内容库、搜索、复制和删除
- 内容日历
- 每日任务
- 创作者长期背景设置
- 深色模式和手机适配
- API Key 不暴露在浏览器中

## 文件结构
- `worker.js`：Cloudflare 后端和 OpenAI 调用
- `public/`：网页界面
- `wrangler.jsonc`：Cloudflare 配置
- `package.json`

## 部署到现有 GitHub 仓库
1. 解压压缩包。
2. 删除 GitHub 仓库中旧版的 `index.html`、`style.css` 和 `app.js`。
3. 上传本压缩包内全部文件和 `public` 文件夹。
4. Cloudflare 会从 GitHub 自动重新部署。
5. 在 Cloudflare 对应 Worker：
   - Settings
   - Variables and Secrets
   - Add secret
   - 名称：`OPENAI_API_KEY`
   - 值：你的 OpenAI API Key
6. 可选添加普通变量：
   - 名称：`OPENAI_MODEL`
   - 值：你账户可用的模型名称
7. 重新部署后，进入网站“个性化设置”查看 API 状态。

## 安全
不要把 API Key 写在 `app.js`、`worker.js` 或 GitHub 中。必须使用 Cloudflare Secret。
