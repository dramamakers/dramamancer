export function safeJsonParse<T>(jsonString: string, fieldName?: string): T | null {
  try {
    if (!jsonString || jsonString.trim() === '') {
      throw new Error(`Empty or null JSON string${fieldName ? ` for field: ${fieldName}` : ''}`);
    }

    // Check for common issues that cause parsing errors
    const trimmed = jsonString.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      throw new Error(
        `Invalid JSON format - does not start with { or [${fieldName ? ` for field: ${fieldName}` : ''}`,
      );
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`JSON parsing error${fieldName ? ` for field ${fieldName}` : ''}:`, error);
    console.error('Raw JSON string:', JSON.stringify(jsonString));
    console.error('String length:', jsonString?.length);
    console.error('First 50 characters:', jsonString?.substring(0, 50));
    console.error('Characters around position 3:', jsonString?.substring(0, 10));
    throw new Error(
      `Failed to parse JSON${fieldName ? ` for field ${fieldName}` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
