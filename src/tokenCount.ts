import { encode } from "gpt-tokenizer";

/**
 * Count the number of tokens in a string using cl100k_base encoding.
 * This gives a reasonable estimate for both OpenAI and Anthropic models.
 */
export function countTokens(text: string): number {
  return encode(text).length;
}
