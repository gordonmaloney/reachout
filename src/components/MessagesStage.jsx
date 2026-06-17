// src/components/MessagesStage.jsx
import { Info, X, Plus, ArrowRight, Check, GripVertical } from "lucide-react";
import { initialTemplates } from "../data/mockData";
import StageShell from "./StageShell";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CALLERNAME_TOKEN,
  FIRSTNAME_TOKEN,
  fixTemplateTokens,
  getTemplateTokenFixes,
  hasCallerNameToken,
  removeCallerNameToken,
} from "../templateTokenUtils";

function normalizeTemplateText(value = "") {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getEditDistance(firstValue = "", secondValue = "") {
  const first = normalizeTemplateText(firstValue);
  const second = normalizeTemplateText(secondValue);

  if (first === second) return 0;
  if (!first) return second.length;
  if (!second) return first.length;

  const distances = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let previousDiagonal = distances[0];
    distances[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const previousAbove = distances[secondIndex];
      const substitutionCost =
        first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      distances[secondIndex] = Math.min(
        distances[secondIndex] + 1,
        distances[secondIndex - 1] + 1,
        previousDiagonal + substitutionCost
      );
      previousDiagonal = previousAbove;
    }
  }

  return distances[second.length];
}

function isSubstantiallyChanged(template) {
  const starterTemplate = initialTemplates.find(
    (initialTemplate) => initialTemplate.id === template.id
  );

  if (!starterTemplate) return false;

  const titleEditDistance = getEditDistance(template.title, starterTemplate.title);
  const bodyEditDistance = getEditDistance(template.body, starterTemplate.body);

  return titleEditDistance > 3 || bodyEditDistance > 5;
}

