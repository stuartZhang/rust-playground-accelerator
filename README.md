# rust-playground-accelerator

插件名《`Rust`实验广场（编译）加速器》。它支持两项功能：

1. 对共享依赖且多二进制目标文件的`Cargo Package`工程，做编译加速优化。
2. 对多互斥`Cargo Features`的`Cargo Package`工程，做全‘编译路径’覆盖的开发调试。

> **名词解释**
>
> 1. 【二进制目标文件】是指在`Bin - Cargo Package`工程中，以编译输出二进制可执行文件为目标的`src/main.rs`或`src/bin/*.rs`编译入口文件。严格地讲，二进制目标文件还应包括注册于`Cargo.toml [[bin]]`配置块内任意位置编译入口文件。但，`rust-playground-accelerator`插件最新版还不适配兼容于这类二进制目标文件。
>
> 2. 【编译路径】是指基于`Cargo Features`组合的代码编译分支。就`vscode`代码编辑器内的视觉效果而言，`rust-analyzer`插件会将未开启`Cargo Features`的代码置灰，并且不显示那些代码的语法高亮与错误提示。

从原理上讲，前者是对不同的二进制目标文件，在编译前，“裁剪”共享依赖项清单，和让`rustc`“轻装上阵”；后者是借助`vscode`开放的图形界面组件（即，复选框菜单），让 @Rustacean 有机会，在编译前，按需勾选欲开发调试的`Cargo Features`。

## 插件依赖限制条件

`rust-playground-accelerator`插件完全依赖于著名的`rust-analyzer`插件，且仅在`rust-analyzer`插件被安装与激活后，才可正常地工作。更确切地讲，`rust-playground-accelerator`插件仅只依据 @Rustacean 对`vscode`代码编辑器的操作，自动调整`rust-analyzer`插件在`.vscode/settings.json`配置文件内的配置参数。进而，让底层的`cargo check / build / run`处理更高效。

## 插件的日志输出

`rust-playground-accelerator`插件在`vscode`的【输出】视图于新建了`rust-playground-accelerator`频道，以集中输出插件自身的运行时日志内容。于是，通过对`rust-playground-accelerator`频道的日志内容做截图，便可更有针对性地向插件作者报障。

### 打开插件日志输出面板

1. `Ctrl+Shift+U`弹出`vscode`的【输出】视图。
2. 从视图顶端右侧的频道下拉列表内，选择`rust-playground-accelerator`频道。

于是，便可见到如下日志输出内容了。

