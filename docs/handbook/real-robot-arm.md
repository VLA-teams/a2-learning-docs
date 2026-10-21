---
title: "A2 真机环境加载与左臂验证"
description: "SSH 登录后的环境加载、ROS2 只读检查、左臂小幅验证与仿真姿态分阶段迁移到真机。"
author: 文档共建小组
status: review
date: 2026-10-21
order: 6
---

# A2 真机环境加载与左臂验证

本页整理**真机侧**的实验流程：从 SSH 登录后的环境准备，到左臂小幅运动验证，再到把仿真保存的姿态分阶段迁移到真机并返回。

::: warning 适用范围
以下以现场已确认的 **ORIN、ROS2 Humble 和 A2_ULTRA v2.1.9** 为背景。更换机器人后应重新核对版本与配置。

**环境加载不代表电机使能、Action 切换或手臂运动。** 每一步的完成条件都单独说明，不要跳过。
:::

::: danger 本页不涉及连接方式
SSH 的连接方式（网线、机器人热点、214 网络）不在本页范围内，请按现场配置或维护者提供的说明操作。
:::

## 一 先确认在哪台机器上

本章命令在 **SSH 登录后的机器人 Linux 终端**执行。先检查主机、架构与目录：

```bash
hostname
uname -m
pwd -P
printf 'HOME=%s\n' "$HOME"
```

现场 ORIN 的架构为 `aarch64`。**主机名可能随机器人变化，不能只看主机名判断设备身份。**

`~` 表示当前用户的家目录。`/home/agi/agibot/...` 与 `/agibot/...` 是两个不同的绝对路径，
是否指向同一位置需要另外核对。

## 二 加载厂家开发环境

智元 A2 v2.1 接口排查文档要求：SSH 连接到 x86 / ORIN 后，执行以下命令加载 ROS2 环境变量。
**每次建立新会话时先执行**，并观察有无报错：

```bash
aima em load-env
```

以当前终端输出为准：

- 若工具提示进入了新的 shell，后续命令就在该 shell 中执行；
- 若明确要求 `source` 某个脚本，则使用**本次输出**的路径。

::: tip 两个容易误判的地方
**不要复制上次生成的 `/tmp` 临时路径**，那是一次性的。

登录欢迎信息显示「加载开发环境」提示，**不等于环境已经加载成功**。要看下一节的检查结果。
:::

### ROS 的 source 还要执行吗

`aima em load-env` 是厂家配置的环境入口；`source /opt/ros/humble/setup.bash` 加载 ROS Humble 的基础环境。

如果厂家入口已正确加载 ROS，且下一节检查均通过，**通常无需再重复 source**。
需要补充基础 ROS 环境时，在同一个终端执行：

```bash
source /opt/ros/humble/setup.bash
```

`source` 让脚本中的环境设置作用于当前 shell；普通执行脚本不能替代它。
基础 ROS 的 `source` 也不能替代厂家工作区、通信配置等设置。

现场使用 Humble：若上述文件不存在，先核对主机和安装路径，**不要直接改成 Foxy**。
新终端或新 SSH 会话需要重新准备环境。

## 三 核对环境与依赖

```bash
printenv ROS_DISTRO
printenv ROS_DOMAIN_ID
printenv ROS_LOCALHOST_ONLY
printenv RMW_IMPLEMENTATION
command -v ros2
command -v python3
```

| 检查项 | 现场参考与判断 |
| --- | --- |
| `ROS_DISTRO` | 本次现场为 `humble`，应与所用 ROS 安装匹配 |
| `ROS_DOMAIN_ID` | A2 v2.1 官方排查文档及此前现场输出为 **232**；以当前机器厂家配置为准 |
| `ROS_LOCALHOST_ONLY` | 此前现场为 **0**，允许发现其他主机上的 ROS 节点 |
| `RMW_IMPLEMENTATION` | 未设置可能使用默认实现，不单独作为故障依据 |
| `ros2` / `python3` 路径 | 确认命令可找到，且 Python 没有被未核实的 Conda 环境替换 |

::: warning 不要凭旧记录强制设置
换机器人后**不要仅凭旧记录强制设置** `ROS_DOMAIN_ID`。环境变量为空时，
先检查 `aima` 是否加载成功；加载前后的数值可能不同。
:::

再检查 Python 依赖：

