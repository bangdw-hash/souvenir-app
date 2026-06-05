const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

async function uploadToCloudinary(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          name: file.name,
          path: data.public_id,
          size: file.size,
          type: file.type,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || '업로드에 실패했습니다.'));
      }
    };

    xhr.onerror = () => reject(new Error('네트워크 오류가 발생했습니다.'));
    xhr.ontimeout = () => reject(new Error('업로드 시간이 초과되었습니다 (30초).'));

    xhr.timeout = 30000;
    xhr.open('POST', UPLOAD_URL);
    xhr.send(formData);
  });
}

export async function uploadRecordFile(groupId, recordId, file, onProgress) {
  const folder = `family-health-hub/groups/${groupId}/records/${recordId}`;
  return uploadToCloudinary(file, folder, onProgress);
}

export async function uploadAppointmentFile(groupId, apptId, file, onProgress) {
  const folder = `family-health-hub/groups/${groupId}/appointments/${apptId}`;
  return uploadToCloudinary(file, folder, onProgress);
}

export async function deleteRecordFile(_path) {
  // Cloudinary 파일 삭제는 서버 API Key가 필요하여 브라우저에서 지원하지 않습니다.
  // 파일은 Cloudinary 대시보드(Media Library)에서 직접 삭제할 수 있습니다.
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
