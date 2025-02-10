"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Get user-defined settings from `settings.json`
 */
function getUserSettings() {
    const config = vscode.workspace.getConfiguration("permscan");
    // Load patterns from settings or use defaults
    const userPatterns = config.get("customPatterns", []);
    const PERMISSION_PATTERNS = userPatterns.length > 0
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
    const includedExtensions = config.get("includedExtensions", ["ts", "js", "php", "py", "vue", "jsx", "rb", "html", "erb", "blade"]);
    const excludedExtensions = config.get("excludedExtensions", []);
    return { patterns: PERMISSION_PATTERNS, includedExtensions, excludedExtensions };
}
/**
 * Recursively scans files for permission-related patterns.
 */
async function scanPermissions(directory, permissions, settings) {
    try {
        const files = await fs.readdir(directory);
        for (const file of files) {
            const fullPath = path.join(directory, file);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    await scanPermissions(fullPath, permissions, settings);
                }
                else {
                    const fileExt = path.extname(file).slice(1); // Get file extension (without dot)
                    if (settings.includedExtensions.includes(fileExt) &&
                        !settings.excludedExtensions.includes(fileExt)) {
                        const content = await fs.readFile(fullPath, "utf-8");
                        settings.patterns.forEach(pattern => {
                            let match;
                            while ((match = pattern.exec(content)) !== null) {
                                permissions.add(match[1]);
                            }
                        });
                    }
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    console.warn(`Skipping file: ${fullPath} - Error: ${err.message}`);
                }
                else {
                    console.warn(`Skipping file: ${fullPath} - Unknown error`);
                }
            }
        }
    }
    catch (err) {
        console.error(`Error scanning directory: ${directory}`, err);
    }
}
/**
 * Activates the extension and registers the command.
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('permscan.scan', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No open workspace found.");
            return;
        }
        const projectDir = workspaceFolders[0].uri.fsPath;
        const permissions = new Set();
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
            }
            else {
                vscode.window.showInformationMessage("No permissions found in project files.");
            }
        });
    });
    context.subscriptions.push(disposable);
}
/**
 * Deactivates the extension.
 */
function deactivate() { }
//# sourceMappingURL=extension.js.map