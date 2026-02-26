export type InitialSuggestion = {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
};

// Number of suggestions to show at a time
export const SUGGESTIONS_PER_BATCH = 5;

// Initial suggestions for quickstart - users can click to auto-fill input and image
export const INITIAL_SUGGESTIONS: InitialSuggestion[] = [
  {
    id: 'fantasy-tavern',
    title: 'Fantasy Tavern',
    text: 'A fantasy RPG where the player is a traveler who stumbles into a mysterious tavern filled with quirky characters',
    imageUrl: '',
  },
  {
    id: 'space-station',
    title: 'Space Mystery',
    text: 'A sci-fi mystery aboard a space station where the player must uncover who sabotaged the life support systems',
    imageUrl: '',
  },
  {
    id: 'school-romance',
    title: 'School Romance',
    text: 'A slice-of-life visual novel set in a high school where the player navigates friendships and romance',
    imageUrl: '',
  },
  {
    id: 'haunted-mansion',
    title: 'Haunted Mansion',
    text: 'A horror game where the player explores a haunted mansion and must survive until dawn',
    imageUrl: '',
  },
  {
    id: 'pirate-adventure',
    title: 'Pirate Adventure',
    text: 'A swashbuckling adventure where the player captains a pirate ship searching for legendary treasure',
    imageUrl: '',
  },
  {
    id: 'cyberpunk-heist',
    title: 'Cyberpunk Heist',
    text: 'A neon-lit cyberpunk thriller where the player leads a crew to pull off an impossible corporate heist',
    imageUrl: '',
  },
  {
    id: 'medieval-kingdom',
    title: 'Medieval Kingdom',
    text: 'A political drama set in a medieval kingdom where the player navigates court intrigue and alliances',
    imageUrl: '',
  },
  {
    id: 'detective-noir',
    title: 'Detective Noir',
    text: 'A noir detective story where the player solves a mysterious murder in a rain-soaked 1940s city',
    imageUrl: '',
  },
  {
    id: 'magical-academy',
    title: 'Magical Academy',
    text: 'A coming-of-age story at a school for young wizards where the player uncovers ancient secrets',
    imageUrl: '',
  },
  {
    id: 'post-apocalyptic',
    title: 'Post-Apocalyptic',
    text: 'A survival story in a post-apocalyptic wasteland where the player builds a community of survivors',
    imageUrl: '',
  },
  {
    id: 'vampire-romance',
    title: 'Vampire Romance',
    text: 'A gothic romance where the player becomes entangled with a mysterious vampire aristocrat',
    imageUrl: '',
  },
  {
    id: 'time-travel',
    title: 'Time Travel',
    text: 'A mind-bending adventure where the player travels through different eras to prevent a catastrophe',
    imageUrl: '',
  },
  {
    id: 'underwater-city',
    title: 'Underwater City',
    text: 'An exploration game set in a decaying underwater utopia filled with secrets and strange creatures',
    imageUrl: '',
  },
  {
    id: 'wild-west',
    title: 'Wild West',
    text: 'A Western adventure where the player is an outlaw seeking redemption in a lawless frontier town',
    imageUrl: '',
  },
  {
    id: 'fairy-tale',
    title: 'Fairy Tale',
    text: 'A whimsical journey through a fairy tale world where classic stories have gone terribly wrong',
    imageUrl: '',
  },
  {
    id: 'superhero-origin',
    title: 'Superhero Origin',
    text: 'An origin story where the player discovers their powers and must choose between heroism and villainy',
    imageUrl: '',
  },
  {
    id: 'ancient-egypt',
    title: 'Ancient Egypt',
    text: 'A mystical adventure in ancient Egypt where the player serves as advisor to a young pharaoh',
    imageUrl: '',
  },
  {
    id: 'samurai-honor',
    title: 'Samurai Honor',
    text: 'A tale of honor and betrayal in feudal Japan where the player is a ronin seeking justice',
    imageUrl: '',
  },
  {
    id: 'alien-first-contact',
    title: 'Alien Contact',
    text: "A first contact scenario where the player is humanity's ambassador to a newly discovered alien race",
    imageUrl: '',
  },
  {
    id: 'cozy-cafe',
    title: 'Cozy Café',
    text: 'A heartwarming story where the player runs a small café and helps customers with their problems',
    imageUrl: '',
  },
  {
    id: 'arctic-expedition',
    title: 'Arctic Expedition',
    text: 'A survival thriller where the player leads a doomed expedition into the frozen Arctic wilderness',
    imageUrl: '',
  },
  {
    id: 'greek-mythology',
    title: 'Greek Mythology',
    text: 'An epic adventure through ancient Greece where the player is a demigod on a divine quest',
    imageUrl: '',
  },
  {
    id: 'steampunk-inventor',
    title: 'Steampunk Inventor',
    text: 'A Victorian steampunk story where the player is an inventor whose creation threatens the empire',
    imageUrl: '',
  },
  {
    id: 'monster-hunter',
    title: 'Monster Hunter',
    text: 'A dark fantasy where the player is a professional monster hunter tracking a legendary beast',
    imageUrl: '',
  },
  {
    id: 'dream-world',
    title: 'Dream World',
    text: 'A surreal adventure through the dream realm where the player must wake up before getting lost forever',
    imageUrl: '',
  },
];
