import { XmlLine } from '@/app/types';
import { parseXmlFormat } from '../parse';
import { getNumLinesSinceLastPause } from '../prompt';

describe('parseXmlFormat', () => {
  it('should extract character and narration elements correctly', () => {
    const input = `PLAN: Establish a sense of mystery and unease through sensory details.

LINE: The air hung thick with the scent of incense, its cloying sweetness clashing with the sterile white walls and harsh fluorescent lights. Enver shifted uncomfortably on the hard plastic chair, the faint hum of unseen machinery putting him further on edge. <ch name="Makima">(smiling warmly, but her eyes remain guarded) I'm glad you could come by today.</ch> Her voice cut through the tense atmosphere like a blade.

PAUSE: true`;

    const result = parseXmlFormat(input);
    expect(result).toEqual({
      plan: 'Establish a sense of mystery and unease through sensory details.',
      lineContent: `The air hung thick with the scent of incense, its cloying sweetness clashing with the sterile white walls and harsh fluorescent lights. Enver shifted uncomfortably on the hard plastic chair, the faint hum of unseen machinery putting him further on edge. <ch name="Makima">(smiling warmly, but her eyes remain guarded) I'm glad you could come by today.</ch> Her voice cut through the tense atmosphere like a blade.`,
      shouldPause: true,
    });
  });

  it('should handle newlines in line content', () => {
    const input = `PLAN: Enver enters, unsure of his surroundings but curious. Makima greets him warmly but with an undercurrent of mystery.

LINE: The heavy doors creaked open once more, and a young man peered inside, his brow furrowed. <ch name="Enver">(hesitantly) Um, hello? I was told to come here...</ch> He trailed off, eyes widening as he took in the dimly lit hall and strange centerpiece. 

<ch name="Makima">(smiling warmly) Enver, welcome. I'm glad you could join us.</ch> Her voice seemed to echo strangely in the cavernous space.
PAUSE: true`;

    const result = parseXmlFormat(input);
    expect(result).toEqual({
      plan: 'Enver enters, unsure of his surroundings but curious. Makima greets him warmly but with an undercurrent of mystery.',
      lineContent: `The heavy doors creaked open once more, and a young man peered inside, his brow furrowed. <ch name="Enver">(hesitantly) Um, hello? I was told to come here...</ch> He trailed off, eyes widening as he took in the dimly lit hall and strange centerpiece. 

<ch name="Makima">(smiling warmly) Enver, welcome. I'm glad you could join us.</ch> Her voice seemed to echo strangely in the cavernous space.`,
      shouldPause: true,
    });
  });

  it('coalesces multiple responses at once', () => {
    const input = `PLAN: od wants to undermine al's leadership, al wants control, ca wants to avoid confrontation
LINE: <ch name="od">(glancing around furtively before leaning in close to ca) Al's got this crazy idea to storm city hall and "make our voices heard." I'm just trying to be the voice of reason, you know?</ch>
PAUSE: false

PLAN: al senses od's undermining and reasserts authority
LINE: <ch name="al">(interjecting loudly) We're not fighting, ca. We're just...discussing strategy.</ch> Al shot od a pointed look.
PAUSE: false  

PLAN: ca wants to defuse the tension
LINE: <ch name="ca">(forcing an awkward laugh) Heh, yeah, we musicians are all about creative differences, am I right? Hey, why don't I play something to, uh, lighten the mood?</ch> ca began rummaging through their guitar case, avoiding eye contact.
PAUSE: true`;

    const result = parseXmlFormat(input);
    expect(result).toEqual({
      plan: "od wants to undermine al's leadership, al wants control, ca wants to avoid confrontation; al senses od's undermining and reasserts authority; ca wants to defuse the tension",
      lineContent:
        '<ch name="od">(glancing around furtively before leaning in close to ca) Al\'s got this crazy idea to storm city hall and "make our voices heard." I\'m just trying to be the voice of reason, you know?</ch> <ch name="al">(interjecting loudly) We\'re not fighting, ca. We\'re just...discussing strategy.</ch> Al shot od a pointed look. <ch name="ca">(forcing an awkward laugh) Heh, yeah, we musicians are all about creative differences, am I right? Hey, why don\'t I play something to, uh, lighten the mood?</ch> ca began rummaging through their guitar case, avoiding eye contact.',
      shouldPause: true,
    });
  });
});

describe('getNumLinesSinceLastPause', () => {
  it('should return 0 when no lines exist', () => {
    const result = getNumLinesSinceLastPause([]);
    expect(result).toBe(0);
  });

  it('should return total lines when no pause line exists', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant' },
      { text: 'Line 2', role: 'assistant' },
      { text: 'Line 3', role: 'assistant' },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(3);
  });

  it('should return 0 when last line has pause', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant' },
      { text: 'Line 2', role: 'assistant' },
      { text: 'Line 3', role: 'assistant', metadata: { shouldPause: true } },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(0);
  });

  it('should return correct count when pause line is in middle', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant' },
      { text: 'Line 2', role: 'assistant', metadata: { shouldPause: true } },
      { text: 'Line 3', role: 'assistant' },
      { text: 'Line 4', role: 'assistant' },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(2);
  });

  it('should find the most recent pause line when multiple exist', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant', metadata: { shouldPause: true } },
      { text: 'Line 2', role: 'assistant' },
      { text: 'Line 3', role: 'assistant', metadata: { shouldPause: true } },
      { text: 'Line 4', role: 'assistant' },
      { text: 'Line 5', role: 'assistant' },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(2);
  });

  it('should handle lines with other metadata but no pause', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant', metadata: { shouldPause: true } },
      { text: 'Line 2', role: 'assistant', metadata: { shouldEnd: true } },
      { text: 'Line 3', role: 'assistant', metadata: { sceneId: '1' } },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(2);
  });

  it('should handle user lines mixed with assistant lines', () => {
    const lines: XmlLine[] = [
      { text: 'Line 1', role: 'assistant', metadata: { shouldPause: true } },
      { text: 'User action', role: 'user' },
      { text: 'Line 2', role: 'assistant' },
      { text: 'Line 3', role: 'assistant' },
    ];
    const result = getNumLinesSinceLastPause(lines);
    expect(result).toBe(3);
  });
});
