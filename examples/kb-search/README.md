# Knowledge Base Search Example

Search across your ThinkFleet knowledge bases from the command line.

## Setup

```bash
export THINKFLEET_API_KEY="sk-..."
export THINKFLEET_PROJECT_ID="..."
```

## Run

```bash
npx tsx examples/kb-search/index.ts "What is our refund policy?"
```

## What it demonstrates

- Listing knowledge bases (`tf.knowledgeBases.list()`)
- Vector search with ranked results (`tf.knowledgeBases.search()`)
- Working with search scores and metadata
