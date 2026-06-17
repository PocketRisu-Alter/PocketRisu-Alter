# Persistent chat generation

PocketRisu can hand supported chat requests to the Node server so generation can continue when the browser is suspended or disconnected.

## Model preset support

| Request adapter | Support |
| --- | --- |
| OpenAI-compatible | Supported |
| Anthropic Messages | Foreground only |
| Google Gemini | Foreground only |

OpenAI-compatible gateway profiles, including Vercel AI Gateway and OpenRouter, use the supported request format. Presets with tool use enabled remain on the foreground path because tool execution currently runs in the browser.

The model preset editor and profile browser display this capability for each profile. An unavailable label does not disable the provider; it means the request continues through the normal foreground path.
