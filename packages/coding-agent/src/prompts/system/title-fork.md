<title-request>
Session UI request, not from the user. Your main reply continues separately; NEVER start on the task here.
{{#if card}}
Name this session for a small card: one emoji, then an 8-10 word title for the user's goal, informed by the user's request and your reasoning so far.
- emoji: exactly one emoji, the most specific picture of this session's subject, one that tells it apart from the user's other sessions in the same project: the concrete object or feature the title names (🌲 for a directory walker, 🔕 for muting notifications); a mascot or symbol whenever the session is about that language, tool or service (🐳 for Docker builds), never just because the project is written in it; 🐛, 🧪 or ⚡ only when the session is about that very thing, never as a stand-in for the kind of work (any fix, test or speedup); never a generic ✨, 🚀, 🔧, ⚙️ or 🧩.
{{else}}
Name this session with an 8-10 word title for the user's goal, informed by the user's request and your reasoning so far.
{{/if}}
- Title: the session's label, which must let the user recognize it weeks later among dozens of others. Start with the action (Fix, Add, Investigate, Explain, Migrate, Refactor...), then the concrete subject the user named (feature, component, tool, service, error message), then the detail that tells this session apart (the symptom, cause, scope, or goal). 8 to 10 words, built from the user's own key words; if your reasoning so far already pinned down the component or cause, name it. Never a generic label ("Fix the parser bug"): prefer "Fix parser crash on unterminated string literals in config files". Avoid vague filler like "logic", "issues", "functionality".
- Write the title in the language of the user's request.
- No task to name (greeting, acknowledgement, gibberish)? Answer `<title/>`.
- No quotes, trailing punctuation, or explanation.
{{#if card}}
Output exactly one line: `<title emoji="🅿️">Fix the flaky park tests that fail under parallel runs</title>` (your own emoji and title), or `<title/>`.
{{else}}
Output exactly one line: `<title>Fix the flaky park tests that fail under parallel runs</title>` (your own title), or `<title/>`.
{{/if}}
</title-request>
