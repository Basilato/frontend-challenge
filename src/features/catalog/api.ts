import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { CatalogFacets, CatalogParams, NftDetail, NftListResponse } from '@/contracts'
import { http } from '@/lib/http'

export const nftKeys = {
  all: ['nfts'] as const,
  list: (params: CatalogParams) => ['nfts', 'list', params] as const,
  facets: (params: Omit<CatalogParams, 'sort' | 'page' | 'pageSize'>) =>
    ['nfts', 'facets', params] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
}

export const facetsQuery = (params: CatalogParams) => {
  const { sort: _s, page: _p, pageSize: _ps, ...facetParams } = params
  return queryOptions({
    queryKey: nftKeys.facets(facetParams),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<CatalogFacets>('/nfts/facets', { params: facetParams, signal })
      return data
    },
    staleTime: 30_000,
  })
}

export const nftListQuery = (params: CatalogParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<NftListResponse>('/nfts', { params, signal })
      return data
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<NftDetail>(`/nfts/${id}`, { signal })
      return data
    },
  })
