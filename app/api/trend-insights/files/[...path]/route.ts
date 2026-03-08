import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    try {
        const { env } = getRequestContext();
        const bucket = env.MSP_TREND_INSIGHTS as any;

        if (!bucket) {
            return new Response('R2 bucket not bound', { status: 500 });
        }

        const { pathname } = new URL(request.url);
        const key = pathname.replace('/api/trend-insights/files/', '');

        const object = await bucket.get(key);

        if (!object) {
            return new Response('File not found', { status: 404 });
        }

        const headers = new Headers();
        // Set metadata manually to avoid proxy serialization issues in dev platform
        if (object.httpMetadata?.contentType) {
            headers.set('Content-Type', object.httpMetadata.contentType);
        }
        if (object.httpMetadata?.contentLanguage) {
            headers.set('Content-Language', object.httpMetadata.contentLanguage);
        }
        if (object.httpMetadata?.contentDisposition) {
            headers.set('Content-Disposition', object.httpMetadata.contentDisposition);
        }

        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');

        // Read the stream into an array buffer to avoid Miniflare IPC stream proxy serialization errors in local dev
        const bodyBuffer = await object.arrayBuffer();

        return new Response(bodyBuffer, {
            headers,
        });
    } catch (error: any) {
        console.error('API Error (Trend Insights File Serving):', error);
        return new Response(error.message, { status: 500 });
    }
}
