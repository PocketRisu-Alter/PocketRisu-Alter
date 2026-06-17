<script lang="ts">
    let { active = false, label = 'Backend' }: { active?: boolean; label?: string } = $props();
</script>
<span class:active title={active ? 'Supported' : 'Not supported'}>{label}: {active ? 'Available' : 'Unavailable'}</span>
<style>
span { font-size: 11px; padding: 2px 7px; border: 1px solid currentColor; border-radius: 999px; opacity: .75; white-space: nowrap; }
span.active { color: #91c89f; opacity: 1; }
</style>
