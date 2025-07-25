import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const EMOJI_OPTIONS = [
  '😀', '😃', '😄', '😁', '😊', '😍', '🤩', '😎', '😋', '😌',
  '👍', '👎', '👌', '✌️', '🤝', '👏', '🙌', '💪', '🔥', '⭐',
  '❤️', '💚', '💙', '💜', '🧡', '💛', '💖', '💕', '💯', '✅',
  '🏠', '🚗', '⛵', '🎸', '📚', '🎮', '👕', '🛠️', '🌱', '🏖️'
];

const COLORS = [
  '#000000', '#374151', '#7C3AED', '#DC2626', '#EA580C', 
  '#CA8A04', '#16A34A', '#0891B2', '#C2410C', '#BE185D'
];

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your description...", 
  maxLength,
  className = ""
}: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentLength, setCurrentLength] = useState(0);

  // Update character count when content changes
  useEffect(() => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      setCurrentLength(textContent.length);
    }
  }, [value]);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      
      // Check max length
      if (maxLength && textContent.length > maxLength) {
        return; // Don't update if over limit
      }
      
      onChange(content);
    }
  };

  const insertEmoji = (emoji: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(emoji));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback: append to end
      if (editorRef.current) {
        editorRef.current.innerHTML += emoji;
      }
    }
    updateContent();
    setShowEmojiPicker(false);
  };

  const applyColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent input if at max length (except backspace/delete)
    if (maxLength && currentLength >= maxLength) {
      if (!['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const formatButtons = [
    { command: 'bold', icon: 'B', title: 'Bold', style: 'font-weight: bold' },
    { command: 'italic', icon: 'I', title: 'Italic', style: 'font-style: italic' },
    { command: 'underline', icon: 'U', title: 'Underline', style: 'text-decoration: underline' },
    { command: 'strikeThrough', icon: 'S', title: 'Strikethrough', style: 'text-decoration: line-through' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
  ];

  return (
    <div className={`border border-gray-300 rounded-[25px_25px_25px_5px] overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Format buttons */}
        {formatButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onClick={() => execCommand(btn.command)}
            className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            title={btn.title}
            style={{ fontSize: '14px' }}
          >
            <span style={{ ...(btn.style ? {} : {}) }} dangerouslySetInnerHTML={{ __html: btn.icon }} />
          </button>
        ))}

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* List buttons */}
        {listButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onClick={() => execCommand(btn.command)}
            className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Color picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Text Color"
          >
            🎨
          </button>
          
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-10 p-2 bg-white border border-gray-300 rounded shadow-lg">
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Add Emoji"
          >
            😀
          </button>
          
          {showEmojiPicker && (
            <div className="absolute top-8 right-0 z-10 p-2 bg-white border border-gray-300 rounded shadow-lg w-64">
              <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                {EMOJI_OPTIONS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-6 h-6 text-sm hover:bg-gray-100 rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Character counter */}
        {maxLength && (
          <div className="ml-auto text-xs text-gray-500">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-3 min-h-32 max-h-64 overflow-y-auto focus:outline-none"
        style={{ fontSize: '14px', lineHeight: '1.5' }}
        onInput={updateContent}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Click outside handlers */}
      {(showEmojiPicker || showColorPicker) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowEmojiPicker(false);
            setShowColorPicker(false);
          }}
        />
      )}

      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
} 