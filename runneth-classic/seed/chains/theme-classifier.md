# Theme Classifier

The 12-theme classification taxonomy. The orchestrator's first step on any turn: figure out which themes the user's message contains, then route to the per-theme chain definition.

## The 12 themes

1. **analyze** — performance, comparison, top/bottom, "what's working"
2. **concepting** — ideas, directions, fresh angles, "give me concepts for..."
3. **briefing** — production-ready scripts, briefs, shot lists, assembly briefs
4. **feedback_qa** — evaluation, "is this good," "what do you think"
5. **creative_attributes** — atomic units: hooks, headlines, messaging angles, CTAs
6. **educate** — why/how, principles, "teach me," "what makes X work"
7. **research** — competitor strategy, audience research, market context
8. **summarize** — consolidate, recap, TL;DR
9. **motion_help** — Motion platform navigation, settings, features
10. **operational** — translate, reformat, simple text transformation
11. **media_buying** — channel comparison, placement questions
12. **image_gen** — image generation (unsupported — offer prompts instead)

## Classification logic

### Step 1: Scan for primary signals

Each theme has trigger patterns in language and uploaded file types.

**analyze** signals:
- Performance language: "what's working," "top performers," "worst ads," "spend," "ROAS," "CPA," "CTR," "metrics"
- Comparison: "compare," "vs," "trends," "over time"
- Data retrieval: "show me," "pull," "get," "list"
- File signal: PERFORMANCE_DATA + analysis intent

**concepting** signals:
- Idea language: "concept," "idea," "direction," "angle"
- Newness: "new," "fresh," "different," "test"
- Strategic framing: "for [audience]," "positioning"
- File signal: COMPETITOR_CREATIVE + creation intent

**briefing** signals:
- Production language: "script," "brief," "storyboard," "editing notes"
- Polish indicators: "production-ready," "for the editor"
- Assembly: "create an ad from," "mashup," "recut," "stitch together"
- File signal: CREATIVE_ASSET + ad creation intent (Assembly Brief path); SCRIPT_COPY + production intent (Script Brief path)

**feedback_qa** signals:
- Evaluation: "is this good," "what do you think," "feedback," "review"
- Comparison to standard: "rate this," "how does this compare"
- File signal: CREATIVE_ASSET or SCRIPT_COPY + evaluation intent

**creative_attributes** signals:
- Unit-level: "hooks," "headlines," "messaging angles," "CTAs"
- Quantity: "give me 5," "variations," "options"
- Refinement: "iterate," "refine," "adapt"
- File signal: SCRIPT_COPY + refinement intent

**educate** signals:
- Understanding: "why," "how does," "explain," "teach me," "what makes"
- Principles: "best practices," "framework," "strategy behind"
- File signal: COMPETITOR_CREATIVE + learning intent

**research** signals:
- Competitive: "competitor," "market," "industry," "what are [brand] doing"
- Audience: "who is," "persona," "audience research"
- Competitor ad teardown: "break down this ad," "analyze this creative"
- File signal: COMPETITOR_CREATIVE + analysis intent

**summarize** signals:
- "summarize," "recap," "key takeaways," "TL;DR"

**motion_help** signals:
- "how do I," "where is," "can Motion," "feature," "setting," "find," "configure"

**operational** signals:
- "translate," "transcribe," "format," "reformat," "shorten," "rewrite this as"

**media_buying** signals:
- "where should I run," "which platform," "feed," "stories," "reels," "placements"

**image_gen** signals:
- "generate an image," "create a visual," "make me a picture"

## Step 2: Identify all themes present

A message can contain multiple themes. Don't collapse related themes; keep them separate.

Boundary markers:
- Conjunctions: "and," "also," "plus," "then"
- Sequencers: "first... then," "after that," "once you do that"
- Multiple question marks, numbered requests

Examples:
- "What's working and give me hooks based on that" → [analyze, creative_attributes]
- "Pull top performers, explain why they work, write a brief" → [analyze, educate, briefing]
- "Give me 5 hooks" → [creative_attributes]
- "Give me concepts for busy moms" → [concepting]
- COMPETITOR_CREATIVE file + "make our version of this" → [concepting]
- "Break down this competitor ad" → [research]
- "Why does this competitor ad work?" → [educate]

## Step 3: Determine theme relationships

**Sequential** — output of A feeds B. Markers: "based on that," "then," "using those," "for the best one"

**Parallel** — A and B are independent. Markers: "also," "separately," compound "and" without dependency

## Step 4: Resolve overlaps with tiebreakers

| Ambiguity | Tiebreaker |
|---|---|
| analyze vs educate | "What's working?" = analyze. "Why does that work?" = educate. |
| analyze vs feedback_qa | Performance data from Motion = analyze. User-provided creative = feedback_qa. |
| concepting vs briefing | "Give me concepts" = concepting. "Write me a script" = briefing. |
| concepting vs creative_attributes | Full ad ideas = concepting. Individual units (just hooks) = creative_attributes. |
| creative_attributes vs briefing | "Give me 3 hooks" = creative_attributes. "Write me a UGC script using this hook" = briefing. |
| educate vs motion_help | Creative strategy principle = educate. Motion platform feature = motion_help. |
| operational vs educate | Task done (translate) = operational. Understanding = educate. |
| operational vs briefing | Simple text transformation = operational. Assembled deliverable = briefing. |
| analyze vs summarize | New insights from data = analyze. Existing info consolidated = summarize. |

**Competitor ad references**:
- Analysis focus → research
- Creation focus → concepting
- Learning focus → educate
- Evaluation focus → feedback_qa

## Step 5: Default rules when still uncertain

- Mentions data, metrics, or performance → default to analyze
- User provides creative to evaluate → default to feedback_qa
- Asks for something new to be created → default to creative_attributes (upscale if context suggests)
- Asks why or how → default to educate
- Asks about Motion platform → default to motion_help
- Asks for a simple task done → default to operational
- Specific competitor ad referenced → default to research
- CREATIVE_ASSET files + ad creation intent → default directly to briefing (Assembly Brief)

## Once classified

Pass the theme list to the chain file for each theme (one of `seed/chains/<theme>.md`). The chain file says which skills run in what order with what inputs.
