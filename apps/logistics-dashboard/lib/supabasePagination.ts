import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_PAGE_SIZE = 1000
const DEFAULT_CONCURRENCY = 4

type FetchAllPagesOptions = {
  pageSize?: number
  concurrency?: number
  orderBy?: string
}

/**
 * Fetch every row from a PostgREST table/view in ordered batches.
 * Each loop requests a small set of pages in parallel to cut end-to-end latency.
 */
export async function fetchAllPagesInParallel<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  options: FetchAllPagesOptions = {},
): Promise<T[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY)
  const orderBy = options.orderBy ?? 'id'
  const rows: T[] = []

  let offset = 0

  while (true) {
    const batchStarts = Array.from({ length: concurrency }, (_, index) => offset + index * pageSize)
    const batchResults = await Promise.all(
      batchStarts.map((start) =>
        client
          .from(table)
          .select(columns)
          .range(start, start + pageSize - 1)
          .order(orderBy),
      ),
    )

    let reachedEnd = false

    for (const result of batchResults) {
      if (result.error) {
        throw result.error
      }

      if (!result.data || result.data.length === 0) {
        reachedEnd = true
        break
      }

      rows.push(...(result.data as T[]))

      if (result.data.length < pageSize) {
        reachedEnd = true
        break
      }
    }

    if (reachedEnd) {
      break
    }

    offset += pageSize * concurrency
  }

  return rows
}
