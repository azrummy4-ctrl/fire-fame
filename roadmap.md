# Migration roadmap

- [x] Inventory existing backend integration and schema scripts; preserve current app connection.
- [x] Document safe standalone migration sequence, financial reconciliation, auth, and testing requirements.
- [ ] Obtain a standalone destination project URL and publishable key (blocked: destination not supplied).
- [ ] Obtain an authorized consistent private source export including auth identities and financial data (blocked: managed source export access unavailable here).
- [ ] Import and reconcile on destination, adapt standalone OAuth/configuration, test critical flows, then cut over (blocked: previous two items).