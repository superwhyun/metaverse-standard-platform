import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function POST(request: Request) {
    try {
        const { env } = getRequestContext();
        const session = await getSessionFromRequest(request, env.JWT_SECRET as string);

        if (!session || session.user.role !== 'admin') {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'pdf' or 'thumbnail'

        if (!file) {
            return Response.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bucket = env.MSP_TREND_INSIGHTS as any;
        if (!bucket) {
            return Response.json({ success: false, error: 'R2 bucket not bound' }, { status: 500 });
        }

        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${type}/${timestamp}-${safeFileName}`;

        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Note: In production, you would use a custom domain or Cloudflare Public Bucket URL
        // For now, we'll return the key or a relative path if handled by a proxy
        const url = `/api/trend-insights/files/${key}`;

        return Response.json({
            success: true,
            url,
            key
        });
    } catch (error: any) {
        console.error('API Error (Trend Insights Upload):', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
