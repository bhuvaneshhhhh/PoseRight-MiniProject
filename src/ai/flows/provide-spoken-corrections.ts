'use server';
/**
 * @fileOverview This flow generates audio feedback from a text string.
 *
 * It exports the following:
 * - provideSpokenCorrections: The main function to generate audio.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Converts PCM audio data to a Base64 encoded WAV data URI.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const SpokenCorrectionsInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});

const SpokenCorrectionsOutputSchema = z.object({
  audio: z.string().describe('The Base64 encoded WAV audio data URI.'),
});

export type SpokenCorrectionsInput = z.infer<typeof SpokenCorrectionsInputSchema>;
export type SpokenCorrectionsOutput = z.infer<typeof SpokenCorrectionsOutputSchema>;

const provideSpokenCorrectionsFlow = ai.defineFlow(
  {
    name: 'provideSpokenCorrectionsFlow',
    inputSchema: SpokenCorrectionsInputSchema,
    outputSchema: SpokenCorrectionsOutputSchema,
  },
  async (input) => {
    if (!input.text) {
        return { audio: '' };
    }
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });

    if (!media) {
      throw new Error('No audio media was generated.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audio: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

export async function provideSpokenCorrections(
  input: SpokenCorrectionsInput
): Promise<SpokenCorrectionsOutput> {
  return provideSpokenCorrectionsFlow(input);
}
