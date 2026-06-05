import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';

export function subscribeAppointments(groupId, callback) {
  const ref = collection(db, 'groups', groupId, 'appointments');
  return onSnapshot(ref, (snap) => {
    const appts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => !a.deleted);
    appts.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : (a.date || '') > (b.date || '') ? 1 : 0);
    callback(appts);
  });
}

export function subscribeDeletedAppointments(groupId, callback) {
  const ref = collection(db, 'groups', groupId, 'appointments');
  return onSnapshot(ref, (snap) => {
    const appts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => a.deleted === true);
    appts.sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
    callback(appts);
  });
}

export async function addAppointment(groupId, data) {
  const ref = collection(db, 'groups', groupId, 'appointments');
  return addDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function updateAppointment(groupId, apptId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'appointments', apptId), data);
}

export async function softDeleteAppointment(groupId, apptId) {
  await updateDoc(doc(db, 'groups', groupId, 'appointments', apptId), {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
}

export async function restoreAppointment(groupId, apptId) {
  await updateDoc(doc(db, 'groups', groupId, 'appointments', apptId), {
    deleted: false,
    deletedAt: null,
  });
}

export async function deleteAppointment(groupId, apptId) {
  await deleteDoc(doc(db, 'groups', groupId, 'appointments', apptId));
}
