import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import { apiClient } from '../config/api';

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
        privKeyBase64 = await SecureStore.getItemAsync(SECURE_STORE_PRIVATE_KEY);
        pubKeyBase64 = await SecureStore.getItemAsync(SECURE_STORE_PUBLIC_KEY);
      } catch (e) {
        // Fallback for environments where SecureStore is unavailable
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
          await SecureStore.setItemAsync(SECURE_STORE_PRIVATE_KEY, newPriv);
          await SecureStore.setItemAsync(SECURE_STORE_PUBLIC_KEY, newPub);
        } catch (e) {
          console.warn('[E2EE] SecureStore write fallback:', e);
        }

        // Publish public key to server
        await apiClient.post('/users/keys', {
          publicKey: newPub,
        });
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
      console.warn('[E2EE] Failed to fetch recipient public key:', err);
    }
    return null;
  }

  encryptMessage(plaintext: string, recipientPublicKeyBase64: string): string {
    if (!plaintext) return plaintext;
    if (!recipientPublicKeyBase64) return plaintext;

    try {
      const recipientPubKey = decodeBase64(recipientPublicKeyBase64);
      const ephemeralKeyPair = nacl.box.keyPair();
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const messageUint8 = decodeUTF8(plaintext);

      const sharedKey = nacl.box.before(recipientPubKey, ephemeralKeyPair.secretKey);
      const ciphertext = nacl.box.after(messageUint8, nonce, sharedKey);

      const ephPubBase64 = encodeBase64(ephemeralKeyPair.publicKey);
      const nonceBase64 = encodeBase64(nonce);
      const cipherBase64 = encodeBase64(ciphertext);

      return `E2E:${ephPubBase64}:${nonceBase64}:${cipherBase64}`;
    } catch (err) {
      console.error('[E2EE] Encryption error:', err);
      return plaintext;
    }
  }

  decryptMessage(encryptedText: string): string {
    if (!encryptedText || !encryptedText.startsWith('E2E:')) {
      return encryptedText;
    }

    if (!this.keyPair) {
      return '[Encrypted message - keys initializing]';
    }

    try {
      const parts = encryptedText.split(':');
      if (parts.length < 4) return encryptedText;

      const ephPubBase64 = parts[1];
      const nonceBase64 = parts[2];
      const cipherBase64 = parts[3];

      const ephPubKey = decodeBase64(ephPubBase64);
      const nonce = decodeBase64(nonceBase64);
      const ciphertext = decodeBase64(cipherBase64);

      const sharedKey = nacl.box.before(ephPubKey, this.keyPair.secretKey);
      const decrypted = nacl.box.open.after(ciphertext, nonce, sharedKey);

      if (!decrypted) {
        return '[Encrypted message]';
      }

      return encodeUTF8(decrypted);
    } catch (err) {
      console.error('[E2EE] Decryption error:', err);
      return '[Encrypted message]';
    }
  }
}

export const e2eeService = new E2EEService();
