# 🚀 Cache Testing Guide

## So testest du die Caching-Performance

### 1. **Cache Debug Panel**

- Oben rechts siehst du ein schwarzes Debug-Panel (nur im Development-Modus)
- Zeigt den Status aller Queries: Frisch, Veraltet, Lädt...
- Zeigt das Alter der Daten (z.B. "30s" = vor 30 Sekunden geladen)

### 2. **Cache-Wirkung testen**

#### **Szenario A: Navigation zwischen Dashboard und Admin**

1. Öffne das Dashboard → warte bis alle Daten geladen sind
2. Klicke auf "Details" bei einer Karte (z.B. Tags)
3. Klicke "← Zurück zum Dashboard"
4. **Ergebnis**: Daten erscheinen SOFORT (aus Cache)

#### **Szenario B: Browser-Tab wechseln**

1. Lade das Dashboard
2. Wechsle zu einem anderen Tab (5+ Minuten)
3. Komme zurück zum Dashboard-Tab
4. **Ergebnis**: Daten sind sofort da + werden im Hintergrund aktualisiert

#### **Szenario C: Refresh-Button**

1. Klicke "Aktualisieren" bei einer Karte
2. **Ergebnis**: Nur diese Karte lädt neu, andere bleiben unberührt

### 3. **Performance-Messungen**

#### **Browser-Konsole öffnen (F12)**

Schaue nach diesen Logs:

```
🏷️ Tags fetched: 25 tags in 234ms
📅 Setting up expiring appointments query
⚙️ Groups fetched: 12 groups in 456ms
```

#### **Network Tab (F12 → Network)**

- **Erster Besuch**: Alle API-Calls sichtbar
- **Wiederholter Besuch**: Keine/wenige API-Calls (Cache!)

### 4. **Cache-Strategien pro Modul**

| Modul       | Cache-Zeit | Background-Update | Test                          |
| ----------- | ---------- | ----------------- | ----------------------------- |
| **Tags**    | 1 Stunde   | Nie               | Sehr schnell bei Wiederholung |
| **Termine** | 30 Min     | 15 Min            | Mittlere Geschwindigkeit      |
| **Gruppen** | 10 Min     | 5 Min             | Häufige Updates               |
| **Logs**    | 2 Min      | 1 Min             | Sehr häufige Updates          |

### 5. **Erwartete Performance-Verbesserungen**

#### **Ohne Cache (vorher)**

- Dashboard laden: 3-8 Sekunden
- Navigation: 2-5 Sekunden pro Wechsel
- Jeder Besuch = neue API-Calls

#### **Mit Cache (jetzt)**

- Erster Besuch: 3-8 Sekunden (normal)
- **Wiederholte Besuche: <1 Sekunde** ⚡
- Navigation: Sofort (aus Cache)
- Background-Updates: Unsichtbar für User

### 6. **Debug-Befehle**

#### **Browser-Konsole**

```javascript
// Cache-Status anzeigen
queryClient.getQueryCache().getAll()

// Bestimmte Query prüfen
queryClient.getQueryState(["tags"])

// Cache leeren
queryClient.clear()
```

### 7. **Typische Cache-Szenarien**

#### **🟢 Cache Hit (schnell)**

```
Status: Frisch (grün)
Alter: 2m
Ladezeit: <100ms
```

#### **🟡 Stale-While-Revalidate**

```
Status: Veraltet (gelb)
Verhalten: Sofortige Anzeige + Background-Update
```

#### **🔵 Background Fetch**

```
Status: Lädt... (blau)
Verhalten: Alte Daten sichtbar + neue werden geladen
```

### 8. **Troubleshooting**

#### **"Ich sehe keinen Unterschied"**

- Warte bis alle Daten initial geladen sind
- Navigiere zwischen Dashboard ↔ Admin mehrmals
- Schaue auf das Debug-Panel (Status sollte "Frisch" sein)

#### **"Cache funktioniert nicht"**

- Browser-Konsole prüfen auf Fehler
- Network-Tab: Sollten weniger Requests sein
- Debug-Panel: Status sollte nicht immer "Nicht geladen" sein

### 9. **Erweiterte Tests**

#### **Offline-Verhalten**

1. Lade Dashboard vollständig
2. Gehe offline (Network → Offline)
3. Navigiere zwischen Seiten
4. **Ergebnis**: Cached Daten bleiben verfügbar

#### **Concurrent Requests**

1. Öffne mehrere Tabs mit dem Dashboard
2. **Ergebnis**: Nur ein API-Call pro Query (Request Deduplication)

---

**💡 Tipp**: Die größten Performance-Gewinne siehst du bei wiederholten Aktionen, nicht beim ersten Laden!
