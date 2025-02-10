# permscan README

This extension scans all permissions in your project so that you will not miss or forget any declared permissions while coding.

## Features

Describe specific features of your extension, including screenshots of your extension in action. Image paths are relative to this README file.

For example, if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

This extension contributes the following settings:

- `permscan.enable`: Enable/disable this extension.
- `permscan.patterns`: An array of regex patterns for matching permissions.
- `permscan.excludeFiles`: An array of file extensions to exclude from scanning.
- `permscan.includeFiles`: An array of file extensions to include in scanning.

### Example `settings.json`

```json
{
  "permscan.enable": true,
  "permscan.patterns": [
    "has_permission\\(['\"].*?['\"]\\)",
    "can\\(['\"].*?['\"]\\)"
  ],
  "permscan.excludeFiles": [".json", ".md"],
  "permscan.includeFiles": [".js", ".ts", ".php"]
}
```

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of permscan.

---

## Following extension guidelines

Ensure that you've read through the extension guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
