# API-Analyse: Raumbuchungsanfragen (Resource Bookings)

## 🔍 Findings

### Bestehende API-Endpoints für Raumbuchungen

Das ChurchTools System hat bereits eine vollständige **Booking/Resource API** im OpenAPI-Schema (`ct-types.d.ts`):

#### 1. **Datenmodelle vorhanden** ✅

- `BookingBase` - Basis-Buchung mit vollständigen Details
- `BookingCalculated` - Buchung mit berechneten Dates
- `BookingCalculatedWithIncludes` - **Mit Konflikten!** ⭐
- `BookingConflict` - Konflikt-Informationen (bookingId, startDate, endDate, statusId, title)
- `BookingCreate` - Schema zum Erstellen einer Buchung
- `Resource` - Ressource/Raum-Definition
- `ResourceType` - Typ der Ressource

#### 2. **Booking-Status & Konflikt-Handling** ✅

```typescript
// BookingBase enthält:
- id: number
- resourceId: number
- startDate: ZuluDate
- endDate: ZuluDate  
- statusId: number
- title: string
- description: string | null
- createdBy: DomainObjectPerson
- onBehalfOfPid: number | null
- onBehalfOf: DomainObjectPerson (in involvedPersonsDomainObjects)

// Konflikte sind explizit im Type:
BookingCalculatedWithIncludes: {
  booking: BookingCalculated
  conflicts?: Array<BookingConflict>
}

// BookingConflict:
{
  bookingId: number
  startDate: ZuluDate
  endDate: ZuluDate
  statusId: StatusId
  title: string
}
```

#### 3. **Status-Handling** ✅

Das System hat `StatusId` Typen:
- Verschiedene Booking-Status sind über `statusId` definiert
- API gibt Status explizit zurück
- Konflikte mit jeweiligem Status einzeln auflisten

### ✅ Verifizierte API-Endpoints (aus OpenAPI-Doku)

```typescript
// 1. Alle Bookings abrufen (mit Filtern & Includes)
GET /bookings
  params: {
    resource_ids[]: number[]        // ERFORDERLICH! Array von Resource-IDs
    status_ids[]?: number[]         // Optional, default: [1, 2] (pending, approved)
                                    // 1=PENDING, 2=APPROVED, 3=CANCELED, 99=DELETED
    person_id?: number              // Filter: Creator oder "im Auftrag von"
    query?: string                  // Freitext-Suche
    include[]: string[]             // ["conflicts", "involvedPersonsDomainObjects"]
  }
  response: {
    data: Array<{
      booking: BookingCalculated
      conflicts?: Array<BookingConflict>
      involvedPersonsDomainObjects?: {
        createdBy?: DomainObjectPerson
        onBehalfOf?: DomainObjectPerson
      }
    }>
    meta: { count: number }
  }

// 2. Einzelne Booking abrufen
GET /bookings/{bookingId}
  response: {
    data: {
      booking: BookingCalculated
      calculatedDates: { startDate, endDate }
      additionalInfos: string[]
    }
  }

// 3. Status einer Booking ändern (✅ AKZEPTIEREN/ABLEHNEN)
PUT /bookings/{bookingId}/{answer}
  params: {
    answer: "accept" | "reject"
  }
  body: {} // Leerer Body
  response: Booking aktualisiert

// ODER Update via PUT (mehr Flexibilität):
PUT /bookings/{bookingId}
  body: {
    statusId: 2        // APPROVED (2) oder CANCELED (3)
    description?: string
    ... weitere Felder
  }

// 4. Konflikte für NEUE Booking berechnen
POST /bookings/conflicts
  body: BookingConflictRequestBody {
    resourceId: number
    startDate: DateString
    endDate: DateString
    // ... (weitere optionale Felder)
  }
  response: { data: Array<BookingConflict>, meta: { count } }

// 5. Konflikte für BESTEHENDE Booking berechnen (bei Update)
POST /bookings/{bookingId}/conflicts
  body: (wie oben)

// 6. Alle Resources abrufen
GET /resources
  response: { data: Array<Resource>, meta: { count } }

// 7. Resource Master Data
GET /resources/masterdata
  response: { resources: Array<Resource>, resourceTypes: Array<ResourceType> }
```

### ⚠️ Wichtige Erkenntnisse

1. **`resource_ids[]` ist ERFORDERLICH!**
   - Bookings können NICHT ohne Resource-IDs abgerufen werden
   - Müssen zuerst alle Resources laden, dann für jede Bookings abfragen
   - Oder mehrere Queries kombinieren

2. **Status-IDs sind standardisiert:**
   - 1 = PENDING (offene Anfrage)
   - 2 = APPROVED/CONFIRMED (genehmigt)
   - 3 = CANCELED (abgelehnt)
   - 99 = DELETED (gelöscht)

3. **Update-Endpoints:**
   - `PUT /bookings/{bookingId}/{answer}` mit "accept"/"reject"
   - `PUT /bookings/{bookingId}` mit statusId im Body (flexibler)

4. **Include-Parameter:**
   - `conflicts` - Zeigt conflicting bookings
   - `involvedPersonsDomainObjects` - Zeigt createdBy + onBehalfOf

5. **Person-Daten sind INCLUDED:**
   - Bei `include[]=involvedPersonsDomainObjects` kommt das direkt mit
   - Keine separaten `/person` Calls nötig

## 📊 Datenfluss für Feature

