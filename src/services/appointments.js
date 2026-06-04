import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export function subscribeAppointments(groupId, callback) {
  return onSnapshot(collection(db, 'groups', groupId, 'appointments'), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
    callback(list);
  });
}

export async function addAppointment(groupId, data) {
  return addDoc(collection(db, 'groups', groupId, 'appointments'), { ...data, createdAt: serverTimestamp() });
}

export async function updateAppointment(groupId, apptId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'appointments', apptId), data);
}

export async function deleteAppointment(groupId, apptId) {
  await deleteDoc(doc(db, 'groups', groupId, 'appointments', apptId));
}
