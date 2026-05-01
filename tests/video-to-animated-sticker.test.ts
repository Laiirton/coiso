import { describe, expect, it } from 'vitest';

import {
  buildFilters,
  resolveVideoStickerMaxSeconds
} from '../src/features/sticker/video-to-animated-sticker';

describe('video-to-animated-sticker helpers', () => {
  it('caps animated sticker videos at 5 seconds', () => {
    expect(resolveVideoStickerMaxSeconds(1)).toBe(1);
    expect(resolveVideoStickerMaxSeconds(5)).toBe(5);
    expect(resolveVideoStickerMaxSeconds(8)).toBe(5);
    expect(resolveVideoStickerMaxSeconds(30)).toBe(5);
  });

  it('builds a transparent square filter chain', () => {
    const filters = buildFilters({
      fps: 12,
      size: 512
    });

    expect(filters).toContain('fps=12');
    expect(filters).toContain('scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos');
    expect(filters).toContain('format=rgba');
    expect(filters).toContain('pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000');
    expect(filters).toContain('setsar=1');
  });
});
