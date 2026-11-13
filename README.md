# 大西部开拓者：新西兰开拓史助手

线下对局《大西部开拓者：新西兰开拓史》（Great Western Trail: New Zealand，eggertspiele 2023）的中文手机助手。一桌人扫码进同一个房间：按人数列开局清单、对局中查规则、终局 12 项每人在自己手机上填分。纯原生 JavaScript，Cloudflare Workers + 静态资源 + Durable Objects，没有构建步骤。

- 线上：https://gwtnz.leisurecat.cloud（2026-11-13 上线），仓库 86777835/gwt-new-zealand-helper
- Worker 名：`gwt-new-zealand-helper`；rate limit `namespace_id`：1161
- 结算评价 game key：`gwt-new-zealand`

做什么、不做什么，以及用户的确认结果，见 [docs/做与不做清单.md](docs/做与不做清单.md)。调研：[BGG社区调研](docs/BGG社区调研.md)、[中文版与中文社区调研](docs/中文版与中文社区调研.md)。规则依据：[规则笔记](docs/规则笔记.md)、[术语表](docs/术语表.md)、[附录效果整理](docs/附录_效果整理.md)。

## 功能

- **开局要随机的东西**：中立建筑 A–H（首局按字母 / 随机）、私有建筑 a/b 面（全 a / 随机，全桌一样）、奖励卡 10 个组合抽 4 个（手机抽或用实物抽完点选），自动排到船舵、酒桶、钟、罗盘下面。主持人抽，全桌同步。
- **座位**：按顺位显示每人起始的钱和手牌（7/8/9/10 元，4/5/6/7 张）。“手指轮盘定先后手”跳总入口。
- **开局清单**：只列本局人数的数字（A 袋 12/13/14、奖励市场 3/5/7、绵羊市场 9/11/14、每组合 3/5/6 张），老玩家常错的标红（工人先每种 1 个、奖励市场前两行都要放、开局 1 金块、第一回合直接从中立建筑开始），并改正规则书两处笔误（罗姆尼羊 18 张、放建筑的是 D）。每条附规则书页码。单人（对莎拉）按 2 人局摆，另列莎拉的准备和难度。
- **对局中**：本局 4 个奖励卡组合的效果（依据附录），加 11 张可展开的局中速查卡：第一回合、回合流程与过路费、威灵顿 4 步、奖励市场与终局计时、买羊表、附属行动单次/双倍、剃毛、帆船与港口、开拓者轨、打牌时机、交换指示物与金块。
- **终局计分**：计分纸 12 项，每项附一句易错提示；钱按元填自动换算；贸易站、目标卡可以填负数；手牌上限格和奖励市场标记是 0/3、0/5 按钮。莎拉不计第 1、9、10 项。只能一个人拿市场标记的 5 分。平局共享名次。
- **结算**：排名、分项、长图、修改分数、自动存档，系列统一评价卡（`gwt-new-zealand`）。
- **4 分钟讲规则**（`/teach`）：7 段讲稿约 1080 字，19 条注意事项（写好答案，默认收起），49 个术语点开看规则书原图和注释，图标速查 43 个。「问」按钮的问题都在常见问题里。
- **局中速查**（`ref.html`）、**新手教程 / 常见问题**（`guide.html`，43 条，搜“惠灵顿”“剪毛”等玩家叫法也能搜到）、**往期对局**（`history.html`）。
- **规则助手**（右下角“规则”）：`/api/chat`，依据 `tools/讲解稿.md`、`tools/faq.json`、`tools/附录.md` 回答；模型顺序、超时切换、联网查找和系列一致（先搜 BGG，回答标“本站未核对”）。本站不设 cron，`CHAT_STATE` 绑定匹兹堡的 KV。回答下方不显示模型名。

## 用词

以繁体中文版规则书（彌生的桌遊日記）的用词为准，转成简体：牧场主、威灵顿、预测区、求职市场、剃毛、交换指示物、组合、船舵/酒桶/钟/罗盘、白色/黑色边框、元（不是镑）。中文版没有翻译羊的品种名，正文按颜色叫（灰色绵羊卡、橘色、红色…），本站照做；只有罗姆尼羊有中文名。简中规则书没找到（玩家普遍说翻译差）。玩家常说的“惠灵顿、剪毛、运羊”收进搜索别名和规则助手提示。

## 文件

- `public/logic.js`：前后端共用：人数相关数字、配置校验、随机抽取、计分 12 项、莎拉、平局、`reduce()`。
- `public/steps.js`：开局清单（每条附页码）、10 个奖励卡组合的效果、摘要、搜索别名。
- `public/ref.js` / `ref-page.js` / `ref.html`：局中速查，房间里和独立页面共用。
- `public/app.js`：房间页面，`morph()` 增量渲染；草稿、展开状态放在 `ui` 里。
- `public/teach.js`：讲规则页全部内容（TERMS、PARTS、NOTES、GROUPS）。图片在 `public/img/teach/*.webp`。
- `src/worker.js`：Room / Lobby / Archive；主持人凭据不发给手机。`src/chat.js`、`src/sse.js`、`public/chat.js`：规则助手。
- `tools/讲解稿.md`、`tools/faq.json`：改完运行 `node tools/sync.mjs` 复制到 `public/`。`tools/附录.md` 只给规则助手用。

## 本地运行与测试

```sh
ln -s /tmp/claude-501/pgh2/node_modules node_modules   # playwright-core
wrangler dev --port 8961                               # 不设 DeepSeek 密钥
node tests/run.mjs                                     # 另开终端
```

`tests/run.mjs` 依次跑 10 个测试，结果写进 `tests/测试结果.md`，截图在 `/tmp/claude-501/gwtnz_shots/`。完整对局测试只能对 localhost 跑；评价接口全部用 `page.route` 拦截。讲规则页测试只拦截 `/api/chat`，也可以对线上跑：`node tests/test_teach.mjs https://gwtnz.leisurecat.cloud/ <截图目录>`。

联网查找另跑（本地假 DeepSeek 在 8790 端口）：

```sh
wrangler dev --port 8962 --var DEEPSEEK_API_KEY:fake --var DEEPSEEK_BASE:http://127.0.0.1:8790 --var CHAT_CF_MODEL:@cf/none/missing
node tests/test_chat.mjs http://localhost:8962/ /tmp/claude-501/gwtnz_shots --mock-web
```

## 部署

```sh
wrangler deploy
wrangler secret put DEEPSEEK_API_KEY --name gwt-new-zealand-helper   # 由用户自己运行
```

## 版权

游戏、规则与官方盒封面版权归 eggertspiele / Plan B Games Europe 及中文版出版方。本站讲解是自己概括的非官方辅助说明。讲规则页图片截自 eggertspiele 官方英文规则书（20 页，low_res 版），页脚署名并链接原文。插画为 Codex CLI 生成的原创图。详见 [docs/素材来源.md](docs/素材来源.md)。
