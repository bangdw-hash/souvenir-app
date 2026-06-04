import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export function subscribePatients(groupId, callback) {
  return onSnapshot(collection(db, 'groups', groupId, 'patients'), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(list);
  });
}

export async function addPatient(groupId, data) {
  return addDoc(collection(db, 'groups', groupId, 'patients'), { ...data, createdAt: serverTimestamp() });
}

export async function updatePatient(groupId, patientId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'patients', patientId), data);
}

export async function deletePatient(groupId, patientId) {
  await deleteDoc(doc(db, 'groups', groupId, 'patients', patientId));
}
