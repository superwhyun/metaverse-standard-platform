import { getRequestContext } from '@cloudflare/next-on-pages';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTrendInsightOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        const db = await createDatabaseAdapter();
        const ops = createTrendInsightOperations(db);

        const result = await ops.getPaginated(limit, offset);

        return Response.json({
            success: true,
            data: result.items,
            total: result.total,
            limit,
            offset
        });
    } catch (error: any) {
        console.error('API Error (Trend Insights GET):', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { env } = getRequestContext();
        const session = await getSessionFromRequest(request, env.JWT_SECRET as string);

        if (!session || session.user.role !== 'admin') {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = await createDatabaseAdapter();
        const ops = createTrendInsightOperations(db);

        const body = await request.json();
        const { title, summary, pdf_url, thumbnail_url } = body;

        if (!title || !pdf_url) {
            return Response.json({ success: false, error: 'Title and PDF URL are required' }, { status: 400 });
        }

        const insight = await ops.create({
            title,
            summary,
            pdf_url,
            thumbnail_url
        });

        return Response.json({
            success: true,
            data: insight
        });
    } catch (error: any) {
        console.error('API Error (Trend Insights POST):', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
