/**
 * Utility helper to manage the auto-incrementing ID counter.
 * Uses kvdb.io for online cross-device synchronization and falls back
 * to localStorage if offline or upon network failure.
 */

const LOCAL_STORAGE_PREFIX = 'sertif_ayc_counter_';

/**
 * Gets the current local counter value from localStorage.
 */
export function getLocalCounter(bucketId: string, keyName: string): number {
  const key = `${LOCAL_STORAGE_PREFIX}${bucketId}_${keyName}`;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Sets the local counter value in localStorage.
 */
export function setLocalCounter(bucketId: string, keyName: string, value: number): void {
  const key = `${LOCAL_STORAGE_PREFIX}${bucketId}_${keyName}`;
  localStorage.setItem(key, value.toString());
}

/**
 * Increments the counter and returns the new value.
 * @param bucketId CounterAPI namespace
 * @param keyName CounterAPI key name
 * @param isOffline if true, forces local storage increment without network request
 * @returns The new incremented counter value
 */
export async function incrementCounter(
  bucketId: string,
  keyName: string,
  isOffline: boolean = false
): Promise<{ value: number; isFallback: boolean }> {
  if (isOffline) {
    const current = getLocalCounter(bucketId, keyName);
    const next = current + 1;
    setLocalCounter(bucketId, keyName, next);
    return { value: next, isFallback: true };
  }

  try {
    const url = `https://api.counterapi.dev/v1/${bucketId}/${keyName}/up`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    const serverVal = parseInt(data.count, 10);

    if (isNaN(serverVal)) {
      throw new Error('Server returned an invalid number format');
    }

    // Keep local storage in sync with server value
    setLocalCounter(bucketId, keyName, serverVal);
    return { value: serverVal, isFallback: false };
  } catch (error) {
    console.warn('Failed to fetch from CounterAPI, falling back to localStorage counter:', error);
    // Fallback to local storage increment
    const current = getLocalCounter(bucketId, keyName);
    const next = current + 1;
    setLocalCounter(bucketId, keyName, next);
    return { value: next, isFallback: true };
  }
}

/**
 * Fetches the current counter value from CounterAPI without incrementing it.
 * Falls back to local storage value if offline or fails.
 */
export async function getRemoteCounter(
  bucketId: string,
  keyName: string,
  isOffline: boolean = false
): Promise<{ value: number; isFallback: boolean }> {
  if (isOffline) {
    return { value: getLocalCounter(bucketId, keyName), isFallback: true };
  }

  try {
    const url = `https://api.counterapi.dev/v1/${bucketId}/${keyName}/`;
    const response = await fetch(url);

    if (response.status === 404) {
      // Key doesn't exist on server yet, return local value
      const localVal = getLocalCounter(bucketId, keyName);
      return { value: localVal, isFallback: false };
    }

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    const serverVal = parseInt(data.count, 10);

    if (isNaN(serverVal)) {
      throw new Error('Server returned an invalid number format');
    }

    // Update local storage to stay in sync with server
    setLocalCounter(bucketId, keyName, serverVal);
    return { value: serverVal, isFallback: false };
  } catch (error) {
    console.warn('Failed to fetch remote counter, using local value:', error);
    return { value: getLocalCounter(bucketId, keyName), isFallback: true };
  }
}


