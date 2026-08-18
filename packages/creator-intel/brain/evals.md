# Creator Intel evals

Realistic eval cases for the redesigned flow.

## Install and setup

1. **Fresh-session offer**: install only stages files; the first fresh session gives a one-line overview and offers setup at most once.
2. **Single workspace skip**: when the account has one workspace, setup uses it without asking which one.
3. **Multi workspace ask**: with more than one workspace, setup asks once which to set up and stores its real id.
4. **Setup rerun is idempotent**: rerunning setup updates the same workspace record with no duplicate files or routines.
5. **Package update safety**: package update changes reference docs only and never modifies customer-owned workspace state.
6. **Package uninstall safety**: uninstall removes package-owned files only.
7. **Deterministic initial state**: setup uses the exact versioned envelopes from the data contract and never a bare array or a different key.
8. **No pre-consent effects**: the first-session offer does not read Motion or connected accounts or write customer state before an explicit yes.
9. **Connection resume**: an OAuth or integration handoff resumes from `setupPhase` and `pendingAction` without duplicating setup.

## Stage 1: how you work

10. **Account Context wins**: when an Account Context doc exists, setup confirms that goal instead of asking an open measurement question.
11. **Spend default**: with no Account Context, setup states the spend default and asks yes or no plus an alternative.
12. **No Northbeam**: setup never asks about Northbeam.
13. **Source connect, spreadsheet**: a spreadsheet roster uses the native Google connection, then reads the selected sheet.
14. **Source connect, Asana**: an Asana roster reuses the selected integration account or offers its core connection flow, never asks to re-enter a stored secret.
15. **Source connect, Notion**: Notion uses the native or connected-integration flow and never requests an API key in chat.
16. **Stable references only**: customer state stores account/resource or secret-key references and no credential values or provider response bodies.
17. **Naming-only roster**: with only naming conventions, setup says cost and rights will be missing and the ROI page will not appear.
18. **Cost source decides ROI**: whether creator cost data exists sets whether the ROI page can be built.
19. **Rights column reuse**: when the roster source has a rights column, setup reads it instead of asking cold.
20. **Hiring lens grounding**: after the person says how they hire, setup grounds each dimension in ad names, Account Context, brand context, or review audit, and only asks for the dimensions it cannot find.
21. **Ungroundable dimension**: a persona that exists nowhere in data is flagged as a gap and requested from the person.

## Roster: one table, drive to zero

22. **Complete table, bounded pages**: every creator exists in one canonical table while customer-facing pages show at most 25 rows with total and omitted counts.
23. **Silence changes nothing**: unnamed creators stay pending after a partial reply.
24. **Partial confirm applies narrowly**: confirming named creators changes only those.
25. **Editor rejection**: an editor or employee token does not become a trusted creator.
26. **Unknown handle**: a valid creator with no Motion profile stays unresolved but usable.
27. **Same first names**: two creators sharing a first name stay separate until a human merge.
28. **Representation captured**: each confirmed creator records topics and angles for later gap analysis.
29. **Drive to zero**: the skill confirms nothing is left pending, or that specific creators were left pending on purpose.
30. **Simple rights**: rights are one per-creator object (usage scope, whitelisting, expiry note), not a separate ledger.
31. **Unknown is not approved**: unknown usage scope is never presented as ready for paid.

## Evidence and mapping

32. **Multiple assets per ad name**: one ad name with several assets does not collapse onto one creator.
33. **Flexible or mashup creative**: multiple creators in one ad stay shared or unresolved, not each credited fully.
34. **Ads without synced assets**: spend-bearing ads with no synced asset still count in eligible and unassigned spend.
35. **Low mapped coverage**: claims are scoped to mapped evidence when coverage is partial.
36. **Reconciliation**: exclusive plus shared plus unassigned equals eligible spend.

## Recommendation

37. **Gap first**: recommendations open with the roster coverage gap before naming anyone.
38. **Method a available when Motion works**: with no Apify and no review audit, the Motion-context method runs after topic approval when Motion returns usable results; otherwise it reports the failure or no-fit honestly.
39. **Topic approval**: method a proposes topics and waits for approval before searching.
40. **No reach dump**: recommendations never return a raw high-follower category list as the answer.
41. **Top creator similarity**: method b asks for top profiles, surfaces adjacent creators from who their networks follow, and offers a routine only after a one-time run.
42. **Similarity needs a secure key**: top creator similarity is never named after its tool; a missing Apify key routes through secure secret input and resumes with only the stored key reference.
43. **Provider bounds**: similarity uses at most five seed calls, 150 followed accounts per seed, 25 enrichment candidates, and rejects failed, truncated, malformed, redirected, or wrong-host results.
44. **Reviews gap gated**: method c runs only when a review audit exists.
45. **Roster first, no padding**: with one fitting roster creator, the answer returns one plus new sourcing, not invented names.
46. **Hard eligibility**: disqualified or ineligible creators never appear.
47. **Unsupported claims guard**: answers never claim geography, engagement, brands worked with, or other unavailable fields.
48. **Recommendation persistence**: a casting answer stores one recommendation id, audits it, shows the same id, and records every method used; a pure performance lookup creates no record.
49. **Recommendation outcome guard**: no outcome is attributed unless a launched ad or brief carries the exact stored recommendation id.

## Dashboard

50. **Two core tabs**: the dashboard always renders Creators and Leaderboard from confirmed state.
51. **ROI page conditional**: the ROI tab appears only with both Account Context and a connected cost source, and is left out otherwise.
52. **Private by default**: the dashboard app is built through app-builder and remains protected unless the person explicitly chooses public access.
53. **Window alignment**: refresh and dashboard support the same 30/60/90/365-day windows; 60 days uses explicit dates and never `last_60d`.
54. **Refresh disclosure**: missing or stale dashboard snapshots are pulled only after one disclosure and explicit yes; declining uses labeled existing data and omits missing windows.

## Refresh

55. **Manual refresh default**: no scheduled refresh exists unless separately approved.
56. **Scheduled partial failure**: one source failing still lets successful sources update, with the failure recorded on that source only.
57. **Refresh never mutates trust**: refresh adds evidence and pending review only.
58. **Default workspace drift**: refresh keeps the stored workspace id even if the conversation default changes.

## Language and failure handling

59. **Record language split**: durable records stay English while user-facing output follows the conversation language.
60. **Creator search schema failure**: the known search failure is surfaced and handled with supported fallbacks, never treated as empty.

## Cost integrity

61. **No fabricated allocation**: when creator fees are only program-wide, the ROI view shows total-network ROI only and never allocates fees across creators, products, campaigns, or funnel buckets, even as an estimate.
62. **Full-year roster**: roster building pulls the full last-365-day library with no limit, stores every creator in one canonical table, and reviews it in bounded pages rather than a truncated sample.
