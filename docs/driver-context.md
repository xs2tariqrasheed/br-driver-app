## Driver Context (Online/Offline)

The Driver Context mirrors the Auth Context pattern and stores driver-specific UI state, currently the online/offline status. It persists to AsyncStorage so the status survives app restarts.

### File locations

- Provider and hook: `context/DriverContext.tsx`
- Storage keys and labels: `constants/global.ts` (`DRIVER_STORAGE_KEY`, `DRIVER_STATUS`)

### State shape

```
type DriverObject = {
  online: boolean;
} | null;

type DriverState = {
  driver: DriverObject;
  isHydrated: boolean;
};
```

### API

The hook returns a tuple `[driver, setDriver]`:

```
const [driver, setDriver] = useDriver();

// Read status
const isOnline = !!driver?.online;

// Update status
await setDriver({ ...(driver ?? {}), online: true });
```

### UI labels

Do not hardcode strings for Online/Offline in the UI. Use the exported constants from `constants/global.ts`:

```
import { DRIVER_STATUS } from "@/constants/global";

DRIVER_STATUS.ONLINE  // "Online"
DRIVER_STATUS.OFFLINE // "Offline"
```

This lets you rename statuses globally (e.g., to "Active" / "Inactive") in one place.

### Example usage (Home header toggle)

See `app/(tabs)/index.tsx` where a labeled Toggle binds to the driver context:

```
const [driver, setDriver] = useDriver();
const labels = [DRIVER_STATUS.OFFLINE, DRIVER_STATUS.ONLINE] as const;

<Toggle
  variant="labeled"
  labels={labels}
  value={driver?.online ? DRIVER_STATUS.ONLINE : DRIVER_STATUS.OFFLINE}
  setValue={(next) => setDriver({ ...(driver ?? {}), online: next === DRIVER_STATUS.ONLINE })}
/>;
```
