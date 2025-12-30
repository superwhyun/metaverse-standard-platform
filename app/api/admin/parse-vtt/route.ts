import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { VTT_PROMPT } from '@/config/vtt-prompt';

export const runtime = 'edge';

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

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // Construct the full prompt
        const userPrompt = `다음은 회의 녹취록(VTT)에서 추출한 텍스트입니다. 이 내용을 바탕으로 보고서를 작성해주세요:\n\n${transcript}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Or use an environment variable if preferred
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        });

        const generatedText = completion.choices[0]?.message?.content || '';

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
    1. A concise TITLE in the format "Group Name - [Ordinal] Round" (e.g., "MPEG - 145th", "Immersive Media WG - 3rd"). Detect the group name and meeting number.
    2. A SUMMARY (under 200 chars).
    3. The DATE of the meeting in "YYYY-MM-DD" format. If not found, return null. 
    
    Return as JSON: { "title": "...", "summary": "...", "date": "..." }.
    
    Transcript start: ${transcript.substring(0, 3000)}`;

        // Note: 'response_format: { type: "json_object" }' is supported by gpt-4o and gpt-3.5-turbo-0125
        const metadataCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: metadataPrompt }],
            response_format: { type: "json_object" }
        });

        let metadata = { title: '', summary: '', date: '' };
        try {
            metadata = JSON.parse(metadataCompletion.choices[0]?.message?.content || '{}');
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
