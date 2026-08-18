# Creator Intel evals

Realistic eval cases for the redesigned flow.

## Install and setup

1. **Install runs setup**: after install, the first response gives a one-line overview and offers to set up now, rather than sitting inactive behind a magic command.
2. **Single workspace skip**: when the account has one workspace, setup uses it without asking which one.
3. **Multi workspace ask**: with more than one workspace, setup asks once which to set up and stores its real id.
4. **Setup rerun is idempotent**: rerunning setup updates the same workspace record with no duplicate files or routines.
5. **Package update safety**: package update changes reference docs only and never modifies customer-owned workspace state.
6. **Package uninstall safety**: uninstall removes package-owned files only.
7. **Deterministic initial state**: setup uses the exact versioned envelopes from the data contract and never a bare array or a different key.

## Stage 1: how you work

8. **Account Context wins**: when an Account Context doc exists, setup confirms that goal instead of asking an open measurement question.
9. **Spend default**: with no Account Context, setup states the spend default and asks yes or no plus an alternative.
10. **No Northbeam**: setup never asks about Northbeam.
11. **Source connect, spreadsheet**: a spreadsheet roster prompts a Google connection, then reads it.
12. **Source connect, Asana**: an Asana roster reuses the existing connection or offers to connect, never asks to re-enter a secret already stored.
13. **Naming-only roster**: with only naming conventions, setup says cost and rights will be missing and the ROI page will not appear.
14. **Cost source decides ROI**: whether creator cost data exists sets whether the ROI page can be built.
15. **Rights column reuse**: when the roster source has a rights column, setup reads it instead of asking cold.
16. **Hiring lens grounding**: after the person says how they hire, setup grounds each dimension in ad names, Account Context, brand context, or review audit, and only asks for the dimensions it cannot find.
17. **Ungroundable dimension**: a persona that exists nowhere in data is flagged as a gap and requested from the person.

## Roster: one table, drive to zero

18. **One table**: the roster review shows every creator in one table, not batched.
19. **Silence changes nothing**: unnamed creators stay pending after a partial reply.
20. **Partial confirm applies narrowly**: confirming named creators changes only those.
21. **Editor rejection**: an editor or employee token does not become a trusted creator.
22. **Unknown handle**: a valid creator with no Motion profile stays unresolved but usable.
23. **Same first names**: two creators sharing a first name stay separate until a human merge.
24. **Representation captured**: each confirmed creator records topics and angles for later gap analysis.
25. **Drive to zero**: the skill confirms nothing is left pending, or that specific creators were left pending on purpose.
26. **Simple rights**: rights are one per-creator object (usage scope, whitelisting, expiry note), not a separate ledger.
27. **Unknown is not approved**: unknown usage scope is never presented as ready for paid.

## Evidence and mapping

28. **Multiple assets per ad name**: one ad name with several assets does not collapse onto one creator.
29. **Flexible or mashup creative**: multiple creators in one ad stay shared or unresolved, not each credited fully.
30. **Ads without synced assets**: spend-bearing ads with no synced asset still count in eligible and unassigned spend.
31. **Low mapped coverage**: claims are scoped to mapped evidence when coverage is partial.
32. **Reconciliation**: exclusive plus shared plus unassigned equals eligible spend.

## Recommendation

33. **Gap first**: recommendations open with the roster coverage gap before naming anyone.
34. **Method a always available**: with no Apify and no review audit, the Motion-context method still runs after topic approval.
35. **Topic approval**: method a proposes topics and waits for approval before searching.
36. **No reach dump**: recommendations never return a raw high-follower category list as the answer.
37. **Top creator similarity**: method b asks for top profiles, surfaces adjacent creators from who their networks follow, and offers a routine only after a one-time run.
38. **Similarity needs a key**: top creator similarity is never named after its tool; if the Apify key is missing, the skill says it needs an Apify key connected and does not run until it is.
39. **Reviews gap gated**: method c runs only when a review audit exists.
40. **Roster first, no padding**: with one fitting roster creator, the answer returns one plus new sourcing, not invented names.
41. **Hard eligibility**: disqualified or ineligible creators never appear.
42. **Unsupported claims guard**: answers never claim geography, engagement, brands worked with, or other unavailable fields.
43. **Recommendation persistence**: a casting answer stores one recommendation id, audits it, and shows the same id; a pure performance lookup creates no record.
44. **Recommendation outcome guard**: no outcome is attributed unless a launched ad or brief carries the exact stored recommendation id.

## Dashboard

45. **Three tabs**: the dashboard renders ROI, Creators, and Leaderboard from confirmed state.
46. **ROI page conditional**: the ROI tab appears only with both Account Context and a connected cost source, and is left out otherwise.
47. **Private by default**: the dashboard app is private to the workspace unless the person chooses otherwise.

## Refresh

48. **Manual refresh default**: no scheduled refresh exists unless separately approved.
49. **Scheduled partial failure**: one source failing still lets successful sources update, with the failure recorded on that source only.
50. **Refresh never mutates trust**: refresh adds evidence and pending review only.
51. **Default workspace drift**: refresh keeps the stored workspace id even if the conversation default changes.

## Language and failure handling

52. **Record language split**: durable records stay English while user-facing output follows the conversation language.
53. **Creator search schema failure**: the known search failure is surfaced and handled with supported fallbacks, never treated as empty.

## Cost integrity

54. **No fabricated allocation**: when creator fees are only program-wide, the ROI view shows total-network ROI only and never allocates fees across creators, products, campaigns, or funnel buckets, even as an estimate.
55. **Full-year roster**: roster building pulls the full last-365-day library with no limit and lists every creator in one table, never a truncated sample.
