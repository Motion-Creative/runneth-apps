# Account Setup

This folder is where Runneth keeps setup that should be visible, editable, and easy to inspect later.

## What Lives Here

- Motion imports for brand context, primary KPI, attribution windows, and spend thresholds
- Customer-taught corrections that should win over imported values
- Notes about which workspace, account, brand, market, or organization a setup file applies to
- Integration source guides when a connected source needs customer-specific instructions

## How To Update It

Tell Runneth what changed in plain language.

Examples:

- "For this workspace, primary KPI should be purchase ROAS."
- "When you use our attribution source, use this attribution window."
- "For this brand, ignore products with less than $1,000 spend."
- "For the asset source, this folder is our source of truth for approved assets."

Runneth should update the visible setup file and preserve the latest imported Motion value unless you ask it to refresh from Motion.

## Motion Imports

Motion-imported setup lives in `motion-imports/`.

Each import file has:

- `Latest Import From Motion`: the last value pulled from Motion
- `Runneth Instructions`: corrections and customer-specific rules

When those conflict, the `Runneth Instructions` section is the behavior Runneth should follow.

## Integration Source Guides

Integration capability docs answer what a connected tool can do.

Account Setup answers how this customer wants Runneth to use that connected tool.

If an integration needs customer-specific setup, create a clear source guide here and say exactly which account, workspace, brand, or folder it applies to.
