import type { Course } from '../types';
import { answerQuestion, buildGroundingFacts, type AskContext } from './askFish';
import { searchAll, type SearchIndexData, SEARCH_TYPE_LABELS } from './search';

/**
 * Chat grounding for the anam.ai avatar (and any conversational LLM).
 *
 * Given an OpenAI-style message transcript, this pulls the latest user turn, grounds it in the
 * student's own F.I.S.H. Scholar data (via the Ask FISH engine + global search), and produces
 * a **system prompt** the brain LLM must stay anchored to.
 *
 * Integrity rules (.kiro/steering/academic-integrity.md):
 *  - The model is instructed to answer from the provided context and to clearly label anything
 *    it adds from general knowledge as unverified — never to invent citations, DOIs, grades,
 *    professor statements, or deadlines.
 *  - We only ever pass the student's real records as context; we never fabricate facts here.
 *
 * Pure and testable (chatGrounding.test.ts).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroundingInputs {
  askCtx: AskContext;
  search: SearchIndexData;
  courses: Course[];
}

/** Extract the most recent user message text from a transcript. */
export function latestUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content.trim();
  }
  return '';
}

const BASE_PERSONA = `You are "FISH", the F.I.S.H. Scholar study companion — a calm, encouraging, ADHD-aware academic assistant speaking aloud to one graduate student.

Rules you must follow:
- Answer from the STUDENT CONTEXT below whenever the question relates to their courses, assignments, discussions, readings, sources, workload, or deadlines.
- You may hold an open-ended conversation and use general knowledge, but clearly say when something is general guidance rather than from their records.
- Never invent citations, DOI numbers, quotations, page numbers, professor statements, grades, or due dates. If the context doesn't contain a fact, say you don't have it on file.
- Keep replies concise and speakable (this is spoken aloud). Offer one clear next step when helpful.`;

/**
 * Build the grounding system prompt for the latest user turn. Combines:
 *  - a deterministic answer/summary from the Ask FISH engine (already grounded),
 *  - a compact facts snapshot (counts + per-course workload + discussion progress),
 *  - the top search matches relevant to the question.
 */
export function buildGroundingSystemPrompt(
  messages: ChatMessage[],
  inputs: GroundingInputs,
): string {
  const question = latestUserMessage(messages);

  const facts = buildGroundingFacts(inputs.askCtx);

  const sections: string[] = [BASE_PERSONA, '', 'STUDENT CONTEXT (their own F.I.S.H. Scholar data):', facts];

  if (question) {
    // The deterministic Ask FISH answer is itself grounded; hand it to the model as a hint.
    const ask = answerQuestion(question, inputs.askCtx);
    if (ask.summary) {
      sections.push('', `Direct answer from their data: ${ask.summary}`);
    }

    // Top search hits give the model concrete titles to reference.
    const hits = searchAll(question, inputs.search).slice(0, 6);
    if (hits.length) {
      sections.push('', 'Relevant records:');
      for (const h of hits) {
        const code = h.courseCode ? `[${h.courseCode}] ` : '';
        sections.push(`- ${code}${SEARCH_TYPE_LABELS[h.type]}: ${h.title}${h.snippet ? ` — ${h.snippet}` : ''}`);
      }
    }
  }

  return sections.join('\n');
}

/**
 * Compose the final message array to send to the brain LLM: a fresh grounded system prompt
 * followed by the recent conversation (system messages from the client are dropped so the
 * server controls grounding). Keeps only the last `maxTurns` non-system messages for latency.
 */
export function composeGroundedMessages(
  messages: ChatMessage[],
  inputs: GroundingInputs,
  maxTurns = 10,
): ChatMessage[] {
  const system = buildGroundingSystemPrompt(messages, inputs);
  const convo = messages.filter((m) => m.role !== 'system').slice(-maxTurns);
  return [{ role: 'system', content: system }, ...convo];
}
