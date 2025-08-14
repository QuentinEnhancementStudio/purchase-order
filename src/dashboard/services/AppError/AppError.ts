import { ErrorCategory, ErrorSeverity } from './ErrorCategories';
import { ErrorCode, isValidErrorCode } from './ErrorCodes';

/**
 * Configuration interface for creating AppError instances
 */
export interface AppErrorConfig {
  id?: string;                           // Optional - auto-generated if not provided
  category: ErrorCategory;               // Required for new errors - IMMUTABLE
  code?: ErrorCode;                      // Optional - specific error code for precise identification
  userMessage?: string;                  // Optional - user-friendly message
  technicalMessage: string;              // Required - technical details
  source?: string;                       // Optional - source location/method
  context?: Record<string, any>;         // Optional - additional context data
  severity?: ErrorSeverity;              // Optional - defaults to MEDIUM
  layer?: string;                        // Optional - application layer (UI, Store, API, etc.)
  cause?: Error | AppError;              // Optional - underlying cause
}

/**
 * Configuration interface for wrapping existing errors
 * Category is optional as it's preserved from existing AppError
 */
export interface WrapErrorConfig extends Partial<AppErrorConfig> {
  category?: ErrorCategory;  // Optional - preserved from cause if it's an AppError
  code?: ErrorCode;          // Optional - preserved from cause if it's an AppError
  userMessage?: string;      // Optional - defaults to generic message if not provided
}

/**
 * Serialized error data for logging and transmission
 */
export interface SerializedAppError {
  id: string;
  category: ErrorCategory;
  code?: ErrorCode;     // Error code for precise identification
  userMessage: string;  // Always string in serialized form (empty string if not provided)
  technicalMessage: string;
  source?: string;
  context?: Record<string, any>;
  severity: ErrorSeverity;
  layer?: string;
  timestamp: string;
  stack?: string;
  cause?: SerializedAppError | null;
}

/**
 * Custom Error class for application-wide error handling
 * Features:
 * - Immutable ID and category (set once, never change)
 * - Error chaining with cause
 * - Rich context and metadata
 * - Layered error wrapping
 */
export class AppError extends Error {
  readonly id: string;                    // IMMUTABLE - auto-generated or provided
  readonly category: ErrorCategory;       // IMMUTABLE - never overridden
  readonly code?: ErrorCode;              // IMMUTABLE - specific error code for identification
  readonly userMessage?: string;
  readonly technicalMessage: string;
  readonly source?: string;
  readonly context?: Record<string, any>;
  readonly severity: ErrorSeverity;
  readonly layer?: string;
  readonly timestamp: Date;
  readonly cause?: Error | AppError;

  /**
   * Validate AppError configuration
   * @private
   */
  private validateConfig(config: AppErrorConfig): void {
    // Validate required fields
    if (!config.technicalMessage || typeof config.technicalMessage !== 'string') {
      throw new Error('AppError: technicalMessage is required and must be a string');
    }
    
    if (!config.category) {
      throw new Error('AppError: category is required');
    }
    
    // Validate category is a valid ErrorCategory
    if (!Object.values(ErrorCategory).includes(config.category)) {
      throw new Error(`AppError: invalid category '${config.category}'. Must be one of: ${Object.values(ErrorCategory).join(', ')}`);
    }
    
    // Validate error code if provided
    if (config.code && !isValidErrorCode(config.code)) {
      throw new Error(`AppError: invalid error code '${config.code}'. Must be a valid ErrorCode`);
    }
    
    // Validate severity if provided
    if (config.severity && !Object.values(ErrorSeverity).includes(config.severity)) {
      throw new Error(`AppError: invalid severity '${config.severity}'. Must be one of: ${Object.values(ErrorSeverity).join(', ')}`);
    }
    
    // Validate ID format if provided
    if (config.id && (typeof config.id !== 'string' || config.id.length !== 6 || !/^[A-Z0-9]+$/.test(config.id))) {
      throw new Error('AppError: id must be a 6-character string containing only uppercase letters and numbers');
    }
  }

  /**
   * Generate a cryptographically secure 6 character error ID
   * Uses crypto.getRandomValues for collision-resistant ID generation
   */
  static generateErrorId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(6);
    
