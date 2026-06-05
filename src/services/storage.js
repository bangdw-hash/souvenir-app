import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const UPLOAD_TIMEOUT_MS = 30000;

async function uploadToPath(path, file, onProgress) {
  const storageRef = ref(storage, path);
  onProgress?.(0);

  const uploadPromise = uploadBytes(storageRef, file).then(async (snapshot) => {
    onProgress?.(100);
    const url = await getDownloadURL(snapshot.ref);
    return { url, name: file.name, path, size: file.size, type: file.type };
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('업로드 시간이 초과되었습니다 (30초). Firebase Storage 설정을 확인해 주세요.')),
      UPLOAD_TIMEOUT_MS
    )
  );

  return Promise.race([uploadPromise, timeoutPromise]);
}

export async function uploadRecordFile(groupId, recordId, file, onProgress) {
  const safeName = file.name.replace(/[^\w가-힣.\-]/g, '_');
  const path = `groups/${groupId}/records/${recordId}/${Date.now()}_${safeName}`;
  return uploadToPath(path, file, onProgress);
}

export async function uploadAppointmentFile(groupId, apptId, file, onProgress) {
  const safeName = file.name.replace(/[^\w가-힣.\-]/g, '_');
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
