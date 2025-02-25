
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    // Basic sentiment analysis (placeholder for demo)
    const words = content.toLowerCase().split(/\s+/);
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'worst'];
    
    let sentimentScore = 0.5; // neutral default
    let matches = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        sentimentScore += 0.1;
        matches++;
      } else if (negativeWords.includes(word)) {
        sentimentScore -= 0.1;
        matches++;
      }
    });

    // Normalize sentiment score between 0 and 1
    sentimentScore = Math.max(0, Math.min(1, sentimentScore));

    // Calculate complexity based on various factors
    const complexity = Math.min(1, Math.max(0, 
      (words.length / 100) + // Length factor
      (new Set(words).size / words.length) + // Vocabulary diversity
      (content.split('.').length / 10) // Sentence structure
    ) / 3);

    // Extract key terms (simple implementation)
    const keyTerms = [...new Set(words)]
      .filter(word => word.length > 4)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        sentiment: sentimentScore,
        complexity: complexity,
        keyTerms: keyTerms
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in analyze-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
