import os
import zipfile

rootDir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
outputPath = os.path.join(rootDir, 'public', 'discord-clone-source.zip')

if os.path.exists(outputPath):
    os.remove(outputPath)

ignore_dirs = {'node_modules', '.git', 'dist', '.aistudio', '.turbo', '.cache', '__pycache__'}
ignore_files = {'bun.lock', '.DS_Store', 'discord-clone-source.zip'}

print("Building standard ZIP archive...")
with zipfile.ZipFile(outputPath, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for root, dirs, files in os.walk(rootDir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.git')]
        for f in files:
            if f in ignore_files or f.endswith('.zip') or f.endswith('.pyc'):
                continue
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, rootDir)
            arcname = arcname.replace(os.path.sep, '/')
            z.write(full_path, arcname)

    readme_content = """# Discord Clone - React & TypeScript

A full-featured Discord web application built with React, Vite, Tailwind CSS, and Firebase Firestore.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the local development server:
```bash
npm run dev
```
Visit http://localhost:3000 in your browser.

3. Build for production:
```bash
npm run build
```

## Included Features
- Servers, channels (text & voice), categories
- Real-time cloud sync with Firebase
- Custom Discord Nitro banner studio & animated profile banners
- Server icon customization (presets, file upload, custom URLs)
- Persistent voice deafen & mute state
- Soundboard & authentic Discord sound effects
"""
    z.writestr('README.md', readme_content)

print(f"Archive built successfully! File size: {os.path.getsize(outputPath)} bytes")
