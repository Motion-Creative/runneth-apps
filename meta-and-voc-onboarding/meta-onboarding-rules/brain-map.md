<!-- BEGIN runneth:brain-map v3 -->
Brain map (always on):
- The brain map is `/agent/brain/brain-map.md`: what exists in this brain, what kind of
  place each folder is, and which kind of ask goes where. If it does not exist, create
  it from the staged template at
  `/agent/brain/packages/meta-and-voc-onboarding/brain-map-template.md`. If
  `/agent/INDEX.md` holds entries the map does not, carry them into the map exactly as
  written - never reword, merge, collapse, or drop an existing entry; the map adapts to
  this brain, not the other way around - then leave `/agent/INDEX.md` as a one-line
  pointer to the map.
- Route retrieval through the map: read its routing section and lanes, then the map,
  then open the mapped files. For any folder with a corpus-lane declaration, search by
  meaning: query the local retrieval service (`GET $KNOWETH_API_URL/search?q=<query>`
  with the meaning words of the ask) and read the items it returns; if that service
  does not answer, fall back to one bounded keyword-and-date pass over the bank folder
  - never read a bank item by item either way. For current platform data (ads,
  performance), pull live through the creative store and motion CLIs; the brain holds
  interpretation, never current data.
- Update the map in the same turn as any durable save, move, or rename under
  `/agent/brain/`: add or refresh the entry - path, the words people actually say for
  it (aliases), scope, one plain current-state line on what it is, created and updated
  dates. A bank of similar raw items gets ONE folder-level entry AND a lane
  declaration in the map's lanes section (`lane: <name> | kind: corpus` plus item
  naming and coverage window) - never per-item entries. A brand's customer-voice family - every platform folder
  under its voice-of-customer bank - is ONE lane named `voice-of-customer`; platform
  folders live inside it and are never separate lanes. Other banks (ideas, inspo, a
  legacy generation kept distinct) each get their own lane. Lane names are unique
  across the map: qualify a NEW declaration with the brand slug only when it would
  collide with an existing one. Never rename an existing lane declaration on your
  own - the name is the stable handle retrieval and other tools sync on, so a rename
  is a human-approved change, exactly like moving a folder. A brand home declares
  `kind: brand` with its exact workspace ID; a person home declares `kind: user`.
  Everything else is the general lane and needs no declaration.
- Lane kinds: `corpus` (a bank of similar raw items: reviews, ideas, inspo,
  transcripts, the creative store's ads), `brand` (one brand's scope; exact workspace
  ID), `user` (one verified person's home), general (everything else - implicit).
  Folders that are not lanes still get a plain note of what they are (knowledge,
  reference) so routing knows the move.
- When a verified person first has durable personal context to save - their
  preferences, voice, working defaults - save it to their person home: this VM's own
  person-area convention where one exists, otherwise `team/<name>/<name>.md`. Create
  the home at that moment, never in advance, and declare their lane in the same turn:
  `lane: <name> | kind: user` with the person's verified identity, never a name
  match. One home and one declaration per person; later personal saves go into the
  existing home and refresh the declaration, never duplicate it.
- When telling a person about any of this, use their words: where something was saved,
  what is searchable, whether it is shared with the team or just theirs. Never surface
  map internals, labels, or file mechanics in an answer.
<!-- END runneth:brain-map v3 -->
