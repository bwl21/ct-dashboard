# Entwickler-Dokumentation

## Quick Reference
- **[AGENTS.md](../AGENTS.md)** - Development patterns, API usage, component structure
- **[LESSONS-LEARNED.md](./LESSONS-LEARNED.md)** - Accumulated knowledge and best practices
- **[API.md](./API.md)** - API interfaces and data structures

## Architecture Overview

### Component Structure
See [AGENTS.md Component Structure](../AGENTS.md#component-structure) for the standard module pattern.

### BaseCard System
See [AGENTS.md BaseCard Usage](../AGENTS.md#basecard-usage) for implementation examples.

### AdminTable System  
See [AGENTS.md AdminTable Usage](../AGENTS.md#admintable-usage) for table patterns.

## Development Workflow
See [AGENTS.md Development Workflow](../AGENTS.md#development-workflow) for step-by-step process.

## Unique Technical Details

### CSS Custom Properties
See `src/style.css` for all CSS custom properties and ChurchTools design system integration.

### ChurchTools Design System Classes
- `ct-btn`, `ct-btn-primary`, `ct-btn-secondary`
- `ct-card`, `ct-card-header`, `ct-card-body`
- `ct-input`, `ct-select`, `ct-textarea`
- `ct-table`, `ct-table-striped`

### Performance Considerations
- Use `defineAsyncComponent` for admin panels
- Implement virtual scrolling for large datasets
- Cache API responses with `ref()` or `reactive()`
- Debounce search inputs with `useDebouncedRef()`

### Error Handling Patterns
See working examples:
- `src/components/tags/useTags.ts` - API error handling
- `src/components/common/BaseCard.vue` - UI error states
- `src/components/common/AdminTable.vue` - Table error handling

### Testing Strategy
- Component tests with Vue Test Utils
- API mocking with Jest
- E2E tests for critical workflows
- Visual regression testing for UI components

## Build & Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete build and deployment process.

## Session Documentation
See [AGENTS.md Session Documentation](../AGENTS.md#session-documentation) for how to document development sessions.

## Troubleshooting
See [AGENTS.md Troubleshooting](../AGENTS.md#troubleshooting) for common issues and solutions.

---

**Note**: This document focuses on unique technical details. For development patterns, workflows, and examples, refer to the linked documents above.