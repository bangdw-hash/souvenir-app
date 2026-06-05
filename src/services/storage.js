import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export async function uploadRecordFile(groupId, recordId, file, onProgress) {
  const safeName = file.name.replace(/[^\w가-힣.\-]/g, '_');
  const path = `groups/${groupId}/records/${recordId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, name: file.name, path, size: file.size, type: file.type });
      }
    );
  });
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
