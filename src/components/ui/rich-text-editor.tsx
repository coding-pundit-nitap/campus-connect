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
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your description...",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value);

  const isEmpty = useMemo(() => {
    return !value || value === "<br>" || value.trim() === "";
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  const exec = useCallback(
    (command: string, cmdValue?: string) => {
      if (disabled || !editorRef.current) return;

      editorRef.current.focus();

      if (command === "heading") {
        document.execCommand(
          "insertHTML",
          false,
          "<h3>" + window.getSelection()?.toString() + "</h3>"
        );
      } else {
        document.execCommand(command, false, cmdValue);
      }

      const html = editorRef.current.innerHTML;
      onChange(html);
      lastValueRef.current = html;
    },
    [disabled, onChange]
  );

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
