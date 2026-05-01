import { spawn } from 'node:child_process';
import { access, mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

import ffmpegStatic from 'ffmpeg-static';

const MAX_WA_ANIMATED_STICKER_SECONDS = 5;

export interface VideoToAnimatedStickerOptions {
  ffmpegPath?: string;
  maxSeconds: number;
  fps: number;
  size: number;
}

export interface AnimatedStickerArtifact {
  outputPath: string;
  format: 'webp' | 'gif';
  sizeBytes: number;
}

export async function convertVideoToAnimatedSticker(
  inputPath: string,
  outputDir: string,
  options: VideoToAnimatedStickerOptions
): Promise<AnimatedStickerArtifact> {
  await access(inputPath);
  await mkdir(outputDir, { recursive: true });

  const ffmpegPath = resolveFfmpegPath(options.ffmpegPath);
  const effectiveMaxSeconds = resolveVideoStickerMaxSeconds(options.maxSeconds);
  const filters = buildFilters(options);
  const candidates = [
    {
      format: 'webp' as const,
      outputPath: join(outputDir, 'animated.webp'),
      args: [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-t',
        String(effectiveMaxSeconds),
        '-vf',
        filters,
        '-c:v',
        'libwebp',
        '-lossless',
        '0',
        '-q:v',
        '60',
        '-preset',
        'default',
        '-pix_fmt',
        'yuva420p',
        '-an',
        '-loop',
        '0',
        '-vsync',
        '0',
        join(outputDir, 'animated.webp')
      ]
    },
    {
      format: 'gif' as const,
      outputPath: join(outputDir, 'animated.gif'),
      args: [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-t',
        String(effectiveMaxSeconds),
        '-vf',
        filters,
        '-an',
        '-loop',
        '0',
        join(outputDir, 'animated.gif')
      ]
    }
  ];

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      await rm(candidate.outputPath, { force: true });
      await runProcess(ffmpegPath, candidate.args);
      await ensureOutputFile(candidate.outputPath);

      return {
        outputPath: candidate.outputPath,
        format: candidate.format,
        sizeBytes: (await stat(candidate.outputPath)).size
      };
    } catch (error) {
      lastError = error;
      await rm(candidate.outputPath, { force: true });
    }
  }

  throw new Error(`Failed to convert video to animated sticker: ${describeError(lastError)}`);
}

function resolveFfmpegPath(preferredPath?: string): string {
  if (preferredPath && preferredPath.trim().length > 0) {
    return preferredPath;
  }

  if (typeof ffmpegStatic === 'string' && ffmpegStatic.trim().length > 0) {
    return ffmpegStatic;
  }

  throw new Error('FFmpeg is not available. Install ffmpeg-static or set FFMPEG_PATH.');
}

export function resolveVideoStickerMaxSeconds(maxSeconds: number): number {
  return Math.max(1, Math.min(maxSeconds, MAX_WA_ANIMATED_STICKER_SECONDS));
}

export function buildFilters(options: VideoToAnimatedStickerOptions): string {
  return [
    `fps=${options.fps}`,
    `scale=${options.size}:${options.size}:force_original_aspect_ratio=decrease:flags=lanczos`,
    'format=rgba',
    `pad=${options.size}:${options.size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
    'setsar=1'
  ].join(',');
}

function runProcess(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'pipe']
    });

    let stderr = '';

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `FFmpeg exited with code ${code ?? 'unknown'}${stderr ? `: ${stderr.trim()}` : ''}`
        )
      );
    });
  });
}

async function ensureOutputFile(outputPath: string): Promise<void> {
  const fileStat = await stat(outputPath);

  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Generated sticker media is empty: ${outputPath}`);
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'unknown error';
}
