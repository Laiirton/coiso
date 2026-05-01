import { describe, expect, it } from 'vitest';

import { parseCommand } from '../src/features/sticker/sticker-command';

describe('parseCommand', () => {
  it('recognizes sticker aliases', () => {
    expect(parseCommand('!sticker', '!')).toBe('sticker');
    expect(parseCommand('!fig', '!')).toBe('sticker');
    expect(parseCommand('!figura agora', '!')).toBe('sticker');
    expect(parseCommand('!s', '!')).toBe('sticker');
  });

  it('recognizes help aliases', () => {
    expect(parseCommand('!help', '!')).toBe('help');
    expect(parseCommand('!ajuda', '!')).toBe('help');
  });

  it('ignores messages without a valid prefix command', () => {
    expect(parseCommand('oi', '!')).toBeNull();
    expect(parseCommand('/sticker', '!')).toBeNull();
  });
});
