import fs from 'fs';
import path from 'path';

const filesToFix = [
  "src/app/(public)/index.tsx",
  "src/app/(public)/store/[id].tsx",
  "src/components/StoreCard.tsx",
  "src/components/StoreMarker.tsx"
];

for (const file of filesToFix) {
  const absolutePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(absolutePath, 'utf8');

  // Fix import
  if (content.includes("import { useThemeColors } from '@/ui/theme';")) {
    content = content.replace("import { useThemeColors } from '@/ui/theme';", "import { useThemeColors, colors } from '@/ui/theme';");
  } else if (content.includes("import { fonts, useThemeColors } from '@/ui/theme';")) {
    content = content.replace("import { fonts, useThemeColors } from '@/ui/theme';", "import { fonts, useThemeColors, colors } from '@/ui/theme';");
  }

  fs.writeFileSync(absolutePath, content);
}

// Fix missing useThemeStore import in map.tsx
const mapPath = path.join(process.cwd(), "src/app/(public)/map.tsx");
let mapContent = fs.readFileSync(mapPath, 'utf8');
if (!mapContent.includes("import { useThemeStore }")) {
  mapContent = mapContent.replace("import { useThemeColors } from '@/ui/theme';", "import { useThemeColors, colors } from '@/ui/theme';\nimport { useThemeStore } from '@/ui/themeStore';");
} else if (mapContent.includes("import { useThemeColors } from '@/ui/theme';")) {
  mapContent = mapContent.replace("import { useThemeColors } from '@/ui/theme';", "import { useThemeColors, colors } from '@/ui/theme';");
}
fs.writeFileSync(mapPath, mapContent);

console.log("Fixes applied");