export default function MessagesStage({
  templates = initialTemplates,
  setTemplates,
  onNext,
  onPrev,
  stageNumLabel = "Stage 2 of 3",
  nextLabel = "Start messaging",
  callerNameTokenEnabled = false,
  canUseCallerNameToken = false,
  setCallerNameTokenEnabled = () => {},
}) {
  const [dragState, setDragState] = useState(null);
  const [dragOrder, setDragOrder] = useState(null);
  const [showCallerNameChoice, setShowCallerNameChoice] = useState(false);
  const cardRefs = useRef(new Map());
  const templateTitleRefs = useRef(new Map());
  const templateBodyRefs = useRef(new Map());
  const templateCursorRefs = useRef(new Map());
  const previousCardRectsRef = useRef(new Map());
  const dragStateRef = useRef(null);
  const dragOrderRef = useRef(null);
  const dragHandlersRef = useRef({ move: null, release: null });
  const templatesRef = useRef(templates);
  const pendingTemplateTitleFocusRef = useRef(null);
  const pendingTemplateBodyFocusRef = useRef(null);
  const templateById = new Map(
    templates.map((template) => [template.id, template])
  );
  const orderedTemplates = dragOrder
    ? dragOrder.map((id) => templateById.get(id)).filter(Boolean)
    : templates;
  const draggedTemplate = dragState ? templateById.get(dragState.id) : null;

  const getLayoutPosition = (node) => ({
    left: node.offsetLeft,
    top: node.offsetTop,
    width: node.offsetWidth,
    height: node.offsetHeight,
  });

  useLayoutEffect(() => {
    templatesRef.current = templates;

    const pendingTemplateTitleFocus = pendingTemplateTitleFocusRef.current;
    if (pendingTemplateTitleFocus) {
      const input = templateTitleRefs.current.get(pendingTemplateTitleFocus);
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        pendingTemplateTitleFocusRef.current = null;
      }
    }

    const pendingTemplateBodyFocus = pendingTemplateBodyFocusRef.current;
    if (pendingTemplateBodyFocus) {
      const { id, cursor } = pendingTemplateBodyFocus;
      const textarea = templateBodyRefs.current.get(id);
      if (textarea) {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(cursor, cursor);
        pendingTemplateBodyFocusRef.current = null;
      }
    }

    const previousRects = previousCardRectsRef.current;
    if (previousRects.size === 0) return;

    cardRefs.current.forEach((node, id) => {
      const previousPosition = previousRects.get(id);
      if (!previousPosition) return;

      const currentRect = node.getBoundingClientRect();
      const deltaX = previousPosition.rect.left - currentRect.left;
      const deltaY = previousPosition.rect.top - currentRect.top;

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
      const rect = node.getBoundingClientRect();
      node.getAnimations().forEach((animation) => animation.cancel());
      positions.set(id, {
        rect,
        layout: getLayoutPosition(node),
      });
    });

    previousCardRectsRef.current = positions;
  };

  const handleTitleChange = (id, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: value } : t))
    );
  };

  const handleBodyChange = (id, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, body: value } : t))
    );
  };

  const rememberBodyCursor = (id, element) => {
    if (!element) return;
    templateCursorRefs.current.set(id, {
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
    });
  };

  const insertToken = (id, token) => {
    const textarea = templateBodyRefs.current.get(id);
    const template = templatesRef.current.find((item) => item.id === id);
    if (!template) return;

    const fallbackCursor = template.body.length;
    const rememberedCursor = templateCursorRefs.current.get(id);
    const start = textarea?.selectionStart ?? rememberedCursor?.start ?? fallbackCursor;
    const end = textarea?.selectionEnd ?? rememberedCursor?.end ?? start;
    const nextBody = `${template.body.slice(0, start)}${token}${template.body.slice(end)}`;
    const nextCursor = start + token.length;

    templateCursorRefs.current.set(id, {
      start: nextCursor,
      end: nextCursor,
    });
    pendingTemplateBodyFocusRef.current = { id, cursor: nextCursor };
    handleBodyChange(id, nextBody);
  };

  const addTemplate = () => {
    const newTemplate = {
      id: `t${Date.now()}`,
      title: "New Template",
      body: "",
    };
    pendingTemplateTitleFocusRef.current = newTemplate.id;
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const getInsertionIndex = (draggedId, pointer, activeOrder) => {
    const draggedNode = cardRefs.current.get(draggedId);
    const offsetParentRect =
      draggedNode?.offsetParent?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };
    const draggedCenter = {
      x:
        pointer.x -
        dragStateRef.current.grabOffset.x +
        dragStateRef.current.size.width / 2,
      y:
        pointer.y -
        dragStateRef.current.grabOffset.y +
        dragStateRef.current.size.height / 2,
    };

    const layoutItems = activeOrder
      .filter((id) => id !== draggedId)
      .map((id) => {
        const node = cardRefs.current.get(id);
        if (!node) return null;

        const layout = getLayoutPosition(node);
        return {
          id,
          centerX: offsetParentRect.left + layout.left + layout.width / 2,
          centerY: offsetParentRect.top + layout.top + layout.height / 2,
          height: layout.height,
        };
      })
      .filter(Boolean);

    return layoutItems.reduce((insertIndex, item) => {
      const rowThreshold = item.height * 0.32;
      const isAfterItem =
        draggedCenter.y > item.centerY + rowThreshold ||
        (Math.abs(draggedCenter.y - item.centerY) <= rowThreshold &&
          draggedCenter.x > item.centerX);

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
        <div style={styles.cardHeader}>
          <span style={{ ...styles.dragHandle, opacity: 0.32 }}>
            <GripVertical size={14} />
          </span>
          <div style={styles.overlayTitleField}>
            {starterTemplateIds.has(draggedTemplate.id) &&
              !isSubstantiallyChanged(draggedTemplate) && (
                <span style={styles.examplePill}>Example template</span>
              )}
            <span style={styles.overlayTitle}>
              {draggedTemplate.title || "Template title"}
            </span>
          </div>
        </div>
        <div style={styles.overlayBody}>
          {draggedTemplate.body ||
            (callerNameTokenEnabled
              ? "Message body - use {FIRSTNAME} and {CALLERNAME}"
              : "Message body - use {FIRSTNAME} for personalization")}
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

  const fixTemplateToken = (id) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              body: fixTemplateTokens(t.body, { callerNameTokenEnabled }),
            }
          : t
      )
    );
  };
  const templatesUseCallerNameToken = templates.some((template) =>
    hasCallerNameToken(template.body)
  );
  const continueFromMessages = () => {
    if (
      canUseCallerNameToken &&
      !callerNameTokenEnabled &&
      templatesUseCallerNameToken
    ) {
      setShowCallerNameChoice(true);
      return;
    }

    onNext();
  };
  const enableCallerNameAndContinue = () => {
    setCallerNameTokenEnabled(true);
    setShowCallerNameChoice(false);
    onNext();
  };
  const removeCallerNameAndContinue = () => {
    setTemplates((prev) =>
      prev.map((template) => ({
        ...template,
        body: removeCallerNameToken(template.body),
      }))
    );
    setShowCallerNameChoice(false);
    onNext();
  };
  const starterTemplateIds = new Set(
    initialTemplates.map((template) => template.id)
  );
  const hasStarterTemplates = templates.some((template) =>
    starterTemplateIds.has(template.id)
  );

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="WRITE YOUR MESSAGES"
      accentPhrase="MESSAGES"
      accentVariant={1}
      subtitle="Create the message templates you want to send to each contact."
      allowOverflow
    >
      <div className="glass-card" style={styles.container}>
        <div style={styles.tokenHelper}>
          <span style={styles.helperTitle}>Writing template messages</span>
          <ul style={styles.helperList}>
            <li>
              Type <code style={styles.code}>{FIRSTNAME_TOKEN}</code> wherever
              you want Reachout to insert the contact's first name. For example,{" "}
              <code style={styles.code}>Hi {FIRSTNAME_TOKEN}</code> becomes{" "}
              <code style={styles.code}>Hi Sandy</code>.
            </li>
            {callerNameTokenEnabled && (
              <li>
                Type <code style={styles.code}>{CALLERNAME_TOKEN}</code>{" "}
                wherever you want the caller's name to appear. For example,{" "}
                <code style={styles.code}>
                  Hey {FIRSTNAME_TOKEN}, this is {CALLERNAME_TOKEN}
                </code>.
              </li>
            )}
            <li>
              WhatsApp formatting can go straight into the template: surround
              words with asterisks to make them bold, like{" "}
              <code style={styles.code}>*this*</code>, or with underscores to
              make them italic, like <code style={styles.code}>_this_</code>.
            </li>
          </ul>
        </div>

        {hasStarterTemplates && (
          <div style={styles.exampleNotice}>
            Example templates are included to get you started. Edit or delete
            them before sending.
          </div>
        )}

        {/* Templates List */}
        <div style={styles.templatesGrid}>
          {orderedTemplates.map((t) => {
            const tokenFixes = getTemplateTokenFixes(t.body, {
              callerNameTokenEnabled,
            });
            const showTokenFix = tokenFixes.length > 0;
            const isDraggingTemplate = dragState?.id === t.id;
            const showExamplePill =
              starterTemplateIds.has(t.id) && !isSubstantiallyChanged(t);

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
                data-template-drop-id={t.id}
                style={{
                  ...styles.card,
                  ...(isDraggingTemplate ? styles.dragPlaceholder : {}),
                }}
                className="glass-card"
              >
                <div style={styles.cardHeader}>
                  {!showExamplePill && (
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
                  )}
                  <label style={styles.titleField}>
                    {showExamplePill && (
                      <span style={styles.examplePillRow}>
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
                        <span style={styles.examplePill}>Example template</span>
                      </span>
                    )}
                    <input
                      ref={(node) => {
                        if (node) {
                          templateTitleRefs.current.set(t.id, node);
                        } else {
                          templateTitleRefs.current.delete(t.id);
                        }
                      }}
                      type="text"
                      value={t.title}
                      onChange={(e) => handleTitleChange(t.id, e.target.value)}
                      placeholder="Template title"
                      style={styles.titleInput}
                    />
                  </label>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    style={styles.deleteBtn}
                    title="Delete template"
                  >
                    <X size={16} color="var(--ta-red)" />
                  </button>
                </div>
                <textarea
                  ref={(node) => {
                    if (node) {
                      templateBodyRefs.current.set(t.id, node);
                    } else {
                      templateBodyRefs.current.delete(t.id);
                    }
                  }}
                  value={t.body}
                  onChange={(e) => {
                    rememberBodyCursor(t.id, e.target);
                    handleBodyChange(t.id, e.target.value);
                  }}
                  onClick={(e) => rememberBodyCursor(t.id, e.target)}
                  onKeyUp={(e) => rememberBodyCursor(t.id, e.target)}
                  onSelect={(e) => rememberBodyCursor(t.id, e.target)}
                  onFocus={(e) => rememberBodyCursor(t.id, e.target)}
                  placeholder={
                    callerNameTokenEnabled
                      ? "Message body - use {FIRSTNAME} and {CALLERNAME}"
                      : "Message body - use {FIRSTNAME} for personalization"
                  }
                  style={styles.bodyTextarea}
                />
                <div style={styles.tokenChipRow} aria-label="Insert tokens">
                  <button
                    type="button"
                    onClick={() => insertToken(t.id, FIRSTNAME_TOKEN)}
                    style={styles.tokenChip}
                  >
                    {FIRSTNAME_TOKEN}
                  </button>
                  {canUseCallerNameToken && (
                    <button
                      type="button"
                      onClick={() => insertToken(t.id, CALLERNAME_TOKEN)}
                      style={styles.tokenChip}
                    >
                      {CALLERNAME_TOKEN}
                    </button>
                  )}
                </div>
                {showTokenFix && (
                  <div style={styles.tokenFixNotice}>
                    <span style={styles.tokenFixText}>
                      Did you mean to use{" "}
                      {tokenFixes.map((token, index) => (
                        <span key={token}>
                          {index > 0 ? " or " : ""}
                          <code style={styles.inlineCode}>{token}</code>
                        </span>
                      ))}
                      ?
                    </span>
                    <button
                      type="button"
                      onClick={() => fixTemplateToken(t.id)}
                      style={styles.tokenFixBtn}
                    >
                      <Check size={14} />
                      Fix token
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {/* Add new template card */}
          <div
            style={styles.addCard}
            className="glass-card"
            onClick={addTemplate}
          >
            <Plus size={32} color="var(--ta-green)" />
            <span style={styles.addLabel}>Add Template</span>
          </div>
        </div>
        {renderDragOverlay()}

        <div style={styles.tipsBanner}>
          <div style={styles.infoIconWrapper}>
            <Info size={18} color="var(--ta-green)" />
          </div>
          <div style={styles.tipsTextContent}>
            <span style={styles.tipsTitle}>TOP TIP</span>
            <p style={styles.tipsText}>
              The Connolly for President campaign in Ireland found it useful to
              text people just before calling. A short message saying you are
              phonebanking now, and asking whether they are free for a call in
              the next hour, can make the follow-up call feel less cold.
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div style={styles.footerRow}>
          <button
            onClick={onPrev}
            style={styles.backBtn}
            className="hover-lift"
          >
            Back to contacts
          </button>

          <button
            onClick={continueFromMessages}
            style={styles.continueBtn}
            className="hover-lift"
          >
            <span>{nextLabel}</span> <ArrowRight size={18} />
          </button>
        </div>
      </div>
      {showCallerNameChoice && (
        <div style={styles.modalOverlay} role="presentation">
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="caller-name-token-title"
          >
            <h3 id="caller-name-token-title" style={styles.modalTitle}>
              Enable caller names?
            </h3>
            <p style={styles.modalText}>
              One or more templates use{" "}
              <code style={styles.inlineCode}>{CALLERNAME_TOKEN}</code>, but
              the caller name token is not enabled.
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={removeCallerNameAndContinue}
                style={styles.modalSecondaryBtn}
              >
                Remove token
              </button>
              <button
                type="button"
                onClick={enableCallerNameAndContinue}
                style={styles.modalPrimaryBtn}
              >
                Enable token
              </button>
            </div>
          </div>
        </div>
      )}
    </StageShell>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "auto",
    minHeight: "100%",
  },
  templatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
    flex: "0 0 auto",
    overflow: "visible",
    paddingRight: 0,
  },
  tokenHelper: {
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    color: "var(--ta-muted-strong)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: "1.5",
    padding: "12px",
  },
  helperTitle: {
    color: "var(--ta-green)",
    fontWeight: 800,
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
  },
  helperList: {
    margin: 0,
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  exampleNotice: {
    marginTop: "-10px",
    color: "var(--ta-muted-strong)",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    minHeight: "244px",
  },
  dragPlaceholder: {
    opacity: 0.22,
    pointerEvents: "none",
  },
  dragOverlay: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    position: "fixed",
    zIndex: 2000,
    pointerEvents: "none",
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.34)",
    borderColor: "rgba(79, 159, 104, 0.5)",
    overflow: "hidden",
  },
  overlayTitleField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: 0,
  },
  overlayTitle: {
    width: "100%",
    background: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "6px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    padding: "7px 9px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  overlayBody: {
    flex: 1,
    background: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    minHeight: "80px",
    fontFamily: "var(--font-body)",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
  },
  draggingCard: {
    borderColor: "rgba(79, 159, 104, 0.5)",
    boxShadow: "0 16px 34px rgba(0, 0, 0, 0.28)",
    opacity: 0.96,
    pointerEvents: "none",
    position: "relative",
    zIndex: 5,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
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
  titleField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: 0,
  },
  examplePill: {
    alignSelf: "flex-start",
    border: "1px solid color-mix(in srgb, var(--ta-red) 52%, transparent)",
    color: "var(--ta-red)",
    borderRadius: "999px",
    padding: "2px 6px",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(9px * var(--reachout-text-scale, 1))",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  examplePillRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleInput: {
    width: "100%",
    background: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "6px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    outline: "none",
    padding: "7px 9px",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  bodyTextarea: {
    flex: 1,
    background: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    padding: "8px",
    borderRadius: "6px",
    resize: "vertical",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    minHeight: "118px",
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  tokenChipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "-2px",
  },
  tokenChip: {
    border: "1px solid rgba(79, 159, 104, 0.34)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    color: "var(--ta-green)",
    borderRadius: "999px",
    padding: "5px 8px",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(10.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    cursor: "pointer",
  },
  tokenFixNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    borderRadius: "8px",
    padding: "8px 10px",
  },
  tokenFixText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  inlineCode: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-cream)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
  },
  tokenFixBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    color: "var(--ta-green)",
    borderRadius: "7px",
    padding: "6px 9px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
  },
  addCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "20px",
  },
  addLabel: {
    marginTop: "8px",
    color: "var(--ta-green)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  tipsBanner: {
    display: "flex",
    backgroundColor: "var(--ta-gray-dark)",
    border: "1px solid rgba(79, 159, 104, 0.18)",
    borderRadius: "12px",
    padding: "16px",
    gap: "16px",
    alignItems: "center",
  },
  infoIconWrapper: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipsTextContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  tipsTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
  },
  tipsText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
    lineHeight: "1.5",
  },
  code: {
    fontFamily: "var(--font-mono)",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--ta-border-subtle)",
    paddingTop: "16px",
    marginTop: "auto",
  },
  backBtn: {
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-medium)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
  },
  continueBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "var(--border-glow)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1400,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  modal: {
    width: "min(390px, 100%)",
    border: "1px solid rgba(79, 159, 104, 0.3)",
    borderRadius: "14px",
    backgroundColor: "var(--modal-card-bg)",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  modalTitle: {
    color: "var(--ta-green)",
    fontSize: "calc(23px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: 0,
  },
  modalText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: 0,
  },
  modalActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  modalSecondaryBtn: {
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  modalPrimaryBtn: {
    border: "1px solid var(--ta-green)",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
};