```bash
python3 -c "import rclpy, tf2_ros, requests; from sensor_msgs.msg import JointState; print('依赖可导入')"
```

看到「依赖可导入」说明当前 Python 能加载这些模块。
**它还不能证明 ROS 已收到机器人数据，也不能证明运动接口可用。**

## 四 只读检查关节反馈

先查看话题类型、发布者及 QoS：

```bash
ros2 topic info /motion/control/arm_joint_state --verbose
```

再用 `BEST_EFFORT`、`VOLATILE` 订阅读取一条实际关节反馈，最多等待 10 秒：

```bash
timeout 10s ros2 topic echo \
  /motion/control/arm_joint_state \
  sensor_msgs/msg/JointState \
  --once \
  --qos-reliability best_effort \
  --qos-durability volatile \
  --qos-depth 10

a2_read_rc=$?
printf '关节反馈读取退出码：%s\n' "$a2_read_rc"
```

| 退出码 | 含义 |
| --- | --- |
| `0` 且输出 `name`、`position` 等字段 | 本次读到了消息 |
| `124` | 等待到期，**不能据此断定机械故障** |

::: tip 读到一次不等于持续正常
话题可见也不保证持续有消息，应继续检查**新鲜度、关节名称和数量**。

此步骤不保存或覆盖 `HOME`，也不向 `arm_joint_command` 发布指令。
:::

## 五 Conda 激活和真机环境的区别

| 操作 | 作用 | 是否必须 |
| --- | --- | --- |
| `aima em load-env` | 加载厂家提供的开发 / ROS2 环境 | 真机按厂家流程执行 |
| `source /opt/ros/humble/setup.bash` | 在当前 shell 加载基础 ROS Humble 环境 | 厂家入口未完整加载基础 ROS 时补充 |
| `conda activate 环境名` | 选择指定 Conda 环境中的 Python、依赖及环境设置 | **本章不要求使用 Conda**；不能代替前两项 |

真机 ROS 脚本优先使用厂家环境中已验证可导入 `rclpy` 的 Python。
训练电脑里的 `vla`、`a2rl` 环境**不会自动出现在机器人上**。

Conda 可能改变 Python 路径，并使 ROS 的二进制模块不兼容，
因此**不要为了运行本章检查临时新建或随意切换环境**。

如果当前终端已经启用了 Conda，且依赖检查失败，可以先查看已有环境：

```bash
conda info --envs
```

仅在 Conda 确实处于激活状态时执行：

```bash
conda deactivate
```

再重新加载厂家环境并核对 Python 路径。

## 六 环境检查的常见问题

| 现象 | 下一步 |
| --- | --- |
| `aima: command not found` | 核对登录的是否为目标工控机，按厂家流程准备 `aima`；不要先修改系统配置 |
| `setup.bash: No such file or directory` | 核对 ROS 版本、安装路径和主机；不要把 Humble 随意替换成 Foxy |
| `No module named rclpy` | 核对 `aima` / `source` 是否生效，以及 `command -v python3`；检查 Conda 是否遮蔽厂家 Python |
| 关节反馈退出码 `124` | 核对当前终端 ROS 配置、话题发布者和 QoS，再检查厂家模块状态 |
| 关节反馈正常，但动作不可用 | 环境检查只覆盖通信准备；Action、告警、控制权和动作条件需在对应实验中另行核对 |

**本章完成条件**：目标主机正确、厂家环境加载无报错、所需依赖可导入，并能读取当前关节反馈。

下一次重新登录后**仍需重新检查**。本章不执行模式切换、复位或任何运动，
也不要求重新安装 ROS 或重启机器人。

## 七 左臂小幅验证

::: info 现场完成记录
2026-10-15 已完成左肘 5° 往返、七关节小步核对，以及保存仿真姿态到真机的分阶段迁移和返回。
迁移与返回完成状态由**现场操作者确认**。以下整理实际使用的工具与操作顺序；
重做实验时仍以本次机器人、状态与记录为准。
:::

本章采用**关节空间 PlanningMove** 控制左臂：

- 目标按 **J1–J7** 排列，接口单位为 **rad**；
- 命令行 `--degrees` 的单位为**度**；
- 右臂只读取反馈并监测变化，**不拼接到左臂请求中**。

### 7.1 适用机器人、目录与文件

