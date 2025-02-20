
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    // Remove the "data:image/jpeg;base64," prefix if present
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Analyze this screenshot and provide detailed insights about what you see. Focus on the main content, UI elements, and any notable information displayed."
          }, {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    const analysis = data.candidates[0].content.parts[0].text;

    // Store the analysis in the messages table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { error: dbError } = await supabaseClient
      .from('messages')
      .insert({
        role: 'assistant',
        content: analysis,
        model_name: 'gemini-pro-vision',
        metadata: { type: 'screenshot_analysis' }
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-screenshot function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
