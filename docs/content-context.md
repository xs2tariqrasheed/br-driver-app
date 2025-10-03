# Content Context

## Overview

The `ContentContext` provides a global state management solution for storing app-wide content fetched from the backend API. This context is initialized at app startup by fetching content from the `/content` endpoint.

## Purpose

- **Centralized Content Storage**: Store all app content in a single, accessible location
- **Single Source of Truth**: Ensure all screens access the same content data
- **Performance**: Fetch content once at startup instead of multiple times across screens

## Usage

### Import the Hook

```tsx
import { useContent } from "@/context/ContentContext";
```

### Access Content in Components

```tsx
function MyComponent() {
  const [content, setContent] = useContent();

  // Access content data
  const welcomeMessage = content?.welcomeMessage;
  const termsAndConditions = content?.termsAndConditions;

  return (
    <View>
      <Text>{welcomeMessage}</Text>
    </View>
  );
}
```

### Update Content

```tsx
function MyComponent() {
  const [content, setContent] = useContent();

  const updateContent = () => {
    setContent({
      ...content,
      newField: "new value",
    });
  };

  return <Button onPress={updateContent} title="Update Content" />;
}
```

## Content Structure

The content object structure depends on the API response from the `/content` endpoint. The type is flexible (`ContentObject`) to accommodate various content structures:

```typescript
type ContentObject = {
  [key: string]: any;
};
```

## Integration Flow

1. **App Startup** (`app/index.tsx`):

   - Displays loading screen with logo
   - Calls GET `/content` API endpoint
   - Stores fetched content in ContentContext
   - Redirects to login screen on success
   - Shows error message on failure

2. **Provider Setup** (`app/_layout.tsx`):

   - `ContentProvider` wraps the entire app
   - Placed at the top of the provider tree
   - Makes content available to all child components

3. **Component Access**:
   - Any component can access content using `useContent()` hook
   - Content is available throughout the app lifecycle
   - Persists across screen navigation

## Error Handling

The initial content fetch is handled in `app/index.tsx`:

- **Loading State**: Shows animated logo with loading indicator
- **Success State**: Stores content and redirects to login
- **Error State**: Displays error message with details

```tsx
// Example error display
<View>
  <Text>Failed to Load Content</Text>
  <Text>{error || "Unable to fetch app content..."}</Text>
</View>
```

## Best Practices

1. **Read Content Early**: Access content in components after app initialization
2. **Type Safety**: Consider creating specific types for your content structure
3. **Fallback Values**: Always provide fallback values when accessing content:
   ```tsx
   const message = content?.welcomeMessage || "Welcome!";
   ```
4. **Content Updates**: Only update content when necessary (e.g., manual refresh)

## API Integration

### Endpoint

- **URL**: `/content`
- **Method**: GET
- **Client**: Default `apiClient` (uses base URL from environment)

### Example Response

```json
{
  "welcomeMessage": "Welcome to BR Driver",
  "termsAndConditions": "...",
  "privacyPolicy": "...",
  "supportEmail": "support@example.com",
  "features": {
    "notifications": true,
    "gpsTracking": true
  }
}
```

## Related Files

- **Context**: `context/ContentContext.tsx`
- **Usage**: `app/index.tsx` (initial fetch)
- **Provider**: `app/_layout.tsx` (provider setup)
- **Hook**: `hooks/useFetch.ts` (API call)

## Notes

- Content is fetched once at app startup
- No persistence to AsyncStorage (fetched fresh on each app launch)
- Content is stored in memory during app session
- If content fetch fails, app shows error and doesn't redirect to login