![输入图片说明](https://foruda.gitee.com/images/1754951454124603810/ad944545_4981249.png "屏幕截图")

## 插件配置说明

`rust-playground-accelerator`插件配置都收拢于`.vscode/settings.json`工作区配置文件内。目前，它还仅支持单一配置项 `rust-playground-accelerator.mappings`。

`rust-playground-accelerator.mappings`同时兼容**两种**配置格式，以支持**三种**`Cargo Features`的组合

1. 仅必填`Cargo Features`
2. 仅可选`Cargo Features`
3. ‘必填 + 可选’的混合式

其中的可选`Cargo Features`都能，借助`vscode`图形界面的“状态栏按钮 + 复选框菜单”组合，被按需勾选。效果如下

![输入图片说明](https://foruda.gitee.com/images/1754952079036848783/d6593df7_4981249.png "屏幕截图")

在上图中点击“改变可选Features”状态栏按钮，弹出复选框菜单。然后，在菜单内，完成勾选和点击蓝色**确定**按钮即可。

### `rust-playground-accelerator.mappings`配置格式一：“精简格式”

```json
{ // 在 .vscode/settings.json 文件内，
  "rust-playground-accelerator.mappings": {
    "二进制目标文件的文件名（比如，main.rs）": {
      "features": string[] // 必填 Cargo Feature 数组
    }
  }
}
```

举个例子，![输入图片说明](https://foruda.gitee.com/images/1754952463576721469/85256f20_4981249.png "屏幕截图")

### `rust-playground-accelerator.mappings`配置格式二：“完整格式”

```json
{ // 在 .vscode/settings.json 文件内，
  "rust-playground-accelerator.mappings": {
    "rustc二进制目标文件文件名": {
      "features": {
        "required": string[] | undefined, // 必填 Cargo Feature 数组。若不指定，就认定为没有。
        "optional": string[] | undefined, // 可选 Cargo Feature 数组，若不指定，就认定为没有。
        "defaultCount4Optional": number | undefined // 代表在【可选 Cargo Feature 数组】内，在首次编译过程中，初始生效前几项 Cargo Features。若不指定，默认值为 1。
      }
    }
  }
}
```

在上述配置块中，若`required`字段被缺省，那便是【仅可选`Cargo Features`】的使用场景。另外，若初始生效的可选`Cargo Features`不仅一个（`>= 1`），或一个都没有（`=0`个），那就调整`"defaultCount4Optional": number`配置值。例如，`"defaultCount4Optional": 0`就初始关闭了所有可选`Cargo Features`。再举个例子，

![输入图片说明](https://foruda.gitee.com/images/1754952951354719820/ea275d4a_4981249.png "屏幕截图")

## 插件使用场景介绍

### `Rust`本地`playground`实验广场

虽然[线上实验场](https://play.rust-lang.org/)已很好用了，但当涉及了

1. 生僻依赖项 — 例如，[ambassador-local-struct.rs](https://github.com/stuartZhang/my_rs_ideas_playground/blob/main/src/bin/ambassador-local-struct.rs)对`ambassador crate`的依赖。
2. 图形界面 — 例如，[libui-basic.rs](https://github.com/stuartZhang/my_rs_ideas_playground/blob/main/src/bin/libui-basic.rs)对`libui crate`的依赖。
3. `Rust ⇆ C`的`FFI`互操作 — 例如，[ffi-closure-callback.rs](https://github.com/stuartZhang/my_rs_ideas_playground/blob/main/src/bin/ffi-closure-callback.rs)与[closure_callback.c](https://github.com/stuartZhang/my_rs_ideas_playground/blob/main/native/closure_callback.c)的互操作

时，还是本地`Cargo Package`用起来更顺手。每次仅需向工程根目录下的`src/bin`文件夹内添加新`*.rs`文件便可快速试错新想法与试用新依赖。但这类既共享依赖又含多个二进制目标文件的`Bin - Cargo Package`工程也有不科学的槽点。即，随着实验例程与依赖项的持续增加，在日积月累之下，`Cargo Package`工程对单个二进制目标文件的编译速度将会**指数级**地**变慢**。这是因为 @Rustacean 无论从哪个入口文件开启编译流程，`rustc`都不得不将每个共享依赖项都过一遍和浪费大量时间。

有不科学之处就值得优化。于是，`rust-playground-accelerator`插件规划的优化路径就是

1. 在`Cargo.toml`配置文件中，将所有依赖项者声明为`optional = true`。于是，
   1. `rustc`就不会初始链接任何一个依赖项。
   2. 每个`optional = true`的可选依赖项就自动成为了一个自定义`Cargo Feature`。

    ![输入图片说明](https://foruda.gitee.com/images/1754955108768880186/d7aee5e1_4981249.png "屏幕截图")

2. 在`.vscode/settings.json`文件的`rust-playground-accelerator.mappings`配置块内，注册每个二进制目标文件都对应了哪些必填与可选的`Cargo Features`。

    ![输入图片说明](https://foruda.gitee.com/images/1754952463576721469/85256f20_4981249.png "屏幕截图")

3. 每当 @Rustacean 从`vscode`代码编辑器打开某个二进制目标文件时，`rust-playground-accelerator`插件就依据上一步预设的【二进制目标文件名 ➜ `Cargo Features`】映射表，实时修改`rust-analyzer`插件的`rust-analyzer.cargo.features: string[]`配置值，和触发`rust-analyzer.reloadWorkspace`插件指令以重载刷新配置信息。

    ![输入图片说明](https://foruda.gitee.com/images/1754955187811219214/82a7ab5b_4981249.png "屏幕截图")

于是，`rust-analyzer`插件就能以最精简的依赖清单，对二进制目标文件做`cargo check / build / run`处理，和执行其它更复杂的`AST`分析工作了。最终，这既提升了`rustc`对单个二进制目标文件的编译速度，又间接改良了`rust-analyzer`插件的使用体验。

在使用了`rust-playground-accelerator.mappings`插件之后，本人体感效果是从编译周期`3~5`分钟望不到头，缩短至`1`分钟左右就能结束编译处理。

### 含有互斥自定义`Features`的`Cargo Package`工程

当工程存在互斥的自定义`Features`时，硬编码`rust-analyzer.cargo.features: "all"`会导致编译冲突；而每次手工修改配置又繁琐易错 —— 插件通过图形界面简化了这一过程。

![输入图片说明](https://foruda.gitee.com/images/1754952079036848783/d6593df7_4981249.png "屏幕截图")

具体的优化步骤包括：

1. 开启`rust-playground-accelerator`插件，和向`.vscode/settings.json`插入如下一段配置

    ```json
    {
      "rust-playground-accelerator.mappings": {
        "main.rs":/* 1. 仅就 main.rs 而言，它同时可匹配 src/main.rs 和 src/bin/main.rs 两个路径 */{
          "features": {
            // 2.没有 required 字段意味着所有 Cargo Features 都可经由 UI 操作按需增减的。
            "optional": ["feature1", "feature2", "feature3"/* , ... */],
            // 3.在 rust-analyzer 插件做首次编译时，默认激活 "optional" 字段中的前两项
            "defaultCount4Optional": 2
          }
        }
      }
    }
    ```

    请再次留意上述配置片段中的三条注释

    1. 仅就二进制目标文件名`main.rs`而言，它同时可匹配`src/main.rs`和`src/bin/main.rs`两个路径
    2. 没有`required`字段意味着所有 Cargo Features 都可按需增减的。
    3. 在`rust-analyzer`插件做首次编译时，默认激活`"optional"`字段中的前两项`"feature1", "feature2"`

2. 在`rust-analyzer`与`rust-playground-accelerator`插件皆成功初始化之后，@Rustacean 便可在`vscode`图形界面的右下角就看到一个崭新的状态栏按钮 ![输入图片说明](https://foruda.gitee.com/images/1755036034642149698/3d834588_4981249.png "屏幕截图")。鼠标点击此状态栏按钮，`vscode`就会弹出可选`Features`的复选框菜单![输入图片说明](https://foruda.gitee.com/images/1755036205645695336/3eb41700_4981249.png "屏幕截图")。
3. @Rustacean 对复选框菜单做勾选，再点击蓝色【确定】按钮。
4. `rust-analyzer`就会

    1. 刷新修改后的配置数据
    2. 调整代码高亮，和将`rustc`暂时覆盖不到编译路径上的代码全部置灰。
    3. 将原来置灰的代码，恢复关键字高亮与语法提示。

## 插件安装

1. 打开 VS Code，进入「扩展」面板（快捷键 `Ctrl+Shift+X`）。
2. 在搜索框输入`rust-playground-accelerator`，找到插件后点击「安装」。
3. 安装完成后，插件会自动激活（需满足「依赖限制条件」）。

## 注意事项

1. 插件仅支持「单一`Cargo Package`工程」，暂不支持多`Workspace Members`工作区（`workspace = true`）。
2. 暂不支持对`Cargo.toml [[bin]]`手工注册的二进制目标文件的跟踪。
3. 不支持对`Lib - Cargo Package`工程。
4. 若工程依赖较多，首次激活`features`时可能需要等待`rust-analyzer`重新加载（状态栏会显示进度）。
5. 为避免与`rust-analyzer`默认行为冲突，和使插件 “无干扰” 工作，**建议额外配置：**

    ```json
    {
      "rust-analyzer.cargo.noDefaultFeatures": true
    }
    ```

    （在`.vscode/settings.json`中添加此配置，可让插件与`rust-analyzer`协同更稳定。）

## 反馈与贡献

1. 遇到问题？可在 [GitHub Issues](https://github.com/stuartZhang/rust-playground-accelerator/issues) 提交`bug`报告（附日志截图更佳）。
2. 欢迎提交`PR`改进插件功能！
