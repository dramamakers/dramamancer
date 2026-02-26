import { validateCartridge } from '@/utils/validate';
import { callAnthropicAPI } from '../../utils';
import { applyInstructions } from './processor';
import { getSystemPrompt, getUserPrompt } from './prompt';
import { QuickstartInput, QuickstartOutput } from './route';

// Process request
async function processRequest(input: QuickstartInput): Promise<QuickstartOutput> {
  console.log('🎭 Processing edit request...');

  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(input);

  // Remove actions field that the LLM API doesn't expect
  const cleanedConversation = input.conversation.map(
    ({ actions: _actions, ...message }) => message,
  );
  const response = await callAnthropicAPI(
    systemPrompt,
    [
      ...cleanedConversation,
      {
        role: 'user',
        content: [{ type: 'text', text: userPrompt }],
      },
    ],
    {
      temperature: 0.8,
      maxTokens: 8000,
    },
  );

  try {
    // Clean up common JSON issues from LLM responses
    let cleanedResponse = response.trim();

    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const result = JSON.parse(cleanedResponse) as QuickstartOutput;

    if (result.type === 'text') {
      if (!result.message) {
        throw new Error('text response missing message');
      }

      console.log('❓ Edit API returned text:', result.message);
      return result;
    }

    // Handle edit responses with instructions
    if (result.type === 'edit') {
      // Validate the response has required fields for edits
      if (!result.editSummary) {
        throw new Error('Invalid edit response format from LLM');
      }

      if (!result.instructions || !Array.isArray(result.instructions)) {
        throw new Error('Edit response must include instructions array');
      }

      console.log(`🎭 Processing ${result.instructions.length} instruction(s)`);

      try {
        // Apply instructions to the current cartridge
        const updatedCartridge = applyInstructions(input.currentCartridge, result.instructions);

        // Validate the updated cartridge
        const validationError = validateCartridge(updatedCartridge);
        if (validationError) {
          console.error('❌ Cartridge validation failed:', validationError);
          return {
            type: 'text',
            message: `I couldn't apply those changes because: ${validationError}. Could you try rephrasing your request?`,
          };
        }

        console.log(`✅ Instruction-based edit completed:`, result.editSummary);

        // Return the result with the updated cartridge
        return {
          type: 'edit',
          instructions: result.instructions,
          editSummary: result.editSummary,
          message: result.message,
          suggestions: result.suggestions,
        };
      } catch (error) {
        console.error('❌ Failed to apply instructions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          type: 'text',
          message: `I couldn't apply those changes: ${errorMessage}. Could you try a different approach?`,
        };
      }
    }

    throw new Error('Invalid response type from LLM');
  } catch (error) {
    console.error('❌ Failed to parse edit response:', error);
    console.error('Raw response (first 800 chars):', response.substring(0, 800));
    console.error(
      'Raw response (last 200 chars):',
      response.substring(Math.max(0, response.length - 200)),
    );

    // Try to give a more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isJSONError = errorMessage.includes('JSON') || errorMessage.includes('parse');

    // Return a text with retry option instead of throwing
    return {
      type: 'text',
      message: isJSONError
        ? `I had trouble formatting my response properly. This is usually a temporary issue. Would you like me to try again?`
        : `I generated a response that was too long or got cut off. This sometimes happens with complex changes. Would you like me to try again?`,
      suggestions: ['Yes, try again', 'Make a simpler change', 'Try a different approach'],
    };
  }
}

// Main entry point: Process all requests uniformly
export async function interpretAndEdit(input: QuickstartInput): Promise<QuickstartOutput> {
  console.log('🎭 Interpreting edit request:', input.userInput);
  return processRequest(input);
}
