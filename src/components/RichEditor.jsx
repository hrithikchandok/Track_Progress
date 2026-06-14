import { useEffect, useRef } from 'react';
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import 'highlight.js/styles/github-dark.css';

const lowlight = createLowlight(common);

// Languages offered in the code-block dropdown (all present in lowlight `common`).
const LANGS = ['auto', 'javascript', 'typescript', 'python', 'java', 'json', 'bash', 'sql', 'css', 'xml', 'go', 'rust', 'cpp', 'csharp', 'php', 'ruby', 'yaml', 'markdown'];

// Code block with a language picker (React NodeView). The picker is editor-only.
function CodeBlockView({ node, updateAttributes, editor }) {
  const editable = editor.isEditable;
  const language = node.attrs.language || 'auto';
  return (
    <NodeViewWrapper className={`cb-wrapper${editable ? ' cb-editable' : ''}`}>
      {editable && (
        <select
          className="cb-lang"
          contentEditable={false}
          value={language}
          onChange={e => updateAttributes({ language: e.target.value === 'auto' ? null : e.target.value })}
        >
          {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({
  lowlight,
  // Keyboard escape hatches so the cursor is never stuck in a code block:
  exitOnArrowDown: true,   // ArrowDown at the end drops into a paragraph below
  exitOnTripleEnter: true, // three Enters breaks out
});

function makeExtensions(editable) {
  return [
    StarterKit.configure({
      codeBlock: false, // replaced by CodeBlockLowlight
    }),
    CodeBlock,
    Link.configure({
      openOnClick: !editable,
      autolink: true,
      protocols: ['http', 'https', 'mailto'],
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'heading' ? 'Heading' : "Write, or press '/' for the + menu on an empty line…",
    }),
  ];
}

// Toolbar button helper
function Btn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`re-btn${active ? ' active' : ''}`}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ content, editable = true, onChange }) {
  const editor = useEditor({
    editable,
    extensions: makeExtensions(editable),
    content: content || '',
    editorProps: { attributes: { class: 'rich-content' } },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  });

  // For read-only views the content arrives async — push it in once it's ready.
  // (Skip in editable mode so we never clobber the user's cursor.)
  const last = useRef(null);
  useEffect(() => {
    if (!editor || editable) return;
    if (content && content !== last.current) {
      last.current = content;
      editor.commands.setContent(content, false);
    }
  }, [editor, editable, content]);

  if (!editor) return null;

  if (!editable) return <EditorContent editor={editor} />;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt('Image URL (https://…)');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  // Clicking the empty space below the content moves the cursor OUT of whatever
  // it was in (e.g. a trailing code block) and into a normal paragraph at the
  // end — creating one if the last node isn't already an empty paragraph.
  const escapeToParagraphBelow = () => {
    const { state } = editor;
    const last = state.doc.lastChild;
    const isEmptyPara = last && last.type.name === 'paragraph' && last.content.size === 0;
    if (isEmptyPara) {
      editor.chain().focus('end').run();
    } else {
      editor.chain().insertContentAt(state.doc.content.size, { type: 'paragraph' }).focus('end').run();
    }
  };

  return (
    <div className="rich-editor">
      {/* Floating toolbar on text selection */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 120 }} className="re-bubble">
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><b>B</b></Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><i>i</i></Btn>
        <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">{'<>'}</Btn>
        <span className="re-sep" />
        <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">H</Btn>
        <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">&ldquo;</Btn>
        <Btn active={editor.isActive('link')} onClick={setLink} title="Link">🔗</Btn>
      </BubbleMenu>

      {/* "+" insert menu on empty lines */}
      <FloatingMenu editor={editor} tippyOptions={{ duration: 120, placement: 'left-start' }} className="re-floating">
        <span className="re-floating-plus">+</span>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">{'</>'}</Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">&ldquo;</Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">—</Btn>
        <Btn onClick={addImage} title="Image">🖼</Btn>
      </FloatingMenu>

      <EditorContent editor={editor} />
      <div className="re-clickzone" onClick={escapeToParagraphBelow} aria-hidden="true" />
    </div>
  );
}

// Serialize helpers for callers that want to persist the document.
export function editorToJSON(editor) { return editor?.getJSON() ?? null; }
export function editorToHTML(editor) { return editor?.getHTML() ?? ''; }
