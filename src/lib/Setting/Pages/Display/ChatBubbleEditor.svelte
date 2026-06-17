<script lang="ts">
    import { DBState } from 'src/ts/stores.svelte';
    import { updateChatBubble } from 'src/ts/gui/colorscheme';
    import ColorInput from 'src/lib/UI/GUI/ColorInput.svelte';
    import SelectInput from 'src/lib/UI/GUI/SelectInput.svelte';
    import OptionInput from 'src/lib/UI/GUI/OptionInput.svelte';

    const onModeChange = (e: Event) => {
        const v = (e.target as HTMLInputElement).value as 'none'|'bubble'|'glass';
        DBState.db.chatBubble.mode = v;
        updateChatBubble();
    };

    const colorRows: { key: 'userBg'|'userBorder'|'charBg'|'charBorder'|'emColor'|'streamingColor', label: string }[] = [
        { key: 'userBg',         label: 'User Bubble Background' },
        { key: 'userBorder',     label: 'User Bubble Border' },
        { key: 'charBg',         label: 'Char Bubble Background' },
        { key: 'charBorder',     label: 'Char Bubble Border' },
        { key: 'emColor',        label: 'Italic Emphasis Color' },
        { key: 'streamingColor', label: 'Streaming Indicator Color' },
    ];
</script>

<div class="flex items-center justify-between gap-3 py-3 border-t border-darkborderc">
    <div class="flex flex-col min-w-0">
        <span class="text-sm text-textcolor">Chat Bubble Mode</span>
        <p class="text-xs text-textcolor2 mt-0.5">None / Bubble (solid) / Glass (translucent + blur). Applies to the default chat theme.</p>
    </div>
    <div class="shrink-0">
        <SelectInput className="w-32" size="sm" value={DBState.db.chatBubble?.mode ?? 'none'} onchange={onModeChange}>
            <OptionInput value="none">None</OptionInput>
            <OptionInput value="bubble">Bubble</OptionInput>
            <OptionInput value="glass">Glass</OptionInput>
        </SelectInput>
    </div>
</div>

{#each colorRows as row}
    <div class="flex items-center justify-between gap-3 py-2">
        <span class="text-sm text-textcolor min-w-0 truncate">{row.label}</span>
        <div class="shrink-0">
            <ColorInput
                nullable
                bind:value={DBState.db.chatBubble[row.key]}
                oninput={updateChatBubble}
            />
        </div>
    </div>
{/each}