### 1. **Initiales Laden: Dashboard Card**
```
GET /bookings?status_id=pending&include=conflicts,persons
└─ Liefert: Array<BookingCalculatedWithIncludes>
   - booking.base.resourceId, title, dates
   - booking.base.createdBy (ersteller)
   - booking.base.onBehalfOf (im Auftrag von)
   - conflicts[] (Array, kann leer sein)
```

### 2. **Filterung & Sortierung** (Client-side nach Fetch)
- Nach Status: `filterByStatus(statusId)`
- Nach Konflikt: `filter(b => b.conflicts && b.conflicts.length > 0)`
- Nach Datum/Raum: `filter(b => b.booking.base.resourceId === id)`
- Freitext: `filter(b => title.includes(text))`
- **Sortierung: Spalten-Header Klick → Datensatz nach Feld sortieren**

### 3. **Bulk-Aktion: Bestätigen**
```typescript
// Für jede markierte Booking:
PUT /bookings/{bookingId}
  body: { statusId: APPROVED_STATUS_ID }

// Dann: GET /bookings (refresh)
```

### 4. **Bulk-Aktion: Ablehnen mit Bemerkung**
```typescript
// Für jede markierte Booking:
PUT /bookings/{bookingId}
  body: { 
    statusId: REJECTED_STATUS_ID,
    description: "Admin-Bemerkung"  // Optional - müsste übergeben werden
  }

// Dann: Trigger E-Mail an createdBy + onBehalfOf + conflictPersons
```

### 5. **E-Mail bei Ablehnung**
Needed zusätzlich:
- E-Mail API-Endpoint (existiert wahrscheinlich in ChurchTools)
- Template für Ablehnungsmail
- Person-Daten auflösen (aus Booking: createdBy, onBehalfOf, Konflikt-Creator)

## ✅ Offene Fragen geklärt

| Frage | Antwort |
|-------|--------|
| **Status-IDs** | 1=PENDING, 2=APPROVED, 3=CANCELED, 99=DELETED ✅ |
| **include-Parameter** | `conflicts`, `involvedPersonsDomainObjects` ✅ |
| **Person-Daten** | Mit `involvedPersonsDomainObjects` enthalten (createdBy, onBehalfOf) ✅ |
| **Konflikt-Daten** | Mit `include[]=conflicts` in Booking enthalten ✅ |

## ⚠️ Noch zu klären

1. **E-Mail API in ChurchTools**:
   - Gibt es einen Endpoint zum Mailen?
   - Oder externe Mail-Service (nodemailer, SendGrid)?
   - SMTP-Konfiguration in ChurchTools?

2. **Person-E-Mail in DomainObjectPerson**:
   - Enthalten die `createdBy` und `onBehalfOf` Objekte direkt eine `email` Property?
   - Oder ist nur `id` und `name` vorhanden → separat `/persons/{id}` aufrufen?

3. **Konflikt-Creator auflösen**:
   - Konflikt enthält nur `bookingId`, `title`, `startDate`, `endDate`
   - Um E-Mail des Konflikt-Creators zu bekommen:
     - Option A: `GET /bookings/{conflictBookingId}` mit `include[]=involvedPersonsDomainObjects`
     - Option B: Ist Creator schon im Konflikt-Objekt enthalten?
   - **→ Müssen wir mit Test-API prüfen**

4. **Bulk Email-Versand**:
   - Mehrere Personen in Ablehnungs-Mail (createdBy + onBehalfOf + conflictCreators)
   - Alle in einer Mail? Separate Mails? (Mit E-Mail-Template TBD)

## 🎯 Nächste Schritte

1. **API-Endpoints testen/validieren**:
   - Doku der ChurchTools API checken
   - Oder in Live-Instanz mit DevTools testen
   - Status-IDs herausfinden

2. **E-Mail-Integration klären**:
   - Welcher Endpunkt? Welche Template-Sprache?
   - Lokale Lösung (nodemailer) vs. ChurchTools-API?

3. **Composable implementieren** (`useRoomBookings.ts`):
   - `fetchBookings(filter, sort)`
   - `approveBooking(id)`
   - `rejectBooking(id, reason)`
   - `sendRejectionEmail(booking, reason, conflictPersons)`

4. **AdminTable Pattern studieren**:
   - `/src/components/tags/TagsAdmin.vue`
   - `/src/components/automatic-groups/AutomaticGroupsAdmin.vue`
   - Checkboxes, Bulk-Buttons, Actions Spalte

## 📝 API Pattern in diesem Projekt

**Bestätigte Muster aus existendem Code:**

```typescript
// ✅ CORRECT (nach AGENTS.md):
const response = await churchtoolsClient.get("/api/endpoint", { param1: "value1" })
// Client unwraps data - use response directly!

// ❌ WRONG:
const response = await churchtoolsClient.get("/api/endpoint", { params: { ... } })

// Delete-Operationen:
await (churchtoolsClient as any).deleteApi(`/tags/${tagId}`)

// Pagination:
const response = await churchtoolsClient.get(`/resource?limit=${limit}&page=${page}`)
```

**Composable Pattern** (aus `useAutomaticGroups.ts`, `useTags.ts`):
- Vue 3 Composable mit `ref`, `computed`
- Oder `@tanstack/vue-query` für komplexere Daten
- Async Funktionen für API-Calls
- Error Handling & Logging
- Type-safe mit TypeScript Interfaces

---

**Status**: 📋 Analyse  
**Aktuell**: 2026-04-16  
**Nächster Schritt**: API-Endpoints verifizieren & Composable starten
