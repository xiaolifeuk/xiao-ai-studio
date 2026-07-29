# Xiao AI Studio 3.4.1

Creator Edition for Cloudflare Workers.

## 3.3 更新
- 新增项目中心：按平台、目标、状态和下一步管理创作项目
- 新增 Prompt 收藏夹：搜索、分类、一键复制或带入内容工厂
- 保留 3.1 的快速模板、草稿自动保存、内容库、日历、截图分析和品牌大脑
- 延续 3.0 本地存储键，升级后原有数据不会丢失

## 部署
1. 安装依赖：`npm install`
2. 登录 Cloudflare：`npx wrangler login`
3. 设置密钥：`npx wrangler secret put OPENAI_API_KEY`
4. 部署：`npm run deploy`


## 3.3 更新
- AI 成功生成后自动保存历史记录
- 支持搜索、分类、查看详情、复制、继续创作和删除
- 历史记录保存在当前浏览器 localStorage，最多 200 条


## 3.4.1 更新
- 内容工厂新增参考图片上传、预览、替换与移除。
- 支持 AI 结合图片和文字生成完整内容包。