本套工具限定现场已验证的 `A2_T3D1_FLAGSHIP / A2_ULTRA-v2.1.9-0-g838be97a5-2605271938`。
**更换机器人或版本后重新核对。**

SSH 的 ORIN 地址为 `192.168.100.110`，运动控制 RPC 地址为 `192.168.100.100`，**二者用途不同**。

在 ORIN Linux 终端准备实验目录，统一使用下列绝对路径，
**不能与 `/home/agi/agibot/...` 混用**：

```bash
mkdir -p /agibot/data/home/agi/Desktop/a2
cd /agibot/data/home/agi/Desktop/a2
pwd -P
```

工具文件说明：

| 文件名称 | 本次配套版本 | 用途 |
| --- | --- | --- |
| `a2_left_joint_plan.py` | `20261015-joint-planning-timeout-7` | 共享 RPC、检查、日志及左肘往返 |
| `a2_left_joint_direction.py` | `20261015-joint-direction-2` | 左臂 J1–J7 小步方向核对 |
| `a2_left_pose_staged.py` | `20261015-pose-staged-1` | 25%、50%、100% 分阶段迁移 |
| `a2_left_pose_return.py` | `20261015-pose-return-1` | 返回指定实验记录的实际起点 |

::: warning 后三个脚本依赖基座
后三个脚本 `import` 基座 `a2_left_joint_plan.py`，**必须使用同一套文件**。

旧的 `a2_left_elbow_cycle*.py`、旧 WASD 和 SE(3) 脚本**不属于本流程**。
:::

### 7.2 上传配套文件到 ORIN

在 Windows PowerShell 执行，把四个控制脚本上传到 ORIN 目标目录。
先查看遥控器上的 IP；若与示例 `192.168.3.103` 不同，替换命令中的该地址。

::: danger 上传前确认
上传会**替换远端同名工具文件**。请在确认没有这些程序正在运行时进行，并保留原版本。
此命令不删除 `logs`、`state` 或姿态文件。
:::

网线直连时可去掉 `-J` 及其后面的跳板参数，目标仍是现场核实的 ORIN 地址。

### 7.3 核对环境、版本和语法

ROS 话题检查需要厂家 ROS 环境；本章四个 Python 工具**只用标准库与同目录基座**，
通过 HTTP RPC 通信，**不依赖 `rclpy`、ROS 发布器或 Conda 激活**。

每个新终端仍需核对主机、目录和 `python3` 路径：

```bash
cd /agibot/data/home/agi/Desktop/a2
command -v python3
python3 a2_left_joint_plan.py --version
python3 a2_left_joint_direction.py --version
python3 a2_left_pose_staged.py --version
python3 a2_left_pose_return.py --version
```

版本应与上表相同。编译检查无输出且返回命令提示符，表示语法检查通过，
**不代表真机已就绪**。

### 7.4 先做只读检查

以下命令**没有 `--execute`**，不禁用播放器、不切 Action、不发送关节目标，
但会保存本次检查日志。它查询型号、版本、Action、播放器、急停、告警和实际关节状态：

```bash
python3 a2_left_joint_plan.py --host 192.168.100.100
```

需要单独查看状态时，下列 `curl` 也只查询，不切换模式：

```bash
curl --connect-timeout 3 --max-time 5 -X POST http://192.168.100.100:56322/rpc/aimdk.protocol.McActionService/GetAction -H 'Content-Type: application/json' -d '{}'
```

### 7.5 左肘 5° 小幅往返

::: danger 执行前必须满足
- 现场确认机器人**站立稳定**；
- 双臂和头颈**路径留空**；
- 其他运动发送程序**已退出**；
- 由**熟悉厂家急停的人员监护**。
:::

下面是已使用的左肘 **J4** 测试方式；一次运行完成向内弯肘和成功到位后的返回：

```bash
python3 a2_left_joint_plan.py --host 192.168.100.100 --execute --degrees 5 --allow-left-elbow-inward
```

`--allow-left-elbow-inward` 是明确选择双肘基础反馈范围的工具参数，**不是关闭限位**。
所有发送的左臂目标仍受保守应用范围检查。

若起点 J4 贴近边界，程序可能提出边界内返回参考；先核对打印的实测起点、目标和返回参考及差值。
**返回参考可能与原始实测起点不同，原始测量不会改写。**

当前工具的到位条件：

