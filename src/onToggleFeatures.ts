import * as vscode from 'vscode';
import { main as changeRaConfig } from './changeRaConfig';
import { cache, cacheData } from './onDidChangeActiveTextEditor';

export async function main(localFileRelPath: string, cachedFeatures: cache.Features, outputChannel: vscode.OutputChannel) {
    // 3. 弹出多选列表（canPickMany: true 允许选择多个）
    const selectedFeatures = await vscode.window.showQuickPick(cachedFeatures.optional.map(feature => ({
      label: feature,
      picked: cachedFeatures.optionalActive.includes(feature)
    })), {
      canPickMany: true,
      title: "调整可选 Cargo Features"
    });
    // 4. 处理用户选择（如果用户取消选择则返回）
    if (localFileRelPath !== cacheData.fileName || !selectedFeatures) {
        return;
    }
    // 提取勾选的 feature 名称
    cachedFeatures.optionalActive = selectedFeatures.map(item => item.label);
    const raFeatures = cachedFeatures.required.concat(cachedFeatures.optionalActive);
    outputChannel.appendLine(`[INFO][onToggleFeatures]为 ${localFileRelPath} 调整后的 cargo features 有 ${raFeatures.join()}`);
    // 5. 更新 rust-analyzer 配置（示例：合并到现有 features 中）
    await changeRaConfig(localFileRelPath, raFeatures/* 实际可能需要与现有 features 合并 */, outputChannel);
}