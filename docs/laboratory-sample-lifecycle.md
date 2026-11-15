# Laboratory Sample Lifecycle & Chain of Custody

## 1. Lifecycle State Machine
Specimens advance through an immutable, strictly regulated lifecycle:

```
[ REGISTERED ] (Collection pending)
       │
       ▼
 [ COLLECTED ] (Drawn by phlebotomist, barcode tagged)
       │
       ▼
[ IN_TRANSIT ] (Dispatched to central processing lab)
       │
       ▼
 [ RECEIVED ]  (Physically logged at receiving desk)
       │
       ├───► [ ACCESSIONED ] (Accepted into processing queue)
       │           │
       │           ▼
       │     [ PROCESSING ]
       │           │
       │           ▼
       │     [ COMPLETED ]
       │
       └───► [ REJECTED ] (Pre-analytical failure, recollection requested)
```

## 2. Immutable Event Timeline
Every transition records a discrete, append-only event in the sample's `events` array:
- `eventType`: `REGISTERED`, `BARCODE_GENERATED`, `COLLECTED`, `DISPATCHED`, `RECEIVED`, `ACCESSIONED`, `REJECTED`, `RECOLLECTION_REQUESTED`, `PROCESSING_STARTED`.
- `actorId` and `actorName`: Identity of the phlebotomist, courier, or accessioning technician.
- `timestamp`: High-precision ISO 8601 UTC timestamp.
- `reason` and `notes`: Pre-analytical quality annotations or statutory rejection codes.

## 3. Retrieval & Auditing
- **Endpoint:** `GET /api/v1/laboratory/samples/:id/timeline`
- Yields the chronological chain of custody for statutory NABL inspection and internal quality assurance.
