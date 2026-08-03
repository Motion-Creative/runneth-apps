# Northstar Skin human-in-the-loop example

This example preserves the concrete Northstar Skin user story Vamsi asked to keep from the earlier design walk-through.

## Starting point

Assume the customer is **Northstar Skin**. They have:

- a creator tracker with 14 people
- creator names in some Meta ad names
- a few creators who are not in Motion's creator directory
- asset rights recorded inconsistently
- Meta as the primary performance source
- no scheduled refresh yet

## 1. Install ends inactive

**Runneth**

> Creator intelligence is installed, but it is not active yet. Nothing has been imported or changed.
>
> To activate it, tell me which Motion workspace to set up.

**Customer**

> set up creator intelligence for Northstar Skin

Setup resolves one exact Motion workspace and creates customer-owned state only for that workspace.

## 2. The trusted roster source is established

**Runneth**

> Where does your current creator roster live?

**Customer**

> We have a Google Sheet. Creator names are also included in our ad names.

**Runneth**

> I'll treat the tracker as the authority. Ad names can propose additional creators, but they cannot confirm anyone automatically.

This is the key human-in-the-loop rule. The tracker is intentional source material. Ad names are supporting evidence only.

## 3. Naming rules are confirmed, not guessed globally

After reading the tracker and a sample of recent ad names, Runneth says:

> I found what looks like a creator field and a separate editor field in your naming convention.
>
> Should I use the creator field to propose matches while ignoring names in the editor field?

**Customer**

> Yes.

That decision is saved for Northstar Skin only. It is not treated as a rule for other workspaces.

## 4. Performance policy is separated from identity

**Runneth**

> What should I use when comparing creators: Meta results or your external attribution source?

**Customer**

> Meta purchases and cost per purchase.

Runneth stores the source, metrics, attribution settings, and currency for this workspace. Identity decisions and performance policy remain separate records.

## 5. Recognition creates proposals, not trusted facts

Runneth reads the tracker and scans recent relevant ads. It returns a review bundle like this:

> I found:
>
> - 14 people in your tracker
> - 11 exact creator matches
> - 3 tracker creators with no Motion profile
> - 4 possible additional creators from ad names
> - 2 names that may be editors
> - 1 handle that could refer to two different people
>
> Nobody has been added to the trusted roster yet.

This is where the human-in-the-loop step matters. Even high-confidence ad-name matches stay pending until Northstar confirms them.

## 6. Review decisions are applied narrowly

Northstar replies:

> Confirm the 11 exact matches.
>
> Reject the 2 editor names.
>
> Leave the ambiguous handle pending.
>
> Add paid-media rights as unknown for the 3 creators without Motion profiles.

Runneth updates only those named records. The remaining candidates stay pending. Silence does not confirm anything else.

## 7. First casting answer stays honest

Later, Northstar asks:

> Who should we cast for our barrier-repair testimonial concept?

Runneth answers in two tiers:

1. confirmed roster creators first, limited to creators with matching evidence and acceptable rights state
2. ecosystem candidates second, using supported Motion discovery fields only

If only one trusted roster creator fits, Runneth returns one. It does not pad the answer to three.

## 8. Refresh stays manual until Northstar opts in

If a new creator handle appears in several recent ad names, refresh does not silently add them. It creates a pending item and asks:

> I found a possible new roster creator in five recent ads. Should I add them, and is the relationship UGC, whitelisting, or both?

If nothing meaningful changed, refresh stays quiet.

## Why this example matters

The product works because the customer does not need to trust an automatic black box. Northstar can see:

- what came from the tracker
- what came from ad names
- what remains unresolved
- which decisions are human-confirmed
- which rights are still unknown

That is the minimum bar for a creator-intel system that customers can rely on.
