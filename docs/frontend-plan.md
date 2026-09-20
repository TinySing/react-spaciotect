# 前端实现与数据接入方案

## 实现决策

Studio 使用一个稳定的前端模型：`project`、`option`、`bubble`、`massing`、`rooms`、`rendering`。页面和 Three.js 组件只使用该模型，不识别后端原始字段或文件名。Site analysis report 也已有独立的读取与保存 service。

## 目录职责

- `src/data`：mock JSON、演示数据和用于生成 mock 模型的纯数据定义；真实接口接入后仍可保留为本地开发 fixture。
- `src/adapters`：将 mock 或后端响应统一转换成页面模型；后端字段兼容仅在这里处理。
- `src/services`：HTTP 请求和按业务资源划分的读写接口。
- `src/hooks`：可复用的请求状态和画布导航/视图旋转行为。
- `src/pages/shared`：跨 Studio 页面复用的可视化组件与 Three.js 场景辅助。`RoomSiteContext3D` 属于 3D 渲染实现，不是 utils 或数据。
- `src/pages/studio`：Studio 页面和仅被 Studio 使用的页面配置，例如模型文件面板清单。

不再保留原型提取缓存 `.extracted`。它不参与 React 运行时，已移至系统废纸篓；需要回查原型脚本时可从废纸篓恢复。

数据入口位于 `src/services/studioService.js`：

- 默认 `VITE_DATA_SOURCE=mock`，继续使用现有 JSON 和概念模型，便于保持当前原型可运行。
- 设置 `VITE_DATA_SOURCE=api` 及 `VITE_API_BASE_URL` 后，自动请求真实接口。
- `src/adapters/studioModel.js` 是唯一的字段兼容层。后端字段变化、旧接口兼容或响应拆分只在这里处理。

## 页面、组件、状态边界

```text
Mock JSON / HTTP API
        ↓
studioService → studioModel adapter → useStudioModel
        ↓
Studio 页面（加载、失败、重试、局部编辑）
        ↓
Bubble / Three.js / Inspector 组件（props 驱动）
```

- `src/services/httpClient.js`：请求、基础错误转换、请求中止。
- `src/services/studioService.js`：按项目和方案获取、保存 Studio 数据。
- `src/hooks/useStudioModel.js`、`src/hooks/useSiteAnalysisReport.js`：处理加载、失败、取消过期请求和重试。
- `src/pages/studio/*`：只保留页面交互和局部草稿状态。
- `src/pages/shared/ThreeMassingViewport.jsx`、`ThreeRenderingViewport.jsx`、`SiteGraph.jsx`：只接收 `site`、`scene`、`nodes`、`relationships` 等 props，不读取业务 JSON。

房间尺寸编辑、镜头位置、缩放、当前工具、未保存的 undo/redo 仍保留在页面本地；它们是界面状态，不应作为每次加载都要请求的服务端状态。

## 接口依赖与联调约束

当前前端在 API 模式下请求：

```text
GET /projects/:projectId/studio/options/:optionId
PATCH /projects/:projectId/studio/options/:optionId/:scope/:entityId
GET /projects/:projectId/site-analysis-report
PATCH /projects/:projectId/site-analysis-report/modules/:moduleId
```

`GET` 响应可以使用任何后端字段命名，但适配后必须提供：

```js
{
  project: { id, name },
  option: { id, label },
  bubble: { nodes: [], relationships: [] },
  massing: { site: {}, summary: {} },
  rooms: { Spaces: [] },
  graph: { nodes: [], relationships: [] },
  roomSite: {},
  rendering: { scene: { rooms: [] }, summary: {} }
}
```

其中 `site` 需要包含边界、每层 footprint、层高、入口线、EVA 路线及室外场地；房间需要包含空间几何控制点与高度。若后端改为分别提供 Bubble、Massing、Rooms、Rendering 四个接口，只需要在 `studioService` 组装一次，页面无需修改。

保存操作按资源粒度发送：Bubble 草稿使用 `scope=bubble/drafts`，房间使用 `scope=rooms`，报告组件使用 `scope=reports/modules`。服务端返回保存后的实体，前端再用返回值更新当前草稿。Bubble 保存与房间 Apply changes 已通过 `saveStudioPatch` 接入该链路；报告的读取已接入 `siteAnalysisReportService`，其 `saveSiteAnalysisReportPatch` 已准备好，待确定“显式保存”或“防抖自动保存”产品规则后再绑定到编辑动作。mock 模式保留现有前端行为。

## 复用与后续接入

无需引入新的状态库或请求库。原有 JSON 留在 `src/data`，但仅作为 mock fixture 被 service 使用；后续不应在页面或共享可视化组件中直接 import 这些数据。

接入时：

1. 复制 `.env.example` 为 `.env.local`，设置 `VITE_DATA_SOURCE=api` 和 API 地址。
2. 在 `studioService` 中确认 endpoint 路径。
3. 按真实响应完善 `toStudioModel`，不要在页面内增加字段转换。
4. 在触发保存的交互中调用 `saveStudioPatch`，成功后写回服务端返回值；失败时保留本地草稿并显示错误。

Site analysis report 已通过 `siteAnalysisReportService` 与 `useSiteAnalysisReport` 进入同一条 mock/API 链路。模块位置、尺寸、可见性和样式编辑会以防抖方式保存，并在工具栏展示保存状态；报告正文、批注和新增页面目前仍是本地编辑状态，后端提供对应资源接口后再接入各自的 service。Projects、Energy、Options 和 Reports 仍使用既有本地演示数据；它们应沿用同一模式新增各自的 service/adapter，而不是把请求直接放进页面。当前本次优先完成了四个 Studio/3D 核心页面及 Site analysis editor 的入口收口。

## 验证与交付说明

- mock 模式下，四个 Studio 页面从相同的 `useStudioModel` 链路加载数据。
- API 模式下，请求失败会显示可重试的错误状态；切换方案时会取消过期请求。
- Three.js 组件的数据均通过 props 注入，便于用真实项目和方案数据复用。
- 本次按仓库约束未运行构建、lint 或自动测试；接入后应在 mock 和 API 两种环境分别做页面验收。
