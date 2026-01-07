"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEditMarkerGutter = exports.createCommentEditDetectionListenerGutter = exports.createCommentEditDetectionListener = exports.createCommentHintDebounceListener = exports.createCommentHintPlugin = exports.createHandleGenerate = exports.generateESQLFromPrompt = exports.commentHintState = exports.setCommentHintEffect = exports.generatedCommentsState = exports.isRegenerationAnnotation = exports.markBlockEditedEffect = exports.removeGeneratedBlockEffect = exports.addGeneratedBlockEffect = void 0;
const state_1 = require("@codemirror/state");
const view_1 = require("@codemirror/view");
const state_2 = require("@codemirror/state");
exports.addGeneratedBlockEffect = state_1.StateEffect.define();
exports.removeGeneratedBlockEffect = state_1.StateEffect.define(); // commentLine
exports.markBlockEditedEffect = state_1.StateEffect.define();
// Annotation to mark regeneration transactions (should skip edit detection)
exports.isRegenerationAnnotation = state_1.Annotation.define();
exports.generatedCommentsState = state_1.StateField.define({
    create() {
        return new Map();
    },
    update(value, tr) {
        // Early return if no relevant effects and no doc changes
        const hasRelevantEffects = tr.effects.some(e => e.is(exports.addGeneratedBlockEffect) ||
            e.is(exports.removeGeneratedBlockEffect) ||
            e.is(exports.markBlockEditedEffect));
        if (!hasRelevantEffects && !tr.docChanged) {
            return value;
        }
        // If there are no blocks and no add effects, return early
        if (value.size === 0 && !hasRelevantEffects) {
            return value;
        }
        let newMap = new Map(value);
        let hasAddEffect = false;
        // Process effects
        if (hasRelevantEffects) {
            for (const effect of tr.effects) {
                if (effect.is(exports.addGeneratedBlockEffect)) {
                    const { commentLine, codeLines, originalCommentText } = effect.value;
                    newMap.set(commentLine, {
                        commentLine,
                        codeLines: new Set(codeLines),
                        editType: 'none',
                        originalCommentText,
                    });
                    hasAddEffect = true;
                }
                else if (effect.is(exports.removeGeneratedBlockEffect)) {
                    newMap.delete(effect.value);
                }
                else if (effect.is(exports.markBlockEditedEffect)) {
                    const { commentLine, editType } = effect.value;
                    const block = newMap.get(commentLine);
                    if (block) {
                        newMap.set(commentLine, { ...block, editType });
                    }
                }
            }
        }
        // Adjust line numbers if document changed (lines added/deleted)
        // SKIP adjustment if we just added a new block - the line numbers are already correct
        // SKIP if no blocks exist
        if (tr.docChanged && newMap.size > 0 && !hasAddEffect) {
            const oldLineCount = tr.startState.doc.lines;
            const newLineCount = tr.newDoc.lines;
            const lineCountChanged = oldLineCount !== newLineCount;
            if (lineCountChanged) {
                const updatedMap = new Map();
                newMap.forEach((block, oldCommentLine) => {
                    try {
                        // Map comment line by position
                        const oldCommentLineObj = tr.startState.doc.line(oldCommentLine);
                        const newCommentPos = tr.changes.mapPos(oldCommentLineObj.from);
                        const newCommentLine = tr.newDoc.lineAt(newCommentPos);
                        // Check if comment line still contains a comment (starts with //)
                        const commentLineText = newCommentLine.text.trim();
                        if (!commentLineText.startsWith('//')) {
                            // Comment was deleted, don't track this block anymore
                            console.log('[Tracking] Comment line deleted, removing tracking for line', oldCommentLine);
                            return;
                        }
                        // Map code lines by position
                        const newCodeLines = new Set();
                        block.codeLines.forEach(oldCodeLine => {
                            try {
                                const oldCodeLineObj = tr.startState.doc.line(oldCodeLine);
                                const newCodePos = tr.changes.mapPos(oldCodeLineObj.from);
                                const newCodeLineObj = tr.newDoc.lineAt(newCodePos);
                                newCodeLines.add(newCodeLineObj.number);
                            }
                            catch (e) {
                                // Code line no longer exists, skip it
                            }
                        });
                        // Only keep block if it still has code lines
                        if (newCodeLines.size > 0) {
                            updatedMap.set(newCommentLine.number, {
                                commentLine: newCommentLine.number,
                                codeLines: newCodeLines,
                                editType: block.editType,
                                originalCommentText: block.originalCommentText,
                            });
                        }
                    }
                    catch (e) {
                        // Comment line no longer exists, skip it
                        console.log('[Tracking] Comment line no longer exists, removing tracking for line', oldCommentLine);
                    }
                });
                newMap = updatedMap;
            }
            else {
                // Line count didn't change, but check if any tracked comments were deleted/modified
                const updatedMap = new Map();
                newMap.forEach((block, commentLine) => {
                    try {
                        const commentLineObj = tr.newDoc.line(commentLine);
                        const commentLineText = commentLineObj.text.trim();
                        // Check if the line still contains a comment
                        if (commentLineText.startsWith('//')) {
                            // Comment still exists, keep the block
                            updatedMap.set(commentLine, block);
                        }
                        else {
                            // Comment was deleted (user cleared the line), don't track anymore
                            console.log('[Tracking] Comment text removed on line', commentLine, '- removing tracking');
                        }
                    }
                    catch (e) {
                        // Line no longer exists, skip it
                        console.log('[Tracking] Comment line no longer accessible, removing tracking for line', commentLine);
                    }
                });
                newMap = updatedMap;
            }
        }
        return newMap;
    },
});
// State for showing comment hint
exports.setCommentHintEffect = state_1.StateEffect.define();
exports.commentHintState = state_1.StateField.define({
    create() {
        return false;
    },
    update(value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(exports.setCommentHintEffect)) {
                return effect.value;
            }
        }
        return value;
    },
});
// Generate fake ES|QL code based on prompt
const generateESQLFromPrompt = (prompt) => {
    const lowerPrompt = prompt.toLowerCase();
    // Helper function to extract field name after "by"
    const extractFieldAfterBy = (text) => {
        // Match patterns like "by field.name" or "by field_name"
        const byMatch = text.match(/\bby\s+([\w\.]+)/i);
        return byMatch ? byMatch[1] : null;
    };
    // Simple pattern matching for demo purposes
    if (lowerPrompt.includes("order") && lowerPrompt.includes("client")) {
        const field = extractFieldAfterBy(lowerPrompt) || "client_id";
        return `FROM orders | STATS COUNT(*) BY ${field}`;
    }
    if (lowerPrompt.includes("error") || lowerPrompt.includes("errors")) {
        const field = extractFieldAfterBy(lowerPrompt) || "host.name";
        return `FROM logs-* | WHERE log.level == "error" | STATS COUNT() BY ${field}`;
    }
    if (lowerPrompt.includes("top") || lowerPrompt.includes("most")) {
        const field = extractFieldAfterBy(lowerPrompt) || "message";
        return `FROM logs-* | STATS count = COUNT() BY ${field} | SORT count DESC | LIMIT 10`;
    }
    if (lowerPrompt.includes("last") || lowerPrompt.includes("recent")) {
        return "FROM logs-* | SORT @timestamp DESC | LIMIT 100";
    }
    if (lowerPrompt.includes("time") || lowerPrompt.includes("hour")) {
        return 'FROM logs-* | STATS count = COUNT() BY bucket(@timestamp, "1h")';
    }
    // Default response
    return 'FROM logs-* | WHERE KQL("""' + prompt + '""") | LIMIT 100';
};
exports.generateESQLFromPrompt = generateESQLFromPrompt;
// Handle comment generation (both initial and regeneration)
const createHandleGenerate = (editorViewRef, onChange, hasCalledEditCallbackRef) => {
    return (commentText, lineNumber) => {
        console.log("handleGenerate called with:", { commentText, lineNumber });
        if (!editorViewRef.current) {
            console.log("No editor view ref");
            return;
        }
        const view = editorViewRef.current;
        // Clear the callback tracking for this comment line (allow callback to fire again after regeneration)
        if (hasCalledEditCallbackRef) {
            hasCalledEditCallbackRef.current.delete(lineNumber);
        }
        try {
            console.log("Total lines in doc:", view.state.doc.lines);
            // Find the comment line
            const commentLine = view.state.doc.line(lineNumber);
            const commentLineText = commentLine.text;
            console.log("Comment line text:", commentLineText);
            // Check if this is a regeneration (comment has (*)) or initial generation
            const isRegeneration = /^\s*\/\/\s*\(\*\)/.test(commentLineText);
            console.log("Is regeneration:", isRegeneration);
            // Extract the prompt
            let prompt = "";
            if (isRegeneration) {
                const promptMatch = commentLineText.match(/^\s*\/\/\s*\(\*\)\s*(.+)$/);
                prompt = promptMatch ? promptMatch[1] : commentText;
            }
            else {
                const promptMatch = commentLineText.match(/^\s*\/\/\s*(.+)$/);
                prompt = promptMatch ? promptMatch[1] : commentText;
            }
            console.log("Extracted prompt:", prompt);
            // Generate code based on the prompt
            const newGeneratedCode = (0, exports.generateESQLFromPrompt)(prompt);
            console.log("New generated code:", newGeneratedCode);
            if (isRegeneration) {
                // REGENERATION: Wipe all old code and insert new code
                // Get tracked blocks to find all old code lines
                const trackedBlocks = view.state.field(exports.generatedCommentsState);
                const block = trackedBlocks.get(lineNumber);
                let replaceFrom = commentLine.from;
                let replaceTo = commentLine.to;
                if (block && block.codeLines.size > 0) {
                    // Find the range of all code lines to replace (including trailing newline)
                    const maxCodeLine = Math.max(...Array.from(block.codeLines));
                    const lastCodeLineObj = view.state.doc.line(maxCodeLine);
                    // Include the newline after the last code line if there's more content after
                    replaceTo = maxCodeLine < view.state.doc.lines ? lastCodeLineObj.to + 1 : lastCodeLineObj.to;
                    console.log("Found tracked block with code lines:", Array.from(block.codeLines));
                    console.log("Will replace from line", lineNumber, "to line", maxCodeLine, "(includes newline:", maxCodeLine < view.state.doc.lines, ")");
                }
                else {
                    // Fallback: try to find the next line if it's ES|QL code
                    const nextLineNumber = lineNumber + 1;
                    if (nextLineNumber <= view.state.doc.lines) {
                        const codeLine = view.state.doc.line(nextLineNumber);
                        const isESQLCode = /^\s*(FROM|ROW|SHOW)/i.test(codeLine.text);
                        if (isESQLCode) {
                            // Include the newline after the code line if there's more content after
                            replaceTo = nextLineNumber < view.state.doc.lines ? codeLine.to + 1 : codeLine.to;
                            console.log("No tracked block, but found ES|QL code on next line");
                        }
                    }
                }
                // Clean up the comment (remove (*) or [outdated] marker)
                const cleanCommentText = commentLineText.replace(/\(\*\)\s*|\[outdated\]\s*/g, '');
                const newText = `${cleanCommentText}\n${newGeneratedCode}`;
                console.log("Wiping old code from", replaceFrom, "to", replaceTo);
                console.log("Inserting new text:", newText);
                // Count the number of lines in the new generated code
                const codeLineCount = newGeneratedCode.split('\n').length;
                const codeLineNumbers = Array.from({ length: codeLineCount }, (_, i) => lineNumber + 1 + i);
                view.dispatch({
                    changes: { from: replaceFrom, to: replaceTo, insert: newText },
                    effects: [
                        // Remove old tracking
                        exports.removeGeneratedBlockEffect.of(lineNumber),
                        // Track the comment and its newly generated code lines
                        exports.addGeneratedBlockEffect.of({
                            commentLine: lineNumber,
                            codeLines: codeLineNumbers,
                            originalCommentText: cleanCommentText,
                        })
                    ],
                });
                // Update parent component
                onChange(view.state.doc.toString());
                console.log("Regeneration complete - TRACKING comment:", lineNumber, "code:", codeLineNumbers);
            }
            else {
                // INITIAL GENERATION: Insert code below comment
                const changes = [
                    // Insert generated code on the next line
                    { from: commentLine.to, insert: `\n${newGeneratedCode}` },
                ];
                console.log("Dispatching changes (initial generation):", changes);
                // After insertion, the code will start at lineNumber + 1
                const codeLineCount = newGeneratedCode.split('\n').length;
                const codeLineNumbers = Array.from({ length: codeLineCount }, (_, i) => lineNumber + 1 + i);
                view.dispatch({
                    changes,
                    effects: [
                        // Track this comment and its generated code lines
                        exports.addGeneratedBlockEffect.of({
                            commentLine: lineNumber,
                            codeLines: codeLineNumbers,
                            originalCommentText: commentLineText,
                        })
                    ],
                });
                // Update parent component
                onChange(view.state.doc.toString());
                console.log("Initial generation complete - TRACKING comment:", lineNumber, "code:", codeLineNumbers);
            }
        }
        catch (e) {
            console.error("Error generating code:", e);
        }
    };
};
exports.createHandleGenerate = createHandleGenerate;
// Create inline hint widget for comment lines
const createCommentHintPlugin = (textSubdued, visorState, commentHintState) => {
    class CommentHintWidget extends view_1.WidgetType {
        hintText;
        constructor(hintText) {
            super();
            this.hintText = hintText;
        }
        toDOM() {
            const span = document.createElement("span");
            span.textContent = this.hintText;
            span.style.color = textSubdued;
            span.style.fontStyle = "italic";
            span.style.pointerEvents = "none";
            span.style.userSelect = "none";
            span.style.marginLeft = "8px";
            return span;
        }
    }
    return view_1.ViewPlugin.fromClass(class {
        decorations;
        constructor(view) {
            this.decorations = this.buildDecorations(view);
        }
        update(update) {
            // Check if commentHintState changed
            const oldHintState = update.startState.field(commentHintState);
            const newHintState = update.state.field(commentHintState);
            const hintStateChanged = oldHintState !== newHintState;
            // Only rebuild decorations if hint state changed, focus changed, or cursor moved to different line
            if (hintStateChanged || update.focusChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
            else if (update.selectionSet || update.docChanged) {
                // Check if cursor moved to a different line
                const oldLine = update.startState.doc.lineAt(update.startState.selection.main.head).number;
                const newLine = update.state.doc.lineAt(update.state.selection.main.head).number;
                if (oldLine !== newLine) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }
        }
        buildDecorations(view) {
            const builder = new state_2.RangeSetBuilder();
            const hintState = view.state.field(commentHintState);
            // Only show hint if editor has focus, visor is not open, and commentHintState is true
            if (!view.hasFocus || view.state.field(visorState).open || !hintState) {
                return builder.finish();
            }
            const { state } = view;
            const cursorPos = state.selection.main.head;
            const line = state.doc.lineAt(cursorPos);
            const lineText = line.text;
            // Check if current line is a comment with actual content
            const isComment = /^\s*\/\//.test(lineText);
            // Extract content after // (and optional (*))
            const commentMatch = lineText.match(/^\s*\/\/\s*(?:\(\*\)\s*)?(.+)$/);
            const hasContent = commentMatch && commentMatch[1].trim().length > 0;
            // Check if this comment has been edited (is tracked and has editType that is not 'none')
            const trackedBlocks = state.field(exports.generatedCommentsState);
            const block = trackedBlocks.get(line.number);
            const isEdited = block && block.editType !== 'none';
            // Show hint if comment is edited/outdated OR if it's a new untracked comment
            const isNewComment = !block;
            if (isComment && hasContent && (isEdited || isNewComment)) {
                // Get the end of the line content (after the last visible character)
                const widget = view_1.Decoration.widget({
                    widget: new CommentHintWidget("(cmd+k to generate)"),
                    side: 1,
                });
                // Add the widget at the end of the line
                builder.add(line.to, line.to, widget);
            }
            return builder.finish();
        }
    }, {
        decorations: (v) => v.decorations,
    });
};
exports.createCommentHintPlugin = createCommentHintPlugin;
// Create update listener for debouncing comment hints
const createCommentHintDebounceListener = (commentHintTimerRef, editorViewRef) => {
    return view_1.EditorView.updateListener.of((update) => {
        // Hide hint while typing or moving cursor, then show after delay
        if (update.docChanged || update.selectionSet) {
            const currentHintState = update.view.state.field(exports.commentHintState);
            // Only dispatch hide effect if hint is currently visible
            if (currentHintState) {
                update.view.dispatch({
                    effects: exports.setCommentHintEffect.of(false),
                });
            }
            // Clear existing timer
            if (commentHintTimerRef.current) {
                clearTimeout(commentHintTimerRef.current);
            }
            // Set a new timer to show hint after user stops typing/moving
            commentHintTimerRef.current = setTimeout(() => {
                if (editorViewRef.current) {
                    editorViewRef.current.dispatch({
                        effects: exports.setCommentHintEffect.of(true),
                    });
                }
            }, 500); // Wait 500ms after user stops typing/moving
        }
    });
};
exports.createCommentHintDebounceListener = createCommentHintDebounceListener;
// Create update listener for detecting edits to generated comments or code
const createCommentEditDetectionListener = (editedBlocksRef, commentEditTimerRef, editorViewRef, onChange) => {
    return view_1.EditorView.updateListener.of((update) => {
        if (update.docChanged && update.transactions.some(tr => tr.isUserEvent('input'))) {
            const trackedBlocks = update.state.field(exports.generatedCommentsState);
            // Skip if no tracked blocks
            if (trackedBlocks.size === 0) {
                return;
            }
            // Build a reverse map for faster code line lookup (line -> commentLine)
            const codeLineToComment = new Map();
            for (const [commentLine, block] of trackedBlocks) {
                for (const codeLine of block.codeLines) {
                    codeLineToComment.set(codeLine, commentLine);
                }
            }
            // Check if any tracked comment or code line was modified
            update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
                // Find which lines were affected by this change
                const affectedLineStart = update.startState.doc.lineAt(fromA).number;
                const affectedLineEnd = toA > fromA ? update.startState.doc.lineAt(toA).number : affectedLineStart;
                for (let lineNum = affectedLineStart; lineNum <= affectedLineEnd; lineNum++) {
                    // Check if this line is a comment line
                    if (trackedBlocks.has(lineNum)) {
                        editedBlocksRef.current.set(lineNum, 'comment');
                    }
                    else if (codeLineToComment.has(lineNum)) {
                        // This is a code line - get its comment line from the map
                        const commentLine = codeLineToComment.get(lineNum);
                        editedBlocksRef.current.set(commentLine, 'code');
                    }
                }
            });
            // Clear existing timer
            if (commentEditTimerRef.current) {
                clearTimeout(commentEditTimerRef.current);
            }
            // Set a new timer to apply markers after user stops typing
            commentEditTimerRef.current = setTimeout(() => {
                if (editorViewRef.current && editedBlocksRef.current.size > 0) {
                    const view = editorViewRef.current;
                    const trackedBlocks = view.state.field(exports.generatedCommentsState);
                    const effects = [];
                    const changes = [];
                    editedBlocksRef.current.forEach((editType, commentLine) => {
                        const block = trackedBlocks.get(commentLine);
                        if (block) {
                            try {
                                const line = view.state.doc.line(commentLine);
                                const lineText = line.text;
                                // Check if it's a comment and doesn't already have the marker
                                if (lineText.trim().startsWith('//')) {
                                    if (editType === 'comment' && !lineText.includes('(*)')) {
                                        // Comment was edited - add (*) marker
                                        const match = lineText.match(/^(\s*\/\/\s*)/);
                                        if (match) {
                                            const prefix = match[1];
                                            const content = lineText.slice(prefix.length).replace(/\[outdated\]\s*/g, '');
                                            const newText = `${prefix}(*) ${content}`;
                                            changes.push({ from: line.from, to: line.to, insert: newText });
                                            effects.push(exports.markBlockEditedEffect.of({ commentLine, editType: 'comment' }));
                                        }
                                    }
                                    else if (editType === 'code' && !lineText.includes('[outdated]')) {
                                        // Code was edited - add [outdated] marker
                                        const match = lineText.match(/^(\s*\/\/\s*)/);
                                        if (match) {
                                            const prefix = match[1];
                                            const content = lineText.slice(prefix.length).replace(/\(\*\)\s*/g, '');
                                            const newText = `${prefix}[outdated] ${content}`;
                                            changes.push({ from: line.from, to: line.to, insert: newText });
                                            effects.push(exports.markBlockEditedEffect.of({ commentLine, editType: 'code' }));
                                        }
                                    }
                                }
                            }
                            catch (e) {
                                console.error("Error processing edited block:", e);
                            }
                        }
                    });
                    // Apply all changes at once
                    if (changes.length > 0 || effects.length > 0) {
                        view.dispatch({
                            changes,
                            effects,
                        });
                        onChange(view.state.doc.toString());
                    }
                    editedBlocksRef.current.clear();
                }
            }, 1000); // Wait 1 second after user stops typing
        }
    });
};
exports.createCommentEditDetectionListener = createCommentEditDetectionListener;
// Create update listener for gutter mode - tracks edits but doesn't apply inline markers
const createCommentEditDetectionListenerGutter = (editedBlocksRef, commentEditTimerRef, editorViewRef, onEditGeneratedCode, hasCalledEditCallbackRef) => {
    return view_1.EditorView.updateListener.of((update) => {
        // Skip edit detection for regeneration transactions
        const isRegeneration = update.transactions.some(tr => tr.annotation(exports.isRegenerationAnnotation));
        if (isRegeneration) {
            return;
        }
        if (update.docChanged && update.transactions.some(tr => tr.isUserEvent('input'))) {
            const trackedBlocks = update.state.field(exports.generatedCommentsState);
            // Skip if no tracked blocks
            if (trackedBlocks.size === 0) {
                return;
            }
            let hasEditedTrackedLine = false;
            let newlyEditedCommentLines = [];
            // Build a reverse map for faster code line lookup (line -> commentLine)
            const codeLineToComment = new Map();
            for (const [commentLine, block] of trackedBlocks) {
                for (const codeLine of block.codeLines) {
                    codeLineToComment.set(codeLine, commentLine);
                }
            }
            // Check if any tracked comment or code line was modified
            update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
                // Find which lines were affected by this change
                const affectedLineStart = update.startState.doc.lineAt(fromA).number;
                const affectedLineEnd = toA > fromA ? update.startState.doc.lineAt(toA).number : affectedLineStart;
                console.log(`[Gutter Edit] Change detected on lines ${affectedLineStart}-${affectedLineEnd}`);
                for (let lineNum = affectedLineStart; lineNum <= affectedLineEnd; lineNum++) {
                    // Check if this line is a comment line
                    if (trackedBlocks.has(lineNum)) {
                        console.log(`[Gutter Edit] Line ${lineNum} is a tracked comment line`);
                        editedBlocksRef.current.set(lineNum, 'comment');
                        hasEditedTrackedLine = true;
                        // Track if this is the first edit for this comment line
                        if (hasCalledEditCallbackRef && !hasCalledEditCallbackRef.current.has(lineNum)) {
                            newlyEditedCommentLines.push(lineNum);
                        }
                    }
                    else if (codeLineToComment.has(lineNum)) {
                        // This is a code line - get its comment line from the map
                        const commentLine = codeLineToComment.get(lineNum);
                        console.log(`[Gutter Edit] Line ${lineNum} is tracked code, comment is line ${commentLine}`);
                        editedBlocksRef.current.set(commentLine, 'code');
                        hasEditedTrackedLine = true;
                        // Track if this is the first edit for this comment line
                        if (hasCalledEditCallbackRef && !hasCalledEditCallbackRef.current.has(commentLine)) {
                            newlyEditedCommentLines.push(commentLine);
                        }
                    }
                }
            });
            // Call callback ONLY ONCE per comment block (first edit only)
            if (newlyEditedCommentLines.length > 0 && onEditGeneratedCode) {
                console.log('[Gutter Edit] Calling onEditGeneratedCode for lines:', newlyEditedCommentLines);
                onEditGeneratedCode();
                // Mark these comment lines as having triggered the callback
                if (hasCalledEditCallbackRef) {
                    newlyEditedCommentLines.forEach(lineNum => {
                        hasCalledEditCallbackRef.current.add(lineNum);
                    });
                }
            }
            // Clear existing timer
            if (commentEditTimerRef.current) {
                clearTimeout(commentEditTimerRef.current);
            }
            // Set a new timer to mark blocks without text changes
            commentEditTimerRef.current = setTimeout(() => {
                if (editorViewRef.current && editedBlocksRef.current.size > 0) {
                    const view = editorViewRef.current;
                    const trackedBlocks = view.state.field(exports.generatedCommentsState);
                    const effects = [];
                    console.log('[Gutter Edit] Timer fired, editedBlocks:', Array.from(editedBlocksRef.current.entries()));
                    console.log('[Gutter Edit] Tracked blocks:', Array.from(trackedBlocks.entries()).map(([line, block]) => ({ line, editType: block.editType })));
                    editedBlocksRef.current.forEach((editType, commentLine) => {
                        const block = trackedBlocks.get(commentLine);
                        console.log(`[Gutter Edit] Checking line ${commentLine}: block exists=${!!block}, editType=${block?.editType}`);
                        if (block && block.editType === 'none') {
                            // Only mark if not already marked
                            console.log(`[Gutter Edit] Marking line ${commentLine} as edited (type: ${editType})`);
                            effects.push(exports.markBlockEditedEffect.of({ commentLine, editType }));
                        }
                    });
                    console.log('[Gutter Edit] Dispatching effects:', effects.length);
                    // Apply effects (no text changes)
                    if (effects.length > 0) {
                        view.dispatch({ effects });
                    }
                    editedBlocksRef.current.clear();
                }
            }, 1000); // Wait 1 second after user stops typing
        }
    });
};
exports.createCommentEditDetectionListenerGutter = createCommentEditDetectionListenerGutter;
// ============================================
// GUTTER MARKER IMPLEMENTATION
// ============================================
// Store current theme state (updated when gutter is created)
let currentIsDarkMode = false;
let currentTextDanger = '#FF5A52';
let currentTextSuccess = '#56C569';
// Track all active tooltips so we can clean them up
let activeTooltips = new Set();
// Escape HTML to prevent XSS
const escapeHtml = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
// Simple word-level diff function
const computeDiff = (oldStr, newStr) => {
    const oldWords = oldStr.split(/(\s+)/); // Split by whitespace but keep the whitespace
    const newWords = newStr.split(/(\s+)/);
    // Find common prefix
    let prefixLen = 0;
    while (prefixLen < oldWords.length && prefixLen < newWords.length && oldWords[prefixLen] === newWords[prefixLen]) {
        prefixLen++;
    }
    // Find common suffix
    let suffixLen = 0;
    while (suffixLen < oldWords.length - prefixLen &&
        suffixLen < newWords.length - prefixLen &&
        oldWords[oldWords.length - 1 - suffixLen] === newWords[newWords.length - 1 - suffixLen]) {
        suffixLen++;
    }
    // Extract parts and escape HTML
    const commonPrefix = escapeHtml(oldWords.slice(0, prefixLen).join(''));
    const commonSuffix = escapeHtml(oldWords.slice(oldWords.length - suffixLen).join(''));
    const removedPart = escapeHtml(oldWords.slice(prefixLen, oldWords.length - suffixLen).join(''));
    const addedPart = escapeHtml(newWords.slice(prefixLen, newWords.length - suffixLen).join(''));
    // Build HTML using theme colors
    const oldHtml = commonPrefix +
        (removedPart ? `<span style="text-decoration: line-through; color: ${currentTextDanger};">${removedPart}</span>` : '') +
        commonSuffix;
    const newHtml = commonPrefix +
        (addedPart ? `<span style="color: ${currentTextSuccess};">${addedPart}</span>` : '') +
        commonSuffix;
    return { oldHtml, newHtml };
};
// Helper function to clean up all active tooltips
const cleanupAllTooltips = () => {
    activeTooltips.forEach(tooltip => {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    });
    activeTooltips.clear();
};
// Helper function to create and show custom tooltip with diff
const showCustomTooltip = (element, text, originalText, currentText) => {
    const tooltip = document.createElement("div");
    tooltip.className = "custom-gutter-tooltip";
    // Use the stored theme state
    const isDarkMode = currentIsDarkMode;
    // Theme-responsive colors
    const tooltipBgColor = isDarkMode ? '#1a1c20' : '#FFFFFF'; // Dark gray in dark mode, WHITE in light mode
    const tooltipTextColor = isDarkMode ? '#DFE5EF' : '#000000'; // Light gray in dark mode, BLACK in light mode
    // If we have diff information, show it
    if (originalText && currentText && originalText !== currentText) {
        // Compute word-level diff
        const { oldHtml, newHtml } = computeDiff(originalText, currentText);
        // Create diff view
        tooltip.innerHTML = `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <div style="margin-bottom: 4px; font-size: 11px; opacity: 0.7;">Comment edited:</div>
        <div style="margin-bottom: 4px;">${oldHtml}</div>
        <div>${newHtml}</div>
        <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">Press Cmd+K to regenerate</div>
      </div>
    `;
    }
    else {
        // Fallback to simple text
        tooltip.textContent = text;
    }
    tooltip.style.cssText = `
    position: fixed;
    background: ${tooltipBgColor};
    color: ${tooltipTextColor};
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    z-index: 10000;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
    document.body.appendChild(tooltip);
    // Track this tooltip
    activeTooltips.add(tooltip);
    // Position tooltip relative to marker
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 12}px`;
    tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)}px`;
    // Fade in
    requestAnimationFrame(() => {
        tooltip.style.opacity = "1";
    });
    return tooltip;
};
const hideCustomTooltip = (tooltip) => {
    if (tooltip) {
        tooltip.style.opacity = "0";
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            // Remove from active tooltips set
            activeTooltips.delete(tooltip);
        }, 200);
    }
};
// Gutter marker for comment edits (shows a distinctive icon)
class CommentEditMarker extends view_1.GutterMarker {
    color;
    originalText;
    currentText;
    tooltip = null;
    constructor(color, originalText, currentText) {
        super();
        this.color = color;
        this.originalText = originalText;
        this.currentText = currentText;
    }
    toDOM() {
        const marker = document.createElement("div");
        marker.style.cssText = `
      width: 4px;
      height: 20px;
      background: ${this.color};
      margin: auto;
      cursor: pointer;
    `;
        marker.addEventListener("mouseenter", () => {
            this.tooltip = showCustomTooltip(marker, "Comment edited - regenerate code with Cmd+K", this.originalText, this.currentText);
        });
        marker.addEventListener("mouseleave", () => {
            hideCustomTooltip(this.tooltip);
            this.tooltip = null;
        });
        return marker;
    }
}
// Gutter marker for code edits (shows a different icon)
class CodeEditMarker extends view_1.GutterMarker {
    color;
    tooltip = null;
    constructor(color) {
        super();
        this.color = color;
    }
    toDOM() {
        const marker = document.createElement("div");
        marker.style.cssText = `
      width: 6px;
      height: 20px;
      border-radius: 2px;
      background: ${this.color};
      margin: auto;
      cursor: pointer;
    `;
        marker.addEventListener("mouseenter", () => {
            this.tooltip = showCustomTooltip(marker, "Generated code edited - regenerate from comment with Cmd+K");
        });
        marker.addEventListener("mouseleave", () => {
            hideCustomTooltip(this.tooltip);
            this.tooltip = null;
        });
        return marker;
    }
}
// Create the gutter extension for edit markers
const createEditMarkerGutter = (commentEditColor, codeEditColor, isDarkMode, textDanger, textSuccess) => {
    // Store the theme state for tooltips to use
    currentIsDarkMode = isDarkMode;
    if (textDanger)
        currentTextDanger = textDanger;
    if (textSuccess)
        currentTextSuccess = textSuccess;
    // Create a single marker for code edits (no diff needed)
    const codeMarker = new CodeEditMarker(codeEditColor);
    return [
        // The gutter configuration
        (0, view_1.gutter)({
            class: "cm-edit-markers",
            markers: (view) => {
                const trackedBlocks = view.state.field(exports.generatedCommentsState);
                const builder = new state_2.RangeSetBuilder();
                console.log('[Gutter Markers] Building markers, tracked blocks:', Array.from(trackedBlocks.entries()).map(([line, block]) => ({
                    line,
                    editType: block.editType,
                    hasOriginalText: !!block.originalCommentText
                })));
                // Clean up any active tooltips when gutter updates (e.g., after Cmd+K regeneration)
                cleanupAllTooltips();
                // Collect all markers with their positions, then sort by position
                const markers = [];
                trackedBlocks.forEach((block) => {
                    const { commentLine, editType, originalCommentText } = block;
                    console.log(`[Gutter Markers] Processing block at line ${commentLine}, editType: ${editType}`);
                    // Only show markers if the edit type is not 'none' and the line exists and has content
                    try {
                        const line = view.state.doc.line(commentLine);
                        const lineText = line.text;
                        const lineTrimmed = lineText.trim();
                        // Don't show marker on empty lines or non-comment lines
                        if (!lineTrimmed || !lineTrimmed.startsWith('//')) {
                            return;
                        }
                        if (editType === 'comment') {
                            // Comment was edited - show marker with diff
                            console.log(`[Gutter Markers] Adding COMMENT marker at line ${commentLine}`);
                            const commentMarker = new CommentEditMarker(commentEditColor, originalCommentText, lineText);
                            markers.push({ pos: line.from, marker: commentMarker });
                        }
                        else if (editType === 'code') {
                            // Code was edited - show marker on comment line (to indicate it's outdated)
                            console.log(`[Gutter Markers] Adding CODE marker at line ${commentLine}`);
                            markers.push({ pos: line.from, marker: codeMarker });
                        }
                        else {
                            console.log(`[Gutter Markers] Skipping line ${commentLine}, editType is '${editType}'`);
                        }
                    }
                    catch (e) {
                        console.error("Error processing marker for line", commentLine, ":", e);
                    }
                });
                // Sort by position and add to builder
                markers.sort((a, b) => a.pos - b.pos);
                markers.forEach(({ pos, marker }) => {
                    builder.add(pos, pos, marker);
                });
                return builder.finish();
            },
            initialSpacer: () => new CommentEditMarker("transparent"),
        }),
        // Add an update listener to force gutter updates when our state changes
        view_1.EditorView.updateListener.of((update) => {
            // Force re-render when our state effects fire
            if (update.transactions.some(tr => tr.effects.some(e => e.is(exports.addGeneratedBlockEffect) ||
                e.is(exports.removeGeneratedBlockEffect) ||
                e.is(exports.markBlockEditedEffect)))) {
                // Gutter will automatically update due to state change
            }
        }),
    ];
};
exports.createEditMarkerGutter = createEditMarkerGutter;
//# sourceMappingURL=commentGeneration.js.map