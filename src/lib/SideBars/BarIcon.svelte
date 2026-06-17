<!-- TODO: REMOVE AND REFACTOR TO BASE BUTTON UI COMPONENT -->

<script lang="ts">
  interface Props {
    onClick?: any;
    additionalStyle?: string | Promise<string>;
    children?: import('svelte').Snippet;
  }

  let { onClick = () => {}, additionalStyle = "", children }: Props = $props();
</script>

{#await additionalStyle}
  <button onclick={onClick} class="ico">{@render children?.()}</button>
{:then as}
  <button onclick={onClick} class="ico" style={as}>{@render children?.()}</button>
{/await}

<style>
  .ico {
    cursor: pointer;
    border-radius: var(--radius-sm);
    height: 2.75rem;
    width: 2.75rem;
    min-height: 2.75rem;
    background-color: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color var(--dur-fast) var(--ease-out),
                border-color var(--dur-fast) var(--ease-out),
                color var(--dur-fast) var(--ease-out);
  }

  .ico:hover {
    background-color: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .ico:active {
    background-color: var(--bg-surface);
  }
</style>
