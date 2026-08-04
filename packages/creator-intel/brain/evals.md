# Creator Intel evals

This file captures realistic eval cases for the first release.

## Install and setup

1. **Install leaves package inactive**: package files are present, but no workspace state exists and no routine exists.
2. **Setup activates one workspace only**: setup for one workspace never creates state for a second workspace.
3. **Setup rerun is idempotent**: rerunning setup updates the same workspace record with no duplicate files or routine side effects.
4. **Package update safety**: package update changes reference docs only and does not modify customer-owned workspace state.
5. **Package uninstall safety**: uninstall removes package-owned files only and does not claim authority over customer-owned records.

## Identity and review

6. **Workspace leakage**: a creator confirmed in one workspace never appears as trusted in another workspace without separate confirmation there.
7. **Silence changes nothing**: pending proposals remain pending after no reply.
8. **Partial review applies narrowly**: confirming two named candidates changes only those two.
9. **Alias handling**: one creator has current and previous handles, and both remain findable under one stable creator id.
10. **Same first names**: two creators share a first name and stay separate until a human merge decision says otherwise.
11. **Editor token rejection**: an editor or employee name in the ad-name field does not become a trusted creator automatically.
12. **Unknown handle**: a valid creator with no Motion profile remains unresolved but usable.
13. **Duplicate profiles**: two Motion profiles look similar and must be deduped or kept separate by Motion creator id and human review.

## Evidence and mapping

14. **Multiple assets per ad name**: one ad name links to several assets and does not collapse performance onto one asset or creator.
15. **Asset reused across ads**: one asset appears in multiple ads and keeps asset-level identity separate from ad-level delivery.
16. **Flexible or mashup creative**: multiple creators in one ad remain shared or unresolved instead of each getting full credit.
17. **Ads without synced creative assets**: spend-bearing ads with no synced asset still count toward eligible and unassigned spend.
18. **Low mapped coverage**: when creator mapping covers only part of spend, the answer clearly scopes claims to mapped evidence.
19. **Performance reconciliation**: exclusive mapped spend plus shared spend plus unassigned spend equals eligible spend.
20. **Meta vs Northbeam divergence**: the same creator ranks differently by source and both views remain separate.

## Rights and relationship state

21. **Rights states stay separate**: approved, expired, unknown, asset-specific, and denied rights are distinct records.
22. **Unknown is not approved**: a creator with unknown paid-media rights is not presented as ready for paid use.
23. **Relationship is separate from identity**: confirmed identity does not imply confirmed whitelisting or partnership rights.
24. **Tracker conflict**: upstream tracker says active while local state says disqualified or expired, and the system flags the conflict instead of silently overwriting.

## Discovery and recommendation quality

25. **Page-two discovery**: a relevant creator only appears on a later page and pagination finds them without duplicating first-page profiles.
26. **Wrong ecosystem**: category pulls return celebrities or off-fit creators, and the result comes back with fewer names or an honest no-fit.
27. **Hard eligibility enforcement**: a disqualified or non-eligible creator never appears even if they look strong on soft fit.
28. **Roster first, no padding**: only one roster creator fits and the system returns one plus ecosystem options instead of inventing two more.
29. **Unsupported claims guard**: answers never claim unavailable creator fields such as geography, engagement, or brands worked with.
30. **Stored TikTok caveat**: missing organic posts do not get translated into inactivity claims.

## Refresh behavior

31. **Manual refresh default**: no scheduled refresh exists unless separately approved.
32. **Scheduled partial failure**: one source fails during refresh and successful sources still update while the failure is recorded on that source only.
33. **Refresh never mutates trusted state**: refresh adds evidence and pending review only, never trusted roster or rights.
34. **Recommendation outcome guard**: no outcome learning occurs unless a launched ad or brief carries the exact stored recommendation id.
35. **Default workspace drift**: refresh keeps using the stored workspace id even if the conversation default workspace later changes.

## Language and failure handling

36. **Record language split**: durable records stay in English even when the conversation is in another language, while user-facing output follows the active conversation language.
37. **Creator search schema failure**: the known creator-search response-schema failure is surfaced as a tool failure, then handled with supported exact name or handle pulls or category and follower fallback, never treated as an empty result.

## Customer experience

38. **Natural first run**: after install, the first visible response asks which workspace to set up instead of requiring a magic command.
39. **One-question progressive setup**: setup asks for workspace, then roster source, then performance lens, one question at a time.
40. **Visible confirmation before trust**: recognition shows grouped people with uncertainty before any creator becomes trusted.
41. **Manual update acknowledgement**: a manual update always confirms completion and summarizes what changed, review items, failures, and what stayed unchanged.
42. **Strategist-led casting**: casting answers use My recommendation, Your roster, New creators to source, and Next move, and can say No creator needed when that is the strongest answer.
