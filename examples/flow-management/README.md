# Flow Management Example

Demonstrates the full flow lifecycle: create, list, rename, and delete.

## Setup

```bash
export THINKFLEET_API_KEY="sk-..."
export THINKFLEET_PROJECT_ID="..."
```

## Run

```bash
npx tsx examples/flow-management/index.ts
```

## What it demonstrates

- Counting flows (`tf.flows.count()`)
- Listing flows with pagination (`tf.flows.list()`)
- Creating flows (`tf.flows.create()`)
- Renaming flows (`tf.flows.rename()`)
- Getting a flow by ID (`tf.flows.get()`)
- Deleting flows (`tf.flows.delete()`)
