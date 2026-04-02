export interface E2EKeyState {
  userKey: Uint8Array | null;
  bundleVersion: number | null;
}

type Listener = (state: E2EKeyState) => void;

const SESSION_STORAGE_KEY = 'lavenius_e2e_key_state_v1';

const listeners = new Set<Listener>();

function cloneKey(key: Uint8Array): Uint8Array {
  return new Uint8Array(key);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function loadStateFromSessionStorage(): E2EKeyState {
  if (typeof window === 'undefined') {
    return { userKey: null, bundleVersion: null };
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { userKey: null, bundleVersion: null };
    }

    const parsed = JSON.parse(raw) as { userKeyBase64?: string; bundleVersion?: number | null };
    if (!parsed.userKeyBase64) {
      return { userKey: null, bundleVersion: null };
    }

    return {
      userKey: base64ToBytes(parsed.userKeyBase64),
      bundleVersion: typeof parsed.bundleVersion === 'number' ? parsed.bundleVersion : null,
    };
  } catch {
    return { userKey: null, bundleVersion: null };
  }
}

function persistStateToSessionStorage(nextState: E2EKeyState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!nextState.userKey) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    const payload = JSON.stringify({
      userKeyBase64: bytesToBase64(nextState.userKey),
      bundleVersion: nextState.bundleVersion,
    });
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
  } catch {
    // Keep app functional even if storage is blocked/full.
  }
}

let state: E2EKeyState = loadStateFromSessionStorage();

function emit(): void {
  listeners.forEach((listener) => listener(getE2EKeyState()));
}

export function getE2EKeyState(): E2EKeyState {
  return {
    userKey: state.userKey ? cloneKey(state.userKey) : null,
    bundleVersion: state.bundleVersion,
  };
}

export function setE2EUserKey(userKey: Uint8Array, bundleVersion?: number): void {
  state = {
    userKey: cloneKey(userKey),
    bundleVersion: typeof bundleVersion === 'number' ? bundleVersion : state.bundleVersion,
  };
  persistStateToSessionStorage(state);
  emit();
}

export function clearE2EUserKey(): void {
  state = {
    userKey: null,
    bundleVersion: null,
  };
  persistStateToSessionStorage(state);
  emit();
}

export function updateE2EUserKeyBundleVersion(bundleVersion: number): void {
  state = {
    ...state,
    bundleVersion,
  };
  persistStateToSessionStorage(state);
  emit();
}

export function subscribeToE2EKeyState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
