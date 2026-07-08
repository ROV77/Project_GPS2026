import fs from 'fs';
import path from 'path';

const filesToRefactor = [
  "src/components/AnimatedTabIcon.tsx",
  "src/app/(public)/account.tsx",
  "src/components/CartSheet.tsx",
  "src/app/(public)/applications.tsx",
  "src/app/onboarding.tsx",
  "src/app/(public)/courier-onboarding.tsx",
  "src/app/(public)/index.tsx",
  "src/components/ProductCard.tsx",
  "src/app/(public)/map.tsx",
  "src/app/(public)/vacancies.tsx",
  "src/components/StoreCard.tsx",
  "src/app/(public)/store/[id].tsx",
  "src/components/StoreDetailSheet.tsx",
  "src/components/StoreMarker.tsx",
  "src/components/VerifiedBadge.tsx"
];

for (const file of filesToRefactor) {
  const absolutePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(absolutePath, 'utf8');

  // Change import
  if (content.includes("import { colors } from '@/ui/theme';")) {
    content = content.replace("import { colors } from '@/ui/theme';", "import { useThemeColors } from '@/ui/theme';");
  } else if (content.includes("import { fonts, colors } from '@/ui/theme';")) {
    content = content.replace("import { fonts, colors } from '@/ui/theme';", "import { fonts, useThemeColors } from '@/ui/theme';");
  }

  // Find component definitions to inject hook
  // function Name( or export default function Name( or export function Name(
  const componentRegex = /(export\s+default\s+function|export\s+function|function)\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/g;
  
  content = content.replace(componentRegex, (match) => {
    return `${match}\n  const colors = useThemeColors();`;
  });

  fs.writeFileSync(absolutePath, content);
}

console.log("Refactoring complete");
