# Room Bookings Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- ChurchTools instance with room booking resources configured
- User with `churchresource.administer bookings` permission
- Active ChurchTools API session

### Access the Module

1. **Dashboard View**
   - Navigate to dashboard
   - Find "🛏️ Raumbuchungsanfragen" card
   - View statistics: Total requests, conflicts, non-conflicts

2. **Admin Panel**
   - Click "Verwalten" (Manage) button on card
   - Or navigate directly to module

---

## 📋 Common Tasks

### Viewing Booking Details

1. Click the **ℹ️** button in the Actions column
2. A modal opens showing:
   - Full booking information
   - Date, time, room
   - Requester details
   - Conflicts (if any)
   - Description/remarks

**Keyboard**: Press Escape to close modal

### Viewing Conflict Details

1. Look for **⚠️ badge** in the Conflicts column
2. **Click the badge** to open conflict details modal
3. View:
   - All conflicting bookings
   - Creator of each conflict
   - Time ranges and dates
   - Status of conflicts

### Approving a Booking

#### Single Approval
1. Click **✅** button in Actions column
2. Confirmation required
3. Booking status changes to "Genehmigt" (Approved)

#### Bulk Approval
1. **Check boxes** for multiple bookings
2. Click **✅ Genehmigen** button in header
3. Confirm approval
4. All selected bookings approved at once

**Tip**: Click header checkbox to select all visible bookings

### Rejecting a Booking

#### Single Rejection
1. Click **❌** button in Actions column
2. Modal opens for rejection
3. **Enter rejection reason** (required)
4. Click **Ablehnen** (Reject)
5. Email sent to requester with reason

#### Bulk Rejection
1. Check boxes for multiple bookings
2. Click **❌ Ablehnen** button in header
3. Enter shared rejection reason
4. Confirm
5. All selected bookings rejected, emails sent

**Note**: Rejection emails include reason and sender information

### Deleting a Booking

1. **Only available for non-pending bookings**
   - Use filter: Status = "Genehmigt" or "Abgelehnt"

2. Click **🗑️** button in Actions column
3. Confirm deletion (cannot be undone)
4. Booking soft-deleted (statusId = 99)

### Filtering Bookings

#### Date Range
- **Datum von**: Select start date
- **Datum bis**: Select end date
- Only shows bookings within range

#### Room/Resource
- **Raum**: Select from dropdown
- Shows only bookings for selected room
- Default: "Alle Räume" (all rooms)

#### Conflict Status
- **Konflikte: Alle** - All bookings
- **Konflikte: Mit Konflikten** - Only conflicting
- **Konflikte: Ohne Konflikte** - Only non-conflicting

#### Booking Status
- **Status: Ausstehend** (Pending) - Default
- **Status: Genehmigt** (Approved)
- **Status: Abgelehnt** (Canceled)

#### Search
- **Search field** at top right
- Searches: Title, Room, Person names, Description
- Real-time filtering

### Sorting

1. Click any **column header** to sort
2. Click again to **toggle direction** (↑ ascending, ↓ descending)
3. Current sort shown in header

**Sortable columns**: Room, Date, Title

---

## 📊 Understanding the Data

### Status Indicators

- **Ausstehend** (Yellow badge) - Pending approval
- **Genehmigt** (Green badge) - Approved
- **Abgelehnt** (Red badge) - Rejected/Canceled

### Conflict Badge (⚠️)

Shows number of conflicting bookings.

**Example**: "⚠️ 2" = 2 conflicting bookings

**Why conflicts occur**: Two bookings in same room during overlapping times

### Series Badge (🔄)

Indicates booking is part of recurring series.

**Hover to see**: End date of series or "unbegrenzt" (unlimited)

---

## 💡 Tips & Tricks

### Efficient Approval

1. Filter by: Raum = Select room, Konflikte = Ohne Konflikte
2. Select all (header checkbox)
3. Bulk approve
4. Done in 3 clicks!

### Conflict Resolution

