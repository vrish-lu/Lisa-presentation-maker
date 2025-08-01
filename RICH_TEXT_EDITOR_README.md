# Rich Text Editor Implementation

This project now includes a comprehensive rich text editor similar to Gamma.app, featuring both block-based and Tiptap-based editing approaches.

## Features

### 🎯 Core Features
- **Block-based Editing**: Each content block is individually editable, similar to Notion and Gamma.app
- **Floating Toolbar**: Context-aware formatting toolbar that appears when text is selected
- **Rich Formatting**: Support for headings (H1-H3), paragraphs, bullet/numbered lists, bold, italic, underline
- **Text Alignment**: Left, center, and right alignment options
- **Color Support**: Text color customization (in Tiptap editor)
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Real-time Updates**: Instant content updates with onChange callbacks

### 🎨 UI/UX Features
- **Clean Interface**: Modern, clean design inspired by Gamma.app
- **Smooth Animations**: Smooth transitions and hover effects
- **Focus States**: Clear visual feedback for selected blocks
- **Add Block Buttons**: Easy addition of new content blocks
- **Keyboard Navigation**: Enter to add new blocks, Backspace to delete empty blocks

## Components Structure

### Atoms
- **`RichTextBlock.tsx`**: Individual editable text blocks with formatting support

### Molecules
- **`FloatingToolbar.tsx`**: Context-aware formatting toolbar
- **`RichTextDemoButton.tsx`**: Demo launcher button

### Organisms
- **`RichTextEditor.tsx`**: Block-based rich text editor
- **`TiptapEditor.tsx`**: Advanced Tiptap-based rich text editor

## Usage

### Basic Usage

```tsx
import RichTextEditor, { TextBlock } from './components/organisms/RichTextEditor';

const MyComponent = () => {
  const [content, setContent] = useState<TextBlock[]>([]);

  return (
    <RichTextEditor
      initialContent={content}
      onChange={setContent}
      placeholder="Start typing..."
    />
  );
};
```

### Tiptap Editor Usage

```tsx
import TiptapEditor from './components/organisms/TiptapEditor';

const MyComponent = () => {
  const [content, setContent] = useState('');

  return (
    <TiptapEditor
      initialContent={content}
      onChange={setContent}
      placeholder="Start typing..."
    />
  );
};
```

## Demo

Access the rich text editor demo by clicking the "Rich Text Editor Demo" button in the top-right corner of the main application.

The demo showcases:
- Block-based editor with individual editable blocks
- Tiptap editor with advanced formatting
- Real-time content updates
- Floating toolbar functionality
- Mobile-responsive design

## Technical Implementation

### Block-based Editor
- Uses React state management for block content
- Custom contentEditable implementation
- Manual text selection handling
- Block-level formatting controls

### Tiptap Editor
- Built on Tiptap.js framework
- Bubble menu for formatting
- Real-time HTML output
- Advanced text selection handling

### Styling
- Tailwind CSS for styling
- Custom CSS for ProseMirror (Tiptap)
- Responsive design patterns
- Smooth animations and transitions

## Dependencies

The rich text editor uses the following key dependencies:
- `@tiptap/react`: React integration for Tiptap
- `@tiptap/starter-kit`: Basic Tiptap extensions
- `@tiptap/extension-text-align`: Text alignment support
- `@tiptap/extension-text-style`: Text styling support
- `@tiptap/extension-font-size`: Font size control
- `@tiptap/extension-underline`: Underline formatting
- `@tiptap/extension-link`: Link support

## Customization

### Adding New Block Types
1. Extend the `TextBlock` interface in `RichTextEditor.tsx`
2. Add rendering logic in `RichTextBlock.tsx`
3. Update the toolbar options in `FloatingToolbar.tsx`

### Styling Customization
- Modify CSS classes in `index.css`
- Update Tailwind classes in component files
- Customize ProseMirror styles for Tiptap editor

### Formatting Options
- Add new formatting buttons to `FloatingToolbar.tsx`
- Implement formatting logic in the respective editors
- Update the format change handlers

## Browser Support

The rich text editor supports:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- ContentEditable support required

## Performance Considerations

- Block-based editor: Efficient for large documents with many blocks
- Tiptap editor: Optimized for real-time editing and complex formatting
- Lazy loading of editor components
- Debounced onChange handlers for better performance

## Future Enhancements

Potential improvements and additions:
- Image support and media embedding
- Table support
- Code block highlighting
- Collaborative editing
- Version history
- Export to various formats (PDF, DOCX, etc.)
- Custom themes and styling options
- Advanced keyboard shortcuts
- Undo/redo functionality 