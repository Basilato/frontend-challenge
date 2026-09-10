import { getRouteApi } from '@tanstack/react-router'

/** Shared handle to the catalog route ("/") so filter/toolbar/grid read the same search state. */
export const catalogRoute = getRouteApi('/')
