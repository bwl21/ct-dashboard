# ChurchTools Dashboard - Agent Guidelines

Vue 3 + TypeScript ChurchTools extension for dashboard functionality with modular card-based architecture.

## Common Commands
- `npm run dev` - Start development server (use with exec_preview)
- `npm run build` - Build for production
- `npm run lint` - Type check and format validation
- `npm run format` - Auto-format code
- `npm run clean` - Clean build artifacts

## Key Files
- `src/components/` - Modular dashboard components
- `src/components/common/BaseCard.vue` - Reusable card component
- `src/components/common/AdminTable.vue` - Data table component
- `.tmp/` - Screenshots and temporary files (not versioned)

## Critical API Pattern ⚠️
**ALWAYS use correct ChurchTools API pattern:**

✅ **Correct:**
```typescript
churchtoolsClient.get('/api/endpoint', { param1: 'value1', param2: 'value2' })
```

❌ **Wrong:**
```typescript
churchtoolsClient.get('/api/endpoint', { params: { param1: 'value1' } })
```

**API Response Structure:**
- ChurchTools client returns the content of `data` directly
- OpenAPI spec shows `{ data: [...], meta: {...} }` but client unwraps this
- Use `response` directly, not `response.data`

## Component Structure
Follow this pattern for new modules:
```
src/components/[module-name]/
├── [Module]Card.vue      # Dashboard card using BaseCard
├── [Module]Admin.vue     # Admin panel using AdminTable  
└── use[Module].ts        # Vue 3 composable with API logic
```

## BaseCard Usage
See working examples:
- `src/components/expiring-appointments/ExpiringAppointmentsCard.vue`
- `src/components/automatic-groups/AutomaticGroupsCard.vue`
- `src/components/tags/TagsCard.vue`

## AdminTable Usage
See working examples:
- `src/components/tags/TagsAdmin.vue`
- `src/components/expiring-appointments/ExpiringAppointmentsAdmin.vue`
- `src/components/automatic-groups/AutomaticGroupsAdmin.vue`

## Composable Pattern
See working examples:
- `src/components/tags/useTags.ts`
- `src/components/expiring-appointments/useExpiringAppointments.ts`
- `src/components/automatic-groups/useAutomaticGroups.ts`

## Development Workflow
1. **Examine existing components** for patterns
2. **Use BaseCard + AdminTable** for consistent UI
3. **Follow TypeScript interfaces** for data structures
4. **Use ChurchTools design classes** (ct-btn, ct-card, ct-select)
5. **Test with exec_preview** on port 5173
6. **Run npm run lint** before completion

⚠️ **IMPORTANT**: 
- NEVER run the development server when expecting the user to test manually. Only use exec_preview for agent testing.
- NEVER make commits on your own behalf. Always ask the user before committing changes.
- CREATE session documentation at start of significant work, UPDATE throughout with timestamps.
- FINALIZE session docs and extract key insights to LESSONS-LEARNED.md when user indicates work is complete.

**Proactive Commit Suggestions:**
- Suggest commits after completing logical units of work
- Remind user to commit before starting new features  
- Propose commits when tests pass and code is stable
- Recommend commits at end of development phases

## Adding New Module
1. Create module directory in `src/components/`
2. Implement Card component using BaseCard
3. Implement Admin component using AdminTable
4. Create composable for data logic
5. Add route to App.vue

## Session Documentation
For significant development work, create session documentation:

**Naming**: `docs/DEVELOPMENT_SESSION_YYYY-MM-DD[_Feature_Name].md`

**Template**:
```markdown
# Development Session - YYYY-MM-DD

## Session Overview
**Started**: HH:MM  
**Branch**: `feature/branch-name`  
**Focus**: Brief description

## Major Accomplishments

### Phase 1: Feature Implementation (HH:MM-HH:MM)
- **Goal**: What was intended
- **Result**: What was achieved
- **Code Changes**: Key files modified

*Add more phases as needed with timestamps*

## Technical Decisions

### Decision: Title (HH:MM)
**Context**: Why needed
**Decision**: What was chosen and why
**Impact**: Effect on codebase

## Next Steps
- [ ] Follow-up tasks
- [ ] Future improvements

## Lessons Learned
- Session-specific insights
- What worked/didn't work in this session
- Immediate takeaways

*Keep brief - detailed lessons go to LESSONS-LEARNED.md*
```

**Session Workflow**: 
- Create session documentation when starting significant development work
- Update session doc throughout the work with timestamps
- When user indicates session is complete, finalize documentation and extract key insights to `docs/LESSONS-LEARNED.md`:

```markdown
# 🎓 Lessons Learned YYYY-MM-DD

### 1. Lesson Title
**Problem**: What challenge was faced
**Solution**: How it was solved
**Application**: When to use this knowledge

*Extract only significant, reusable insights from session docs*
```

## Troubleshooting
- **API calls failing**: Check ChurchTools session and permissions
- **Build errors**: Run `npm run clean && npm run reinstall`
- **Type errors**: Run `npm run type-check`
- **Format errors**: Run `npm run format`