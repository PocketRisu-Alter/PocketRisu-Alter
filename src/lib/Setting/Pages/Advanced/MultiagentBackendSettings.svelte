<script lang="ts">
    import { DBState } from 'src/ts/stores.svelte';
    import { createDefaultBackendMultiagentConfig } from 'src/ts/storage/database.svelte';
    import Accordion from 'src/lib/UI/Accordion.svelte';
    import TextInput from 'src/lib/UI/GUI/TextInput.svelte';
    import SecretInput from 'src/lib/UI/GUI/SecretInput.svelte';
    import NumberInput from 'src/lib/UI/GUI/NumberInput.svelte';
    import TextAreaInput from 'src/lib/UI/GUI/TextAreaInput.svelte';
    import SelectInput from 'src/lib/UI/GUI/SelectInput.svelte';
    import CheckInput from 'src/lib/UI/GUI/CheckInput.svelte';
    import Button from 'src/lib/UI/GUI/Button.svelte';

    // Defensive init: alwaysWriteDefaults runs on load, but a freshly imported
    // DB blob rendered before that pass would crash on the nested reads below.
    if (!DBState.db.backendMultiagentConfig) {
        DBState.db.backendMultiagentConfig = createDefaultBackendMultiagentConfig();
    }

    const conf = $derived(DBState.db.backendMultiagentConfig);

    // NumberInput binds a number; maxTokens is number | null (blank = provider
    // default). Bridge through a local that maps NaN/empty back to null.
    let maxTokensInput = $state<number | undefined>(
        DBState.db.backendMultiagentConfig?.maxTokens ?? undefined
    );
    $effect(() => {
        const v = maxTokensInput;
        DBState.db.backendMultiagentConfig.maxTokens =
            (v === undefined || v === null || Number.isNaN(v)) ? null : v;
    });

    const agentLabels: Record<string, string> = {
        worldbuilding: 'Worldbuilding agent',
        plot: 'Plot agent',
        character: 'Character agent',
    };

    function resetConfig() {
        DBState.db.backendMultiagentConfig = createDefaultBackendMultiagentConfig();
        maxTokensInput = undefined;
    }
</script>

<Accordion styled name="Backend MultiAgent">
    <p class="text-textcolor2 text-sm mb-3">
        Native config for the server-side MultiAgent pipeline. No plugin install required —
        set an API key here and the backend runs the pipeline using its built-in agent prompts.
        Leave a prompt blank to use the server default.
    </p>

    <!-- Analysis agent connection -->
    <span class="text-textcolor2 text-sm">Analysis agent API key</span>
    <SecretInput fullwidth bind:value={conf.apiKey} placeholder="Required to enable the pipeline" />

    <span class="text-textcolor2 text-sm mt-3 block">Base URL</span>
    <TextInput fullwidth bind:value={conf.baseUrl} placeholder="https://api.openai.com/v1" />

    <span class="text-textcolor2 text-sm mt-3 block">Model</span>
    <TextInput fullwidth bind:value={conf.model} placeholder="gpt-4o-mini" />

    <span class="text-textcolor2 text-sm mt-3 block">Provider label (optional)</span>
    <TextInput fullwidth bind:value={conf.provider} placeholder="openai" />

    <div class="flex gap-4 mt-3 flex-wrap">
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Temperature</span>
            <NumberInput bind:value={conf.temperature} min={0} max={2} />
        </div>
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Max tokens (blank = default)</span>
            <NumberInput bind:value={maxTokensInput} min={1} placeholder="default" />
        </div>
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Context window (messages)</span>
            <NumberInput bind:value={conf.window} min={1} max={50} />
        </div>
    </div>

    <span class="text-textcolor2 text-sm mt-3 block">Extra body JSON (OpenAI-compatible, optional)</span>
    <TextAreaInput fullwidth bind:value={conf.extraBodyJson} placeholder={'{ "top_p": 0.9 }'} />

    <!-- Behaviour -->
    <div class="flex gap-4 mt-3 flex-wrap">
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Strict mode</span>
            <SelectInput
                value={conf.strictMode ? '1' : '0'}
                onchange={(e) => { conf.strictMode = e.currentTarget.value === '1'; }}
            >
                <option value="0">Lenient (fail-open)</option>
                <option value="1">Strict (block on error)</option>
            </SelectInput>
        </div>
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Injection position</span>
            <SelectInput bind:value={conf.injectionPosition}>
                <option value="system-end">system-end</option>
                <option value="before-last-user">before-last-user</option>
            </SelectInput>
        </div>
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Injection format</span>
            <SelectInput bind:value={conf.injectionFormat}>
                <option value="classic">classic</option>
                <option value="xml">xml</option>
                <option value="markdown-table">markdown-table</option>
            </SelectInput>
        </div>
        <div class="flex flex-col">
            <span class="text-textcolor2 text-sm">Analysis language</span>
            <SelectInput bind:value={conf.analysisLanguage}>
                <option value="auto">auto</option>
                <option value="en">en</option>
                <option value="ko">ko</option>
                <option value="ja">ja</option>
            </SelectInput>
        </div>
    </div>

    <!-- Agents -->
    <div class="mt-4 flex flex-col gap-2">
        <span class="text-textcolor2 text-sm">Agents</span>
        {#each Object.keys(conf.agents) as name (name)}
            <Accordion name={agentLabels[name] ?? name}>
                <CheckInput name="Enabled" bind:check={conf.agents[name].enabled} />
                <span class="text-textcolor2 text-sm mt-2 block">System prompt override (blank = built-in)</span>
                <TextAreaInput fullwidth bind:value={conf.agents[name].systemPrompt} placeholder="Leave blank to use the server's built-in system prompt" />
                <span class="text-textcolor2 text-sm mt-2 block">User prompt template override (blank = built-in)</span>
                <TextAreaInput fullwidth bind:value={conf.agents[name].userPromptTemplate} placeholder="Leave blank to use the server's built-in user prompt template" />
            </Accordion>
        {/each}
    </div>

    <div class="mt-4">
        <Button styled="outlined" onclick={resetConfig}>Reset to defaults</Button>
    </div>
</Accordion>
