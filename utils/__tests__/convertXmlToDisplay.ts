import { convertXmlLineToDisplayLine } from '../convert';

describe('convertXmlLineToDisplayLine', () => {
  it('should convert character and narration elements correctly', () => {
    const input = `Dust motes dance in the dim glow of the monitor.<ch name="Theo">(eyes the office warily) This place gives me the creeps. Why are we even here?</ch><ch name="Julian">(leans over the desk, smirking) Isn't it obvious? This computer must be some kind of backdoor into the school's network.</ch>The archaic machine hums quietly in the corner.`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      type: 'narration',
      text: 'Dust motes dance in the dim glow of the monitor.',
    });
    expect(result[1]).toEqual({
      type: 'character',
      text: '(eyes the office warily) This place gives me the creeps. Why are we even here?',
      characterName: 'Theo',
    });
    expect(result[2]).toEqual({
      type: 'character',
      text: "(leans over the desk, smirking) Isn't it obvious? This computer must be some kind of backdoor into the school's network.",
      characterName: 'Julian',
    });
    expect(result[3]).toEqual({
      type: 'narration',
      text: 'The archaic machine hums quietly in the corner.',
    });
  });

  it('should handle character lines with actions and dialogue', () => {
    const input = `<ch name="Alice">(nervously fidgets) I'm not sure we should indulge this request right now.</ch>`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'character',
      text: "(nervously fidgets) I'm not sure we should indulge this request right now.",
      characterName: 'Alice',
    });
  });

  it('should handle player lines', () => {
    const input = `<player>(looks at the painting) I wonder what this means.</player>`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'player',
      text: '(looks at the painting) I wonder what this means.',
    });
  });

  it('should handle multiple character lines', () => {
    const input = `<ch name="Alice">(stares at Bob) Is that true?</ch><ch name="Bob">(looks away) Yes, I'm afraid so.</ch>Silence fills the room.`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: 'character',
      text: '(stares at Bob) Is that true?',
      characterName: 'Alice',
    });
    expect(result[1]).toEqual({
      type: 'character',
      text: "(looks away) Yes, I'm afraid so.",
      characterName: 'Bob',
    });
    expect(result[2]).toEqual({
      type: 'narration',
      text: 'Silence fills the room.',
    });
  });

  it('should handle if the character is named Narrator', () => {
    const input = `<ch name="Narrator">(narrates) The story begins...</ch>`;
    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'narration',
      text: '(narrates) The story begins...',
    });
  });

  it('should handle empty or invalid input', () => {
    const result = convertXmlLineToDisplayLine({ text: '', role: 'user' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'narration',
      text: '',
      metadata: undefined,
    });
  });

  it('should handle plain text as narration', () => {
    const input = 'The protagonist looks around the room.';

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'narration',
      text: 'The protagonist looks around the room.',
    });
  });

  it('should handle mixed character, player, and narration lines', () => {
    const input = `The air hung thick with the scent of incense, its cloying sweetness clashing with the sterile white walls and harsh fluorescent lights. Enver shifted uncomfortably on the hard plastic chair, the faint hum of unseen machinery putting him further on edge. <ch name="Makima">(smiling warmly, but her eyes remain guarded) I'm glad you could come by today.</ch> Her voice cut through the tense atmosphere like a blade.`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: 'narration',
      text: 'The air hung thick with the scent of incense, its cloying sweetness clashing with the sterile white walls and harsh fluorescent lights. Enver shifted uncomfortably on the hard plastic chair, the faint hum of unseen machinery putting him further on edge.',
    });
    expect(result[1]).toEqual({
      type: 'character',
      text: "(smiling warmly, but her eyes remain guarded) I'm glad you could come by today.",
      characterName: 'Makima',
    });
    expect(result[2]).toEqual({
      type: 'narration',
      text: 'Her voice cut through the tense atmosphere like a blade.',
    });
  });

  it('should handle complex multi-character dialogue with interspersed narration', () => {
    const input = `<ch name="Enver">(glancing around warily) Who is here, exactly?</ch>

Makima's smile didn't waver, but her eyes glinted with something unreadable. <ch name="Makima">For now, just us. But we are part of something...greater.</ch> She traced a finger along the ridged metal surface of the sphere, her voice taking on a reverent tone. <ch name="Makima">This is a sacred place, one where the veil between our world and the next grows thin.</ch>`;

    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      type: 'character',
      text: '(glancing around warily) Who is here, exactly?',
      characterName: 'Enver',
    });
    expect(result[1]).toEqual({
      type: 'narration',
      text: "Makima's smile didn't waver, but her eyes glinted with something unreadable.",
    });
    expect(result[2]).toEqual({
      type: 'character',
      text: 'For now, just us. But we are part of something...greater.',
      characterName: 'Makima',
    });
    expect(result[3]).toEqual({
      type: 'narration',
      text: 'She traced a finger along the ridged metal surface of the sphere, her voice taking on a reverent tone.',
    });
    expect(result[4]).toEqual({
      type: 'character',
      text: 'This is a sacred place, one where the veil between our world and the next grows thin.',
      characterName: 'Makima',
    });
  });

  it('treats other tags as narration', () => {
    const input = `<description>According to all known laws of aviation, there's no way a bee should be able to fly.</description>`;
    const result = convertXmlLineToDisplayLine({ text: input, role: 'user' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'narration',
      text: "According to all known laws of aviation, there's no way a bee should be able to fly.",
    });
  });
});
