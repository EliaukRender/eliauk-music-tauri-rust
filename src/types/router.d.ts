import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** 占位页对应的方案文档（docs/功能方案/ 下的文件名） */
    doc?: string
  }
}
