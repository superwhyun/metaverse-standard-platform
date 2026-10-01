import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTechNewsMetadata, getXPostUrl, getYouTubeVideoId } from '../lib/tech-news-metadata.ts';

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

test('ignores the YouTube homepage description returned for a video', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes('/oembed?')
    ? Response.json({ title: 'Video title', author_name: 'Video channel', thumbnail_url: 'https://i.ytimg.com/thumb.jpg' })
    : Response.json({
      status: true,
      data: {
        title: 'YouTube',
        description: 'YouTube에서 마음에 드는 동영상과 음악을 감상하고, 직접 만든 콘텐츠를 업로드하여 친구, 가족뿐 아니라 전 세계 사람들과 콘텐츠를 공유할 수 있습니다.',
        image: null,
      },
    });

  try {
    const metadata = await getTechNewsMetadata('https://www.youtube.com/watch?v=jfKfPfyJRdk');
    assert.equal(metadata.title, 'Video title');
    assert.equal(metadata.description, 'YouTube 영상 · 채널: Video channel');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('recognizes only individual X posts and normalizes their URL for oEmbed', () => {
  assert.equal(getXPostUrl('https://x.com/StandardsLab/status/1234567890123456789?s=20'), 'https://twitter.com/StandardsLab/status/1234567890123456789');
  assert.equal(getXPostUrl('https://mobile.twitter.com/i/web/status/1234567890123456789'), 'https://twitter.com/i/status/1234567890123456789');
  assert.equal(getXPostUrl('https://x.com/StandardsLab'), null);
  assert.equal(getXPostUrl('https://x.com.evil.test/StandardsLab/status/1234567890123456789'), null);
});

test('uses the actual X post text instead of the metadata service site description', async () => {
  const originalFetch = globalThis.fetch;
  const called = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    called.push(url);
    if (url.startsWith('https://publish.twitter.com/oembed?')) {
      return Response.json({
        html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">New open standard &amp; roadmap<br>See details at <a href="https://t.co/example">example.com</a> <img alt="🚀" src="emoji.png" /></p>&mdash; Standards Lab</blockquote>',
        thumbnail_url: 'https://pbs.twimg.com/media/example.jpg',
      });
    }
    return Response.json({ status: true, data: { title: 'X', description: 'Log in to X to see what is happening', image: null } });
  };

  try {
    const metadata = await getTechNewsMetadata('https://x.com/StandardsLab/status/1234567890123456789?s=20');
    assert.equal(metadata.title, 'New open standard & roadmap');
    assert.equal(metadata.description, 'New open standard & roadmap\nSee details at example.com 🚀');
    assert.equal(metadata.image, 'https://pbs.twimg.com/media/example.jpg');
    assert.equal(metadata.source, 'x-oembed');
    assert.ok(called[0].includes(encodeURIComponent('https://twitter.com/StandardsLab/status/1234567890123456789')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('falls back to existing metadata when X cannot provide an embed', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes('/oembed?')
    ? new Response(null, { status: 404 })
    : Response.json({ status: true, data: { title: 'Article shared on X', description: 'A useful technology update', image: null } });

  try {
    const metadata = await getTechNewsMetadata('https://x.com/StandardsLab/status/1234567890123456789');
    assert.equal(metadata.title, 'Article shared on X');
    assert.equal(metadata.description, 'A useful technology update');
    assert.equal(metadata.source, 'metadata-service');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
