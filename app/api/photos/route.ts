import { NextRequest, NextResponse } from 'next/server';
import { cloudinary, getMissingCloudinaryEnv, hasCloudinaryConfig } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'tet-photo-journal';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybe = error as { message?: string; error?: { message?: string } };
    if (maybe.error?.message) return maybe.error.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

function getCloudinaryConfigErrorResponse() {
  const missing = getMissingCloudinaryEnv();
  return NextResponse.json(
    {
      error: `Missing Cloudinary env vars: ${missing.join(', ')}`,
    },
    { status: 500 }
  );
}

interface CloudinaryPhoto {
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
  createdAt: string;
}

function decodeContextValue(value: string | undefined): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeLegacyAvatarUrl(url: string): string {
  if (!url) return '';
  // Old data replaced "=" with spaces, e.g. "...abc s96-c"
  if (url.includes('googleusercontent.com')) {
    return url.replace(/\s(s\d+-c)\b/, '=$1');
  }
  return url;
}

function mapResourceToPhoto(resource: any): CloudinaryPhoto {
  const context = resource.context?.custom || resource.context || {};
  const uploaderAvatar = normalizeLegacyAvatarUrl(decodeContextValue(context.uploaderAvatar));
  return {
    id: resource.public_id,
    publicId: resource.public_id,
    filename: resource.original_filename || resource.public_id.split('/').pop() || 'photo',
    imageUrl: resource.secure_url,
    thumbnailUrl: resource.secure_url,
    caption: decodeContextValue(context.caption) || '',
    uploaderName: decodeContextValue(context.uploaderName) || 'Unknown',
    uploaderEmail: decodeContextValue(context.uploaderEmail) || '',
    uploaderAvatar: uploaderAvatar || '',
    uploaderId: decodeContextValue(context.uploaderId) || '',
    fileSize: resource.bytes || 0,
    createdAt: resource.created_at,
  };
}

function safeContextValue(value: string): string {
  return encodeURIComponent(value.trim());
}

export async function GET() {
  if (!hasCloudinaryConfig()) {
    return getCloudinaryConfigErrorResponse();
  }

  try {
    const result = await cloudinary.search
      .expression(`public_id:${CLOUDINARY_FOLDER}/*`)
      .sort_by('created_at', 'desc')
      .max_results(200)
      .with_field('context')
      .execute();

    const photos = (result.resources || []).map(mapResourceToPhoto);
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Cloudinary fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch photos') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasCloudinaryConfig()) {
    return getCloudinaryConfigErrorResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const caption = String(formData.get('caption') || '');
    const uploaderId = String(formData.get('uploaderId') || '');
    const uploaderName = String(formData.get('uploaderName') || 'Unknown');
    const uploaderEmail = String(formData.get('uploaderEmail') || '');
    const uploaderAvatar = String(formData.get('uploaderAvatar') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    if (!uploaderId || !uploaderEmail) {
      return NextResponse.json({ error: 'Missing uploader info' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${CLOUDINARY_FOLDER}/${uploaderId}`,
          resource_type: 'image',
          context: [
            `caption=${safeContextValue(caption)}`,
            `uploaderId=${safeContextValue(uploaderId)}`,
            `uploaderName=${safeContextValue(uploaderName)}`,
            `uploaderEmail=${safeContextValue(uploaderEmail)}`,
            `uploaderAvatar=${safeContextValue(uploaderAvatar)}`,
          ].join('|'),
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
            return;
          }
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    const photo = mapResourceToPhoto({
      ...uploadResult,
      context: {
        custom: {
          caption,
          uploaderId,
          uploaderName,
          uploaderEmail,
          uploaderAvatar,
        },
      },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to upload photo') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasCloudinaryConfig()) {
    return getCloudinaryConfigErrorResponse();
  }

  try {
    const body = await request.json();
    const publicId = String(body?.publicId || '');
    const uploaderId = String(body?.uploaderId || '');

    if (!publicId || !uploaderId) {
      return NextResponse.json({ error: 'Missing publicId or uploaderId' }, { status: 400 });
    }

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
      context: true,
    });
    const ownerId = resource?.context?.custom?.uploaderId || resource?.context?.uploaderId;

    if (ownerId !== uploaderId) {
      return NextResponse.json({ error: 'Not allowed to delete this photo' }, { status: 403 });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete photo') },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasCloudinaryConfig()) {
    return getCloudinaryConfigErrorResponse();
  }

  try {
    const body = await request.json();
    const publicId = String(body?.publicId || '');
    const uploaderId = String(body?.uploaderId || '');
    const caption = String(body?.caption || '');

    if (!publicId || !uploaderId) {
      return NextResponse.json({ error: 'Missing publicId or uploaderId' }, { status: 400 });
    }

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
      context: true,
    });
    const currentContext = resource?.context?.custom || resource?.context || {};
    const ownerId = currentContext.uploaderId;

    if (ownerId !== uploaderId) {
      return NextResponse.json({ error: 'Not allowed to edit this photo' }, { status: 403 });
    }

    const mergedContext = {
      caption,
      uploaderId: String(currentContext.uploaderId || ''),
      uploaderName: String(currentContext.uploaderName || 'Unknown'),
      uploaderEmail: String(currentContext.uploaderEmail || ''),
      uploaderAvatar: String(currentContext.uploaderAvatar || ''),
    };

    await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: 'image',
      context: [
        `caption=${safeContextValue(mergedContext.caption)}`,
        `uploaderId=${safeContextValue(mergedContext.uploaderId)}`,
        `uploaderName=${safeContextValue(mergedContext.uploaderName)}`,
        `uploaderEmail=${safeContextValue(mergedContext.uploaderEmail)}`,
        `uploaderAvatar=${safeContextValue(mergedContext.uploaderAvatar)}`,
      ].join('|'),
    });

    const latest = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
      context: true,
    });
    const photo = mapResourceToPhoto(latest);

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Cloudinary edit error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to edit photo') },
      { status: 500 }
    );
  }
}
