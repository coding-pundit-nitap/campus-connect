"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo,
  Undo,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Write your description...",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],

    content: value || "",
    editable: !disabled,

    editorProps: {
      attributes: {
        class: cn(
          "min-h-[120px] p-3",
          "focus:outline-none",
          "prose prose-sm max-w-none",
          "dark:prose-invert"
        ),
      },
    },

    onUpdate: ({ editor }) => {
      onChange(sanitizeHTML(editor.getHTML()));
    },

    onFocus: () => {
      setFocused(true);
    },

    onBlur: () => {
      setFocused(false);
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();

    if (currentHtml !== value) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border bg-background transition-shadow",
        focused && "ring-2 ring-ring ring-offset-2",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          title="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />

        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          title="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          title="Heading"
          active={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />

        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          title="Bullet List"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />

        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          title="Numbered List"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          icon={<Undo className="h-4 w-4" />}
          title="Undo"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />

        <ToolbarButton
          icon={<Redo className="h-4 w-4" />}
          title="Redo"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  icon,
  title,
  onClick,
  disabled,
  active = false,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-accent text-accent-foreground"
      )}
    >
      {icon}
    </Button>
  );
}
