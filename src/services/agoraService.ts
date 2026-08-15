import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../config/api';

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
}

export interface CallSessionCallbacks {
  onUserJoined?: (uid: number) => void;
  onUserOffline?: (uid: number) => void;
  onRemoteVideoStateChanged?: (uid: number, state: number) => void;
  onError?: (errCode: number, message: string) => void;
}

class AgoraCallingService {
  private engine: any = null;
  private currentChannel: string | null = null;
  private currentToken: string | null = null;
  private currentUid: number = 0;
  private isJoined: boolean = false;
  private isNativeAgoraAvailable: boolean = false;
  private callbacks: CallSessionCallbacks = {};

  constructor() {
    this.checkNativeAvailability();
  }

  private checkNativeAvailability() {
    try {
      // Check if native Agora module exists (development build)
      const agoraModule = require('react-native-agora');
      if (agoraModule && (agoraModule.createAgoraRtcEngine || agoraModule.RtcEngine)) {
        this.isNativeAgoraAvailable = true;
        console.log('[AgoraService] Native react-native-agora module detected.');
      }
    } catch (e) {
      this.isNativeAgoraAvailable = false;
      console.log('[AgoraService] Running in Expo environment without native Agora binary.');
    }
  }

  public async requestCallPermissions(type: 'voice' | 'video'): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (type === 'video') {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const cameraGranted =
          type === 'voice' || granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;

        if (!micGranted || !cameraGranted) {
          Alert.alert(
            'Permissions Required',
            `MeshX needs ${!micGranted ? 'Microphone' : ''}${!micGranted && !cameraGranted ? ' and ' : ''}${!cameraGranted ? 'Camera' : ''} permission to connect your call.`
          );
          return false;
        }
      } else {
        const audioPerm = await Audio.requestPermissionsAsync();
        if (!audioPerm.granted) {
          Alert.alert('Microphone Required', 'Please enable microphone access in device settings.');
          return false;
        }

        if (type === 'video') {
          const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
          if (!cameraPerm.granted) {
            Alert.alert('Camera Required', 'Please enable camera access in device settings.');
            return false;
          }
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      return true;
    } catch (err) {
      console.error('[AgoraService] Permission request failed:', err);
      return false;
    }
  }

  public async fetchCallToken(channelName: string): Promise<AgoraTokenResponse> {
    try {
      console.log(`[AgoraService] Requesting token for channel=${channelName} from backend /calls/token...`);
      const res = await apiClient.post('/calls/token', { channelName });
      if (!res.data?.token) {
        throw new Error('No token returned from server');
      }
      console.log(`[AgoraService] Token received successfully. AppId=${res.data.appId}, UID=${res.data.uid}`);
      return res.data;
    } catch (error: any) {
      console.error('[AgoraService] Fetch token error:', error?.message || error);
      throw error;
    }
  }

  public async initializeAndJoin(
    channelName: string,
    type: 'voice' | 'video',
    callbacks?: CallSessionCallbacks
  ): Promise<boolean> {
    this.callbacks = callbacks || {};

    const hasPermission = await this.requestCallPermissions(type);
    if (!hasPermission) {
      return false;
    }

    try {
      const tokenData = await this.fetchCallToken(channelName);
      this.currentToken = tokenData.token;
      this.currentChannel = channelName;
      this.currentUid = tokenData.uid;

      if (this.isNativeAgoraAvailable) {
        const agoraModule = require('react-native-agora');
        this.engine = agoraModule.createAgoraRtcEngine();
        this.engine.initialize({ appId: tokenData.appId });

        this.engine.registerEventHandler({
          onJoinChannelSuccess: (connection: any, elapsed: number) => {
            console.log(`[Agora RTC] Joined channel ${channelName} successfully in ${elapsed}ms`);
            this.isJoined = true;
          },
          onUserJoined: (connection: any, uid: number) => {
            console.log(`[Agora RTC] Remote user ${uid} joined channel`);
            this.callbacks.onUserJoined?.(uid);
          },
          onUserOffline: (connection: any, uid: number, reason: number) => {
            console.log(`[Agora RTC] Remote user ${uid} left channel. Reason=${reason}`);
            this.callbacks.onUserOffline?.(uid);
          },
          onError: (errCode: number, message: string) => {
            console.error(`[Agora RTC Error] Code=${errCode}, Msg=${message}`);
            this.callbacks.onError?.(errCode, message);
          },
        });

        this.engine.enableAudio();
        if (type === 'video') {
          this.engine.enableVideo();
          this.engine.startPreview();
        } else {
          this.engine.disableVideo();
        }

        this.engine.joinChannel(tokenData.token, channelName, tokenData.uid, {});
      } else {
        console.log(`[AgoraService Mock/Expo Mode] Simulated channel join on ${channelName} with token.`);
        this.isJoined = true;
      }

      return true;
    } catch (err: any) {
      console.error('[AgoraService] Initialize error:', err);
      return false;
    }
  }

  public muteLocalAudio(isMuted: boolean) {
    if (this.engine && this.isNativeAgoraAvailable) {
      try {
        this.engine.muteLocalAudioStream(isMuted);
      } catch (e) {}
    }
    console.log(`[AgoraService] Local Audio Mute=${isMuted}`);
  }

  public setVideoEnabled(enabled: boolean) {
    if (this.engine && this.isNativeAgoraAvailable) {
      try {
        if (enabled) {
          this.engine.enableLocalVideo(true);
          this.engine.startPreview();
        } else {
          this.engine.enableLocalVideo(false);
          this.engine.stopPreview();
        }
      } catch (e) {}
    }
    console.log(`[AgoraService] Local Video Enabled=${enabled}`);
  }

  public switchCamera() {
    if (this.engine && this.isNativeAgoraAvailable) {
      try {
        this.engine.switchCamera();
      } catch (e) {}
    }
    console.log('[AgoraService] Camera Switched');
  }

  public setSpeakerphone(isSpeaker: boolean) {
    if (this.engine && this.isNativeAgoraAvailable) {
      try {
        this.engine.setEnableSpeakerphone(isSpeaker);
      } catch (e) {}
    }
    console.log(`[AgoraService] Speakerphone=${isSpeaker}`);
  }

  public async leaveAndCleanup() {
    if (this.engine && this.isNativeAgoraAvailable) {
      try {
        this.engine.leaveChannel();
        this.engine.release();
        this.engine = null;
      } catch (e) {}
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (e) {}

    this.isJoined = false;
    this.currentChannel = null;
    this.currentToken = null;
    console.log('[AgoraService] Call session cleaned up');
  }
}

export const agoraService = new AgoraCallingService();