| 条件 | 阈值 |
| --- | --- |
| 左臂最大目标误差 | ≤ `0.008 rad` |
| 差分估计速度 | ≤ `0.04 rad/s` |
| 连续满足时间 | `0.5 s` |
| 实际变化 | 需观察到足够变化 |

工具读取 `GetJointState`，**不把 RPC 响应时间戳说成已经验证的原始传感器采样时间**。
速度由厂家规划器决定，脚本不支持任意指定速度字段。

### 7.6 七关节方向核对

在迁移保存姿态之前，逐个核对左臂 J1–J7 的名称及小幅运动方向。

左臂顺序是 `idx13_left_arm_joint1` 至 `idx19_left_arm_joint7`。
已完成记录中，**J1 / J2 / J3 / J5 / J6 / J7 为 +2°**，J4 采用左肘 5° 测试。

::: warning 一处异常需要说明
**J1 首轮返程监测中止**后，通过只读反馈确认实际返回，
不能把这次记录写成全程无异常。
:::

先看所选关节的只读预览，再按关节分别执行。
**一条执行命令完成并核查后，再运行下一条；不要用循环一次发送七个关节。**

```bash
# 以 J1 为例：先预览
python3 a2_left_joint_direction.py --host 192.168.100.100 --joint 1 --degrees 2 --sign + --allow-left-elbow-inward

# 确认后执行
python3 a2_left_joint_direction.py --host 192.168.100.100 --joint 1 --degrees 2 --sign + --execute --allow-left-elbow-inward
```

其余关节把 `--joint 1` 依次改为 `2`、`3`、`5`、`6`、`7` 即可（J4 已在 7.5 节核对）。

每个工具仍要求 **SWITCH** 和 **MOVE**。小步方向到位支持当前对应关系的核对，
**不代表任意大行程、路径或动力学完全一致**；后续姿态迁移使用单独分阶段流程。

### 7.7 查日志与处理结果未知

```bash
cd /agibot/data/home/agi/Desktop/a2
ls -lt logs
if [ -f state/joint-planning-uncertain.json ]; then
    cat state/joint-planning-uncertain.json
else
    printf '当前目录没有未确认请求标记。\n'
fi
```

本次日志目录由程序打印，形如 `logs/planning-时间-随机值`：

| 文件 | 内容 |
| --- | --- |
| `before.json` | 接管前快照 |
| `planning-origin.json` | 模式准备后的实际起点 `actual14` 和返回参考 `return_reference14` |
| `events.jsonl` | 请求、响应及反馈 |
| `out-reached.json` / `back-reached.json` | 到位记录 |
| `result.json` | 汇总结果 |

::: danger 出现未确认标记时
HTTP 超时与任务执行状态**分别处理**。已有 `state/joint-planning-uncertain.json` 时，
执行入口会拒绝新请求。

**先查原请求、实际反馈与现场状态，再确定后续方案。不要删除标记、换目录或改 ID 重发。**

右臂相对同一本次起点变化超过 `0.035 rad` 会停止后续请求；**不能忽略该监测继续动作**。
:::

## 八 仿真姿态迁移到真机

::: info 现场完成记录
已保存的左臂仿真姿态按 25%、50%、100% 到达真机，并已返回本次实验起点。

**实验完成不表示可以把这组角度直接用于其他机器人。**
:::

本章接续前一章的配套文件、模式与反馈检查。

仿真模型为 **T2D0 Ultra**，现场真机报告 **A2_T3D1_FLAGSHIP**；
按名称映射、逐关节小步核对后**仍需现场确认整条路径**。

::: warning 线性插值在限位内 ≠ 路径无碰撞
关节角在线性插值下位于限位内，**并不能证明厂家实际规划路径无碰撞**。
:::

### 8.1 准备核定目标文件

本次 Windows 原始保存文件为「左臂_仿真示教姿态_20261014_213259.json」；
核定文件「保存仿真左臂目标核定-20261015.json」含按名称组织的 `joints` / `target_rad`，
符合迁移工具格式。

::: danger 不要改文件名直接传入
原始保存文件的 `positions` 数组**不是工具直接读取的格式**，不要改个文件名后直接传入。
:::

本次仿真目标（仅供核对）：

