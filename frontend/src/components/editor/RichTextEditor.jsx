import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Placeholder } from "@tiptap/extensions";
import { EditorToolbar } from "./EditorToolbar";
import { cn } from "../../lib/utils";

function imageFiles(dataTransfer) {
  return [...(dataTransfer?.files ?? [])].filter((file) => file.type.startsWith("image/"));
}

/**
 * Editor rich text berbasis TipTap.
 *
 * - variant "full": toolbar lengkap (soal & pembahasan)
 * - variant "compact": toolbar ringkas, tampil saat fokus (pilihan jawaban)
 *
 * Gambar diunggah ke server lewat `onUploadImage(file) => Promise<url|null>`,
 * termasuk saat gambar di-paste atau di-drag ke editor.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis di sini...",
  variant = "full",
  onUploadImage,
  isUploading = false,
  invalid = false,
  id,
  ariaLabel,
  ariaDescribedBy,
  className,
  contentClassName,
  disabled = false,
}) {
  const isFull = variant === "full";
  const onChangeRef = useRef(onChange);
  const onUploadRef = useRef(onUploadImage);
  const lastEmitted = useRef(value ?? "");
  onChangeRef.current = onChange;
  onUploadRef.current = onUploadImage;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: isFull ? { levels: [3, 4] } : false,
        codeBlock: isFull ? {} : false,
        blockquote: isFull ? {} : false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 60, minHeight: 40 },
      }),
      ...(isFull ? [TextAlign.configure({ types: ["heading", "paragraph"] })] : []),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap rich-content px-3.5 py-3 focus:outline-none",
          isFull ? "min-h-[140px]" : "min-h-[44px] text-sm",
          contentClassName
        ),
        role: "textbox",
        "aria-multiline": "true",
        ...(id ? { id } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
      },
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData);
        if (!files.length || !onUploadRef.current) return false;
        event.preventDefault();
        files.forEach(async (file) => {
          const url = await onUploadRef.current(file);
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: url, alt: "" })));
        });
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = imageFiles(event.dataTransfer);
        if (!files.length || !onUploadRef.current) return false;
        event.preventDefault();
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        files.forEach(async (file) => {
          const url = await onUploadRef.current(file);
          if (!url) return;
          const node = view.state.schema.nodes.image.create({ src: url, alt: "" });
          const position = coordinates?.pos ?? view.state.selection.from;
          view.dispatch(view.state.tr.insert(Math.min(position, view.state.doc.content.size), node));
        });
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.isEmpty ? "" : instance.getHTML();
      lastEmitted.current = html;
      onChangeRef.current?.(html);
    },
  });

  // Sinkronkan bila nilai diubah dari luar (mis. data ujian selesai dimuat / soal diduplikasi)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value || "";
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const insertImage = async (file) => {
    if (!editor || !onUploadRef.current) return;
    const url = await onUploadRef.current(file);
    if (url) editor.chain().focus().setImage({ src: url, alt: "" }).run();
  };

  return (
    <div
      className={cn(
        "group/editor rounded-xl border bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-500/30",
        invalid ? "border-red-400 focus-within:border-red-500" : "border-slate-300 focus-within:border-brand-500",
        disabled && "opacity-60",
        className
      )}
      data-invalid={invalid || undefined}
    >
      {editor && (
        <EditorToolbar
          editor={editor}
          variant={variant}
          onPickImage={onUploadImage ? insertImage : undefined}
          isUploading={isUploading}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
