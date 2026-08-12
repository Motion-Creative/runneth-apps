# Creator Intel evals

This file captures realistic eval cases for the first release.

## Install and setup

1. **Install leaves package inactive**: package files are present, but no workspace state exists and no routine exists.
2. **Setup activates one workspace only**: setup for one workspace never creates state for a second workspace.
3. **Setup rerun is idempotent**: rerunning setup updates the same workspace record with no duplicate files or routine side effects.
4. **Package update safety**: package update changes reference docs only and does not modify customer-owned workspace state.
5. **Package uninstall safety**: uninstall removes package-owned files only and does not claim authority over customer-owned records.
6. **Deterministic initial state**: setup uses the exact versioned object envelopes from the data contract and never substitutes a bare array or a different collection key.

## Identity and review

7. **Workspace leakage**: a creator confirmed in one workspace never appears as trusted in another workspace without separate confirmation there.
8. **Silence changes nothing**: pending proposals remain pending after no reply.
9. **Partial review applies narrowly**: confirming two named candidates changes only those two.
10. **Alias handling**: one creator has current and previous handles, and both remain findable under one stable creator id.
11. **Same first names**: two creators share a first name and stay separate until a human merge decision says otherwise.
12. **Editor token rejection**: an editor or employee name in the ad-name field does not become a trusted creator automatically.
13. **Unknown handle**: a valid creator with no Motion profile remains unresolved but usable.
14. **Duplicate profiles**: two Motion profiles look similar and must be deduped or kept separate by Motion creator id and human review.
15. **Recognition audit**: one proposal batch appends one audit event containing every new stable candidate id.

## Evidence and mapping

16. **Multiple assets per ad name**: one ad name links to several assets and does not collapse performance onto one asset or creator.
17. **Asset reused across ads**: one asset appears in multiple ads and keeps asset-level identity separate from ad-level delivery.
18. **Flexible or mashup creative**: multiple creators in one ad remain shared or unresolved instead of each getting full credit.
19. **Ads without synced creative assets**: spend-bearing ads with no synced asset still count toward eligible and unassigned spend.
20. **Low mapped coverage**: when creator mapping covers only part of spend, the answer clearly scopes claims to mapped evidence.
21. **Performance reconciliation**: exclusive mapped spend plus shared spend plus unassigned spend equals eligible spend.
22. **Meta vs Northbeam divergence**: the same creator ranks differently by source and both views remain separate.

## Rights and relationship state

23. **Rights states stay separate**: approved, expired, unknown, asset-specific, and denied rights are distinct records.
24. **Unknown is not approved**: a creator with unknown paid-media rights is not presented as ready for paid use.
25. **Relationship is separate from identity**: confirmed identity does not imply confirmed whitelisting or partnership rights.
26. **Tracker conflict**: upstream tracker says active while local state says disqualified or expired, and the system flags the conflict instead of silently overwriting.

## Discovery and recommendation quality

27. **Page-two discovery**: a relevant creator only appears on a later page and pagination finds them without duplicating first-page profiles.
28. **Wrong ecosystem**: category pulls return celebrities or off-fit creators, and the result comes back with fewer names or an honest no-fit.
29. **Hard eligibility enforcement**: a disqualified or non-eligible creator never appears even if they look strong on soft fit.
30. **Roster first, no padding**: only one roster creator fits and the system returns one plus ecosystem options instead of inventing two more.
31. **Unsupported claims guard**: answers never claim unavailable creator fields such as geography, engagement, or brands worked with.
32. **Stored TikTok caveat**: missing organic posts do not get translated into inactivity claims.

## Refresh behavior

33. **Manual refresh default**: no scheduled refresh exists unless separately approved.
34. **Scheduled partial failure**: one source fails during refresh and successful sources still update while the failure is recorded on that source only.
35. **Refresh never mutates trusted state**: refresh adds evidence and pending review only, never trusted roster or rights.
36. **Recommendation outcome guard**: no outcome learning occurs unless a launched ad or brief carries the exact stored recommendation id.
37. **Default workspace drift**: refresh keeps using the stored workspace id even if the conversation default workspace later changes.

## Language and failure handling

38. **Record language split**: durable records stay in English even when the conversation is in another language, while user-facing output follows the active conversation language.
39. **Creator search schema failure**: the known creator-search response-schema failure is surfaced as a tool failure, then handled with supported exact name or handle pulls or category and follower fallback, never treated as an empty result.

## Customer experience

40. **Natural first run**: after install, the first visible response asks which workspace to set up instead of requiring a magic command.
41. **One-question progressive setup**: setup asks for workspace, then roster source, then performance lens, one question at a time.
42. **Visible confirmation before trust**: recognition shows grouped people with uncertainty before any creator becomes trusted.
43. **Manual update acknowledgement**: a manual update always confirms completion and summarizes what changed, review items, failures, and what stayed unchanged.
44. **Strategist-led casting**: casting answers use My recommendation, Your roster, New creators to source, and Next move, and can say No creator needed when that is the strongest answer.
45. **Standalone recommendation persistence**: a standalone casting answer stores one recommendation id, audits it, and exposes the same id in the visible answer; a pure performance lookup creates no recommendation record.
