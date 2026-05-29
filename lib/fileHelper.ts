import * as FileSystem from 'expo-file-system/legacy';
import { FileItem } from './types';

export const BASE_DIR = `${FileSystem.documentDirectory}DevSnippets/`;
export const SCREENSHOTS_DIR = `${BASE_DIR}screenshots/`;
export const EXPORTS_DIR = `${BASE_DIR}exports/`;
export const TEMPLATES_DIR = `${BASE_DIR}templates/`;
export const DOWNLOADS_DIR = `${BASE_DIR}downloads/`;

export const initFileSystem = async (): Promise<void> => {
  const dirs = [BASE_DIR, SCREENSHOTS_DIR, EXPORTS_DIR, TEMPLATES_DIR, DOWNLOADS_DIR];
  for (const dir of dirs) {
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    } catch (e) {
      console.error(`Failed to create directory ${dir}:`, e);
    }
  }
};

// Copy photo to screenshots
export const saveScreenshot = async (tempUri: string): Promise<{ uri: string; name: string; size: number }> => {
  await initFileSystem();
  const filename = `screenshot_${Date.now()}.png`;
  const persistentUri = `${SCREENSHOTS_DIR}${filename}`;
  
  await FileSystem.copyAsync({
    from: tempUri,
    to: persistentUri
  });
  
  const info = await FileSystem.getInfoAsync(persistentUri);
  return {
    uri: persistentUri,
    name: filename,
    size: info.exists ? info.size : 0
  };
};

// Export snippet to exports directory
export const exportSnippetFile = async (
  title: string,
  code: string,
  extension: 'txt' | 'js' | 'json'
): Promise<{ uri: string; name: string; size: number }> => {
  await initFileSystem();
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${safeTitle || 'snippet'}_${Date.now()}.${extension}`;
  const fileUri = `${EXPORTS_DIR}${filename}`;
  
  let content = code;
  if (extension === 'json') {
    content = JSON.stringify({
      title,
      code,
      exportedAt: new Date().toISOString(),
      platform: 'DevSnippets-AI'
    }, null, 2);
  } else if (extension === 'txt') {
    content = `========================================\nTitle: ${title}\nExported: ${new Date().toISOString()}\n========================================\n\n${code}`;
  }

  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
  const info = await FileSystem.getInfoAsync(fileUri);
  return {
    uri: fileUri,
    name: filename,
    size: info.exists ? info.size : 0
  };
};

// Browse files in subPath
export const browseDirectory = async (subFolder: string = ''): Promise<FileItem[]> => {
  await initFileSystem();
  const targetDir = subFolder ? `${BASE_DIR}${subFolder}/` : BASE_DIR;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(targetDir);
    const items: FileItem[] = [];
    
    for (const name of files) {
      const fullPath = `${targetDir}${name}`;
      const info = await FileSystem.getInfoAsync(fullPath);
      if (info.exists) {
        const ext = name.split('.').pop() || '';
        items.push({
          name,
          path: fullPath,
          isDirectory: info.isDirectory,
          size: info.size,
          modificationTime: info.modificationTime,
          fileExtension: info.isDirectory ? undefined : ext
        });
      }
    }
    
    // Sort directories first, then alphabetically
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading folder ${targetDir}:`, error);
    return [];
  }
};

// Delete a local file or directory
export const deleteFile = async (path: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch (error) {
    console.error(`Failed to delete path ${path}:`, error);
  }
};

// Move or copy files
export const moveOrCopyFile = async (srcPath: string, destPath: string, method: 'move' | 'copy'): Promise<void> => {
  try {
    if (method === 'move') {
      await FileSystem.moveAsync({ from: srcPath, to: destPath });
    } else {
      await FileSystem.copyAsync({ from: srcPath, to: destPath });
    }
  } catch (error) {
    console.error(`Failed to ${method} from ${srcPath} to ${destPath}:`, error);
    throw error;
  }
};

// Read a file's string contents
export const readFileContent = async (path: string): Promise<string> => {
  try {
    const content = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
    return content;
  } catch (error) {
    console.error(`Failed to read file contents at ${path}:`, error);
    return '';
  }
};

// Create a custom subfolder
export const createFolder = async (folderName: string, parentFolder: string = ''): Promise<void> => {
  await initFileSystem();
  const newDirPath = parentFolder 
    ? `${BASE_DIR}${parentFolder}/${folderName}/` 
    : `${BASE_DIR}${folderName}/`;
  try {
    await FileSystem.makeDirectoryAsync(newDirPath, { intermediates: true });
  } catch (error) {
    console.error(`Failed to create directory at ${newDirPath}:`, error);
    throw error;
  }
};

// Pre-load default coder resources/templates
export const seedDefaultTemplates = async (): Promise<void> => {
  await initFileSystem();
  
  const templates = [
    {
      name: 'react-local-storage-hook.js',
      code: `import { useState, useEffect } from 'react';\n\n// Custom React hook to sync state with localStorage\nexport function useLocalStorage(key, initialValue) {\n  const [value, setValue] = useState(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      console.error(error);\n      return initialValue;\n    }\n  });\n\n  useEffect(() => {\n    try {\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (error) {\n      console.error(error);\n    }\n  }, [key, value]);\n\n  return [value, setValue];\n}`
    },
    {
      name: 'flask-hello-api.py',
      code: `from flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n@app.route('/api/v1/hello', methods=['GET'])\ndef hello_world():\n    name = request.args.get('name', 'Developer')\n    return jsonify({\n        'message': f'Hello, {name}!',\n        'status': 'success',\n        'offline_ready': True\n    })\n\nif __name__ == '__main__':\n    app.run(debug=True, port=5000)`
    },
    {
      name: 'express-quickstart.js',
      code: `const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({\n    message: 'Welcome to DevSnippets Local Express Server API!',\n    version: '1.0.0'\n  });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server is running on port \${PORT}\`);\n});`
    }
  ];

  for (const t of templates) {
    const tUri = `${TEMPLATES_DIR}${t.name}`;
    try {
      const info = await FileSystem.getInfoAsync(tUri);
      if (!info.exists) {
        await FileSystem.writeAsStringAsync(tUri, t.code, { encoding: FileSystem.EncodingType.UTF8 });
      }
    } catch (e) {
      console.error(`Failed to seed template ${t.name}:`, e);
    }
  }
};
