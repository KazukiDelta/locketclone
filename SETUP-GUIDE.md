# SETUP GUIDE (Chi tiet tung buoc)

Tai lieu nay huong dan ban setup va chay project tu dau den cuoi.

## A. Dieu kien can

1. Da cai Node.js 20+.
2. Co tai khoan Google de tao Firebase.
3. Co tai khoan Cloudinary.

## B. Clone / mo source

1. Mo terminal tai thu muc project.
2. Kiem tra co file `package.json`.

## C. Tao Firebase project (Auth)

1. Vao https://console.firebase.google.com.
2. Chon `Add project`.
3. Dat ten project (vi du: `tet-photo-journal`).
4. Tao xong, vao `Authentication`.
5. Chon `Get started`.
6. Bat `Google` o tab `Sign-in method`.
7. Chon support email va `Save`.
8. Quay ve overview, bam icon Web `</>` de tao app web.
9. Copy cac gia tri config:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`

## D. Tao Cloudinary

1. Vao https://cloudinary.com va dang nhap.
2. Vao Dashboard.
3. Copy 3 thong tin:
- `Cloud name`
- `API Key`
- `API Secret`
4. Chon folder se luu anh (vi du `tet-photo-journal`).

## E. Tao file moi truong `.env.local`

1. Tao file `.env.local` o root project.
2. Paste mau sau va dien gia tri that:

```env
# Firebase (Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Danh sach email duoc phep dang nhap (tach bang dau phay, khong khoang trang)
NEXT_PUBLIC_ALLOWED_EMAILS=ban@gmail.com,nguoiyeu@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=tet-photo-journal
```

## F. Cai dependencies

1. Chay lenh:

```bash
npm install
```

2. Neu loi peer dependency, cap nhat dependency theo lockfile moi nhat roi chay lai.

## G. Chay local

1. Chay:

```bash
npm run dev
```

2. Mo `http://localhost:3000`.

## H. Kiem tra chuc nang (test checklist)

1. Bam `Dang nhap bang Google`.
2. Dang nhap dung email trong whitelist.
3. Upload 1 anh.
4. Nhap caption (neu muon).
5. Xac nhan anh hien trong feed.
6. Thu xoa chinh anh vua upload.

## I. Deploy Vercel

1. Day code len GitHub.
2. Import repo vao Vercel.
3. Add toan bo env vars trong `.env.local` vao Vercel Project Settings.
4. Deploy.
5. Vao Firebase Auth > Settings > Authorized domains, them domain Vercel.

## J. Cac loi thuong gap

1. `Missing Cloudinary env vars`
- Kiem tra lai 3 bien Cloudinary trong `.env.local`.

2. `Email ... not authorized`
- Kiem tra `NEXT_PUBLIC_ALLOWED_EMAILS`.
- Dung format: `email1@gmail.com,email2@gmail.com`.

3. Upload tre / fail
- Thu anh nho hon.
- Kiem tra mang internet.

## K. Ghi chu ky thuat

- Project hien dung Firebase cho Auth.
- Luu anh dang dung Cloudinary qua API route (`/api/photos`).
- Neu can bao mat cao hon, can them verify Firebase ID token o server truoc khi cho upload/delete.
