export interface E2EKeyState {
  userKey: Uint8Array | null;
  bundleVersion: number | null;
}

type Listener = (state: E2EKeyState) => void;

let state: E2EKeyState = {
  userKey: null,
  bundleVersion: null,
};

const listeners = new Set<Listener>();

function cloneKey(key: Uint8Array): Uint8Array {
  return new Uint8Array(key);
}

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
  emit();
}

export function clearE2EUserKey(): void {
  state = {
    userKey: null,
    bundleVersion: null,
  };
  emit();
}

export function updateE2EUserKeyBundleVersion(bundleVersion: number): void {
  state = {
    ...state,
    bundleVersion,
  };
  emit();
}

export function subscribeToE2EKeyState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
