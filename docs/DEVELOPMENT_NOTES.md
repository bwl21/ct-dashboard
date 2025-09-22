# Development Notes

## ChurchTools Client API Usage

### ✅ Correct Pattern
```typescript
// Parameters passed directly as object properties
churchtoolsClient.get('/api/endpoint', { 
  param1: 'value1',
  param2: 'value2',
  limit: 50
})

churchtoolsClient.post('/api/endpoint', {
  data: 'value'
})
```

### ❌ Incorrect Pattern
```typescript
// DO NOT wrap parameters in a nested "params" object
churchtoolsClient.get('/api/endpoint', { 
  params: { param1: 'value1' }  // WRONG!
})
```

### API Signature
```typescript
get<ResponseType>(uri: string, params?: Record<string, any>, options?: GetOptions): Promise<ResponseType>
post<ResponseType>(uri: string, data?: any, options?: PostOptions): Promise<ResponseType>
```

### Examples in Codebase
- **Correct usage**: `src/services/churchtools.ts`
- **Incorrect usage found in**: `src/components/tags/TagsAdmin.vue`, `src/components/tags/TagsCard.vue`

### Note for AI Assistants
The second parameter of churchtoolsClient methods is the direct params object, not an object containing a "params" key. This is a common mistake that should be avoided in new code and corrected when found in existing code.