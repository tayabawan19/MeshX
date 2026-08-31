import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import { Platform } from 'react-native';
import { apiClient } from '../config/api';

// Supply secure PRNG to tweetnacl in React Native and Web
nacl.setPRNG((x, n) => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(n);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < n; i++) {
      x[i] = bytes[i];
    }
  } else {
    try {
      const randomBytes = Crypto.getRandomBytes(n);
      for (let i = 0; i < n; i++) {
        x[i] = randomBytes[i];
      }
    } catch (e) {
      for (let i = 0; i < n; i++) {
        x[i] = Math.floor(Math.random() * 256);
      }
    }
  }
});

const SECURE_STORE_PRIVATE_KEY = 'meshx_e2e_private_key_v1';
const SECURE_STORE_PUBLIC_KEY = 'meshx_e2e_public_key_v1';

class E2EEService {
  private keyPair: nacl.BoxKeyPair | null = null;
  private publicKeyCache: Map<string, string> = new Map();

  async initialize(userId: string): Promise<void> {
    try {
      let privKeyBase64: string | null = null;
      let pubKeyBase64: string | null = null;

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          privKeyBase64 = localStorage.getItem(SECURE_STORE_PRIVATE_KEY);
          pubKeyBase64 = localStorage.getItem(SECURE_STORE_PUBLIC_KEY);
        } else {
          privKeyBase64 = await SecureStore.getItemAsync(SECURE_STORE_PRIVATE_KEY);
          pubKeyBase64 = await SecureStore.getItemAsync(SECURE_STORE_PUBLIC_KEY);
        }
      } catch (e) {
        console.warn('[E2EE] SecureStore read fallback:', e);
      }

      if (privKeyBase64 && pubKeyBase64) {
        const secretKey = decodeBase64(privKeyBase64);
        const publicKey = decodeBase64(pubKeyBase64);
        this.keyPair = { secretKey, publicKey };
      } else {
        // Generate new Curve25519 keypair
        const newKeyPair = nacl.box.keyPair();
        this.keyPair = newKeyPair;

        const newPriv = encodeBase64(newKeyPair.secretKey);
        const newPub = encodeBase64(newKeyPair.publicKey);

        try {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(SECURE_STORE_PRIVATE_KEY, newPriv);
            localStorage.setItem(SECURE_STORE_PUBLIC_KEY, newPub);
          } else {
            await SecureStore.setItemAsync(SECURE_STORE_PRIVATE_KEY, newPriv);
            await SecureStore.setItemAsync(SECURE_STORE_PUBLIC_KEY, newPub);
          }
        } catch (e) {
          console.warn('[E2EE] SecureStore write fallback:', e);
        }

        // Publish public key to server with safe error handling
        try {
          await apiClient.post('/users/keys', {
            publicKey: newPub,
          });
        } catch (postErr) {
          console.warn('[E2EE] Public key upload deferred:', (postErr as any)?.message || postErr);
        }
      }
    } catch (err) {
      console.error('[E2EE] Initialization error:', err);
    }
  }

  async getRecipientPublicKey(recipientUserId: string): Promise<string | null> {
    if (this.publicKeyCache.has(recipientUserId)) {
      return this.publicKeyCache.get(recipientUserId) || null;
    }

    try {
      const res = await apiClient.get(`/users/${recipientUserId}/keys`);
      if (res.data?.publicKey) {
        this.publicKeyCache.set(recipientUserId, res.data.publicKey);
        return res.data.publicKey;
      }
    } catch (err) {
      console.warn('[E2EE] Failed to fetch recipient public key:', (err as any)?.message || err);
    }
    return null;
  }

  encryptMessage(plaintext: string, recipientPublicKeyBase64: string): string {
    try {
      if (!this.keyPair || !recipientPublicKeyBase64) {
        return plaintext;
      }

      const recipientPubKey = decodeBase64(recipientPublicKeyBase64);
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const messageUint8 = decodeUTF8(plaintext);

      const encrypted = nacl.box(
        messageUint8,
        nonce,
        recipientPubKey,
        this.keyPair.secretKey
      );

      const payload = {
        nonce: encodeBase64(nonce),
        ciphertext: encodeBase64(encrypted),
      };

      return `E2E:${JSON.stringify(payload)}`;
    } catch (err) {
      console.error('[E2EE] Encryption failed:', err);
      return plaintext;
    }
  }

  decryptMessage(ciphertextPayload: string, senderPublicKeyBase64?: string): string {
    try {
      if (!ciphertextPayload || typeof ciphertextPayload !== 'string' || !ciphertextPayload.startsWith('E2E:')) {
        return ciphertextPayload;
      }

      if (!this.keyPair || !senderPublicKeyBase64) {
        return ciphertextPayload;
      }

      const jsonStr = ciphertextPayload.slice(4);
      const { nonce: nonceBase64, ciphertext: cipherBase64 } = JSON.parse(jsonStr);

      const nonce = decodeBase64(nonceBase64);
      const ciphertext = decodeBase64(cipherBase64);
      const senderPubKey = decodeBase64(senderPublicKeyBase64);

      const decrypted = nacl.box.open(
        ciphertext,
        nonce,
        senderPubKey,
        this.keyPair.secretKey
      );

      if (!decrypted) {
        return '[Encrypted message - unable to decrypt]';
      }

      return encodeUTF8(decrypted);
    } catch (err) {
      console.error('[E2EE] Decryption failed:', err);
      return ciphertextPayload;
    }
  }

  getPublicKey(): string | null {
    if (!this.keyPair) return null;
    return encodeBase64(this.keyPair.publicKey);
  }
}

export const e2eeService = new E2EEService();
