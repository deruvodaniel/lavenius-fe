import EFFDicewarePassphrase from '@small-tech/eff-diceware-passphrase';

const USER_KEY_BYTE_LENGTH = 32;
const SALT_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const RECOVERY_WORD_COUNT = 15;
const RECOVERY_SEPARATOR = ' ';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const recoverySecretGenerator = new EFFDicewarePassphrase();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveKek(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: PBKDF2_HASH,
      iterations: PBKDF2_ITERATIONS,
      salt: toBufferSource(salt),
    },
    keyMaterial,
    { name: AES_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function importUserKey(userKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toBufferSource(userKey),
    { name: AES_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export interface UserKeyBundle {
  encryptedUserKey: string;
  salt: string;
  iv: string;
}

export interface RecoveryUserKeyBundle {
  recoveryEncryptedUserKey: string;
  recoverySalt: string;
  recoveryIv: string;
}

export function generateUserKey(): Uint8Array {
  return randomBytes(USER_KEY_BYTE_LENGTH);
}

export function generateRecoverySecret(): string {
  // 15 words from the EFF Diceware list (~192 bits) for high-entropy human backup.
  return recoverySecretGenerator.words(RECOVERY_WORD_COUNT).join(RECOVERY_SEPARATOR);
}

export async function wrapUserKey(userKey: Uint8Array, secret: string): Promise<UserKeyBundle> {
  const salt = randomBytes(SALT_BYTE_LENGTH);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const kek = await deriveKek(secret, salt);
  const encryptedUserKeyBuffer = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: toBufferSource(iv) },
    kek,
    toBufferSource(userKey)
  );

  return {
    encryptedUserKey: toBase64(new Uint8Array(encryptedUserKeyBuffer)),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

export async function wrapUserKeyForRecovery(
  userKey: Uint8Array,
  recoverySecret: string
): Promise<RecoveryUserKeyBundle> {
  const bundle = await wrapUserKey(userKey, recoverySecret);
  return {
    recoveryEncryptedUserKey: bundle.encryptedUserKey,
    recoverySalt: bundle.salt,
    recoveryIv: bundle.iv,
  };
}

export async function unwrapUserKey(bundle: UserKeyBundle, secret: string): Promise<Uint8Array> {
  const salt = fromBase64(bundle.salt);
  const iv = fromBase64(bundle.iv);
  const encryptedUserKey = fromBase64(bundle.encryptedUserKey);
  const kek = await deriveKek(secret, salt);
  const userKeyBuffer = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: toBufferSource(iv) },
    kek,
    toBufferSource(encryptedUserKey)
  );

  return new Uint8Array(userKeyBuffer);
}

export async function decryptUserKeyFromRecoveryBundle(
  bundle: RecoveryUserKeyBundle,
  recoverySecret: string
): Promise<Uint8Array> {
  return unwrapUserKey(
    {
      encryptedUserKey: bundle.recoveryEncryptedUserKey,
      salt: bundle.recoverySalt,
      iv: bundle.recoveryIv,
    },
    recoverySecret
  );
}

export async function encryptField(plaintext: string, userKey: Uint8Array): Promise<EncryptedPayload> {
  const key = await importUserKey(userKey);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: toBufferSource(iv) },
    key,
    toBufferSource(encoder.encode(plaintext))
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
    iv: toBase64(iv),
  };
}

export async function decryptField(
  ciphertextBase64: string,
  ivBase64: string,
  userKey: Uint8Array
): Promise<string> {
  const key = await importUserKey(userKey);
  const ciphertext = fromBase64(ciphertextBase64);
  const iv = fromBase64(ivBase64);
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: toBufferSource(iv) },
    key,
    toBufferSource(ciphertext)
  );

  return decoder.decode(plaintextBuffer);
}

export function userKeyToBase64(userKey: Uint8Array): string {
  return toBase64(userKey);
}
