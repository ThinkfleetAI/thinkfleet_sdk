# Agent Chat Example

Interactive CLI that lets you chat with any ThinkFleet agent.

## Setup

```bash
export THINKFLEET_API_KEY="sk-..."
export THINKFLEET_PROJECT_ID="..."
```

## Run

```bash
npx tsx examples/agent-chat/index.ts
```

You'll be prompted to select an agent from your project, then you can chat interactively.

## What it demonstrates

- Listing agents (`tf.agents.list()`)
- Getting agent details (`tf.agents.get()`)
- Multi-turn chat with session persistence (`tf.agents.chat()`)
- Token usage tracking
