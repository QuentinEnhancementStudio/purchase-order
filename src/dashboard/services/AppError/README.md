# AppError Service

Comprehensive error handling system for the purchase-order application. Provides structured error management with hierarchical error codes, immutable properties, error chaining, and rich context support.

## Core Features

- **Immutable Error Identity**: ID, category, and code are set once and never change
- **Error Chaining**: Wrap and chain errors across application layers
- **Hierarchical Error Codes**: Domain-specific error codes following `DOMAIN.OPERATION.ISSUE` format
- **Rich Context**: Attach metadata and context to errors
- **Type Safety**: Full TypeScript support with type guards
- **Structured Logging**: Enhanced console output with filtering
- **Serialization**: JSON serialization for logging and transmission

## Quick Start

```typescript
import { AppError, ErrorCategory, ErrorSeverity } from './AppError';

// Create a new error
const error = new AppError({
  category: ErrorCategory.NETWORK,
  code: 'PARTNER.CREATE.DUPLICATE_EMAIL',
  technicalMessage: 'Failed to create partner: email already exists',
  userMessage: 'This email is already registered',
  source: 'PartnerService.create',
  context: { email: 'user@example.com' },
  severity: ErrorSeverity.MEDIUM
});

// Wrap existing error
const wrappedError = AppError.wrap(existingError, {
  layer: 'UI',
  userMessage: 'Failed to save partner',
  context: { action: 'save' }
});
```

## File Structure

```
AppError/
├── AppError.ts          # Main AppError class and interfaces
├── ErrorCategories.ts   # Error categories and severity levels
├── ErrorCodes.ts        # Hierarchical error codes by domain
├── index.ts             # Module exports
└── README.md            # This documentation
```

## Error Categories

System-level error categories for unexpected conditions:

- `NETWORK` - Network/connection failures
- `AUTH` - Authentication failures
- `AUTHORIZATION` - Permission denied
- `SERVER` - Backend/database errors
- `CLIENT` - Frontend runtime errors
- `RATE_LIMIT` - API rate limiting
- `TIMEOUT` - Request timeouts
- `CONFIGURATION` - Missing/invalid config
- `SYSTEM` - System-level failures
- `UNKNOWN` - Unclassified exceptions

## Severity Levels

- `LOW` - Minor issues, recoverable, minimal user impact
- `MEDIUM` - Significant issues, user action needed
- `HIGH` - Critical issues, system impact
- `FATAL` - System-breaking errors

## Error Codes

Hierarchical codes following `DOMAIN.OPERATION.ISSUE` format:

### Partner Management
- `PARTNER.CREATE.DUPLICATE_EMAIL`
- `PARTNER.UPDATE.NOT_FOUND`
- `PARTNER.DELETE.HAS_ORDERS`
- `PARTNER.LOAD.PERMISSION_DENIED`

### Validation
- `VALIDATION.FIELD.REQUIRED`
- `VALIDATION.BUSINESS_RULE.VIOLATED`
- `VALIDATION.INTEGRITY.CHECKSUM_FAILED`

## Usage Examples

### Basic Error Creation

```typescript
const error = new AppError({
  category: ErrorCategory.SERVER,
  technicalMessage: 'Database connection failed',
  userMessage: 'Unable to save changes',
  severity: ErrorSeverity.HIGH
});
```

### Error Wrapping

```typescript
try {
  // Some operation that might fail
} catch (error) {
  throw AppError.wrap(error, {
    layer: 'Service',
    userMessage: 'Failed to process request',
    context: { userId: '123', action: 'update' }
  });
}
```

### Error Chaining

```typescript
// Original error in data layer
const dbError = new AppError({
  category: ErrorCategory.SERVER,
  code: 'PARTNER.CREATE.DUPLICATE_EMAIL',
  technicalMessage: 'Unique constraint violation',
  layer: 'Database'
});

// Wrap in service layer
const serviceError = AppError.wrap(dbError, {
  layer: 'Service',
  technicalMessage: 'Partner creation failed',
  context: { email: 'user@example.com' }
});

// Wrap in UI layer
const uiError = AppError.wrap(serviceError, {
  layer: 'UI',
  userMessage: 'Unable to create partner'
});
```

