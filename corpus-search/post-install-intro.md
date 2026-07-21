# Corpus search

## What just opened up
You now have hybrid retrieval over any folder of markdown files Runneth has access to. Index a folder once (video scene summaries, Gong transcripts, briefs, research notes, anything markdown-shaped) and queries come back in about a second, ranked by both keyword and semantic match. Role and timestamp filters work out of the box for transcripts.

## Try this now
1. **Check what's currently indexed**: `What corpora are indexed in this sandbox right now?`
   _You'll get back:_ the live status of the corpus store, with kinds, source folders, and chunk counts.
2. **Index a folder**: `Index my folder at [absolute-path] with kind [your-kind-name].`
   _You'll get back:_ the corpus-search CLI runs against the folder, embeds the chunks, and confirms count + speed.
3. **Search the indexed content**: `Search the [kind] corpus for [your-natural-language-query].`
   _You'll get back:_ top-ranked chunks with the source file, role or timestamp metadata when present, ready to use as evidence.
4. **Scope a search by role**: `In the calls corpus, find every place a customer talks about churn risk.`
   _You'll get back:_ chunks where the speaker role matches "customer," ranked by relevance to churn.

## Compounds with
- **bootcamp:** The bootcamp library is a natural first corpus to index.
- **review-library:** Review markdown is searchable once indexed as a corpus.
