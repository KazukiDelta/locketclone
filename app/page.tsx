'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Camera, LogOut, Pencil, RefreshCw, Save, Trash2, Upload, User, X } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { compressImage, validateImageFile } from '@/lib/imageCompression';
import { deletePhoto, getPhotos, Photo, updatePhotoCaption, uploadPhoto } from '@/lib/photos';

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const fetchPhotos = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const fetchedPhotos = await getPhotos();
      setPhotos(fetchedPhotos);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setError('Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUploadModal(true);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress('Đang nén ảnh...');

    try {
      const compressed = await compressImage(selectedFile);
      setUploadProgress(
        `Đã nén ${compressed.compressionRatio.toFixed(0)}% (${(
          compressed.compressedSize /
          1024 /
          1024
        ).toFixed(2)}MB)`
      );

      setUploadProgress('Đang upload lên Cloudinary...');
      const newPhoto = await uploadPhoto(
        compressed.file,
        caption,
        user.uid,
        user.displayName || 'Unknown',
        user.email || '',
        user.photoURL || undefined
      );

      setUploadProgress('Upload thành công!');
      setPhotos((prev) => [newPhoto, ...prev.filter((item) => item.id !== newPhoto.id)]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      setUploading(false);
      setUploadProgress('');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err?.message || 'Upload thất bại. Vui lòng thử lại.');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!user || photo.uploaderId !== user.uid) {
      alert('Bạn chỉ có thể xóa ảnh của mình.');
      return;
    }

    if (!confirm('Bạn chắc chắn muốn xóa ảnh này?')) return;

    try {
      await deletePhoto(photo);
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
    } catch (err: any) {
      alert(err?.message || 'Xóa thất bại.');
    }
  };

  const handleUpdateCaption = async (photo: Photo, nextCaption: string) => {
    if (!user || photo.uploaderId !== user.uid) {
      alert('Bạn chỉ có thể sửa ảnh của mình.');
      return;
    }

    try {
      const updatedPhoto = await updatePhotoCaption(photo, user.uid, nextCaption);
      setPhotos((prev) => prev.map((item) => (item.id === updatedPhoto.id ? updatedPhoto : item)));
    } catch (err: any) {
      alert(err?.message || 'Sửa caption thất bại.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tết Photo Journal</h1>
            <p className="text-gray-600 dark:text-gray-300">Album riêng cho chuyến đi Tết</p>
          </div>

          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err: any) {
                alert(err?.message || 'Đăng nhập thất bại.');
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập bằng Google
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Chỉ email trong whitelist mới được truy cập</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tết 2026</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{photos.length} ảnh</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchPhotos}
                disabled={loading}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                title="Tải lại"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="switch-wrapper-sleep-awake" title="Bật/Tắt dark mode">
                <div className="check">
                  <input id="switch-sleep-awake" type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                  <label htmlFor="switch-sleep-awake"></label>
                </div>
              </div>

              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
              )}

              <button
                onClick={signOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-300 text-lg">Chưa có ảnh nào</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">Nhấn nút camera để upload ảnh đầu tiên</p>
          </div>
        ) : (
          <div className="space-y-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                currentUserId={user.uid}
                onDelete={handleDelete}
                onUpdateCaption={handleUpdateCaption}
              />
            ))}
          </div>
        )}
      </main>

      <label
        htmlFor="photo-input"
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:bg-blue-700 hover:scale-110 active:scale-95 z-20"
      >
        <Camera className="w-8 h-8" />
      </label>
      <input
        id="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Upload ảnh</h2>

              {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded-xl mb-4" />}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caption (tùy chọn)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Viết gì đó về ảnh này..."
                    rows={3}
                    className="textarea"
                    disabled={uploading}
                  />
                </div>

                {uploadProgress && (
                  <div className="bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 px-4 py-3 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">{uploadProgress}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setPreviewUrl('');
                      setCaption('');
                    }}
                    className="btn-secondary flex-1"
                    disabled={uploading}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Đang upload...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  currentUserId: string;
  onDelete: (photo: Photo) => void;
  onUpdateCaption: (photo: Photo, nextCaption: string) => Promise<void>;
}

function PhotoCard({ photo, currentUserId, onDelete, onUpdateCaption }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftCaption, setDraftCaption] = useState(photo.caption || '');
  const [savingCaption, setSavingCaption] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const isOwner = photo.uploaderId === currentUserId;

  useEffect(() => {
    setDraftCaption(photo.caption || '');
  }, [photo.caption]);
  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [photo.uploaderAvatar]);

  const handleSaveCaption = async () => {
    setSavingCaption(true);
    try {
      await onUpdateCaption(photo, draftCaption.trim());
      setEditing(false);
    } finally {
      setSavingCaption(false);
    }
  };

  return (
    <div className="card overflow-hidden fade-in">
      <div className="relative bg-gray-100 dark:bg-slate-800">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={photo.imageUrl}
          alt={photo.caption || 'Photo'}
          className={`w-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {photo.uploaderAvatar && !avatarLoadFailed ? (
              <img
                src={photo.uploaderAvatar}
                alt={photo.uploaderName}
                className="w-8 h-8 rounded-full"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{photo.uploaderName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{format(photo.createdAt, 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  title="Sửa caption"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveCaption}
                    disabled={savingCaption}
                    className="p-2 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                    title="Lưu"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDraftCaption(photo.caption || '');
                      setEditing(false);
                    }}
                    disabled={savingCaption}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                    title="Hủy"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(photo)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Xóa ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={draftCaption}
            onChange={(e) => setDraftCaption(e.target.value)}
            rows={3}
            className="textarea mt-2"
            placeholder="Viết caption..."
            disabled={savingCaption}
          />
        ) : (
          photo.caption && <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap mt-2">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}
