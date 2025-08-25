/**
 * Wrapper for generateObject that works with Claude Code
 */

import { generateText, type LanguageModel } from 'ai';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';

interface GenerateObjectOptions<T> {
  model: LanguageModel;
  schema: z.ZodSchema<T>;
  system?: string;
  prompt: string;
  maxRetries?: number;
}

/**
 * Extract JSON from various text formats Claude might return
 */
function extractJSON(text: string): any {
  // First, try direct parsing (in case it's already clean JSON)
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue to extraction attempts
  }

  // Try to extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json|typescript|javascript)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      // Remove variable declarations if present
      const jsonText = codeBlockMatch[1]
        .replace(/^(?:const|let|var)\s+\w+\s*=\s*/, '')
        .trim();
      return JSON.parse(jsonrepair(jsonText));
    } catch (e) {
      // Continue to next attempt
    }
  }

  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const repaired = jsonrepair(jsonMatch[0]);
      const parsed = JSON.parse(repaired);
      
      // If jsonrepair returns an array but we found an object, extract it
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            return item;
          }
        }
      }
      return parsed;
    } catch (e) {
      // Continue
    }
  }

  // Last resort: try jsonrepair on the whole text
  try {
    const repaired = jsonrepair(text);
    const parsed = JSON.parse(repaired);
    
    // If it's an array, try to find the first object
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return item;
        }
      }
    }
    return parsed;
  } catch (e) {
    throw new Error(`Could not extract valid JSON from response: ${text.substring(0, 100)}...`);
  }
}

/**
 * Generate a structured object using Claude Code with automatic JSON repair
 */
export async function generateObjectClaude<T>(options: GenerateObjectOptions<T>): Promise<{ object: T }> {
  const {
    model,
    schema,
    system,
    prompt,
    maxRetries = 2
  } = options;

  // Enhanced system prompt for better JSON output
  const enhancedSystem = system 
    ? `${system}\nIMPORTANT: Respond with valid JSON only, no markdown formatting, no explanations.`
    : 'You are a JSON generator. Respond ONLY with valid JSON matching the requested structure. No markdown, no explanations, no code blocks.';

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use generateText to get the raw response
      const result = await generateText({
        model,
        system: enhancedSystem,
        prompt: attempt > 0 
          ? `${prompt}\n\nIMPORTANT: Output ONLY the JSON object, nothing else.`
          : prompt,
      });

      // Extract and parse JSON
      const extractedJSON = extractJSON(result.text);
      
      // Debug log on retry
      if (attempt > 0) {
        console.log('Extracted JSON:', JSON.stringify(extractedJSON, null, 2));
      }
      
      // Validate against schema
      const parsed = schema.parse(extractedJSON);
      
      return { object: parsed };
    } catch (error: any) {
      lastError = error;
      
      // If it's a schema validation error and we have more retries, continue
      if (error.name === 'ZodError' && attempt < maxRetries - 1) {
        console.log(`Attempt ${attempt + 1} failed schema validation, retrying...`);
        continue;
      }
      
      // If JSON extraction failed and we have more retries, continue
      if (error.message.includes('Could not extract') && attempt < maxRetries - 1) {
        console.log(`Attempt ${attempt + 1} failed to extract JSON, retrying...`);
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to generate object');
}

// Export a convenience function to create the wrapper
export function createClaudeObjectGenerator(model: LanguageModel) {
  return <T>(options: Omit<GenerateObjectOptions<T>, 'model'>) => 
    generateObjectClaude({ ...options, model });
}