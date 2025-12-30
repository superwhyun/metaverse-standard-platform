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

        // Construct the full prompt
        const userPrompt = `다음은 회의 녹취록(VTT)에서 추출한 텍스트이다. 이 내용을 바탕으로 양식에 맞춰 보고서를 작성할 것:\n\n${transcript}`;

        // Combine system and user prompts for the unified input model
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

        const completion = await openai.responses.create({
            model: 'gpt-5-nano',
            reasoning: { effort: 'low' },
            input: fullPrompt,
            max_output_tokens: 2048, // Allocate enough tokens for a full report
        });

        // @ts-ignore
        const generatedText = completion.output_text || '';

        // Simple parsing of the markdown result to extract title, summary, and content
        // We assume the model follows instructions, but we need to fit it into our form fields.
        // The prompt asks for markdown. We'll use the whole text as 'content', but try to extract a title if possible.
        // Or, we can ask the model to output JSON.
        // Given the prompt asks for specific markdown structure, let's try to parse it or just return it as content.
        // Use a secondary light call or regex to get a title if needed, or just let user fill it.
        // For now, let's put the whole thing in content, and maybe generate a title/summary separately or extract them.

        // Let's refine the prompt logic slightly in the implementation or just format the response.
        // The current prompt asks for a specific markdown structure.
        // Let's assume the user wants the whole thing in the 'content' area,
        // but we also need 'summary' and 'title'.

        // Strategy: Return the full generated text.
        // Also try to extract a summary (first paragraph?) or generate one.
        // Let's do a quick separate extraction or ask for JSON in the prompt?
        // The user provided a specific prompt *template* which outputs text.
        // We will use that exact text for the 'Content' field.
        // For 'Title' and 'Summary', we might need to ask OpenAI again or imply them.
        // However, to save tokens/time, let's generating a title and summary based on the transcript as well in the same call?
        // The user's prompt is specific. Let's stick to it for the "Content".
        // We can infer a title from the filename or first line.
        // We can infer summary from the first section if it exists.

        // Ideally, we'd change the prompt to output JSON, but the user gave a specific text prompt.
        // Let's return the full text. The frontend can put it in 'Content'.
        // We can generate a title/summary with a cheap call or just leave them blank/prefilled with filename.

        // Actually, let's do a second "cheap" call to get a Title and 1-sentence Summary from the same transcript?
        // Or just one call.
        // Let's try to extract from the generated text if possible.
        // The sample has "1. 핵심 논의", "2. ...".

        // Let's just return the generated text.
        // And PERHAPS generate a title/summary separately.
        // Let's do a parallel    // Extract metadata using a lightweight second call
        const metadataPrompt = `Based on the following transcript, provide:
    1. A concise TITLE in the format "Group Name - #[Ordinal]" (e.g., "MPEG - #145", "Immersive Media WG - #3"). Detect the group name and meeting number.
    2. A SUMMARY in KOREAN. 경어체 사용금지. 의례적인 절차설명은 제외하고 주요 핵심 논의 내용을 한글로 500자 내외로 요약할것.
    3. The DATE of the meeting in "YYYY-MM-DD" format. If not found, return null. 
    
    Return as JSON: { "title": "...", "summary": "...", "date": "..." }.
    
    Transcript start: ${transcript.substring(0, 3000)}`;

        // Note: Using 'gpt-5-nano' as requested, following lib/openai-categorizer.ts pattern
        // The 'responses' API is used instead of 'chat.completions'
        const metadataResponse = await openai.responses.create({
            model: 'gpt-5-nano',
            reasoning: { effort: 'low' },
            input: metadataPrompt,
            max_output_tokens: 1024,
        });

        let metadata = { title: '', summary: '', date: '' };
        try {
            // @ts-ignore - output_text might be missing in older types
            const jsonText = metadataResponse.output_text || '{}';
            // Clean up potentially wrapped JSON (e.g. ```json ... ```)
            const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            metadata = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse metadata JSON', e);
        }

        return NextResponse.json({
            content: generatedText,
            title: metadata.title || file.name.replace('.vtt', ''),
            summary: metadata.summary || '',
            date: metadata.date || ''
        });

    } catch (error: any) {
        console.error('Error processing VTT:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
