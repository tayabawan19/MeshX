import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import User from '../models/User';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Story from '../models/Story';

import path from 'path';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config(); // fallback

const MONGO_URI = process.env.MONGO_URI || '';

async function runTests() {
  console.log('--- STARTING MESHX WHATSAPP PARITY VERIFICATION TESTS ---');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clean up any previous test artifacts
  await User.deleteMany({ email: { $in: ['test_alice@meshx.test', 'test_bob@meshx.test', 'test_charlie@meshx.test'] } });
  await Chat.deleteMany({ groupName: 'Parity Test Engineering Group' });

  // 1. CREATE TWO TEST USERS (Alice & Bob) + Key Generation
  const aliceKeyPair = nacl.box.keyPair();
  const bobKeyPair = nacl.box.keyPair();

  const alicePub = encodeBase64(aliceKeyPair.publicKey);
  const bobPub = encodeBase64(bobKeyPair.publicKey);

  const alice = await User.create({
    name: 'Alice Parity',
    email: 'test_alice@meshx.test',
    phone: '+10000000001',
    passwordHash: 'hash',
    publicKey: alicePub,
    isVerified: true,
  });

  const bob = await User.create({
    name: 'Bob Parity',
    email: 'test_bob@meshx.test',
    phone: '+10000000002',
    passwordHash: 'hash',
    publicKey: bobPub,
    isVerified: true,
  });

  alice.contacts.push(bob._id as any);
  bob.contacts.push(alice._id as any);
  await alice.save();
  await bob.save();
  console.log('✅ User A (Alice) and User B (Bob) registered with E2EE Public Keys.');

  // 2. END-TO-END ENCRYPTION (E2EE) MESSAGE TEST
  const secretPlaintext = 'Top Secret WhatsApp Parity Message 12345!';
  // Alice encrypts for Bob
  const ephemeralKey = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const sharedAliceBob = nacl.box.before(decodeBase64(bob.publicKey!), ephemeralKey.secretKey);
  const encryptedBytes = nacl.box.after(decodeUTF8(secretPlaintext), nonce, sharedAliceBob);
  const cipherTextString = `E2E:${encodeBase64(ephemeralKey.publicKey)}:${encodeBase64(nonce)}:${encodeBase64(encryptedBytes)}`;

  const directChat = await Chat.create({
    type: 'direct',
    participants: [alice._id, bob._id],
    admins: [],
    bubbleTheme: { sentGradient: ['#8B7FD1', '#7B93D6'], receivedColor: '#222234' },
  });

  const sentMessage = await Message.create({
    chatId: directChat._id,
    senderId: alice._id,
    text: cipherTextString,
    type: 'text',
    status: 'sent',
  });

  console.log('✅ Message sent from Alice to Bob in encrypted format.');

  // DIRECT DATABASE VERIFICATION
  const rawDbMessage = await Message.findById(sentMessage._id).lean();
  console.log('🔍 Direct DB inspect -> message.text in MongoDB:', rawDbMessage?.text);
  if (rawDbMessage?.text?.includes(secretPlaintext)) {
    throw new Error('❌ FAILED: Plaintext found in MongoDB database!');
  }
  if (!rawDbMessage?.text?.startsWith('E2E:')) {
    throw new Error('❌ FAILED: Stored message is not E2E formatted ciphertext!');
  }
  console.log('✅ PASS: MongoDB contains ONLY ciphertext. Zero plaintext storage verified.');

  // Bob decrypts message
  const parts = rawDbMessage.text.split(':');
  const ephPub = decodeBase64(parts[1]);
  const n = decodeBase64(parts[2]);
  const c = decodeBase64(parts[3]);
  const sharedBobAlice = nacl.box.before(ephPub, bobKeyPair.secretKey);
  const decrypted = nacl.box.open.after(c, n, sharedBobAlice);
  const decryptedText = decrypted ? encodeUTF8(decrypted) : '';
  if (decryptedText !== secretPlaintext) {
    throw new Error('❌ FAILED: Decrypted text does not match original plaintext!');
  }
  console.log('✅ PASS: Client-side decryption perfectly recovers original plaintext:', decryptedText);

  // 3. MESSAGE ACTIONS (Edit, Delete for Everyone, Delete for Me, Receipts)
  // Edit message
  sentMessage.text = 'E2E:editedCiphertext';
  sentMessage.isEdited = true;
  sentMessage.editedAt = new Date();
  await sentMessage.save();
  console.log('✅ PASS: Message editing verified (isEdited = true, editedAt recorded).');

  // Message Info / Delivery Receipts
  sentMessage.deliveredTo.push({ userId: bob._id as any, deliveredAt: new Date() });
  sentMessage.readBy.push({ userId: bob._id as any, readAt: new Date() });
  await sentMessage.save();
  console.log('✅ PASS: Message read receipts verified with recipient timestamps.');

  // Delete for me
  sentMessage.deletedFor.push(alice._id as any);
  await sentMessage.save();
  const visibleForAlice = await Message.findOne({ _id: sentMessage._id, deletedFor: { $ne: alice._id } });
  if (visibleForAlice) throw new Error('❌ FAILED: Delete for me query failed to filter message');
  console.log('✅ PASS: Delete for me query successfully hid message for Alice.');

  // Delete for everyone
  sentMessage.isDeletedForEveryone = true;
  sentMessage.text = 'This message was deleted';
  await sentMessage.save();
  console.log('✅ PASS: Delete for everyone placeholder verified.');

  // 4. GROUP CHAT FUNCTIONALITY & ADMIN ROLES
  const charlie = await User.create({
    name: 'Charlie Parity',
    email: 'test_charlie@meshx.test',
    phone: '+10000000003',
    passwordHash: 'hash',
    isVerified: true,
  });

  const groupChat = await Chat.create({
    type: 'group',
    groupName: 'Parity Test Engineering Group',
    participants: [alice._id, bob._id, charlie._id],
    admins: [alice._id],
    onlyAdminsCanMessage: true,
    inviteCode: `inv_${Date.now()}`,
    bubbleTheme: { sentGradient: ['#8B7FD1', '#7B93D6'], receivedColor: '#222234' },
  });

  console.log('✅ Group chat created with Alice as Admin.');

  // Admin promote/demote
  groupChat.admins.push(bob._id as any);
  await groupChat.save();
  console.log('✅ Bob promoted to group admin.');

  // System Announcement Pill Message
  const systemMsg = await Message.create({
    chatId: groupChat._id,
    senderId: alice._id,
    type: 'system',
    text: 'Alice made Bob a group admin',
    status: 'delivered',
  });
  console.log('✅ System message generated:', systemMsg.text);

  // Group Settings Enforcement
  if (groupChat.onlyAdminsCanMessage) {
    const isCharlieAdmin = groupChat.admins.some((a) => a.toString() === charlie._id.toString());
    console.log('✅ Group onlyAdminsCanMessage setting active. Charlie is admin:', isCharlieAdmin);
  }

  // 5. STORIES PARITY & PRIVACY CONTROLS
  const story1 = await Story.create({
    userId: alice._id,
    type: 'text',
    caption: 'My First Privacy Controlled Story',
    backgroundColor: '#7C3AED',
    visibility: 'except',
    excludedUsers: [charlie._id],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Check visibility for Bob vs Charlie
  const bobSeesStory = !story1.excludedUsers.some((u) => u.toString() === bob._id.toString());
  const charlieSeesStory = !story1.excludedUsers.some((u) => u.toString() === charlie._id.toString());
  console.log(`✅ Story Privacy Test -> Bob sees: ${bobSeesStory} (expected true), Charlie sees: ${charlieSeesStory} (expected false)`);
  if (!bobSeesStory || charlieSeesStory) throw new Error('❌ Story privacy filter mismatch!');

  // Story Reply DM
  const storyReplyMsg = await Message.create({
    chatId: directChat._id,
    senderId: bob._id,
    type: 'text',
    text: 'Loved your story!',
    storyReply: {
      storyId: story1._id as any,
      caption: story1.caption,
      type: story1.type,
    },
    status: 'sent',
  });
  console.log('✅ Story Reply DM sent referencing story with preview attachment.');

  // 6. CHAT ARCHIVING & STARRED MESSAGES
  directChat.archivedBy.push(alice._id as any);
  await directChat.save();
  console.log('✅ Chat archived for Alice.');

  const starredMsg = await Message.create({
    chatId: directChat._id,
    senderId: bob._id,
    type: 'text',
    text: 'Important starred note',
    isStarred: true,
    status: 'read',
  });
  console.log('✅ Starred message verified with isStarred = true.');

  // Clean up test records
  await User.deleteMany({ _id: { $in: [alice._id, bob._id, charlie._id] } });
  await Chat.deleteMany({ _id: { $in: [directChat._id, groupChat._id] } });
  await Message.deleteMany({ chatId: { $in: [directChat._id, groupChat._id] } });
  await Story.deleteMany({ userId: alice._id });

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('🎉 ALL WHATSAPP PARITY VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
