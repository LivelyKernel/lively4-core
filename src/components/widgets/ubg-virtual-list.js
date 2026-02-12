/**
 * VirtualList: fixed-height, keyed, element recycling, anchor-preserving updates.
 *
 * Requirements on your items:
 *   - items is an array in render order
 *   - each item has a stable unique key (string/number) accessible via getKey(item)
 *
 * Outer container: scroll viewport
 * Inner container: spacer with total height; contains absolutely-positioned row elements
 */
export default function createVirtualList(outer, options) {
  const rowHeight = mustNumber(options.rowHeight, "rowHeight");
  const overscan = options.overscan ?? 6;
  const renderRow = mustFn(options.renderRow, "renderRow");
  const onRowRecycled = options.onRowRecycled ?? (() => {});
  const getKey = options.getKey ?? ((item) => item.key);

  // Ensure outer is scrollable
  const cs = getComputedStyle(outer);
  if (cs.position === "static") outer.style.position = "relative";
  if (cs.overflowY === "visible") outer.style.overflowY = "auto";

  // Inner spacer
  const inner = document.createElement("div");
  inner.style.position = "relative";
  inner.style.width = "100%";
  outer.appendChild(inner);

  // State
  let items = [];
  let keyToIndex = new Map();

  // Rendered rows: key -> { index, el }
  const rendered = new Map();

  // Pool for recycling
  const pool = [];

  // Scheduling
  let rafPending = false;
  let lastViewportH = outer.clientHeight;

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());
  resizeObserver.observe(outer);

  outer.addEventListener(
    "scroll",
    () => scheduleUpdate(),
    { passive: true }
  );

  function buildIndex() {
    keyToIndex = new Map();
    for (let i = 0; i < items.length; i++) {
      keyToIndex.set(String(getKey(items[i])), i);
    }
  }

  function updateInnerHeight() {
    inner.style.height = `${items.length * rowHeight}px`;
  }

  function scheduleUpdate() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      updateNow();
    });
  }

  function updateNow() {
    const scrollTop = outer.scrollTop;
    const viewportH = outer.clientHeight;
    lastViewportH = viewportH;

    const start = Math.floor(scrollTop / rowHeight);
    const end = Math.ceil((scrollTop + viewportH) / rowHeight);

    const from = clamp(start - overscan, 0, items.length);
    const to = clamp(end + overscan, 0, items.length);

    const needed = new Set();

    for (let index = from; index < to; index++) {
      const item = items[index];
      const key = String(getKey(item));
      needed.add(key);

      const existing = rendered.get(key);
      if (existing) {
        // If key existed but moved due to sort/filter/compaction, update position
        existing.index = index;
        position(existing.el, index * rowHeight);
        continue;
      }

      // Create/reuse element
      const recycled = pool.pop() ?? null;
      const el = renderRow(index, recycled);

      // Virtualization style
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.right = "0";
      el.dataset.vlKey = key;

      position(el, index * rowHeight);

      inner.appendChild(el);
      rendered.set(key, { index, el });
    }

    // Recycle no-longer-needed
    for (const [key, rec] of rendered) {
      if (needed.has(key)) continue;

      rendered.delete(key);
      onRowRecycled(rec.index, rec.el);

      if (rec.el.parentElement === inner) inner.removeChild(rec.el);
      pool.push(rec.el);
    }
  }

  function position(el, topPx) {
    // translateY is usually smoother than top
    el.style.transform = `translateY(${Math.round(topPx)}px)`;
  }

  /**
   * Replace the whole items array (compaction/sort/filter/etc).
   *
   * Anchor behavior:
   * - Provide anchorKey to keep that item at the same visual Y in the viewport.
   * - If anchorOffsetPx is omitted, we preserve its previous offset from the top.
   *
   * Example:
   *   list.setItems(newItems, { anchorKey: selectedKey });
   */
  function setItems(newItems, anchor) {
    // Capture anchor info BEFORE changing indices
    const anchorKey = anchor?.anchorKey != null ? String(anchor.anchorKey) : null;

    let prevAnchorIndex = -1;
    let prevAnchorScrollTop = outer.scrollTop;
    let prevAnchorOffset = 0;

    if (anchorKey != null) {
      prevAnchorIndex = keyToIndex.get(anchorKey) ?? -1;

      // If user didn't provide offset, keep current visual offset
      if (typeof anchor?.anchorOffsetPx === "number") {
        prevAnchorOffset = anchor.anchorOffsetPx;
      } else if (prevAnchorIndex >= 0) {
        prevAnchorOffset = prevAnchorIndex * rowHeight - prevAnchorScrollTop;
      } else {
        prevAnchorOffset = 0;
      }
    }

    // Apply new items + rebuild index
    items = Array.isArray(newItems) ? newItems : [];
    buildIndex();
    updateInnerHeight();

    // Adjust scroll to keep anchor stable
    if (anchorKey != null) {
      const nextAnchorIndex = keyToIndex.get(anchorKey) ?? -1;
      if (nextAnchorIndex >= 0) {
        const nextScrollTop = nextAnchorIndex * rowHeight - prevAnchorOffset;
        outer.scrollTop = clamp(nextScrollTop, 0, maxScrollTop());
      }
      // If anchor disappeared, we leave scrollTop as-is.
    }

    // We do NOT fully reset; we reuse keyed elements whenever possible.
    // But we must fix any rendered items that no longer exist.
    dropRenderedThatNoLongerExist();

    // Now re-render window
    scheduleUpdate();
  }

  function dropRenderedThatNoLongerExist() {
    for (const [key, rec] of Array.from(rendered.entries())) {
      if (keyToIndex.has(key)) continue;

      rendered.delete(key);
      onRowRecycled(rec.index, rec.el);
      if (rec.el.parentElement === inner) inner.removeChild(rec.el);
      pool.push(rec.el);
    }
  }

  function maxScrollTop() {
    return Math.max(0, items.length * rowHeight - outer.clientHeight);
  }

  function getVisibleRange() {
    const scrollTop = outer.scrollTop;
    const viewportH = outer.clientHeight;

    const start = Math.floor(scrollTop / rowHeight);
    const end = Math.ceil((scrollTop + viewportH) / rowHeight);
    return {
      start: clamp(start, 0, items.length),
      end: clamp(end, 0, items.length),
      overscannedStart: clamp(start - overscan, 0, items.length),
      overscannedEnd: clamp(end + overscan, 0, items.length),
    };
  }

  function scrollToKey(key, align = "start") {
    key = String(key);
    const index = keyToIndex.get(key);
    if (index == null) return false;

    const top = index * rowHeight;
    const viewportH = lastViewportH || outer.clientHeight;

    let target = top;
    if (align === "center") target = top - (viewportH - rowHeight) / 2;
    if (align === "end") target = top - (viewportH - rowHeight);

    outer.scrollTop = clamp(target, 0, maxScrollTop());
    scheduleUpdate();
    return true;
  }

  function destroy() {
    resizeObserver.disconnect();
    outer.removeEventListener("scroll", scheduleUpdate);
    // recycle everything
    for (const [key, rec] of Array.from(rendered.entries())) {
      rendered.delete(key);
      onRowRecycled(rec.index, rec.el);
      if (rec.el.parentElement === inner) inner.removeChild(rec.el);
    }
    pool.length = 0;
    if (inner.parentElement === outer) outer.removeChild(inner);
  }

  // Init
  updateInnerHeight();
  scheduleUpdate();

  return {
    // data
    setItems,
    getItems: () => items,

    // viewport helpers
    getVisibleRange,
    scrollToKey,

    // tune
    setOverscan(n) {
      options.overscan = n;
      scheduleUpdate();
    },

    // cleanup
    destroy,

    // for debugging
    _inner: inner,
    _rendered: rendered,
    _pool: pool,
    _keyToIndex: () => keyToIndex,
  };
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function mustNumber(v, name) {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`VirtualList: ${name} must be a finite number`);
  }
  return v;
}

function mustFn(v, name) {
  if (typeof v !== "function") {
    throw new Error(`VirtualList: ${name} must be a function`);
  }
  return v;
}
