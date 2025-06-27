/**
 * Text Utils - Utilities to safely handle text content and prevent
 * "text strings must be rendered within a <Text> component" errors
 */

/**
 * Safely renders message content, handling special cases like DOCUMENT_REF
 */
export const safeMessageContent = (content: string | null | undefined): string => {
  // Handle null/undefined content
  if (!content) return '';
  
  // Handle document reference messages
  if (content.startsWith('DOCUMENT_REF:')) {
    const parts = content.split(':');
    const documentTitle = parts.slice(2).join(':');
    return documentTitle ? `📄 ${documentTitle}` : '📄 Document shared';
  }
  
  // Return sanitized content
  return content.trim();
};

/**
 * Gets a safe preview of message content for display in lists
 */
export const safeMessagePreview = (content: string | null | undefined): string => {
  // Handle null/undefined content
  if (!content) return 'No messages yet';
  
  // Handle document reference messages
  if (content.startsWith('DOCUMENT_REF:')) {
    return 'Document shared';
  }
  
  // Return trimmed content
  return content.trim();
};

/**
 * Safely formats any text content for React Native Text components
 */
export const safeText = (text: any): string => {
  if (text === null || text === undefined) return '';
  if (typeof text === 'string') return text;
  if (typeof text === 'number') return text.toString();
  if (typeof text === 'boolean') return text.toString();
  return String(text);
};

/**
 * Validates that content is safe to render without wrapping in Text
 * Used for debugging - should always return false in production
 */
export const isUnsafeTextContent = (content: any): boolean => {
  // Check if content is a string that's not in JSX
  if (typeof content === 'string' && content.trim().length > 0) {
    return true;
  }
  return false;
}; 