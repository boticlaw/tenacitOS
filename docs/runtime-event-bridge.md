# Runtime Event Bridge Pattern

## Overview

The Runtime Event Bridge provides a type-safe, decoupled event system for component communication in SuperBotijo.

## Architecture

```
Producer Component → EventBridge → Consumer Components
```

Components can:
- **Emit** events without knowing who consumes them
- **Subscribe** to events without knowing who produces them
- **Filter** events by type or source
- **Access** event history for debugging

## Basic Usage

### Emitting Events

```typescript
import { emitSessionChange, emitNotification } from "@/lib/runtime-events";

// Emit a session change event
emitSessionChange("agent:boti:main", { model: "claude-sonnet-4" });

// Emit a notification
emitNotification(
  "notif-123",
  "Session Created",
  "New agent session started",
  "high"
);
```

### Subscribing to Events

#### Using the Hook (Recommended)

```typescript
import { useEventSubscription } from "@/hooks/useEventBridge";

function MyComponent() {
  useEventSubscription("session:change", (event) => {
    console.log("Session changed:", event.payload.sessionKey);
    // Update UI or state
  });

  return <div>...</div>;
}
```

#### Direct Subscription

```typescript
import { eventBridge } from "@/lib/runtime-events";

// Subscribe to specific event type
const unsubscribe = eventBridge.subscribe("session:change", (event) => {
  // Handle event
});

// Cleanup
unsubscribe();
```

### Subscribing to Multiple Events

```typescript
import { useFilteredEvents } from "@/hooks/useEventBridge";

function ActivityMonitor() {
  useFilteredEvents(
    { types: ["activity:update", "activity:create"] },
    (event) => {
      // Handle both event types
      console.log(\`Activity \${event.type}\`, event.payload);
    }
  );

  return <div>...</div>;
}
```

### Subscribing to All Events

```typescript
import { useAllEventsSubscription } from "@/hooks/useEventBridge";

function EventLogger() {
  useAllEventsSubscription((event) => {
    console.log(\`[\${event.type}]\`, event);
  });

  return null;
}
```

## Event Types

### Activity Events
- `activity:create` - New activity logged
- `activity:update` - Activity status changed

### Session Events
- `session:create` - New session started
- `session:change` - Session properties changed
- `session:delete` - Session ended

### Notification Events
- `notification:new` - New notification
- `notification:read` - Notification marked as read

### System Events
- `status:change` - Component status changed
- `gateway:status` - Gateway connection status
- `model:change` - Model changed for session

## Type Safety

All events are fully typed:

```typescript
import type { SessionChangeEvent } from "@/types/events";

const handler = (event: SessionChangeEvent) => {
  // TypeScript knows event.payload.sessionKey exists
  console.log(event.payload.sessionKey);
};
```

## Event History

Access recent events for debugging:

```typescript
import { eventBridge } from "@/lib/runtime-events";

// Get all history
const allEvents = eventBridge.getHistory();

// Get filtered history
const sessionEvents = eventBridge.getHistory({
  types: ["session:create", "session:change"]
});
```

## Best Practices

1. **Use helper functions** - Prefer `emitSessionChange()` over direct `eventBridge.emit()`
2. **Cleanup subscriptions** - Hooks handle this automatically, but manual subscriptions need cleanup
3. **Type your handlers** - Use TypeScript types for better IDE support
4. **Filter when possible** - Use filters instead of subscribing to all events
5. **Document custom events** - Add new event types to `src/types/events.ts`

## Migration Guide

### From Direct State Updates

Before:
```typescript
// Tightly coupled
setActivities([...activities, newActivity]);
```

After:
```typescript
// Decoupled via events
emitActivityCreate(newActivity.id, newActivity.type, newActivity.description);

// In another component
useEventSubscription("activity:create", (event) => {
  setActivities(prev => [...prev, event.payload]);
});
```

## Examples

### Real-time Activity Feed

```typescript
function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEventSubscription("activity:create", (event) => {
    setActivities(prev => [event.payload, ...prev]);
  });

  useEventSubscription("activity:update", (event) => {
    setActivities(prev => prev.map(a => 
      a.id === event.payload.activityId 
        ? { ...a, ...event.payload.updates }
        : a
    ));
  });

  return <div>{/* render activities */}</div>;
}
```

### Gateway Status Monitor

```typescript
function GatewayMonitor() {
  const [status, setStatus] = useState("disconnected");

  useEventSubscription("gateway:status", (event) => {
    setStatus(event.payload.status);
  });

  return <div>Status: {status}</div>;
}
```

## Testing

Events can be easily mocked in tests:

```typescript
import { eventBridge } from "@/lib/runtime-events";

test("component reacts to session change", () => {
  render(<MyComponent />);
  
  eventBridge.emit({
    type: "session:change",
    timestamp: new Date().toISOString(),
    payload: { sessionKey: "test", changes: {} }
  });

  // Assert UI updated
});
```
