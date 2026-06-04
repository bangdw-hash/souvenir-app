import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export function subscribeRecords(groupId, callback) {
  return onSnapshot(collection(db, 'groups', groupId, 'records'), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(list);
  });
}

export async function addRecord(groupId, data) {
  return addDoc(collection(db, 'groups', groupId, 'records'), { ...data, createdAt: serverTimestamp() });
}

export async function updateRecord(groupId, recordId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'records', recordId), data);
}

export async function deleteRecord(groupId, recordId) {
  await deleteDoc(doc(db, 'groups', groupId, 'records', recordId));
}
