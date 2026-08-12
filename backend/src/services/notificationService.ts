let admin: any = null;

try {
  admin = require('firebase-admin');
} catch (e) {
  console.warn('[Firebase Admin Warning] firebase-admin package dynamic require warning');
}

let isFirebaseInitialized = false;

export const initFirebaseAdmin = () => {
  if (!admin) return;
  if (isFirebaseInitialized || (admin.apps && admin.apps.length > 0)) {
    isFirebaseInitialized = true;
    return;
  }

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountEnv) {
      let serviceAccount;
      if (serviceAccountEnv.trim().startsWith('{')) {
        serviceAccount = JSON.parse(serviceAccountEnv);
      } else {
        serviceAccount = require(serviceAccountEnv);
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('[Firebase Admin] Initialized FCM service successfully.');
    } else {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT not set in env. Push notifications will log locally.');
    }
  } catch (error) {
    console.warn('[Firebase Admin Error] Failed to initialize Firebase Admin:', error);
  }
};

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  dataPayload: Record<string, string> = {}
): Promise<boolean> => {
  initFirebaseAdmin();

  console.log(`\n==================================================`);
  console.log(`[FCM Notification] Sending to Token: ${fcmToken.slice(0, 15)}...`);
  console.log(`[FCM Notification] Title: ${title}`);
  console.log(`[FCM Notification] Body: ${body}`);
  console.log(`[FCM Notification] Data:`, dataPayload);
  console.log(`==================================================\n`);

  if (!fcmToken || fcmToken.includes('demo_token') || !isFirebaseInitialized || !admin) {
    return true;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: dataPayload,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'meshx_messages',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true,
          },
        },
      },
    });

    console.log(`[FCM Notification] Successfully delivered to token: ${fcmToken.slice(0, 15)}...`);
    return true;
  } catch (error) {
    console.error('[FCM Notification Error]', error);
    return false;
  }
};
