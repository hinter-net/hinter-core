---
"@hinter-net/hinter-core": patch
---

The swarm connection gets destroyed even if closing drives errors (for example, because `.storage/` was deleted while the app was running)
