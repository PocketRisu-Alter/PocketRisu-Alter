<script lang="ts">
  interface Props {
    isActive: boolean;
  }

  let { isActive }: Props = $props();
</script>

<div
  class="indicator"
  class:active={isActive}
></div>

<style>
  .indicator {
    position: absolute;
    left: -6px;
    width: 2px;
    height: 0px;
    border-radius: 1px;
    background-color: var(--accent);
    opacity: 0;
    transition: height var(--dur-fast) var(--ease-out),
                opacity var(--dur-fast) var(--ease-out);
  }
  :global(.group:hover) > .indicator:not(.active) {
    height: 12px;
    opacity: 0.5;
  }
  .indicator.active {
    height: 24px;
    opacity: 1;
  }
</style>
