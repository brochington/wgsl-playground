export function createEditor(settings) {
  const editor = CodeMirror.fromTextArea(
    document.getElementById('shader-editor'),
    {
      lineNumbers: true,
      mode: 'rust',
      theme: 'dracula',
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      lineWrapping: settings.wordWrap,
      matchBrackets: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      extraKeys: {
        'Cmd-/': 'toggleComment',
        'Ctrl-/': 'toggleComment',
      },
    }
  );

  document.querySelector(
    '.CodeMirror'
  ).style.fontSize = `${settings.fontSize}px`;

  // Force a refresh to ensure theme is applied
  setTimeout(() => {
    editor.refresh();
  }, 100);

  return editor;
}