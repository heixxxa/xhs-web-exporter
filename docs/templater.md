# Experimental Templater

这个目录下新增了一套“非侵入式”的采集模板骨架，用来把当前项目里已经存在的能力抽成可复用的站点模板。

## 目标

- 统一网络拦截：`src/templater/runtime/http-hook.ts`
- 统一 DOM 观察：`src/templater/runtime/dom-watch.ts`
- 统一解析产物：`src/templater/core/types.ts`
- 统一存储接口：`src/templater/storage/dexie-store.ts`
- 统一模板装配：`src/templater/core/create-templater.ts`

## 当前状态

- 现有功能路径保持不变，主入口仍然是 `src/main.tsx`
- 现有 XHS 模块继续使用原来的 UI / 扩展体系
- 新 templater 默认不会自动启动，因此不会影响已有导出流程

## XHS 示例

`src/templater/examples/xhs.ts` 提供了一个示例模板，复用了从现有模块抽出来的共享解析器：

- `src/modules/xhs-shared/parsers.ts`
- `src/modules/xhs-shared/dom.ts`

这意味着后续新增网站时，只需要新增对应的：

1. URL 匹配规则
2. JSON / DOM 解析器
3. 实体类型映射

而不需要重复写一遍 hook、observer、去重、存储代码。

## 最小使用方式

```ts
import { createXhsCaptureTemplater } from '@/templater';

const templater = createXhsCaptureTemplater();
await templater.start();
```

## 推荐的下一步

如果要继续推进成“多网站模板系统”，建议下一步做这三件事：

1. 给 templater 加模板注册表
2. 给存储层补查询 UI
3. 把现有 XHS 模块逐步迁到 templater 适配器上
