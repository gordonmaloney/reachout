import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function MobileTemplateEditor({
  templates,
  setTemplates,
  extraChannelsEnabled,
  setExtraChannelsEnabled,
}) {
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [dragOrder, setDragOrder] = useState(null);
  const cardRefs = useRef(new Map());
  const previousCardRectsRef = useRef(new Map());
  const dragStateRef = useRef(null);
  const dragOrderRef = useRef(null);
  const dragHandlersRef = useRef({ move: null, release: null });
  const templatesRef = useRef(templates);
  const templateById = new Map(
    templates.map((template) => [template.id, template])
  );
  const orderedTemplates = dragOrder
    ? dragOrder.map((id) => templateById.get(id)).filter(Boolean)
    : templates;
  const draggedTemplate = dragState ? templateById.get(dragState.id) : null;

  useLayoutEffect(() => {
    templatesRef.current = templates;

    const previousRects = previousCardRectsRef.current;
    if (previousRects.size === 0) return;

    cardRefs.current.forEach((node, id) => {
      const previousRect = previousRects.get(id);
      if (!previousRect) return;

      const currentRect = node.getBoundingClientRect();
      const deltaX = previousRect.left - currentRect.left;
      const deltaY = previousRect.top - currentRect.top;

      if (deltaX === 0 && deltaY === 0) return;

      node.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(0.42, 0, 0.2, 1)",
        }
      );
    });

    previousRects.clear();
  }, [templates, dragOrder]);

  const rememberTemplatePositions = () => {
    const positions = new Map();

    cardRefs.current.forEach((node, id) => {
      node.getAnimations().forEach((animation) => animation.cancel());
      positions.set(id, node.getBoundingClientRect());
    });

    previousCardRectsRef.current = positions;
  };

  const handleChange = (id, field, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTemplate = () => {
    setTemplates((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        title: "New Template",
        body: "",
      },
    ]);
  };

  const handleRemoveTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const getInsertionIndex = (draggedId, pointer, activeOrder) => {
    const draggedCenterY =
      pointer.y -
      dragStateRef.current.grabOffset.y +
      dragStateRef.current.size.height / 2;

    return activeOrder
      .filter((id) => id !== draggedId)
      .reduce((insertIndex, id) => {
        const node = cardRefs.current.get(id);
        if (!node) return insertIndex;

        const rect = node.getBoundingClientRect();
        const threshold = rect.height * 0.32;
        const isAfterItem = draggedCenterY > rect.top + rect.height / 2 - threshold;

        return isAfterItem ? insertIndex + 1 : insertIndex;
      }, 0);
  };

  const setPreviewOrder = (draggedId, insertionIndex) => {
    const activeOrder =
      dragOrderRef.current || templatesRef.current.map((template) => template.id);
    const orderWithoutDragged = activeOrder.filter((id) => id !== draggedId);
    const safeInsertionIndex = Math.max(
      0,
      Math.min(insertionIndex, orderWithoutDragged.length)
    );
    const nextOrder = [...orderWithoutDragged];

    nextOrder.splice(safeInsertionIndex, 0, draggedId);

    if (activeOrder.join("|") === nextOrder.join("|")) return;

    rememberTemplatePositions();
    dragOrderRef.current = nextOrder;
    setDragOrder(nextOrder);
  };

  const updateDragPreview = (pointer) => {
    const state = dragStateRef.current;
    if (!state) return;

    const activeOrder =
      dragOrderRef.current || templatesRef.current.map((template) => template.id);
    const insertionIndex = getInsertionIndex(state.id, pointer, activeOrder);

    setPreviewOrder(state.id, insertionIndex);
  };

  const startTemplateDrag = (id, event) => {
    const node = cardRefs.current.get(id);
    const rect = node?.getBoundingClientRect();

    if (!rect) return;

    event.preventDefault();

    const initialOrder = templatesRef.current.map((template) => template.id);
    const nextDragState = {
      id,
      pointer: { x: event.clientX, y: event.clientY },
      grabOffset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      size: { width: rect.width, height: rect.height },
    };

    dragStateRef.current = nextDragState;
    dragOrderRef.current = initialOrder;
    setDragState(nextDragState);
    setDragOrder(initialOrder);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleTemplateDrag = (event) => {
    const state = dragStateRef.current;
    if (!state) return;

    const pointer = { x: event.clientX, y: event.clientY };
    const nextDragState = { ...state, pointer };

    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
    updateDragPreview(pointer);
  };

  const stopTemplateDrag = () => {
    const finalOrder = dragOrderRef.current;

    cardRefs.current.forEach((node) => {
      node.getAnimations().forEach((animation) => animation.cancel());
      node.style.transform = "";
    });

    if (finalOrder) {
      setTemplates((prev) => {
        const nextTemplateById = new Map(
          prev.map((template) => [template.id, template])
        );
        const ordered = finalOrder
          .map((templateId) => nextTemplateById.get(templateId))
          .filter(Boolean);
        const orderedIds = new Set(ordered.map((template) => template.id));
        const newTemplates = prev.filter(
          (template) => !orderedIds.has(template.id)
        );

        return [...ordered, ...newTemplates];
      });
    }

    previousCardRectsRef.current.clear();
    dragStateRef.current = null;
    dragOrderRef.current = null;
    setDragState(null);
    setDragOrder(null);
  };

  const getDragOverlayStyle = () => {
    if (!dragState) return {};

    return {
      ...styles.dragOverlay,
      left: `${dragState.pointer.x - dragState.grabOffset.x}px`,
      top: `${dragState.pointer.y - dragState.grabOffset.y}px`,
      width: `${dragState.size.width}px`,
      height: `${dragState.size.height}px`,
    };
  };

  const renderDragOverlay = () => {
    if (!dragState || !draggedTemplate) return null;

    return (
      <div style={getDragOverlayStyle()} className="glass-card" aria-hidden="true">
        <div style={styles.templateHeader}>
          <span style={{ ...styles.dragHandle, opacity: 0.32 }}>
            <GripVertical size={14} />
          </span>
          <span style={styles.overlayTitle}>
            {draggedTemplate.title || "New Template"}
          </span>
          <span style={styles.overlayRemoveSpacer} />
        </div>
        <div style={styles.overlayBody}>
          {draggedTemplate.body || "Message body"}
        </div>
      </div>
    );
  };

  useLayoutEffect(() => {
    dragHandlersRef.current = {
      move: handleTemplateDrag,
      release: stopTemplateDrag,
    };
  });

  useEffect(() => {
    if (!dragState?.id) return undefined;

    const handleWindowPointerMove = (event) => {
      dragHandlersRef.current.move?.(event);
    };
    const handleWindowPointerRelease = () => {
      dragHandlersRef.current.release?.();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerRelease);
    window.addEventListener("pointercancel", handleWindowPointerRelease);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerRelease);
      window.removeEventListener("pointercancel", handleWindowPointerRelease);
    };
  }, [dragState?.id]);

  const enableExtraChannels = () => {
    setExtraChannelsEnabled(true);
    setShowChannelModal(false);
  };
  const handleChannelToggle = () => {
    if (extraChannelsEnabled) {
      setExtraChannelsEnabled(false);
      return;
    }
    setShowChannelModal(true);
  };

  return (
    <div style={styles.container} className="glass-card">
      <div style={styles.header}>
        <h2 style={styles.title}>Edit Templates</h2>
        <button onClick={handleAddTemplate} style={styles.addBtn} className="hover-lift">
          <Plus size={16} /> Add
        </button>
      </div>
      <button onClick={handleChannelToggle} style={styles.channelBtn} className="hover-lift">
        {extraChannelsEnabled ? "Signal / Telegram enabled" : "Add Signal / Telegram"}
      </button>
      <div style={styles.list} className="mobile-template-list">
        {orderedTemplates.map((t) => {
          const isDraggingTemplate = dragState?.id === t.id;

          return (
            <div
              key={t.id}
              ref={(node) => {
                if (node) {
                  cardRefs.current.set(t.id, node);
                } else {
                  cardRefs.current.delete(t.id);
                }
              }}
              data-mobile-template-drop-id={t.id}
              style={{
                ...styles.item,
                ...(isDraggingTemplate ? styles.dragPlaceholder : {}),
              }}
              className="glass-card"
            >
              <div style={styles.templateHeader}>
                <button
                  type="button"
                  aria-label={`Drag ${t.title || "template"} to reorder`}
                  title="Drag to reorder"
                  style={styles.dragHandle}
                  onPointerDown={(event) => startTemplateDrag(t.id, event)}
                  onPointerUp={stopTemplateDrag}
                  onPointerCancel={stopTemplateDrag}
                >
                  <GripVertical size={14} />
                </button>
                <input
                  style={styles.input}
                  type="text"
                  value={t.title}
                  onChange={(e) => handleChange(t.id, "title", e.target.value)}
                />
                <button
                  onClick={() => handleRemoveTemplate(t.id)}
                  style={styles.removeBtn}
                  title="Remove template"
                >
                  <X size={16} color="var(--ta-red)" />
                </button>
              </div>
              <textarea
                className="mobile-template-body"
                style={styles.textarea}
                rows={5}
                value={t.body}
                onChange={(e) => handleChange(t.id, "body", e.target.value)}
              />
            </div>
          );
        })}
      </div>
      {renderDragOverlay()}
      {showChannelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowChannelModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add Signal and Telegram</h3>
            <p style={styles.modalText}>
              This adds Signal and Telegram as contact options. Signal does not
              allow pre-filled messages, so tapping Signal will copy the
              message to your clipboard and open the chat with the contact.
            </p>
            <p style={styles.modalText}>
              Telegram will open the contact by phone number where supported by the app.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowChannelModal(false)} style={styles.modalSecondary}>Cancel</button>
              <button onClick={enableExtraChannels} style={styles.modalPrimary}>Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "var(--ta-cream)",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    margin: 0,
    color: "var(--ta-green)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    flex: 1,
  },
  item: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
  },
  dragPlaceholder: {
    opacity: 0.22,
    pointerEvents: "none",
  },
  dragOverlay: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
    position: "fixed",
    zIndex: 2000,
    pointerEvents: "none",
    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.34)",
    borderColor: "rgba(79, 159, 104, 0.5)",
    overflow: "hidden",
  },
  templateHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dragHandle: {
    width: "12px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "var(--ta-muted)",
    cursor: "grab",
    opacity: 0.22,
    padding: 0,
    touchAction: "none",
  },
  overlayTitle: {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-heading)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  overlayRemoveSpacer: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
  },
  overlayBody: {
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    minHeight: "128px",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-heading)",
  },
  textarea: {
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    minHeight: "128px",
    resize: "none",
  },
  addBtn: {
    backgroundColor: "transparent",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "6px",
    padding: "6px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  channelBtn: {
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    cursor: "pointer",
  },
  removeBtn: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "transparent",
    border: "1px solid rgba(255, 77, 77, 0.4)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "18px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "360px",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "12px",
    padding: "18px",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
  },
  modalTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    marginBottom: "8px",
  },
  modalText: {
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    color: "var(--ta-muted-strong)",
    marginBottom: "10px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "14px",
  },
  modalSecondary: {
    background: "transparent",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 12px",
  },
  modalPrimary: {
    background: "var(--ta-green)",
    border: "none",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontFamily: "var(--font-heading)",
  },
};
