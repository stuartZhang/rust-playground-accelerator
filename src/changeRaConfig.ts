import * as vscode from 'vscode';
import * as _ from 'lodash'; // eslint-disable-line @typescript-eslint/naming-convention

interface ChangeRaConfigFn {
  isCancel: boolean;
  features: string;
  (): Promise<void>;
}
let queue: Promise<void> = Promise.resolve();
let queue4Fn: ChangeRaConfigFn[] = [];
export function main(localFileRelPath: string, raFeatures: string[], outputChannel: vscode.OutputChannel)/* 更新 rust-analyzer 的 features 配置 */{
  // 构造 ChangeRaConfigFn 实例
  const core: ChangeRaConfigFn = async (): Promise<void> => {
    if (core.isCancel) {
      outputChannel.appendLine(`[INFO][changeRaConfig]放弃对 ${localFileRelPath} 的 cargo features（${raFeatures.join()}） 调整`);
      return;
    }
    // 查看 rust-analyzer 配置项是否与新配置值不同。
    let raConfig = vscode.workspace.getConfiguration('rust-analyzer.cargo');
    if (_.isEqual(raFeatures, raConfig.get('features'))) {
      return;
    }
    outputChannel.appendLine(`[INFO][changeRaConfig]正在激活新 ${localFileRelPath} 的 cargo features（${raFeatures.join()}）`);
    const release = vscode.window.setStatusBarMessage(`[rpa]正在激活新 cargo features：${raFeatures.join()}`);
    try {
      // 修改工作区配置文件
      await raConfig.update('features', raFeatures, vscode.ConfigurationTarget.Workspace /* 仅修改工作区配置 */);
      raConfig = vscode.workspace.getConfiguration('rust-analyzer.cargo');
      const newRaFeatures: string[] = raConfig.get('features') ?? [];
      if (_.isEqual(raFeatures, newRaFeatures)) {
        // 触发 rust-analyzer 重新加载。通过试验，似乎不执行这步也没事，反而速度更快了。
        await vscode.commands.executeCommand('rust-analyzer.reloadWorkspace');
        outputChannel.appendLine(`[INFO][changeRaConfig]已为 ${localFileRelPath} 的 ${raFeatures.join()} 重载 rust-analyzer`);
      } else {
        outputChannel.appendLine(`[INFO][changeRaConfig]已为 ${localFileRelPath} 的 ${raFeatures.join()} 已过期（最新为 ${newRaFeatures.join()}），放弃重载 rust-analyzer`);
      }
    } catch (err) {
      const error = err as Error | undefined;
      outputChannel.appendLine(`[ERROR][changeRaConfig]为 ${localFileRelPath} 修改 rust-analyzer 配置失败: ${error?.stack ?? error?.message ?? error}`);
    } finally {
      release.dispose();
    }
  };
  core.isCancel = false; // 默认正常执行 core 函数体。当 isCancel 被置为 true 时，由放弃执行当前 core 函数体。
  core.features = raFeatures.join(); // 判断是否放弃执行 core 函数体的指标。即，它欲修改至的目标 cargo features 字符串（以逗号分隔）。
  //
  queue4Fn.filter((fn, index) => index > 0 && fn.features === raFeatures.join()).forEach(fn => {
    // 若队列中存在与当前 core 函数体欲修改至的目标 cargo features 字符串（以逗号分隔）相同的项，则将其 isCancel 置为 true。
    // 注意：此条件过滤不包括首数组项，因为它已经正在被处理中了。
    fn.isCancel = true;
  });
  outputChannel.appendLine(`[INFO][changeRaConfig][始]-待处理项还有 ${queue4Fn.filter(fn => !fn.isCancel).length} 个`);
  queue4Fn.push(core);
  return queue = queue.then(core, core).finally(() => {
    queue4Fn.shift();
    outputChannel.appendLine(`[INFO][changeRaConfig][终]-待处理项还有 ${queue4Fn.filter(fn => !fn.isCancel).length} 个`);
  });
}
export function destroy() {
  queue4Fn = [];
}
