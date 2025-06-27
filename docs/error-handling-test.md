# Error Handling Test Guide

## Testing URL Error Detection & Snackbar Notifications

The error handling system categorizes different types of URL scraping errors and displays appropriate snackbar notifications to users.

### Test URLs for Different Error Types

#### 1. Scrape-Protected Websites (🛡️ Error Type: `scrape_protected`)
```
https://perenual.com/plant-database-search-guide/species/1055/guide 
https://cloudflare.com
https://facebook.com/sample-page
```
**Expected Behavior:** Red error snackbar with "Learn More" action button

#### 2. Invalid URLs (🔗 Error Type: `invalid_url`)
```
not-a-valid-url
ftp://invalid-protocol.com
https://   (trailing spaces get cleaned, but empty domain)
```
**Expected Behavior:** Yellow warning snackbar

#### 3. Network/Timeout Issues (⏱️ Error Type: `timeout` or `network`)
```
https://httpstat.us/timeout
https://nonexistent-domain-12345.com
```
**Expected Behavior:** Orange warning snackbar with "Retry" action

#### 4. Valid URLs for Success Testing (✅ Success)
```
https://wikipedia.org/wiki/Gardening
https://example.com
https://httpbin.org/get
```
**Expected Behavior:** Green success snackbar

### Error Response Structure

The edge function returns structured error responses:

```json
{
  "success": false,
  "error": "SCRAPE_PROTECTED",
  "error_type": "scrape_protected",
  "user_message": "This website has bot protection enabled and cannot be scraped. Please try a different URL.",
  "debug_info": {
    "domain": "perenual.com",
    "protection": true
  }
}
```

### UI Error Handling Features

1. **Processing Notification**: Blue info snackbar shown while processing
2. **Input Validation**: Warning for empty URLs or missing lesson
3. **Categorized Errors**: Different colors and actions based on error type
4. **Success Feedback**: Confirmation with resource title
5. **Retry Actions**: Action buttons for recoverable errors
6. **Enhanced Duration**: Error snackbars stay visible longer (10s vs 7s)

### Testing Steps

1. Open Teacher Lessons screen
2. Ensure you have an active lesson
3. Test each URL type in the "Add Resource" input
4. Observe different snackbar notifications
5. Try action buttons (Learn More, Retry)

### Known Issues Fixed

1. **Trailing Spaces**: URLs with trailing spaces are automatically cleaned
2. **Domain Detection**: Improved detection of scrape-protected domains
3. **Timeout Handling**: Better categorization of timeout vs protection errors
4. **User Messages**: Clear, actionable error messages instead of technical details

## Implementation Details

- **GSSnackbar Component**: Reusable snackbar with variants and actions
- **Error Categorization**: Edge function analyzes errors and returns structured responses
- **UI Integration**: Teacher lessons screen handles all error types with appropriate feedback
- **Enhanced Detection**: Multiple layers of scrape protection detection (domains, patterns, status codes) 