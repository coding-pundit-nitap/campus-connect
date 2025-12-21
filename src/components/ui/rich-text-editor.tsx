"use client";

import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo,
  Undo,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
function saveSelection(containerEl: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return null;

  return range.cloneRange();
}

function restoreSelection(range: Range | null): void {
  if (!range) return;
  const selection = window.getSelection();
  if (!selection) return;

  selection.removeAllRanges();
  selection.addRange(range);
}

function wrapSelectionWithTag(tagName: string, containerEl: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return;

  if (range.collapsed) return;

  const wrapper = document.createElement(tagName);
  try {
    range.surroundContents(wrapper);
  } catch {
    const contents = range.extractContents();
    wrapper.appendChild(contents);
    range.insertNode(wrapper);
  }

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  selection.addRange(newRange);
}

function insertBlockElement(tagName: string, containerEl: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return;

  const selectedText = range.toString() || "";
  const block = document.createElement(tagName);
  block.textContent = selectedText;

  range.deleteContents();
  range.insertNode(block);

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(block);
  newRange.collapse(false);
  selection.addRange(newRange);
}

function insertTextAtCaret(text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertList(ordered: boolean, containerEl: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return;

  const listTag = ordered ? "ol" : "ul";
  const list = document.createElement(listTag);
  const li = document.createElement("li");

  if (range.collapsed) {
    li.innerHTML = "<br>";
  } else {
    li.textContent = range.toString();
    range.deleteContents();
  }

  list.appendChild(li);
  range.insertNode(list);

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(li);
  newRange.collapse(true);
  selection.addRange(newRange);
}

interface HistoryState {
  html: string;
  savedRange: { startOffset: number; endOffset: number } | null;
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Write your description...",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value);

  const historyRef = useRef<HistoryState[]>([
    { html: value || "", savedRange: null },
  ]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  const isEmpty = useMemo(() => {
    return !value || value === "<br>" || value.trim() === "";
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  const pushToHistory = useCallback((html: string) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex < history.length - 1) {
      history.splice(currentIndex + 1);
    }

    if (history[currentIndex]?.html !== html) {
      history.push({ html, savedRange: null });
      historyIndexRef.current = history.length - 1;
    }

    if (history.length > 50) {
      history.shift();
      historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
    }
  }, []);

  const undo = useCallback(() => {
    if (!editorRef.current || historyIndexRef.current <= 0) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = state.html;
    lastValueRef.current = state.html;
    onChange(state.html);
  }, [onChange]);

  const redo = useCallback(() => {
    if (
      !editorRef.current ||
      historyIndexRef.current >= historyRef.current.length - 1
    )
      return;

    isUndoRedoRef.current = true;
    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = state.html;
    lastValueRef.current = state.html;
    onChange(state.html);
  }, [onChange]);

  const exec = useCallback(
    (command: string) => {
      if (disabled || !editorRef.current) return;

      const savedRange = saveSelection(editorRef.current);
      editorRef.current.focus();
      restoreSelection(savedRange);

      switch (command) {
        case "bold":
          wrapSelectionWithTag("strong", editorRef.current);
          break;
        case "italic":
          wrapSelectionWithTag("em", editorRef.current);
          break;
        case "heading":
          insertBlockElement("h3", editorRef.current);
          break;
        case "insertUnorderedList":
          insertList(false, editorRef.current);
          break;
        case "insertOrderedList":
          insertList(true, editorRef.current);
          break;
        case "undo":
          undo();
          return;
        case "redo":
          redo();
          return;
      }

      const html = editorRef.current.innerHTML;
      onChange(html);
      lastValueRef.current = html;
      pushToHistory(html);
    },
    [disabled, onChange, undo, redo, pushToHistory]
  );

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
    pushToHistory(html);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    insertTextAtCaret(text);

    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
      pushToHistory(html);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      redo();
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border bg-background",
        isFocused && "ring-2 ring-ring ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          title="Bold"
          onClick={() => exec("bold")}
          disabled={disabled}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          title="Italic"
          onClick={() => exec("italic")}
          disabled={disabled}
        />

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          title="Heading"
          onClick={() => exec("heading")}
          disabled={disabled}
        />

        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          title="Bullet List"
          onClick={() => exec("insertUnorderedList")}
          disabled={disabled}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          title="Numbered List"
          onClick={() => exec("insertOrderedList")}
          disabled={disabled}
        />

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          icon={<Undo className="h-4 w-4" />}
          title="Undo"
          onClick={() => exec("undo")}
          disabled={disabled}
        />
        <ToolbarButton
          icon={<Redo className="h-4 w-4" />}
          title="Redo"
          onClick={() => exec("redo")}
          disabled={disabled}
        />
      </div>

      <div className="relative">
        {isEmpty && !isFocused && (
          <div className="absolute inset-0 p-3 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          className={cn(
            "min-h-[120px] p-3 focus:outline-none prose prose-sm max-w-none",
            "dark:prose-invert",
            "[&_h3]:text-lg [&_h3]:font-semibold"
          )}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (editorRef.current) {
              const html = editorRef.current.innerHTML;
              if (html !== lastValueRef.current) {
                lastValueRef.current = html;
                onChange(html);
              }
            }
            onBlur?.();
          }}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
    </Button>
  );
}
