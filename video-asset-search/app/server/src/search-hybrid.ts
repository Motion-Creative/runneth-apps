/**
 * search-hybrid.ts — Hybrid BM25 + cosine-similarity search via RRF.
 *
 * This module is purely additive. The original cosine-only path in index.ts
 * is untouched and reachable by flipping USE_HYBRID_SEARCH = false.
 *
 * Algorithm:
 *   1. BM25 leg  — FTS5 query on chunks_fts, top 50 by bm25() rank.
 *   2. Vector leg — cosine similarity on stored embeddings, top 50 by score.
 *   3. RRF fusion — score = 1/(60+rank_bm25) + 1/(60+rank_vector).
 *      Shots in only one leg contribute 0 for the absent leg.
 *   4. Sort by fused score descending, return top `limit`.
 *
 * Inputs: raw query text (for BM25) + 384-dim query vector (for cosine).
 * Output: same shape as the cosine-only path — enriched shot list with `score`.
 */

import { getAllShotsForVectorSearch, ftsSearch } from './asset-db.js'

const RRF_K = 60

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hybridSearch = (
  queryText: string,
  queryVector: number[],
  limit = 200
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] => {

  // ── BM25 leg ───────────────────────────────────────────────────────────────
  const bm25Rows  = ftsSearch(queryText, 50)
  const bm25Ranks = new Map<string, number>()
  bm25Rows.forEach((r, idx) => bm25Ranks.set(r.shot_id, idx))

  // ── Vector leg ─────────────────────────────────────────────────────────────
  const allShots = getAllShotsForVectorSearch()
  const vectorRanked = allShots
    .map(shot => {
      let dot = 0
      for (let i = 0; i < 384; i++) dot += queryVector[i] * shot.vec[i]
      return { ...shot, _cosine: dot }
    })
    .sort((a, b) => b._cosine - a._cosine)

  // The vector leg uses the same 0.65 floor as the pure-cosine path.
  // Shots below 0.65 only enter the RRF pool if the BM25 leg finds them via
  // keyword match — that's the exact gap hybrid is designed to fill.
  const MIN_COSINE = 0.65
  const vectorRanks = new Map<string, number>()
  vectorRanked
    .filter(s => s._cosine >= MIN_COSINE)
    .slice(0, 50)
    .forEach((s, idx) => vectorRanks.set(s.id, idx))

  // ── RRF fusion ─────────────────────────────────────────────────────────────
  const allIds = new Set([...bm25Ranks.keys(), ...vectorRanks.keys()])

  const fused = Array.from(allIds)
    .map(id => {
      const bRank = bm25Ranks.get(id)
      const vRank = vectorRanks.get(id)
      const score = (bRank !== undefined ? 1 / (RRF_K + bRank) : 0)
                  + (vRank  !== undefined ? 1 / (RRF_K + vRank)  : 0)
      return { id, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // ── Hydrate with full shot metadata ────────────────────────────────────────
  const shotMap = new Map(vectorRanked.map(s => [s.id, s]))

  // Also cover BM25-only results not in the top-50 vector set
  if (bm25Ranks.size > 0) {
    const bm25Only = bm25Rows.map(r => r.shot_id).filter(id => !shotMap.has(id))
    if (bm25Only.length > 0) {
      allShots.filter(s => bm25Only.includes(s.id)).forEach(s => shotMap.set(s.id, { ...s, _cosine: 0 }))
    }
  }

  return fused
    .map(({ id, score }) => {
      const shot = shotMap.get(id)
      if (!shot) return null
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { vec: _vec, _cosine: _c, ...rest } = shot as typeof shot & { _cosine?: number }
      return { ...rest, score }
    })
    .filter(Boolean)
}
