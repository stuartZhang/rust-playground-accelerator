import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 监听「活动编辑器变化」事件（即文件切换）
    const disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) {
            // 无打开的文件时，可重置配置（可选）
            resetConfig();
            return;
        }

        const document = editor.document;
        const filePath = document.uri.fsPath; // 文件路径
        const fileLanguage = document.languageId; // 语言类型（如 rust、javascript）

        // 根据文件类型/路径动态修改配置
        updateConfigByFile(fileLanguage, filePath);
    });

    context.subscriptions.push(disposable);
}

// 根据文件类型/路径修改配置
function updateConfigByFile(language: string, filePath: string) {
    // 获取工作区配置对象（针对 .vscode/settings.json）
    const config = vscode.workspace.getConfiguration();

    // 示例1：根据语言类型修改 tabSize
    if (language === 'rust') {
        config.update(
            'editor.tabSize', // 配置项名称
            2,                // 目标值
            vscode.ConfigurationTarget.Workspace // 仅修改工作区配置
        );
    }

    // 示例2：根据文件路径修改格式化配置
    if (filePath.includes('/special-folder/')) {
        config.update(
            'editor.formatOnSave',
            true,
            vscode.ConfigurationTarget.Workspace
        );
    } else {
        config.update(
            'editor.formatOnSave',
            false,
            vscode.ConfigurationTarget.Workspace
        );
    }
}

// 重置配置（可选）
function resetConfig() {
    const config = vscode.workspace.getConfiguration();
    config.update('editor.tabSize', 4, vscode.ConfigurationTarget.Workspace);
    config.update('editor.formatOnSave', false, vscode.ConfigurationTarget.Workspace);
}

export function deactivate() {}
