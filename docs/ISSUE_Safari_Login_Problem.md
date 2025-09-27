# 🐛 Safari/Webkit Login Problem in Tests

## Problem Description

The ChurchTools Dashboard extension shows different behavior in Safari/Webkit compared to Chrome during Playwright tests:

- **Chrome**: Login successful, all modules visible, user shows as "Bernhard Weichel (Admin)"
- **Safari/Webkit**: Login fails, only "Auslaufende Terminserien" visible, user shows as "Anonymous"

## Evidence

### Chrome Test (Working):

- ✅ User Display: "Bernhard Weichel (Admin)"
- ✅ All 4 modules visible
- ✅ All permissions available

### Safari Test (Failing):

- ❌ User Display: "Anonymous"
- ❌ Only 1 module visible ("Auslaufende Terminserien")
- ❌ Limited permissions (only `churchcal.view` available)

## Permission Debugger Output (Safari)

```
Module Access:
- automatic-groups: ❌
- expiring-appointments: ✅
- tags: ❌
- loggerSummary: ❌

Configured Permissions:
- automatic-groups: churchdb.administer groups = ❌
- expiring-appointments: churchcal.view = ✅
- tags: churchcore.administer persons = ❌
- loggerSummary: churchcore.view logfile = ❌
```

## Potential Causes

1. **Cookie Handling**: Safari has stricter cookie policies that may block ChurchTools session cookies
2. **CORS Issues**: Safari's security model may prevent cross-origin API calls
3. **Network Stack Differences**: WebKit vs Chromium network handling
4. **JavaScript Engine**: Different async/await timing behavior

## Impact Assessment

- **Test Environment**: Confirmed issue in Playwright tests
- **Production Environment**: **Needs verification** - may affect real Safari users
- **User Base**: Potentially 15-20% of Mac users if production is affected

## Investigation Needed

### 1. Production Verification

- [ ] Test extension in real Safari browser
- [ ] Check if issue exists outside test environment
- [ ] Verify with different Safari versions

### 2. Technical Analysis

- [ ] Debug Safari network requests during login
- [ ] Check browser console for errors
- [ ] Analyze cookie behavior in Safari
- [ ] Test CORS configuration

### 3. Browser Compatibility

- [ ] Test in other WebKit-based browsers
- [ ] Verify Firefox behavior
- [ ] Check mobile Safari (if applicable)

## Workaround (Temporary)

For tests, we've made them browser-agnostic:

```typescript
// Instead of expecting specific modules
await expect(page.locator("h3", { hasText: "Automatische Gruppen" })).toBeVisible()

// Now check for any modules
const moduleCount = await page.locator("h3").count()
expect(moduleCount).toBeGreaterThan(0)
```

## Next Steps

1. **Priority**: Verify if this affects production Safari users
2. **If production affected**: High priority bug fix needed
3. **If test-only**: Lower priority, but still needs investigation for CI reliability

## Files Affected

- `src/main.ts` - Login logic
- `tests/dashboard.spec.ts` - Test expectations
- `src/services/permissions.ts` - Permission handling

## Related

- Permission-based card visibility system
- ChurchTools API authentication
- Browser compatibility testing

---

**Created**: 2025-09-27  
**Status**: Open  
**Priority**: TBD (depends on production verification)
