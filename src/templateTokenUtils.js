export const FIRSTNAME_TOKEN = "{FIRSTNAME}";
export const CALLERNAME_TOKEN = "{CALLERNAME}";

const TEMPLATE_TOKENS = [
  {
    id: "firstName",
    token: FIRSTNAME_TOKEN,
    enabled: () => true,
    bracketPatterns: [
      /[[{(]\s*first\s*[_-]?\s*name\s*[\]})]/gi,
      /[[{(]\s*firstname\s*[\]})]/gi,
    ],
    barePattern: /\bFIRST\s*[_-]?\s*NAME\b/g,
  },
  {
    id: "callerName",
    token: CALLERNAME_TOKEN,
    enabled: ({ callerNameTokenEnabled = false } = {}) =>
      Boolean(callerNameTokenEnabled),
    bracketPatterns: [
      /[[{(]\s*caller\s*[_-]?\s*name\s*[\]})]/gi,
      /[[{(]\s*callername\s*[\]})]/gi,
    ],
    barePattern: /\bCALLER\s*[_-]?\s*NAME\b/g,
  },
];

function getEnabledTokens(options = {}) {
  return TEMPLATE_TOKENS.filter((token) => token.enabled(options));
}

function fixToken(body = "", tokenConfig) {
  const fixedBracketTokens = tokenConfig.bracketPatterns.reduce(
    (nextBody, pattern) => nextBody.replace(pattern, tokenConfig.token),
    body
  );

  return fixedBracketTokens.replace(
    tokenConfig.barePattern,
    (match, offset, fullText) => {
      const alreadyFixed =
        fullText[offset - 1] === "{" && fullText[offset + match.length] === "}";
      return alreadyFixed ? match : tokenConfig.token;
    }
  );
}

export function fixTemplateTokens(body = "", options = {}) {
  return getEnabledTokens(options).reduce(
    (nextBody, tokenConfig) => fixToken(nextBody, tokenConfig),
    body
  );
}

export function getTemplateTokenFixes(body = "", options = {}) {
  return getEnabledTokens(options)
    .filter((tokenConfig) => fixToken(body, tokenConfig) !== body)
    .map((tokenConfig) => tokenConfig.token);
}

export function hasTemplateTokenMistake(body = "", options = {}) {
  return getTemplateTokenFixes(body, options).length > 0;
}

export function hasCallerNameToken(body = "") {
  return String(body || "").includes(CALLERNAME_TOKEN);
}

export function removeCallerNameToken(body = "") {
  return String(body || "")
    .replaceAll(CALLERNAME_TOKEN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?;:])/g, "$1");
}