1. Sort by date ascending
2. Filter by Konflikte = Mit Konflikten
3. Check each conflict modal
4. Negotiate with conflicting party or reject

### Quick Rejection

1. Check multiple boxes of problematic requests
2. Enter shared reason (e.g., "Raum nicht verfügbar")
3. Bulk reject
4. Done!

### Find Your Booking

1. Use search box
2. Enter: Room name, person name, or title
3. Instant results

---

## 🔧 Troubleshooting

### Bookings Not Loading
- Check your permission: `churchresource.administer bookings`
- Verify ChurchTools API is accessible
- Refresh page (F5)

### Can't See Conflicts
- Zoom in (conflicts are small badge)
- Check filter isn't hiding them
- Filter by: Konflikte = Mit Konflikten

### Email Not Sent
- Verify ChurchTools email service configured
- Check person email addresses exist
- Look for error toast in top right

### Can't Approve/Reject
- Check permission again
- Booking might be locked
- Try refreshing

### Date Filter Not Working
- Click outside field after selecting date
- Or press Enter to confirm
- Check start date ≤ end date

---

## 📱 Mobile / Responsive

The interface is responsive:

- **Desktop**: Full table view
- **Tablet**: Condensed columns
- **Mobile**: Stacked layout, scrollable actions

**Note**: Bulk operations work on visible (filtered) bookings only

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Close any open modal |
| Enter | Submit form/dialog |
| Tab | Navigate between fields |
| Space | Toggle checkbox |

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Permission denied | Contact admin, request `churchresource.administer bookings` |
| Bookings stuck in pending | Refresh, check for API errors in console |
| Email bouncing | Verify person email exists in ChurchTools |
| Conflicts not showing | Clear browser cache, refresh page |

### Where to Find Help

- **Documentation**: [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)
- **API Details**: [API_ANALYSE.md](./API_ANALYSE.md)
- **Requirements**: [ANFORDERUNG.md](./ANFORDERUNG.md)

---

## 🎓 Examples

### Example 1: Approve All Non-Conflicting Bookings

```
1. Filter by: Konflikte = "Ohne Konflikte"
2. Filter by: Status = "Ausstehend"
3. Click header checkbox → Select all visible
4. Click "✅ Genehmigen"
5. Confirm
→ All approved!
```

### Example 2: Find and Reject Conflicting Bookings

```
1. Filter by: Konflikte = "Mit Konflikten"
2. Click ⚠️ badge to see details
3. Negotiate resolution
4. Click ❌ to reject with reason
5. Email sent to all parties
→ Conflict handled!
```

### Example 3: Manage Room "Großer Saal"

```
1. Filter by: Raum = "Großer Saal"
2. Sort by: Datum ascending
3. Review each booking
4. Approve compatible, reject conflicts
5. Refresh to see latest
→ Room managed!
```

---

## 🔐 Permissions

This module requires:

```
Module: churchresource
Action: administer bookings
```

If you don't see the card on dashboard, you lack permission.

Contact your ChurchTools admin to grant access.

---

## ✨ Features at a Glance

| Feature | What It Does |
|---------|-------------|
| Dashboard Card | Shows statistics overview |
| Admin Table | Lists all bookings with filters |
| Details Modal | Full booking information |
| Conflict Modal | Details about conflicts |
| Bulk Approve | Approve multiple at once |
| Bulk Reject | Reject multiple with reason |
| Bulk Delete | Delete multiple bookings |
| Email Notify | Auto-send to affected parties |
| Search | Full-text search |
| Filters | 5 different filter criteria |
| Sort | Clickable column headers |

---

## 📚 Learn More

- [Complete Summary](./COMPLETION_SUMMARY.md) - Full technical details
- [Requirements](./ANFORDERUNG.md) - What was requested
- [API Analysis](./API_ANALYSE.md) - How it works technically
- [Checklist](./IMPLEMENTATION_CHECKLIST.md) - What was implemented

---

**Happy booking management!** 🎉

Last Updated: 2026-04-17
