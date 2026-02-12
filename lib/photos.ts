/**
 * lib/photos.ts
 *
 * Photo operations via internal API (Cloudinary backend)
 */

export interface Photo {
  id: string;
  publicId: string;
  filename: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption: string;
  uploaderName: string;
  uploaderEmail: string;
  uploaderAvatar?: string;
  uploaderId: string;
  fileSize: number;
  createdAt: Date;
}

function mapPhoto(payload: any): Photo {
  return {
    id: payload.id,
    publicId: payload.publicId || payload.id,
    filename: payload.filename,
    imageUrl: payload.imageUrl,
    thumbnailUrl: payload.thumbnailUrl,
    caption: payload.caption || '',
    uploaderName: payload.uploaderName || 'Unknown',
    uploaderEmail: payload.uploaderEmail || '',
    uploaderAvatar: payload.uploaderAvatar || '',
    uploaderId: payload.uploaderId || '',
    fileSize: payload.fileSize || 0,
    createdAt: new Date(payload.createdAt),
  };
}

export async function uploadPhoto(
  file: File,
  caption: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAvatar?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caption', caption || '');
  formData.append('uploaderId', userId);
  formData.append('uploaderName', userName);
  formData.append('uploaderEmail', userEmail);
  formData.append('uploaderAvatar', userAvatar || '');

  const response = await fetch('/api/photos', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to upload photo');
  }

  const data = await response.json();
  return mapPhoto(data.photo);
}

export async function getPhotos(): Promise<Photo[]> {
  const response = await fetch('/api/photos', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch photos');
  }

  const data = await response.json();
  return (data.photos || []).map(mapPhoto);
}

export async function deletePhoto(photo: Photo): Promise<void> {
  const response = await fetch('/api/photos', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicId: photo.publicId,
      uploaderId: photo.uploaderId,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to delete photo');
  }
}

export async function updatePhotoCaption(
  photo: Photo,
  uploaderId: string,
  caption: string
): Promise<Photo> {
  const response = await fetch('/api/photos', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicId: photo.publicId,
      uploaderId,
      caption,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to edit photo');
  }

  const data = await response.json();
  return mapPhoto(data.photo);
}
