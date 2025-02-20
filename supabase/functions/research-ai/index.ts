
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface Citation {
  text: string;
  url?: string;
  title?: string;
}

const generateWithGemini = async (prompt: string, config: ModelConfig) => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${prompt}\n\nPlease provide a comprehensive response with citations where applicable. Format citations as [CITATION]{title}|{url}|{text} if you reference external sources.`
        }]
      }],
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate response with Gemini');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const extractCitations = (text: string): Citation[] => {
  const citations: Citation[] = [];
  const citationRegex = /\[CITATION\]{([^}]*)}\|{([^}]*)}\|{([^}]*)}/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    citations.push({
      title: match[1],
      url: match[2],
      text: match[3]
    });
  }

  return citations;
};

const saveCitations = async (messageId: string, citations: Citation[]) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  for (const citation of citations) {
    await supabase
      .from('citations')
      .insert({
        message_id: messageId,
        source_title: citation.title,
        source_url: citation.url,
        citation_text: citation.text
      });
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, config, conversationId } = await req.json();

    let response;
    switch (config.provider.toLowerCase()) {
      case 'google':
        response = await generateWithGemini(prompt, config);
        break;
      case 'anthropic':
      case 'openai':
        throw new Error('Provider not implemented yet');
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Extract and store citations
    const citations = extractCitations(response);
    
    // Clean up the response by removing citation markers
    const cleanResponse = response.replace(/\[CITATION\]{([^}]*)}\|{([^}]*)}\|{([^}]*)}/g, '($1)');

    // Save the message
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: cleanResponse,
        model_name: config.model,
        metadata: { 
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          citation_count: citations.length
        }
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Save citations if any were found
    if (citations.length > 0 && message) {
      await saveCitations(message.id, citations);
    }

    return new Response(
      JSON.stringify({ 
        generatedText: cleanResponse,
        citations,
        messageId: message?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in research-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
