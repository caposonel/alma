"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import { useState } from "react";
import type { CSSProperties } from "react";

// Augment TipTap's `Storage` interface so `editor.storage.markdown` is typed.
// `tiptap-markdown` registers itself under the key `markdown` at runtime, but
// only exports the storage type — never wires it into TipTap's declarations.
declare module "@tiptap/core" {
  interface Storage {
    markdown: {
      getMarkdown(): string;
    };
  }
}

interface RichTextEditorProps {
  /** Hidden form input name — the form submits the editor's markdown under this key. */
  name: string;
  /** Initial markdown content. */
  defaultValue?: string;
  /** Placeholder shown while the editor is loading (SSR pass). */
  placeholder?: string;
}

/**
 * WYSIWYG markdown editor used inside admin forms.
 *
 * Wraps TipTap with the `tiptap-markdown` extension so the storage shape
 * stays as a plain markdown string — exactly what `lib/admin-store` already
 * persists for `body`. The hidden `<input name={name}>` carries the latest
 * markdown so the form's existing server action (`formData.get("body")`)
 * keeps working unchanged.
 *
 * Hebrew RTL: the editor uses `dir="auto"` so each block's direction is
 * detected from its first strong character — Hebrew paragraphs flow RTL,
 * English paragraphs flow LTR, mixed content behaves naturally.
 *
 * SSR / hydration: TipTap drives a `contenteditable` div, so it must only
 * render client-side. `immediatelyRender: false` tells TipTap to defer its
 * first render until after mount, avoiding the React 19 hydration mismatch
 * that would otherwise fire under the Next.js App Router.
 */
export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder,
}: RichTextEditorProps) {
  const [markdown, setMarkdown] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => {
      setMarkdown(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        style:
          "min-height: 300px; padding: 16px; outline: none; font-size: 14px; line-height: 1.7;",
        dir: "auto",
      },
    },
    // Avoid SSR hydration mismatch under Next.js App Router.
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div style={loadingStyle}>{placeholder ?? "Loading editor…"}</div>
    );
  }

  return (
    <div style={containerStyle}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {/* Hidden input — carries the current markdown for the form's server action. */}
      <input type="hidden" name={name} value={markdown} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div style={toolbarStyle}>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        “ Quote
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => {
          const previous = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("URL", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        Link
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        → R
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        L ←
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        ...toolbarButtonStyle,
        background: active ? "#FDF2F2" : "transparent",
        color: active ? "#B85959" : "#2A2A2A",
        borderColor: active ? "#E5A0A0" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 1,
        height: 20,
        background: "#E5D7C8",
        margin: "0 4px",
      }}
    />
  );
}

const containerStyle: CSSProperties = {
  border: "1px solid #E5D7C8",
  borderRadius: 4,
  background: "white",
  overflow: "hidden",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 2,
  padding: 6,
  borderBottom: "1px solid #E5D7C8",
  background: "#F5EBE0",
};

const toolbarButtonStyle: CSSProperties = {
  padding: "4px 8px",
  border: "1px solid transparent",
  borderRadius: 3,
  fontSize: 13,
  lineHeight: 1.4,
  cursor: "pointer",
  fontFamily: "inherit",
  minWidth: 28,
};

const loadingStyle: CSSProperties = {
  minHeight: 300,
  padding: 16,
  border: "1px solid #E5D7C8",
  borderRadius: 4,
  background: "white",
  color: "#9C8E84",
  fontSize: 14,
};
