import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

async function uploadToPath(path, file, onProgress) {
  const storageRef = ref(storage, path);
  onProgress?.(0);
  const snapshot = await uploadBytes(storageRef, file);
  onProgress?.(100);
  const url = await getDownloadURL(snapshot.ref);
  return { url, name: file.name, path, size: file.size, type: file.type };
}

export async function uploadRecordFile(groupId, recordId, file, onProgress) {
  const safeName = file.name.replace(/[^\w0-鿿.\-]/g, '_');
  const path = `groups/${groupId}/records/${recordId}/${Date.now()}_${safeName}`;
  return uploadToPath(path, file, onProgress);
}

export async function uploadAppointmentFile(groupId, apptId, file, onProgress) {
  const safeName = file.name.replace(/[^\w0-鿿.\-]/g, '_');
  const path = `groups/${groupId}/appointments/${apptId}/${Date.now()}_${safeName}`;
  return uploadToPath(path, file, onProgress);
}

export async function deleteRecordFile(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // already deleted or doesn't exist
  }
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
