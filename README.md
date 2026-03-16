# Math Sprint V4

This is a standalone Next.js update package for Math Sprint V4.

## What's included
- Animated confetti on correct answers
- Streak flames and stronger reward loop
- Adaptive difficulty logic
- Visual fraction bars and circles
- XP shop with unlockable avatars
- Teacher dashboard
- Parent weekly report email preview
- Grade 4 and Grade 7 pathways
- **Name-saving fix included**

## Name-saving fix
The student name field now uses a direct local update flow instead of relying on an async cloud-save callback.

```tsx
<input
  className="text-input"
  value={profile.student_name}
  onChange={(e) => updateProfile({ student_name: e.target.value })}
/>
```

`updateProfile()` immediately:
1. updates React state
2. saves to localStorage

That makes the student name persist across refreshes without lag.

## Install
```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Replace your local project cleanly
Copy these folders/files into your local project root:
- `app/`
- `components/`
- `package.json` if you want the exact dependency set here
- `tsconfig.json`
- `next.config.mjs`
- `next-env.d.ts`

## Notes
This package is self-contained and does not require shadcn/ui or Tailwind. It uses plain CSS in `app/globals.css`.
