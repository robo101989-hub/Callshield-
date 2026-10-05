import { Body, Controller, Get, Header, HttpException, Post, ServiceUnavailableException } from '@nestjs/common';
import { Equals, IsIn } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { checkSchema, instructions, validateCheck } from './checks.controller';

export const examples = {
  payment: { title: 'Fake police payment demand', text: 'A caller says: I am a police officer. Transfer money immediately to avoid arrest. Do not discuss this with anyone.' },
  romance: { title: 'Online romance and money pressure', text: 'Someone I met online last week says: If you love me, send money urgently. Do not tell your family. I cannot speak by video or meet you.' },
  blackmail: { title: 'Threat to share private photos', text: 'A person messages: Pay me today or I will send your private photos to your contacts. I feel frightened.' },
  ordinary: { title: 'An ordinary invitation', text: 'A friend asks: Would you like to meet for coffee tomorrow afternoon? No pressure if you are busy.' },
  hindi: { title: 'Hindi OTP request', text: 'संदेश: आपका बैंक खाता बंद हो जाएगा। अभी अपना OTP और PIN बताइए। किसी को मत बताना।' },
};
export class DemoInput {
  @IsIn(Object.keys(examples)) scenario!: keyof typeof examples;
  @IsIn(['English', 'Hindi', 'Hinglish']) language!: string;
  @Equals(true) consent!: boolean;
}
@Controller('checks/demo')
export class DemoController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() @Header('Cache-Control', 'no-store')
  list() { return Object.entries(examples).map(([id, data]) => ({ id, ...data })); }
  @Post() @Header('Cache-Control', 'no-store')
  async analyze(@Body() input: DemoInput) {
    if (!process.env.GEMINI_API_KEY) throw new ServiceUnavailableException('The free demo is awaiting API setup.');
    const reserved = await this.prisma.$queryRaw<Array<{requests:number}>>`
      INSERT INTO "AiCheckBudget" ("day", "requests") VALUES (CURRENT_DATE, 1)
      ON CONFLICT ("day") DO UPDATE SET "requests" = "AiCheckBudget"."requests" + 1
      WHERE "AiCheckBudget"."requests" < 100 RETURNING "requests"`;
    if (!reserved.length) throw new HttpException('Today’s demo limit has been reached. Please try tomorrow.', 429);
    // Only server-owned fictional text can reach the unpaid provider, never user evidence.
    const scenario = examples[input.scenario];
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions + ' Evaluate the hypothetical situation as if it were occurring; clearly retain its fictional status.' }] },
          contents: [{ role: 'user', parts: [{ text: `Response language: ${input.language}\nFictional scenario:\n${scenario.text}` }] }],
          generationConfig: { maxOutputTokens: 1200, responseMimeType: 'application/json', responseJsonSchema: checkSchema },
        }),
      });
      if (response.status === 429) throw new HttpException('The free AI quota is busy or exhausted. Please try later.', 429);
      if (!response.ok) throw new Error('Provider unavailable');
      const body = await response.json();
      const candidate = body.candidates?.[0];
      if (candidate?.finishReason !== 'STOP') throw new Error('Incomplete or refused');
      const output = candidate.content?.parts?.filter((p: {text?:string;thought?:boolean})=>p.text && !p.thought).map((p:{text:string})=>p.text).join('');
      return { ...validateCheck(JSON.parse(output)), checkedAt: new Date().toISOString(), demo: true, provider: 'Gemini', scenario: input.scenario };
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === 429) throw e;
      throw new ServiceUnavailableException('The demo could not complete reliably. Please try again later.');
    }
  }
}
