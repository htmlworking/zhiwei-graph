# 知维图谱

基于大语言模型的概念知识图谱构建工具，面向中小学教师的备课辅助桌面应用。

## 功能

- **概念知识库管理**：手动添加或 AI 生成学科概念，建立前提、类比、上下位等关系
- **概念生态模拟**：输入新概念，LLM 分析同化锚点、认知冲突、重构需求，预测学习难度并给出教学建议
- **D3 力导向图可视化**：颜色编码展示概念生态（绿=锚点、红=冲突、紫=新概念）
- **小知对话助手**：通过自然语言对话操作概念库，支持 Function Calling
- **深色模式**：设置页切换浅色 / 深色主题
- **本地存储**：所有数据保存在用户文档目录，无需云端

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 33 |
| 前端 | React 19 + TypeScript + Vite |
| 可视化 | D3.js v7 |
| 图标 | Lucide React |
| 文档生成 | docx |

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装

```bash
git clone https://github.com/htmlworking/zhiwei-graph.git
cd zhiwei-graph
npm install
```

> 如果 Electron 下载失败（国内网络），设置镜像后重试：
> ```bash
> set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> npm install electron
> ```

### 开发模式

```bash
npm run electron:dev
```

启动 Vite 开发服务器 + Electron 窗口，支持热更新。

### 配置 API Key

启动后点击顶栏右侧 **齿轮图标** → 进入设置页 → 填写：

| 字段 | 说明 | 示例 |
|------|------|------|
| 提供商 | LLM 平台 | OpenAI / DeepSeek 兼容 |
| 模型名称 | 模型 ID | `deepseek-chat` |
| API 端点 | API URL | `https://api.deepseek.com/v1/chat/completions` |
| API Key | 密钥 | `sk-...` |

Key 仅保存在本地 `文档\ConceptEcology\settings.json`，不上传任何服务器。

### 使用流程

1. **新建项目** → 填写学科和目标学生
2. **搭建概念库** → 手动添加或在"概念知识库"Tab 中使用 AI 生成骨架
3. **建立关系** → 在"概念关系"Tab 中连接概念
4. **运行模拟** → 在"生态模拟"Tab 输入新概念，LLM 返回分析结果
5. **查看图谱** → 右侧面板实时渲染概念生态，拖拽调节窗口大小
6. **导出报告** → 在"教学报告"Tab 复制或导出 Markdown

也可直接用右下角 **小知** 对话助手完成概念库的增删改。

## 打包部署

```bash
npm run build
npx electron-builder --win --publish=never
```

生成的便携文件夹在 `release\win-unpacked\`，压缩后可直接分发。Windows 用户双击 `ZhiWeiGraph.exe` 运行，无需安装。

> 打包要求：Electron 二进制已下载（`node_modules\electron\dist\` 下有 `electron.exe`）。如果 electron-builder 下载失败，先把 `node_modules\electron\dist\` 复制到 `release\win-unpacked\` 即可。

## 项目结构

```
├── electron/           # Electron 主进程
│   ├── main.ts         # 入口，窗口管理
│   ├── preload.ts      # IPC 桥接
│   └── ipc/
│       ├── project.ts  # 项目 CRUD
│       ├── settings.ts # 配置读写
│       ├── llm.ts      # LLM 调用 + 智能体循环
│       └── tools.ts    # 工具定义与执行
├── src/                # React 前端
│   ├── App.tsx         # 路由
│   ├── components/     # UI 组件
│   ├── types/          # TypeScript 类型
│   └── styles/         # CSS
├── public/             # 静态资源
├── package.json        # 依赖与构建配置
└── gen-docx.js         # 报告生成脚本
```

## License

MIT
