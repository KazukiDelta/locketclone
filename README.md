# Tet Photo Journal (Firebase Auth + Cloudinary)

Album anh rieng cho nhom nho, dang nhap Google, upload anh nhanh, giao dien mobile-first.

## Tech stack

- Next.js 15 + React 19 + TypeScript
- Firebase Authentication (Google sign-in + whitelist email)
- Cloudinary (luu tru anh)
- Tailwind CSS

## Tinh nang

- Dang nhap bang Google
- Whitelist email (chi email duoc phep moi vao app)
- Nen anh client-side truoc khi upload (giam dung luong va toc do)
- Feed anh realtime theo thu tu moi nhat
- Xoa anh (chi owner)

## Kien truc

- Auth: Firebase client SDK
- Upload/list/delete anh: qua API route `app/api/photos/route.ts`
- Luu tru: Cloudinary folder `CLOUDINARY_FOLDER/<uploaderId>`

## 1) Cai dat

```bash
npm install
```

## 2) Tao `.env.local`

Copy tu `.env.example` va dien gia tri that.

## 3) Chay local

```bash
npm run dev
```

Mo `http://localhost:3000`.

## Bien moi truong bat buoc

```env
# Firebase (chi dung cho auth)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ALLOWED_EMAILS=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=tet-photo-journal
```

## Luu y bao mat

- Whitelist email dang kiem tra o client de chan truy cap UI.
- API route hien tai chua verify Firebase ID token o server.
- Neu can muc bao mat cao hon, bo sung xac thuc server-side (Firebase Admin + verify token) truoc khi upload/delete.

## Troubleshooting nhanh

- `Missing Cloudinary env vars`: thieu bien Cloudinary trong `.env.local`.
- `Email ... not authorized`: email login khong nam trong `NEXT_PUBLIC_ALLOWED_EMAILS`.
- Upload fail voi anh lon: thu anh nho hon hoac kiem tra mang.

## Tai lieu chi tiet

Xem `SETUP-GUIDE.md` de co huong dan tung buoc.
