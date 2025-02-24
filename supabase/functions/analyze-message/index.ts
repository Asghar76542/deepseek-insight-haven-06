
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
  sentiment: number;
  complexity: number;
  keyTerms: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json()

    if (!content) {
      throw new Error('No content provided')
    }

    // Basic sentiment analysis using word lists and patterns
    const sentimentAnalysis = analyzeSentiment(content)
    
    // Complexity analysis using multiple factors
    const complexityAnalysis = analyzeComplexity(content)
    
    // Extract key terms
    const keyTerms = extractKeyTerms(content)

    const result: AnalysisResult = {
      sentiment: sentimentAnalysis,
      complexity: complexityAnalysis,
      keyTerms: keyTerms,
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Sentiment analysis implementation
function analyzeSentiment(text: string): number {
  const positiveWords = new Set([
    'good', 'great', 'excellent', 'positive', 'amazing', 'wonderful', 'fantastic',
    'helpful', 'beneficial', 'success', 'improvement', 'resolved', 'solved'
  ])

  const negativeWords = new Set([
    'bad', 'poor', 'terrible', 'negative', 'horrible', 'awful', 'wrong',
    'issue', 'problem', 'error', 'fail', 'broken', 'complicated'
  ])

  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  let score = 0
  let totalWords = words.length

  words.forEach(word => {
    if (positiveWords.has(word)) score += 1
    if (negativeWords.has(word)) score -= 1
  })

  // Normalize to range 0-1
  return (score / totalWords + 1) / 2
}

// Complexity analysis implementation
function analyzeComplexity(text: string): number {
  // Word length complexity
  const words = text.match(/\b\w+\b/g) || []
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length

  // Sentence length complexity
  const sentences = text.split(/[.!?]+/).filter(Boolean)
  const avgSentenceLength = words.length / sentences.length

  // Technical term complexity
  const technicalTerms = new Set([
    'algorithm', 'implementation', 'function', 'database', 'api',
    'interface', 'component', 'architecture', 'framework', 'protocol'
  ])
  const technicalTermCount = words.filter(word => technicalTerms.has(word.toLowerCase())).length

  // Code block complexity
  const codeBlockCount = (text.match(/```[\s\S]*?```/g) || []).length

  // Calculate final complexity score (0-1)
  const weightedScore = (
    (avgWordLength / 12) * 0.3 +
    (avgSentenceLength / 30) * 0.3 +
    (technicalTermCount / words.length) * 0.2 +
    (codeBlockCount > 0 ? 0.2 : 0)
  )

  return Math.min(Math.max(weightedScore, 0), 1)
}

// Key terms extraction
function extractKeyTerms(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const wordFreq = new Map<string, number>()
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have'])

  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  })

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}