### Type Guards

```typescript
if (AppError.isAppError(error)) {
  console.log(`Error ID: ${error.id}`);
  console.log(`Category: ${error.category}`);
}

if (AppError.isValidCategory(category)) {
  // Category is valid ErrorCategory
}
```

### Structured Logging

```typescript
// Basic logging
error.log();

// Detailed logging with options
error.log({
  includeStack: true,
  includeContext: true,
  filterSensitive: false,
  grouping: true
});

// Filter and log multiple errors
AppError.logFiltered(errors, {
  category: [ErrorCategory.NETWORK, ErrorCategory.SERVER],
  severity: [ErrorSeverity.HIGH, ErrorSeverity.FATAL],
  timeRange: { start: new Date(), end: new Date() }
});
```

### Serialization

```typescript
// Full serialization
const serialized = error.toJSON();

// Safe serialization (no context/stack)
const safe = error.toSafeJSON();

// Minimal copy for storage
const minimal = error.toMinimal();
```

### Context and Chain Navigation

```typescript
// Get effective properties (with fallbacks)
const userMsg = error.effectiveUserMessage;
const code = error.effectiveCode;

// Navigate error chain
const rootId = error.rootId;
const layers = error.getLayerPath();
const allContext = error.getAllContext();

// Check for specific codes in chain
if (error.hasCode('PARTNER.CREATE.DUPLICATE_EMAIL')) {
  // Handle duplicate email error
}
```

## Best Practices

### Error Creation
- Always provide meaningful `technicalMessage`
- Use appropriate `category` and `severity`
- Include relevant `context` data
- Specify `source` for debugging

### Error Wrapping
- Preserve original error information
- Add layer-specific context
- Provide user-friendly messages at UI layer
- Don't modify immutable properties (ID, category, code)

### Error Handling
- Use type guards to check error types
- Access effective properties for fallback behavior
- Log errors at appropriate levels
- Clean up error references when done

### Memory Management
- Call `dispose()` for long-lived error objects
- Use `toMinimal()` for storage/caching
- Clear references to prevent memory leaks

## API Reference

### AppError Class

#### Constructor
```typescript
new AppError(config: AppErrorConfig)
```

#### Static Methods
- `AppError.generateErrorId(): string`
- `AppError.wrap(error, config): AppError`
- `AppError.from(error, config): AppError`
- `AppError.isAppError(value): boolean`
- `AppError.isValidCategory(value): boolean`
- `AppError.isValidSeverity(value): boolean`
- `AppError.logFiltered(errors, filter): void`

#### Instance Properties
- `id: string` (immutable)
- `category: ErrorCategory` (immutable)
- `code?: ErrorCode` (immutable)
- `userMessage?: string`
- `technicalMessage: string`
- `source?: string`
- `context?: Record<string, any>`
- `severity: ErrorSeverity`
- `layer?: string`
- `timestamp: Date`
- `cause?: Error | AppError`

#### Instance Methods
- `toJSON(): SerializedAppError`
- `toSafeJSON(): SafeSerializedAppError`
- `toMinimal(): MinimalAppError`
- `toString(): string`
- `toLogString(): string`
- `log(options?): void`
- `dispose(): void`
- `hasCode(code): boolean`
- `getLayerPath(): string[]`
- `getAllContext(): Record<string, any>`

#### Computed Properties
- `rootId: string`
- `rootCategory: ErrorCategory`
- `rootCode?: ErrorCode`
- `effectiveUserMessage: string`
- `effectiveTechnicalMessage: string`
- `effectiveCode?: ErrorCode`

## Integration

This error system is designed to work across all application layers:

1. **Database Layer**: Create errors for data access failures
2. **Service Layer**: Wrap database errors with business context
3. **API Layer**: Transform service errors for HTTP responses
4. **UI Layer**: Present user-friendly error messages

The immutable ID and category ensure error identity is preserved across all layers while allowing each layer to add relevant context.