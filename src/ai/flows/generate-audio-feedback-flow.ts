'use server';
/**
 * @fileOverview This flow generates audio feedback from a text string.
 *
 * It exports the following:
 * - generateAudioFeedback: The main function to generate audio.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI }from '@genkit-ai/googleai';

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

const GenerateAudioFeedbackInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});

const GenerateAudioFeedbackOutputSchema = z.object({
  audio: z.string().describe('The Base64 encoded WAV audio data URI.'),
});

export type GenerateAudioFeedbackInput = z.infer<typeof GenerateAudioFeedbackInputSchema>;
export type GenerateAudioFeedbackOutput = z.infer<typeof GenerateAudioFeedbackOutputSchema>;


const generateAudioFeedbackFlow = ai.defineFlow(
  {
    name: 'generateAudioFeedbackFlow',
    inputSchema: GenerateAudioFeedbackInputSchema,
    outputSchema: GenerateAudioFeedbackOutputSchema,
  },
  async (input) => {
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


export async function generateAudioFeedback(
  input: GenerateAudioFeedbackInput
): Promise<GenerateAudioFeedbackOutput> {
  return generateAudioFeedbackFlow(input);
}
