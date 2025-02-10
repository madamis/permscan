import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Get user-defined settings from `settings.json`
 */
function getUserSettings(): { patterns: RegExp[], includedExtensions: string[], excludedExtensions: string[] } {
    const config = vscode.workspace.getConfiguration("permscan");

    // Load patterns from settings or use defaults
    const userPatterns = config.get<string[]>("customPatterns", []);
    const PERMISSION_PATTERNS: RegExp[] = userPatterns.length > 0
        ? userPatterns.map(p => new RegExp(p, "g"))
        : [
            /has_permission\s*\(\s*['"](.*?)['"]\s*\)/g,
            /permission\s*\(\s*['"](.*?)['"]\s*\)/g,
            /authorize\s*\(\s*['"](.*?)['"]\s*\)/g,
            /can\(['"](.*?)['"]\)/g,
            /has_permission\?\(['"](.*?)['"]\)/g,
            /can_perform\s*\(\s*['"](.*?)['"]\s*\)/g,
            /performs\s*\(\s*['"](.*?)['"]\s*\)/g,
            /can_do\s*\(\s*['"](.*?)['"]\s*\)/g,
            /does\s*\(\s*['"](.*?)['"]\s*\)/g,
            /has_ability\s*\(\s*['"](.*?)['"]\s*\)/g,
            /authorized\s*\(\s*['"](.*?)['"]\s*\)/g
        ];

    // Load file extensions settings
    const includedExtensions = config.get<string[]>("includedExtensions", ["ts", "js", "php", "py", "vue", "jsx", "rb", "html", "erb", "blade"]);
    const excludedExtensions = config.get<string[]>("excludedExtensions", []);

    return { patterns: PERMISSION_PATTERNS, includedExtensions, excludedExtensions };
}

/**
 * Recursively scans files for permission-related patterns.
 */
async function scanPermissions(directory: string, permissions: Set<string>, settings: { patterns: RegExp[], includedExtensions: string[], excludedExtensions: string[] }) {
    try {
        const files = await fs.readdir(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);

            try {
                const stats = await fs.stat(fullPath);

                if (stats.isDirectory()) {
                    await scanPermissions(fullPath, permissions, settings);
                } else {
                    const fileExt = path.extname(file).slice(1); // Get file extension (without dot)

                    if (
                        settings.includedExtensions.includes(fileExt) &&
                        !settings.excludedExtensions.includes(fileExt)
                    ) {
                        const content = await fs.readFile(fullPath, "utf-8");
                        settings.patterns.forEach(pattern => {
                            let match;
                            while ((match = pattern.exec(content)) !== null) {
                                permissions.add(match[1]);
                            }
                        });
                    }
                }
            } catch (err) {
                if (err instanceof Error) {
                    console.warn(`Skipping file: ${fullPath} - Error: ${err.message}`);
                } else {
                    console.warn(`Skipping file: ${fullPath} - Unknown error`);
                }
            }
        }
    } catch (err) {
        console.error(`Error scanning directory: ${directory}`, err);
    }
}

/**
 * Activates the extension and registers the command.
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('permscan.scan', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No open workspace found.");
            return;
        }

        const projectDir = workspaceFolders[0].uri.fsPath;
        const permissions = new Set<string>();
        const settings = getUserSettings();

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Scanning for permissions...",
            cancellable: false
        }, async (progress) => {
            await scanPermissions(projectDir, permissions, settings);

            if (permissions.size > 0) {
                const outputChannel = vscode.window.createOutputChannel("Permission Scanner");
                outputChannel.clear();
                outputChannel.appendLine("Found Permissions:\n");
                permissions.forEach(perm => outputChannel.appendLine(`- ${perm}`));
                outputChannel.show();
                vscode.window.showInformationMessage(`Scan complete. Found ${permissions.size} unique permissions.`);
            } else {
                vscode.window.showInformationMessage("No permissions found in project files.");
            }
        });
    });

    context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension.
 */
export function deactivate() {}
