import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Silent Interface Verification', () => {
  it('ensures audioService.ts is completely deleted from the codebase', () => {
    const audioServicePath = path.resolve(__dirname, '../services/audioService.ts');
    expect(fs.existsSync(audioServicePath)).toBe(false);
  });

  it('ensures no file in src references soundFx, audioService, or AudioContext', () => {
    const srcDir = path.resolve(__dirname, '..');
    
    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes('silentInterface.test')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('soundFx');
          expect(content).not.toContain('audioService');
          expect(content).not.toContain('AudioContext');
          expect(content).not.toContain('webkitAudioContext');
        }
      }
    }

    checkDir(srcDir);
  });
});