    // Use crypto.getRandomValues for secure random generation
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto (should be rare)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }

  constructor(config: AppErrorConfig) {
    super(config.technicalMessage);
    
    // Set error name for better debugging
    this.name = 'AppError';
    
    // Validate input parameters
    this.validateConfig(config);
    
    // IMMUTABLE PROPERTIES - set once, never change
    this.id = config.id || AppError.generateErrorId();
    this.category = config.category;
    this.code = config.code;
    
    // MUTABLE PROPERTIES - can be different per layer
    this.userMessage = config.userMessage;
    this.technicalMessage = config.technicalMessage;
    this.source = config.source;
    this.context = config.context;
    this.severity = config.severity || ErrorSeverity.MEDIUM;
    this.layer = config.layer;
    this.cause = config.cause;
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Wrap an existing error with additional context
   * Preserves ID and category if wrapping an AppError
   */
  static wrap(error: Error | AppError, config: WrapErrorConfig): AppError {
    // Extract immutable properties from existing AppError
    const existingId = error instanceof AppError ? error.id : undefined;
    const existingCategory = error instanceof AppError ? error.category : undefined;
    const existingCode = error instanceof AppError ? error.code : undefined;

    return new AppError({
      // IMMUTABLE: Preserve existing ID, category, and code - never override
      id: existingId || config.id || AppError.generateErrorId(),
      category: existingCategory || config.category || ErrorCategory.UNKNOWN,
      code: existingCode || config.code,
      
      // MUTABLE: These can be set by each layer
      userMessage: config.userMessage || 'An error occurred',
      technicalMessage: config.technicalMessage || error.message || 'Unknown technical error',
      source: config.source,
      layer: config.layer,
      context: config.context,
      severity: config.severity || ErrorSeverity.MEDIUM,
      cause: error
    });
  }

  /**
   * Create an AppError from a regular Error
   * Must provide category as it's not an AppError
   */
  static from(error: Error, config: Omit<WrapErrorConfig, 'cause'> & { category: ErrorCategory }): AppError {
    return AppError.wrap(error, {
      ...config,
      cause: error
    });
  }

  // ========== TYPE GUARDS ==========

  /**
   * Type guard to check if an error is an AppError
   */
  static isAppError(error: any): error is AppError {
    return error instanceof AppError && 
           typeof error.id === 'string' &&
           Object.values(ErrorCategory).includes(error.category) &&
           typeof error.technicalMessage === 'string';
  }

  /**
   * Type guard to check if a value is a valid ErrorCategory
   */
  static isValidCategory(category: any): category is ErrorCategory {
    return typeof category === 'string' && Object.values(ErrorCategory).includes(category as ErrorCategory);
  }

  /**
   * Type guard to check if a value is a valid ErrorSeverity
   */
  static isValidSeverity(severity: any): severity is ErrorSeverity {
    return typeof severity === 'string' && Object.values(ErrorSeverity).includes(severity as ErrorSeverity);
  }

  /**
   * Type guard to check if an object has the structure of AppErrorConfig
   */
  static isValidConfig(config: any): config is AppErrorConfig {
    return typeof config === 'object' &&
           config !== null &&
           typeof config.technicalMessage === 'string' &&
           this.isValidCategory(config.category) &&
           (config.code === undefined || isValidErrorCode(config.code)) &&
           (config.severity === undefined || this.isValidSeverity(config.severity)) &&
           (config.id === undefined || (typeof config.id === 'string' && /^[A-Z0-9]{6}$/.test(config.id)));
  }

  // ========== IMMUTABLE PROPERTY ACCESSORS ==========

  /**
   * Get the root error ID (from the deepest cause)
   */
  get rootId(): string {
    if (this.cause instanceof AppError) {
      return this.cause.rootId;
    }
    return this.id;
  }

  /**
   * Get the root error category (from the deepest cause)
   */
  get rootCategory(): ErrorCategory {
    if (this.cause instanceof AppError) {
      return this.cause.rootCategory;
    }
    return this.category;
  }

  /**
   * Get the root error code (from the deepest cause)
   */
  get rootCode(): ErrorCode | undefined {
    if (this.cause instanceof AppError) {
      return this.cause.rootCode;
    }
    return this.code;
  }

  // ========== EFFECTIVE PROPERTY ACCESSORS ==========

  /**
   * Get effective user message with fallback cascade
   */
  get effectiveUserMessage(): string {
    return this.userMessage || 
           (this.cause instanceof AppError ? this.cause.effectiveUserMessage : '') ||
           'An unexpected error occurred';
  }

  /**
   * Get effective technical message with fallback cascade
   */
  get effectiveTechnicalMessage(): string {
    return this.technicalMessage ||
           (this.cause?.message) ||
           'Unknown technical error';
  }

  /**
   * Get effective error code with fallback cascade
   */
  get effectiveCode(): ErrorCode | undefined {
    return this.code || 
           (this.cause instanceof AppError ? this.cause.effectiveCode : undefined);
  }

  /**
   * Get the path of layers in the error chain
   */
  getLayerPath(): string[] {
    const layers: string[] = [];
    if (this.layer) layers.push(this.layer);
    if (this.cause instanceof AppError) {
      layers.push(...this.cause.getLayerPath());
    }
    return layers;
  }

  /**
   * Get all context data from the error chain with proper namespacing
   */
  getAllContext(): Record<string, any> {
    const allContext: Record<string, any> = {};
    
    // Add current layer context with layer prefix
    if (this.context) {
      const currentPrefix = this.layer ? `${this.layer}` : 'current';
      Object.keys(this.context).forEach(key => {
        allContext[`${currentPrefix}.${key}`] = this.context![key];
      });
    }
    
    // Recursively add cause contexts with their own prefixes
    if (this.cause instanceof AppError) {
      const causeContexts = this.cause.getAllContext();
      Object.keys(causeContexts).forEach(key => {
        // Avoid double prefixing - check if already prefixed
        const finalKey = key.includes('.') ? key : `cause.${key}`;
        allContext[finalKey] = causeContexts[key];
      });
    } else if (this.cause) {
      // For non-AppError causes, just add basic info
      allContext['cause.message'] = this.cause.message;
      allContext['cause.name'] = this.cause.name;
    }
    
    return allContext;
  }

  /**
   * Check if this error has a specific code anywhere in the chain
   */
  hasCode(code: ErrorCode): boolean {
    if (this.code === code) return true;
    if (this.cause instanceof AppError) {
      return this.cause.hasCode(code);
    }
    return false;
  }

  // ========== SERIALIZATION METHODS ==========

  /**
   * Serialize to JSON for logging and transmission
   */
  toJSON(): SerializedAppError {
    return {
      id: this.id,
      category: this.category,
      code: this.code,
      userMessage: this.userMessage || '',
      technicalMessage: this.technicalMessage,
      source: this.source,
      context: this.context,
      severity: this.severity,
      layer: this.layer,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause instanceof AppError ? this.cause.toJSON() : null
    };
  }

  /**
   * Safe serialization without sensitive data
   */
  toSafeJSON(): Omit<SerializedAppError, 'context' | 'stack'> {
    const full = this.toJSON();
    
    // Create safe version without context and stack
    const safe: Omit<SerializedAppError, 'context' | 'stack'> = {
      id: full.id,
      category: full.category,
      code: full.code,
      userMessage: full.userMessage,
      technicalMessage: full.technicalMessage,
      source: full.source,
      severity: full.severity,
      layer: full.layer,
      timestamp: full.timestamp,
      cause: full.cause ? this.sanitizeCause(full.cause) : null
    };
    
    return safe;
  }

  /**
   * Recursively sanitize cause chain for safe serialization
   * @private
   */
  private sanitizeCause(cause: SerializedAppError): Omit<SerializedAppError, 'context' | 'stack'> | null {
    if (!cause) return null;
    
    return {
      id: cause.id,
      category: cause.category,
      code: cause.code,
      userMessage: cause.userMessage,
      technicalMessage: cause.technicalMessage,
      source: cause.source,
      severity: cause.severity,
      layer: cause.layer,
      timestamp: cause.timestamp,
      cause: cause.cause ? this.sanitizeCause(cause.cause) : null
    };
  }

  /**
   * String representation for logging
   */
  toString(): string {
    const codeStr = this.code ? ` [${this.code}]` : '';
    return `AppError [${this.id}]${codeStr} ${this.category}: ${this.technicalMessage}`;
  }

  /**
   * Detailed string representation for debugging
   */
  toLogString(): string {
    const parts = [
      `AppError [${this.id}]`,
      `Category: ${this.category}`,
      this.code ? `Code: ${this.code}` : null,
      `Layer: ${this.layer || 'Unknown'}`,
      `Message: ${this.technicalMessage}`,
      this.source ? `Source: ${this.source}` : null,
      this.context ? `Context: ${JSON.stringify(this.context)}` : null
    ].filter(Boolean);

    let result = parts.join(' | ');
    
    if (this.cause instanceof AppError) {
      result += `\n  Caused by: ${this.cause.toLogString().replace(/\n/g, '\n  ')}`;
    } else if (this.cause) {
      result += `\n  Caused by: ${this.cause.message}`;
    }
    
    return result;
  }

  // ========== MEMORY MANAGEMENT ==========

  /**
   * Dispose of error references and clear context for garbage collection
   * This is useful for long-lived error objects that might hold references
   */
  dispose(): void {
    // Clear context to help GC
    if (this.context) {
      Object.keys(this.context).forEach(key => {
        delete this.context![key];
      });
    }
    
    // Dispose of cause chain recursively
    if (this.cause instanceof AppError) {
      this.cause.dispose();
    }
  }

  /**
   * Create a lightweight copy with minimal memory footprint
   * Useful for long-term storage or caching
   */
  toMinimal(): Pick<AppError, 'id' | 'category' | 'code' | 'userMessage' | 'technicalMessage' | 'timestamp'> {
    return {
      id: this.id,
      category: this.category,
      code: this.code,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      timestamp: this.timestamp
    };
  }

  // ========== STRUCTURED LOGGING ==========

  /**
   * Log error with structured console output
   */
  log(options: { 
    includeStack?: boolean; 
    includeContext?: boolean;
    filterSensitive?: boolean;
    grouping?: boolean;
  } = {}): void {
    const {
      includeStack = true,
      includeContext = true,
      filterSensitive = true,
      grouping = true
    } = options;

    const logLevel = this.getLogLevel();
    const emoji = this.getLogEmoji();
    const title = `${emoji} AppError [${this.id}] - ${this.category}`;

    if (grouping) {
      console.groupCollapsed(title);
    } else {
      console.error(title);
    }

    // Basic error info
    const basicErrorInfo = {
      id: this.id,
      category: this.category,
      ...(this.code && { code: this.code }),
      severity: this.severity,
      ...(this.layer && { layer: this.layer }),
      message: this.technicalMessage,
      ...(this.userMessage && { userMessage: this.userMessage }),
      ...(this.source && { source: this.source }),
      timestamp: this.timestamp.toISOString(),
	  context: this.context || "",
    };
	
	console.error('Basic Error Info:', basicErrorInfo);

    // Stack trace
    if (includeStack && this.stack) {
      console.error('Stack:', this.stack);
    }

    // Chain information
    if (this.cause instanceof AppError) {
      console.error('Caused by AppError:', this.cause.id);
      this.cause.log({ ...options, grouping: false });
    } else if (this.cause) {
      console.error('Caused by:', this.cause.message);
    }

    if (grouping) {
      console.groupEnd();
    }
  }

  /**
   * Get appropriate log level based on severity
   * @private
   */
  private getLogLevel(): 'error' | 'warn' | 'info' | 'log' {
    switch (this.severity) {
      case ErrorSeverity.FATAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  /**
   * Get emoji for log visualization
   * @private
   */
  private getLogEmoji(): string {
    switch (this.severity) {
      case ErrorSeverity.FATAL:
        return '💀';
      case ErrorSeverity.HIGH:
        return '🚨';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.LOW:
        return '💡';
      default:
        return '❓';
    }
  }

  /**
   * Log only errors matching certain criteria
   */
  static logFiltered(
    errors: AppError[], 
    filter: {
      category?: ErrorCategory[];
      severity?: ErrorSeverity[];
      codes?: ErrorCode[];
      timeRange?: { start: Date; end: Date };
    }
  ): void {
    const filtered = errors.filter(error => {
      if (filter.category && !filter.category.includes(error.category)) {
        return false;
      }
      if (filter.severity && !filter.severity.includes(error.severity)) {
        return false;
      }
      if (filter.codes && error.code && !filter.codes.includes(error.code)) {
        return false;
      }
      if (filter.timeRange) {
        const errorTime = error.timestamp.getTime();
        if (errorTime < filter.timeRange.start.getTime() || 
            errorTime > filter.timeRange.end.getTime()) {
          return false;
        }
      }
      return true;
    });

    console.group(`📊 Filtered Errors (${filtered.length}/${errors.length})`);
    filtered.forEach(error => error.log({ grouping: false }));
    console.groupEnd();
  }
}