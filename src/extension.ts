import * as vscode from 'vscode';
import * as _ from 'lodash'; // eslint-disable-line @typescript-eslint/naming-convention
import { main as onToggleFeatures } from './onToggleFeatures';
import { destroy as destroyChangeRaConfig } from './changeRaConfig';
import { cacheData, main as onDidChangeActiveTextEditor} from './onDidChangeActiveTextEditor';

export function activate(context: vscode.ExtensionContext) {
  // 1. 创建日志输出频道
  const outputChannel = vscode.window.createOutputChannel('rust-playground-accelerator');
  context.subscriptions.push(outputChannel);
  outputChannel.appendLine('[INFO][extension] 扩展已激活');
  // 2. 创建状态栏项
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right/* 显示在右侧 */, 100 /* 优先级（值越大越靠右） */);
  statusBarItem.text = "$(pencil) 改变可选 Features"; // 显示文本（带齿轮图标）
  statusBarItem.tooltip = "[rust-playground-accelerator]点击调整可选 Cargo Features";
  statusBarItem.command = "rust-playground-accelerator.toggleFeatures"; // 绑定点击命令
  context.subscriptions.push(statusBarItem);
  // 3. 注册状态栏点击事件对应的命令
  context.subscriptions.push(vscode.commands.registerCommand("rust-playground-accelerator.toggleFeatures", () => {
    if (!cacheData.fileName || !cacheData.features || cacheData.features.optional.length <= 0) {
      return;
    }
    return onToggleFeatures(cacheData.fileName, cacheData.features, outputChannel);
  }));
  // 4. 监听「活动编辑器变化」事件（即文件切换）
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
      return;
    }
    return onDidChangeActiveTextEditor(editor, outputChannel, statusBarItem);
  }));
  // 5. 监听 .vscode/settings.json 变化
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('rust-playground-accelerator.mappings')) {
      cacheData.reset(); // 清空缓存
      if (vscode.window.activeTextEditor)/* 若当前有活跃编辑器，重新处理 */{
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor, outputChannel, statusBarItem);
      }
    }
  }));
}
export function deactivate() {
  cacheData.reset();
  destroyChangeRaConfig();
}
