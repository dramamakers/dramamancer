export interface ParsedXmlLine {
  plan?: string;
  lineContent: string;
  shouldPause: boolean;
}

/**
 * Parses text containing PLAN:, LINE:, PAUSE:, and optionally END: sections
 */
export function parseXmlFormat(text: string): ParsedXmlLine {
  const sections = text.split(/\n(?=PLAN:|LINE:|PAUSE:|END:)/);
  const planContents: string[] = [];
  const lineContents: string[] = [];
  let pauseInfo = '';

  sections.forEach((section: string) => {
    const trimmedSection = section.trim();
    if (trimmedSection.startsWith('PLAN:')) {
      const planContent = trimmedSection.replace(/^PLAN:\s*/i, '').trim();
      if (planContent) {
        planContents.push(planContent);
      }
    } else if (trimmedSection.startsWith('LINE:')) {
      const lineContent = trimmedSection.replace(/^LINE:\s*/i, '').trim();
      if (lineContent) {
        lineContents.push(lineContent);
      }
    } else if (trimmedSection.startsWith('PAUSE:')) {
      pauseInfo = trimmedSection.replace(/^PAUSE:\s*/i, '').trim();
    }
  });

  // Combine all plans with "; " and all lines together
  const combinedPlan = planContents.length > 0 ? planContents.join('; ') : '';
  const combinedLineContent = lineContents.join(' ');

  // Fallback to old format if new format not found
  let finalLineContent = combinedLineContent;
  if (!finalLineContent) {
    const [oldLineContent, oldPauseInfo] = text.split('\nPAUSE: ');
    finalLineContent = oldLineContent.split(/LINE:\s*/i)[1]?.trim() || oldLineContent.trim();
    pauseInfo = oldPauseInfo?.trim() || '';
  }

  return {
    plan: combinedPlan || undefined,
    lineContent: finalLineContent,
    shouldPause: pauseInfo?.trim().toLowerCase() === 'true' || false,
  };
}
