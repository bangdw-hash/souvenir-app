import { db } from '../firebase';
import {
  collection, doc, addDoc, getDocs, query, where,
  serverTimestamp, onSnapshot, updateDoc, deleteDoc,
} from 'firebase/firestore';

export async function createGroup(name, slug) {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('slug', '==', slug));
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('이미 사용 중인 그룹 주소입니다.');
  const docRef = await addDoc(groupsRef, { name, slug, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getGroupBySlug(slug) {
  const q = query(collection(db, 'groups'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function addMember(groupId, memberData) {
  return addDoc(collection(db, 'groups', groupId, 'members'), { ...memberData, createdAt: serverTimestamp() });
}

export function subscribeMembers(groupId, callback) {
  return onSnapshot(collection(db, 'groups', groupId, 'members'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function deleteMember(groupId, memberId) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', memberId));
}

export async function updateGroup(groupId, data) {
  await updateDoc(doc(db, 'groups', groupId), data);
}

export async function logActivity(groupId, activity) {
  return addDoc(collection(db, 'groups', groupId, 'activity'), { ...activity, createdAt: serverTimestamp() });
}

export function subscribeActivity(groupId, callback) {
  return onSnapshot(query(collection(db, 'groups', groupId, 'activity')), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items.slice(0, 20));
  });
}
