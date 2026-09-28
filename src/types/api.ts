/** NCM API 通用响应外壳，业务字段因接口而异 */
export type ApiResponse<T extends object = object> = {
  code: number
  message?: string
  msg?: string
} & T
