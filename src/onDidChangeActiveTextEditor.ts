import * as path from 'path';
import * as vscode from 'vscode';
import { main as changeRaConfig } from './changeRaConfig';

namespace config {
  export interface Features {
    required?: string[];
    optional?: string[];
    defaultCount4Optional?: number; // 默认值为 1
  }
  export interface Entry {
    features?: Features | string[];
  }
  export type Mappings = Record<string, Entry | undefined>;
}
export namespace cache {
  export interface Features {
    required: string[];
    optional: string[];
    optionalActive: string[];
  }
  export type Mappings = Record<string, Features | undefined>;
  export interface Data {
    fileName?: string;
    mappings: Mappings;
    features: Features | undefined;
    reset: () => void;
  }
}
export const cacheData: cache.Data = {
  fileName: undefined,
  mappings: {},
  get features() {
    return this.fileName ? this.mappings[this.fileName] : undefined;
  },
  reset() {
    this.fileName = undefined;
    this.mappings = {};
  }

};
// 根据文件类型/路径修改配置
function core(config4Entry: config.Entry, outputChannel: vscode.OutputChannel, localFileRelPath: string, statusBarItem: vscode.StatusBarItem) {
  // 查找当前文件对应的 features（默认空数组，即不激活任何可选依赖）
  let features = config4Entry.features;
  if (!features) {
    outputChannel.appendLine('[WARN][onDidChangeActiveTextEditor]在 mappings 配置表内，未找到名为 features 清单');
    return;
  }
  let raFeatures: string[];
  if (Array.isArray(features)) {
    raFeatures = features.filter((feature) => !!feature);
    statusBarItem.hide();
  } else {
    let cachedFeatures: cache.Features;
    if (cacheData.mappings[localFileRelPath]) {
      cachedFeatures = cacheData.mappings[localFileRelPath];
    } else {
      const optional = features.optional?.filter((feature) => !!feature) ?? [];
      let count = features.defaultCount4Optional ?? 1;
      count = Math.min(Math.max(0, count), optional.length);
      const optionalActive = optional.slice(0, count);
      cachedFeatures = cacheData.mappings[localFileRelPath] = {
        required: features.required?.filter((feature) => !!feature) ?? [],
        optional,
        optionalActive
      };
    }
    raFeatures = cachedFeatures.required.concat(cachedFeatures.optionalActive);
    if (cachedFeatures.optional.length > 0) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }
  if (raFeatures.length <= 0) {
    outputChannel.appendLine(`[WARN][onDidChangeActiveTextEditor]聚合后 ${localFileRelPath} 的 cargo features 为空`);
    return;
  }
  // 更新 rust-analyzer 的 features 配置
  return changeRaConfig(localFileRelPath, raFeatures, outputChannel);
}
export function main(editor: vscode.TextEditor, outputChannel: vscode.OutputChannel, statusBarItem: vscode.StatusBarItem) {
    const fileLanguage = editor.document.languageId; // 语言类型（如 rust、javascript）
    if (fileLanguage !== 'rust') {
      return;
    }
    // 确认 rust-analyzer 插件是否有安装并激活
    const rustAnalyzerExtension = vscode.extensions.getExtension('rust-lang.rust-analyzer');
    if (!rustAnalyzerExtension || !rustAnalyzerExtension.isActive) {
      outputChannel.appendLine('[WARN][onDidChangeActiveTextEditor]未安装 rust-analyzer 插件。rust-playground-accelerator 不能正常地运行');
      return;
    }
    // 读取插件配置表
    const config4Rpf: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('rust-playground-accelerator');
    if (!config4Rpf) {
      outputChannel.appendLine('[WARN][onDidChangeActiveTextEditor]在 .vscode/settings.json 内，未找到名为 rust-playground-accelerator 的根配置表');
      return;
    }
    const mappings: config.Mappings | undefined = config4Rpf.get('mappings');
    if (mappings) {
      let config4Entry: config.Entry | undefined;
      const filePath = editor.document.uri.fsPath; // 文件路径
      // 基于工作区根路径计算相对路径
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      const fileRelPath = workspaceFolder ? path.relative(workspaceFolder.uri.fsPath, filePath) : undefined;
      // 再判断是否属于 src/bin 直接子文件
      [cacheData.fileName, config4Entry] = Object.entries(mappings).find(([fileName]) =>
        path.join('src', 'bin', fileName) === fileRelPath ||
        fileName === "main.rs" && path.join('src', fileName) === fileRelPath
      ) ?? [];
      // 查找当前活跃文件对应的配置表（默认空）
      if (!cacheData.fileName || !config4Entry) {
        return;
      }
      outputChannel.appendLine(`[INFO][onDidChangeActiveTextEditor]打开 ${cacheData.fileName}`);
      // 根据文件类型/路径动态修改配置
      return core(config4Entry, outputChannel, cacheData.fileName, statusBarItem);
    }
    outputChannel.appendLine(`[WARN][onDidChangeActiveTextEditor]就 ${cacheData.fileName} 文件，在 .vscode/settings.json 内，未找到名为 rust-playground-accelerator.mappings 的功能配置表`);
}
