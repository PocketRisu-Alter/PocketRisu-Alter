// scrollIntoView walks all scrollable ancestors; if documentElement is
// bloated (e.g. by sidebar layout leakage) it gets scrolled too, pushing
// the viewport off body and revealing gray space below. Use this helper
// to scroll only the given container instead of climbing to the root.
export function scrollWithinContainer(
    el: HTMLElement,
    container: HTMLElement,
    options: { block: 'start' | 'end'; behavior: ScrollBehavior; bottomInset?: number }
) {
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    // `bottomInset` reserves space at the bottom of the viewport (e.g. for a
    // floating composer that overlays the scroll area). For `block: 'end'` the
    // element is aligned to `containerRect.bottom - bottomInset` instead of the
    // raw bottom, so it lands just above the overlay with no leftover scroll gap.
    const inset = options.bottomInset ?? 0
    const offset = options.block === 'start'
        ? elRect.top - containerRect.top
        : elRect.bottom - (containerRect.bottom - inset)
    container.scrollTo({ top: container.scrollTop + offset, behavior: options.behavior })
}
