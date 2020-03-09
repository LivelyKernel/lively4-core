import { convertTemplateType } from "./convertTemplateType.js";
import { toToken } from "./toToken.js";

export function toTokens(tokens, tt, code) {
  return convertTemplateType(tokens, tt)
    .filter(t => t.type !== "CommentLine" && t.type !== "CommentBlock")
    .map(t => toToken(t, tt, code));
}