| 关节 | 反馈 / 目标名称 | 仿真目标（度） |
| --- | --- | --- |
| J1 | `idx13_left_arm_joint1` | -29.31 |
| J2 | `idx14_left_arm_joint2` | +75.56 |
| J3 | `idx15_left_arm_joint3` | +0.03 |
| J4 | `idx16_left_arm_joint4` | -80.70 |
| J5 | `idx17_left_arm_joint5` | +90.00 |
| J6 | `idx18_left_arm_joint6` | -1.03 |
| J7 | `idx19_left_arm_joint7` | +0.93 |

程序读取核定文件的 `target_rad`，按官方关节名称排序，**不使用上表四舍五入的度数**。

核定文件是当时的离线候选记录，里面旧的未核实事项**不应删除或改写成「已经证明安全」**；
本章的现场完成状态与原始候选数据分开保存。

### 8.2 只读预览 25%、50%、100% 目标

在 ORIN 终端执行，**当前没有 `--execute`**。
工具检查精确七个关节、重复名称、有限数值及目标限位，并展示当前值和各阶段目标：

```bash
cd /agibot/data/home/agi/Desktop/a2
python3 a2_left_pose_staged.py --host 192.168.100.100 --target ./pose_target_reviewed.json --allow-left-elbow-inward
```

阶段目标按「返回参考 +（最终目标 − 返回参考）× 比例」计算，比例为 `0.25`、`0.5`、`1.0`。

**预览值不是接管后的最终起点**，执行时会重新测量。

### 8.3 执行分阶段迁移

逐关节核对完成、目标文件无误、模式及状态检查通过后，由现场人员再次检查路径和厂家急停。
**此命令会请求实际运动**：

```bash
python3 a2_left_pose_staged.py --host 192.168.100.100 --target ./pose_target_reviewed.json --execute --allow-left-elbow-inward
```

| 程序提示 | 现场操作 |
| --- | --- |
| `SWITCH` | 确认必要的播放器禁用和全局 `ONLINE_PLANNING` 切换 |
| `MOVE` | 核对本次起点和目标后，开始 25% 阶段 |
| 25% 到位后 `NEXT` / `BACK` | 观察姿态及路径；`NEXT` 才进入 50%，`BACK` 返回本次参考 |
| 50% 到位后 `NEXT` / `BACK` | 同样核对后选择是否进入 100% |
| 100% 已实际到位后 `BACK` | **明确输入 `BACK`**，程序才发送返回本次参考的目标 |
| `ACTUAL_STAGED_ROUNDTRIP_REACHED` | 查看 `result.json` 的 `reached_fraction`；只有到达 `1.0` 且返回才是完整目标往返 |

::: danger 超时与退出不会自动返回
各段实际到位等待上限为 **45 秒**。阶段间 `NEXT` / `BACK` 等待上限为 **120 秒**，
期间继续检查状态与右臂。

**等待到期、`Ctrl+C` 或退出不会自动返回，也不会取消已经被机器人接收的动作。**

到达 100% 后**不要关闭终端来代替 `BACK`**。
:::

### 8.4 保存本次起点与完成记录

以程序打印的本次日志目录为准：

| 文件字段 | 含义 |
| --- | --- |
| `planning-origin.json` 的 `actual14` | 模式准备后的真实双臂起点 |
| `planning-origin.json` 的 `return_reference14` | 允许发送的返回参考，可能有已说明的边界内偏移 |
| `result.json` | `reached_fraction`、`returned_actual14`、`full_sim_pose_transfer_validated` 等 |

::: warning 两点不要混淆
`actual14` 与 `return_reference14` **都不是厂家 HOME**。

**返回误差必须从本次结果读取**，不能套用左肘 5° 测试的误差。
:::

完成后**仍保持规划模式，播放器仍禁用**，不自动恢复切模式前的姿态。现场人员按厂家流程结束实验。

**当前流程并未提供按 X、关终端或断网自动复位的功能。**

### 8.5 独立返回指定实验起点

若已到目标但没有在原程序输入 `BACK`，先查原会话、当前反馈和未确认标记。

::: danger 这不是通用恢复按钮
下面的独立返回工具**不是异常状态下的通用恢复按钮**。

不得使用另一台机器人、另一天或仅凭「最新文件」挑选的起点。
:::

先输入要返回的那一次会话 `planning-origin.json` 绝对路径，再做只读对比：

```bash
cd /agibot/data/home/agi/Desktop/a2
read -r -p '本次实验 planning-origin.json 的绝对路径：' a2_origin_file
if [ -f "$a2_origin_file" ]; then
    python3 a2_left_pose_return.py --host 192.168.100.100 --origin-file "$a2_origin_file" --allow-left-elbow-inward
else
    printf '起点文件不存在，停止在此步骤。\n'
fi
```

