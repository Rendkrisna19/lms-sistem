import { useId, useRef, useState } from "react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ACCEPTED_IMAGE_TYPES } from "../../features/quiz/useImageUpload";

function ToolbarButton({ label, icon: Icon, isActive, disabled, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive ?? undefined}
      disabled={disabled}
      // Cegah editor kehilangan seleksi saat tombol diklik
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        isActive ? "bg-brand-100 text-brand-700" : "hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />;

export function EditorToolbar({ editor, variant = "full", onPickImage, isUploading }) {
  const isFull = variant === "full";
  const fileInputRef = useRef(null);
  const linkInputId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      subscript: e.isActive("subscript"),
      superscript: e.isActive("superscript"),
      code: e.isActive("code"),
      heading: e.isActive("heading", { level: 3 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      link: e.isActive("link"),
      alignLeft: e.isActive({ textAlign: "left" }),
      alignCenter: e.isActive({ textAlign: "center" }),
      alignRight: e.isActive({ textAlign: "right" }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const openLink = () => {
    setLinkUrl(editor.getAttributes("link").href || "https://");
    setLinkOpen(true);
  };

  const applyLink = (event) => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!url || url === "https://") {
      chain().extendMarkRange("link").unsetLink().run();
    } else if (/^(https?:\/\/|mailto:)/i.test(url)) {
      chain().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  };

  return (
    <div
      className={cn(
        "border-b border-slate-200 bg-slate-50/70 rounded-t-xl",
        // Toolbar ringkas hanya muncul saat editor aktif agar daftar pilihan tetap rapi
        !isFull && "hidden group-focus-within/editor:block"
      )}
    >
      <div role="toolbar" aria-label="Format teks" className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
        <ToolbarButton label="Tebal (Ctrl+B)" icon={Bold} isActive={state.bold} onClick={() => chain().toggleBold().run()} />
        <ToolbarButton label="Miring (Ctrl+I)" icon={Italic} isActive={state.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolbarButton label="Garis bawah (Ctrl+U)" icon={UnderlineIcon} isActive={state.underline} onClick={() => chain().toggleUnderline().run()} />
        {isFull && <ToolbarButton label="Coret" icon={Strikethrough} isActive={state.strike} onClick={() => chain().toggleStrike().run()} />}
        <ToolbarButton label="Subskrip (mis. H₂O)" icon={SubscriptIcon} isActive={state.subscript} onClick={() => chain().toggleSubscript().run()} />
        <ToolbarButton label="Superskrip (mis. x²)" icon={SuperscriptIcon} isActive={state.superscript} onClick={() => chain().toggleSuperscript().run()} />

        {isFull && (
          <>
            <Divider />
            <ToolbarButton label="Subjudul" icon={Heading3} isActive={state.heading} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
            <ToolbarButton label="Daftar berpoin" icon={List} isActive={state.bulletList} onClick={() => chain().toggleBulletList().run()} />
            <ToolbarButton label="Daftar bernomor" icon={ListOrdered} isActive={state.orderedList} onClick={() => chain().toggleOrderedList().run()} />
            <Divider />
            <ToolbarButton label="Rata kiri" icon={AlignLeft} isActive={state.alignLeft} onClick={() => chain().setTextAlign("left").run()} />
            <ToolbarButton label="Rata tengah" icon={AlignCenter} isActive={state.alignCenter} onClick={() => chain().setTextAlign("center").run()} />
            <ToolbarButton label="Rata kanan" icon={AlignRight} isActive={state.alignRight} onClick={() => chain().setTextAlign("right").run()} />
            <Divider />
            <ToolbarButton label="Kode / rumus" icon={Code} isActive={state.code} onClick={() => chain().toggleCode().run()} />
            <ToolbarButton label="Kutipan" icon={Quote} isActive={state.blockquote} onClick={() => chain().toggleBlockquote().run()} />
            <ToolbarButton label="Tautan" icon={Link2} isActive={state.link} onClick={openLink} />
          </>
        )}

        {onPickImage && (
          <>
            <Divider />
            <ToolbarButton
              label={isUploading ? "Mengunggah gambar..." : "Sisipkan gambar"}
              icon={isUploading ? Loader2 : ImagePlus}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onPickImage(file);
              }}
            />
          </>
        )}

        {isFull && (
          <div className="ml-auto flex items-center">
            <ToolbarButton label="Urungkan (Ctrl+Z)" icon={Undo2} disabled={!state.canUndo} onClick={() => chain().undo().run()} />
            <ToolbarButton label="Ulangi (Ctrl+Y)" icon={Redo2} disabled={!state.canRedo} onClick={() => chain().redo().run()} />
          </div>
        )}
      </div>

      {linkOpen && (
        <form onSubmit={applyLink} className="flex items-center gap-2 border-t border-slate-200 px-2 py-2">
          <label htmlFor={linkInputId} className="sr-only">
            Alamat tautan
          </label>
          <input
            id={linkInputId}
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setLinkOpen(false)}
            placeholder="https://contoh.com"
            className="h-8 flex-1 rounded-lg border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="h-8 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700">
            Terapkan
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-8 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100">
            Batal
          </button>
        </form>
      )}
    </div>
  );
}
