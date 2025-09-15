---
"@hinter-net/hinter-core": patch
---

The peer gets blacklisted if corestore replication errors for any reason other than a connection reset.
This covers a variety of cases such as the peer running multiple instances in parallel or an instance with corrupted storage.
