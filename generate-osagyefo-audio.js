/**
 * generate-osagyefo-audio.js
 *
 * Generate Amazon Polly MP3 audio for all 15 hardcoded "From Osagyefo" letters.
 * Uses the Matthew (Neural) voice — distinguished American male, distinct from
 * Brian (British) used for the open letters page.
 *
 * Uploads to: s3://dearosagyefo.com/audio/osagyefo-letter-{idx}.mp3
 * Output: prints the audioUrls array to paste into from-osagyefo.html
 *
 * Usage:
 *   node generate-osagyefo-audio.js
 */

require('dotenv').config();

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const AWS_REGION  = process.env.AWS_REGION  || 'us-east-1';
const S3_BUCKET   = process.env.S3_BUCKET   || 'dearosagyefo.com';
const POLLY_VOICE = 'Matthew'; // Neural American male — Nkrumah's oratorical style
const CHUNK_SIZE  = 2800;

const polly = new PollyClient({ region: AWS_REGION });
const s3    = new S3Client({ region: AWS_REGION });

// ── Letter text extracted from from-osagyefo.html lettersData ────────────────
const lettersData = [
  {
    title: 'On the Prison Years: What Confinement Taught Me',
    salutation: 'To those who know suffering,',
    body: 'I was imprisoned by the colonial government. They thought the walls of James Fort would break me. They were wrong. Prison, I discovered, is a university — the finest I ever attended. It strips away every illusion and teaches you what you truly believe in. In my cell I read everything I could find. I studied. I planned. I wrote. And I made a promise to myself: that when I emerged, I would give every fibre of my being to the cause of freedom. Not freedom for Kwame Nkrumah — that is a small thing — but freedom for all of Africa. They released me because the people demanded it. Not because the colonial masters had a change of heart, but because the voice of the people could no longer be ignored. That is the power of a united people. No prison, no army, no empire can stand against a people who have decided to be free. If you are young and reading these words, know this: the obstacles before you are real, but they are not permanent. The British Empire seemed permanent. It was not. Apartheid seemed permanent. It was not. The conditions that oppress you today — poverty, corruption, injustice — they too shall pass. But only if you resolve to make them pass.'
  },
  {
    title: 'At Long Last, the Battle Has Ended',
    salutation: 'People of Ghana,',
    body: 'At long last, the battle has ended! And thus, Ghana, your beloved country, is free forever! And yet again, I say that the independence of Ghana is meaningless unless it is linked up with the total liberation of the African continent. We must change our attitudes, our minds. We must realise that from now on we are no longer a colonial but a free and independent people. But also, as I pointed out, that entails hard work. It is not going to be easy. From now on, today, we must change our attitudes, our minds. We must realise that from now on we are no longer a colonial but free and independent people. Let us now, fellow Ghanaians, let us now ask for God\'s blessing and in the words of our ancestors I say, and I throw down on you the challenge: that we are going to see that we create our own African personality and identity. We again, rededicate ourselves to the struggle to emancipate other countries in Africa; for our independence is meaningless unless it is linked up with the total liberation of Africa.'
  },
  {
    title: 'I Speak of Freedom: A Statement of African Ideology',
    salutation: 'To all who believe in the African cause,',
    body: 'For centuries, Europeans dominated the African continent. The white man arrogated to himself the right to rule and to be obeyed by the non-white; his mission, he claimed, was to civilise Africa. Under this cloak, the Europeans robbed the continent of vast riches and inflicted unimaginable suffering on the African people. All this makes a sad story, but now we must be prepared to bury the past and build the future. For it is only when the past has been faced and dealt with that we can look ahead without bitterness, and plan the tomorrow of our dreams. Countrymen, the task ahead is great indeed, and heavy is the responsibility; and yet it is a noble and glorious challenge — a challenge which calls for the marshalling of all our resources of brain and brawn. I believe strongly and sincerely that with the deep-rooted wisdom and dignity, the innate respect for human lives, the intense humanity that is our heritage, the African race, united under one federal government, will emerge not as just another world bloc to flaunt its wealth and strength, but as a Great Power whose greatness is indestructible because it is built not on fear, envy, and suspicion, but on hope, trust, friendship and directed to the good of all mankind.'
  },
  {
    title: 'Africa Must Unite or Perish',
    salutation: 'Your Excellencies, Heads of African States,',
    body: 'We need the strength of our combined numbers and resources to protect ourselves from the very positive dangers of returning colonialism in disguised forms. We need it to combat the entrenched forces dividing our continent and still holding back millions of our brothers. We have already reached the stage where we must unite or sink into that condition which has made Latin America the unwilling and exploited appendage of the United States of America. The forces that unite us are intrinsic and greater than the superimposed influences that keep us apart. Here is a challenge which destiny has thrown out to the leaders of Africa. It is for us to grasp what is a golden opportunity to prove that the genius of African people can surmount the separatist tendencies in sovereign nationhood by coming together speedily on the much broader entity of a Union of African States. We must unite now or perish. The signs are already here for those with eyes to see. We must act now. Tomorrow may be too late and the opportunity will have passed, and with it the hope of free Africa\'s millions.'
  },
  {
    title: 'The African Personality: On Building a Philosophy of Our Own',
    salutation: 'Fellow Africans,',
    body: 'We face neither combatively, but not shamefully. Practice without thought is blind; thought without practice is empty. Our philosophy must find its weapons in the environment and living conditions of the African people. The philosophy that must stand behind the social revolution is that which I have called Consciencism. It is the map in intellectual terms of the disposition of forces which will enable African society to digest the Western and the Islamic and the Euro-Christian elements in Africa, and develop them in such a way that they fit into the African personality. We do not need to go to Europe to find our identity. We do not need to reject modernity to be African. What we need is a synthesis — a way of being that honours the communal traditions of our ancestors while embracing the tools and discoveries of the modern age. This is not contradiction. This is intelligence. The African personality is not a museum piece. It is a living, evolving force. It dances. It thinks. It builds. It dreams. And it refuses — absolutely refuses — to be defined by those who once claimed we had no history, no civilisation, no future. We have all three. And the world is about to find out.'
  },
  {
    title: 'The Invisible Chains: On Neo-Colonialism',
    salutation: 'To the peoples of the developing world,',
    body: 'The essence of neo-colonialism is that the State which is subject to it is, in theory, independent and has all the outward trappings of international sovereignty. In reality its economic system and thus its political policy is directed from outside. The methods of neo-colonialists are subtle and varied. They operate not only in the economic field, but also in the political, religious, ideological and cultural spheres. Faced with the militant peoples of the ex-colonial territories, imperialism simply switches tactics. Without a qualm it dispenses with its flags, and even with certain of its more hated set of puppets. In place of colonialism, as the main instrument of imperialism, we have today neo-colonialism. The result of neo-colonialism is that foreign capital is used for the exploitation rather than for the development of the less developed parts of the world. Investment, under neo-colonialism, increases rather than decreases the gap between the rich and the poor countries of the world. The struggle against neo-colonialism is not aimed at excluding the capital of the developed world from operating in less developed countries. It is aimed at preventing the financial power of the developed countries being used in such a way as to impoverish the less developed.'
  },
  {
    title: 'To the People of Ghana: I Have Not Abandoned You',
    salutation: 'People of Ghana,',
    body: 'The military and police have seized power in Ghana while I was on a mission of peace to Hanoi. I want you to know that I am well, that I am safe, and that I have not abandoned you. The struggle continues. This coup was not carried out in the interest of the people. It was carried out in the interest of neocolonialism. The forces that engineered this betrayal are the same forces that have always opposed African unity and independence. They feared what we were building — a united Africa, free from foreign domination. I call upon all true patriots, all those who believe in the cause of African freedom, to remain steadfast. The setback is temporary. The cause of African unity is imperishable. No coup can destroy an idea whose time has come. I shall return. Of this I am certain. And when I do, it will not be to seek vengeance, but to continue the work we began together on the 6th of March, 1957.'
  },
  {
    title: 'An Appeal to the Organisation of African Unity',
    salutation: 'Your Excellencies,',
    body: 'I write to you not as the deposed President of Ghana, but as a fellow African who has devoted his life to the cause we all profess to share: the total liberation and unification of our continent. The coup in Ghana was not merely an attack on my government. It was an attack on the very principle of African sovereignty. If a foreign power can engineer the removal of one African head of state, no African head of state is safe. Today it is Ghana. Tomorrow it may be your country. I urge the OAU to take a firm stand against this illegal seizure of power. Not for my sake — my personal fate is of little consequence — but for the sake of the principle we established in Addis Ababa in 1963: that the sovereignty and territorial integrity of every African state is sacred. If we allow coups to go unchallenged, if we recognise governments installed by foreign intelligence services, then we have surrendered the very independence we fought so hard to win. I implore you: do not let this precedent stand.'
  },
  {
    title: 'On the Soldiers Who Betrayed: A Word to the Ghana Armed Forces',
    salutation: 'Officers and men of the Ghana Armed Forces,',
    body: 'You were trained to defend Ghana. Instead, you were used to destroy it. Not by an enemy from across the sea, but by the very powers whose interests you were told to protect. You became instruments of a foreign policy that was never your own. I do not blame every soldier. I know that many of you were deceived. You were told that I had stolen from the nation, that I had become a dictator, that your action was patriotic. But ask yourselves: who benefited? Was it the market woman in Makola? The farmer in Tamale? The fisherman in Elmina? Or was it the mining companies, the foreign banks, the intelligence services who had long plotted this day? A soldier who overthrows his own government does not become a statesman. He becomes a precedent. And that precedent will haunt Ghana for decades. Every ambitious colonel will look at what you did and think: why not me? Why not now? I forgive you. But history will require more than forgiveness. It will require understanding — of how easily a nation can be turned against itself, and how long it takes to recover.'
  },
  {
    title: 'On the Coup: An Anatomy of Neocolonialism',
    salutation: 'To the reader,',
    body: 'The events of February 1966 did not occur in a vacuum. They were the culmination of a carefully orchestrated campaign by imperialist powers who could not tolerate an independent Africa charting its own course. I documented these events not out of bitterness, but so that future generations may understand the machinery of neocolonialism. The CIA and its allies had long regarded Ghana as a threat — not because we possessed weapons of mass destruction, but because we possessed an idea: that Africa could and should govern itself. That the resources of Africa should serve the people of Africa. That unity was not merely a slogan but a necessity. They infiltrated our institutions, turned officers against their own people, and when the moment came, they struck. But let me be clear: coups do not defeat ideas. They merely delay their realisation. I write these words from exile, but exile has not exiled my convictions. Every day I wake in Conakry, I am reminded that the struggle for African liberation is larger than any one man, any one government, any one setback.'
  },
  {
    title: 'A Message to the Youth of Africa',
    salutation: 'Young men and women of Africa,',
    body: 'The future of Africa belongs to you. Not to the generals who seize power in the night. Not to the foreign interests who finance coups and install puppet governments. Not to those who have traded the dream of independence for the comfort of servitude. The future belongs to you. I have seen the face of imperialism. It wears many masks — aid with conditions, loans with chains, trade agreements that benefit one side. But you, the youth, you have something that cannot be bought: the fire of conviction. The knowledge that Africa deserves better. Educate yourselves. Not merely in the universities of the West, but in the history of your own continent. Know who you are, where you come from, and what was taken from you. Then you will understand what must be rebuilt. I may not live to see the Africa I dreamed of. But you will build it. Of this, I have no doubt.'
  },
  {
    title: 'To the Freedom Fighters of Southern Africa',
    salutation: 'Comrades in the struggle,',
    body: 'While I write from exile, you fight in the bush. While I theorise about liberation, you live it — in Mozambique, in Angola, in Zimbabwe, in Namibia, in South Africa. You are the proof that the African revolution did not die with my government. It merely changed address. The armed struggle for liberation is not terrorism. It is the inevitable response of a people who have exhausted every peaceful means of redress. When the settler takes your land, when the colonial power denies you the vote, when the apartheid regime classifies you as less than human — what option remains but to fight? I urge you: fight not only with weapons but with ideas. The revolution must be political, economic, social, and cultural. It is not enough to remove the colonial flag. You must remove the colonial mind. You must build new institutions, new economies, new ways of thinking that serve the people — all the people. Africa watches you. Africa is with you. And when victory comes — as it surely will — remember that independence is only the beginning. The harder work comes after.'
  },
  {
    title: 'On African Unity: The Only Way Forward',
    salutation: 'To all who seek African liberation,',
    body: 'I have said it before and I shall say it again: Africa must unite. This is not a slogan. It is a matter of life and death. A divided Africa will forever be at the mercy of those who wish to exploit it. Only a united Africa — politically, economically, militarily — can stand as an equal among the powers of the world. Some said I was moving too fast. That Africa was not ready. But ready for what? Ready to be free? A people are always ready to be free. It is only their oppressors who insist they need more time. From this room in Conakry, I can see clearly what perhaps I could not see from the corridors of power in Accra: that the struggle is not between capitalism and socialism, or between East and West. The struggle is between Africa and those who would keep Africa on its knees. Unite. There is no other way.'
  },
  {
    title: 'The Last Testament: What I Would Have Ghana Know',
    salutation: 'Ghana,',
    body: 'I am growing old in this borrowed country, and my health is not what it was. But the fire that was lit on the 6th of March, 1957, burns still. It burns in me, and I know it burns in you. I made mistakes. Any man who leads a nation through its birth and its first faltering steps will make mistakes. But my greatest error, if it was an error, was believing too fiercely in what Africa could become. I believed we could industrialise in a generation. I believed we could unite a continent that colonialism had carved into pieces. I believed in you. They took the government. They could not take the idea. And the idea is simple: that Africa, with all its resources, all its people, all its ancient wisdom, deserves to stand tall. Not as a beggar at the table of nations, but as a host. If I do not return — and the years grow uncertain — remember what we began. Do not let them tell you it was nothing. Do not let them rewrite the story. We dared to dream the biggest dream a continent has ever dreamed. And we were right to dream it. Forward ever. Backward never.'
  },
  {
    title: 'To Dr. Busia: Now You Understand',
    salutation: 'Dr. Busia,',
    body: 'So the army has removed you too. On the 13th of January, 1972, while you sat in a London clinic, the soldiers came — just as they came for me six years ago. Colonel Acheampong now sits where you sat, which is where I sat before you. The chair, it seems, belongs to whoever has the guns. You were among those who welcomed my overthrow. You called it liberation. You returned from exile in the Netherlands to accept what the coup-makers offered. You became Prime Minister under the very constitution that was written to bury everything I built. And now? Now the same military tradition has consumed you. I do not write to gloat. I write because perhaps now, from your own exile, you can see what I have seen from mine: that coups are not corrections — they are a disease. Once a nation learns that power can be seized by force, the lesson is never forgotten. Every general watches and waits for his turn. I warned that neocolonialism would devour us from within. You dismissed it as rhetoric. But here we are — two deposed leaders of the same small country, both learning the same bitter lesson at different ends of the same decade. The forces that removed me did not stop with me. They will not stop with you. Africa must find another way.'
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > CHUNK_SIZE) {
    let idx = remaining.lastIndexOf('. ', CHUNK_SIZE);
    if (idx < 100) idx = remaining.lastIndexOf(' ', CHUNK_SIZE);
    if (idx < 0)   idx = CHUNK_SIZE;
    chunks.push(remaining.slice(0, idx + 1).trim());
    remaining = remaining.slice(idx + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function callPolly(text) {
  const res = await polly.send(new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: POLLY_VOICE,
    Engine: 'neural',
    TextType: 'text',
  }));
  const buffers = [];
  for await (const chunk of res.AudioStream) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(buffers);
}

async function generateAndUpload(idx, letter) {
  const fullText = letter.title + '. ' + letter.salutation + ' ' + letter.body;
  const chunks = chunkText(fullText);
  const buffers = await Promise.all(chunks.map(callPolly));
  const mp3 = Buffer.concat(buffers);

  const s3Key = `audio/osagyefo-letter-${idx}.mp3`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: mp3,
    ContentType: 'audio/mpeg',
  }));
  return `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nGenerating Polly audio for ${lettersData.length} Osagyefo letters — voice: ${POLLY_VOICE} (Neural)\n`);
  const urls = [];
  let ok = 0, failed = 0;

  for (let i = 0; i < lettersData.length; i++) {
    const letter = lettersData[i];
    process.stdout.write(`  [${i}] ${letter.title.slice(0, 55)} ... `);
    try {
      const url = await generateAndUpload(i, letter);
      urls.push(url);
      console.log('✓');
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      urls.push('');
      failed++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${ok} succeeded, ${failed} failed.\n`);
  console.log('// Paste this into from-osagyefo.html:\nconst OSAG_AUDIO_URLS = ' + JSON.stringify(urls, null, 2) + ';\n');
}

main().catch(err => { console.error(err); process.exit(1); });