在同一个终端、路径变量仍指向已核对的本次记录时，再执行下面命令。
核对程序显示的当前角、原点角和回归幅度，之后**仍需 SWITCH、MOVE 两次现场确认**：

```bash
python3 a2_left_pose_return.py --host 192.168.100.100 --origin-file "$a2_origin_file" --execute --allow-left-elbow-inward
```

独立返回读取的是原会话 `actual14` 的左七个实测值，以 **50%、100% 两段**返回；
它不使用 `return_reference14` 自动替代越界原点。

如果原实测值超出发送目标包络，返回工具会拒绝，**不要改写原点文件绕过**。
两段在 `MOVE` 后依次执行，不使用 `NEXT` 门禁；成功结果为 `ACTUAL_RETURN_REACHED`。

**已正常 `BACK` 完成时，无需再执行此步骤。**

### 8.6 取回日志并归档

在 Windows PowerShell 取回本次机器人 `a2/logs`，使用新的本地归档目录保留现场记录：

```powershell
$a2Archive = Join-Path $env:USERPROFILE ('Desktop\具身智能\仿真\真机预检\机器人日志-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $a2Archive -ErrorAction Stop | Out-Null
scp -J agi@192.168.3.103:22 -r 'agi@192.168.100.110:/agibot/data/home/agi/Desktop/a2/logs' "$a2Archive"
if ($LASTEXITCODE -ne 0) { throw '日志下载未完成，请保留本地已取回文件并核对。' }
```

归档**至少保留**：`before.json`、`planning-origin.json`、`events.jsonl`、到位记录与 `result.json`。

若回归由独立工具完成，**同时保留迁移和返回两个会话**。

把实际阶段、最终误差、机器人身份及操作时间记录在实验说明中。

### 8.7 本流程的实际范围

| 项目 | 实际范围 |
| --- | --- |
| 运动接口 | 仅左臂 JOINT PlanningMove，按名称映射的七个 rad 目标；速度由厂家规划器决定 |
| 完成判断 | `ONLINE_PLANNING` 读取实际关节反馈，不使用 `GetTaskState` 作为到位依据 |
| 路径检查 | 已有 T2D0 近似几何采样**不能证明** T3D1 真机实际规划路径无碰撞；需要现场观察 |
| 取消与退出 | 本工具未封装可核实的任务取消接口。关闭终端、SSH 断连、`Ctrl+C` **不能当作厂家急停或自动回位** |
| 其他入口 | 仿真 HTTP、手机、MCP、训练环境均未因此自动接入真机 |

## 九 本阶段结果与接口依据

| 完成内容 | 确认依据 |
| --- | --- |
| 左肘 5° 往返 | 本地实测日志确认；去程 / 返回左臂七关节最大目标误差约 **0.253° / 0.283°** |
| 七关节小步核对 | 2026-10-15 逐关节方向验证记录。**只说明该小幅条件下的核对结果** |
| 仿真姿态迁移与返回 | 现场操作者确认完成。最终迁移误差在缺少完整本地原始记录时不另行编造 |

运动采用 A2 v2.1 的 **PlanningMove**：

- `group` 为 `McPlanningGroup_LEFT_ARM`
- `target.type` 为 `JOINT`
- `joints` 按 J1–J7 传入 **rad**

`ONLINE_PLANNING` **不支持用 `GetTaskState` 判定完成**，工具根据实际反馈判断。

## 官方参考

- [智元 A2 v2.1：接口问题排查](https://open.agibot.com/docs/aimdk/a2/v2_1/dev_guide/10-interface_issues)
- [智元 A2 v2.1：运动控制、PlanningMove 与模式要求](https://open-eu.agibot.com/docs/aimdk/a2/v2_1/dev_guide/07-01-motion_control)
- [智元 A2 v2.1：播放器查询及禁用含义](https://open-eu.agibot.com/docs/aimdk/a2/v2_1/dev_guide/07-02-motion_play)
- [ROS2 Humble：配置开发环境](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Configuring-ROS2-Environment.html)
- [Conda：管理与激活环境](https://docs.conda.io/projects/conda/en/stable/user-guide/tasks/manage-environments.html)
