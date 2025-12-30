import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { VTT_PROMPT } from '@/config/vtt-prompt';

export const runtime = 'edge';

// Cloudflare Pages/Workers 환경 호환을 위한 환경변수 접근 헬퍼
function getEnv(name: string): string | undefined {
    // @ts-ignore
    return (typeof process !== 'undefined' && process?.env?.[name])
        // @ts-ignore
        || (globalThis as any)?.[name]
        // @ts-ignore
        || (globalThis as any)?.__env__?.[name];
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read file content
        // In Edge runtime, Blob/File methods like text() or arrayBuffer() work fine.
        const fileContent = await file.text();

        // Use raw content directly without parsing
        const transcript = fileContent;

        // Read System Prompt from config (imported constant)
        const systemPrompt = VTT_PROMPT;

        const apiKey = getEnv('OPENAI_API_KEY');
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // Create a unified prompt for single-pass generation
        const usageInstructions = `
You act as a professional meeting minutes writer.
Analyze the provided VTT transcript and output a JSON object with the following 4 fields:
1. "title": A concise title (format: "Group Name - #[Ordinal]").
2. "date": Meeting date in "YYYY-MM-DD" format (or null if not found).
3. "summary": 1000자 이내의 문장으로 주요 표준화 논의내용을 작성해.
4. "content": The main meeting report in Markdown format.

For the "content" field, strictly follow these style rules:
${VTT_PROMPT}

Output must be valid JSON only.
`;

        const fullPrompt = `${usageInstructions}\n\nTranscript:\n${transcript}`;

        // Single API call using gpt-5-mini
        const completion = await openai.responses.create({
            model: 'gpt-5-mini', // Restoring user choice
            reasoning: { effort: 'medium' }, // Increased effort for complex single-shot task
            input: fullPrompt,
            max_output_tokens: 4096,
        });

        // @ts-ignore
        const rawOutput = completion.output_text || '{}';

        // Clean up markdown code blocks if present to ensure valid JSON parsing
        const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();

        let result = { title: '', date: '', summary: '', content: '' };

        try {
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse unified JSON response:', e);
            console.error('Raw output:', rawOutput);
            // Fallback: treat entire output as content if JSON fails
            result.content = rawOutput;
        }

        return NextResponse.json({
            content: result.content || '',
            title: result.title || file.name.replace('.vtt', ''),
            summary: result.summary || '',
            date: result.date || ''
        });

    } catch (error: any) {
        console.error('Error processing VTT:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
