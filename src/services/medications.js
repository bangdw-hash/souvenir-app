import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';

export function subscribeMedications(groupId, callback) {
  const ref = collection(db, 'groups', groupId, 'medications');
  return onSnapshot(ref, (snap) => {
    const meds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    meds.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(meds);
  });
}

export async function addMedication(groupId, data) {
  const ref = collection(db, 'groups', groupId, 'medications');
  return addDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function updateMedication(groupId, medicationId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'medications', medicationId), data);
}

export async function deleteMedication(groupId, medicationId) {
  await deleteDoc(doc(db, 'groups', groupId, 'medications', medicationId));
}
