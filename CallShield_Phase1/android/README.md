# CallShield Android — Phase 1 Boundary

The Android application is intentionally not implemented in this backend phase.

Next phase:

- Kotlin/Jetpack Compose project
- CallScreeningService
- Local risk cache
- Block/whitelist synchronization
- Number lookup
- Call history
- User reporting

Android's CallScreeningService can allow/disallow incoming calls and provide caller identification. It must respond to incoming calls within the platform's required time window, so Phase 2 will use local cache + fast API lookup rather than a network-only decision path.
