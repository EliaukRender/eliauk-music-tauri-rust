import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'

export async function fetchLikedIds(uid: number): Promise<number[]> {
  const res = await get<ApiResponse<{ ids: number[] }>>('/likelist', { uid })
  return res.ids
}

export async function likeSong(id: number, like: boolean) {
  await get('/like', { id, like })
}
