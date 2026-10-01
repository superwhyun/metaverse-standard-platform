import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTechNewsMetadata, getYouTubeVideoId } from '../lib/tech-news-metadata.ts';

test('recognizes individual YouTube videos without trusting lookalike domains', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=jfKfPfyJRdk&t=5',
    'https://m.youtube.com/shorts/jfKfPfyJRdk',
    'https://www.youtube.com/live/jfKfPfyJRdk',
    'https://youtu.be/jfKfPfyJRdk',
  ]) {
    assert.equal(getYouTubeVideoId(url), 'jfKfPfyJRdk');
  }
  assert.equal(getYouTubeVideoId('https://youtube.com.evil.test/watch?v=jfKfPfyJRdk'), null);
  assert.equal(getYouTubeVideoId('https://www.youtube.com/playlist?list=abc'), null);
});

test('uses YouTube title and thumbnail when the metadata service cannot read a video', async () => {
  const originalFetch = globalThis.fetch;
  const called = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    called.push(url);
    if (url.startsWith('https://www.youtube.com/oembed?')) {
      return Response.json({ title: 'New research video', author_name: 'Research Lab', thumbnail_url: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg' });
    }
    return new Response(null, { status: 502 });
  };

  try {
    const metadata = await getTechNewsMetadata('https://youtu.be/jfKfPfyJRdk');
    assert.equal(metadata.title, 'New research video');
    assert.equal(metadata.image, 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg');
    assert.equal(metadata.description, 'YouTube 영상 · 채널: Research Lab');
    assert.equal(metadata.source, 'youtube-oembed');
    assert.equal(called.length, 2);
    assert.ok(called[0].includes(encodeURIComponent('https://www.youtube.com/watch?v=jfKfPfyJRdk')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('keeps the longer description from the existing metadata service', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes('/oembed?')
    ? Response.json({ title: 'Video title', thumbnail_url: 'https://i.ytimg.com/thumb.jpg' })
    : Response.json({ status: true, data: { title: 'Generic title', description: 'A detailed technology description', image: null } });

  try {
    const metadata = await getTechNewsMetadata('https://www.youtube.com/watch?v=jfKfPfyJRdk');
    assert.equal(metadata.title, 'Video title');
    assert.equal(metadata.description, 'A detailed technology description');
    assert.equal(metadata.source, 'youtube-oembed');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
