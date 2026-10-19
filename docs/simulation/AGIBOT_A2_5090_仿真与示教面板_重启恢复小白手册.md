---
title: "5090 意外关机 / 重启后：AGIBOT A2 MuJoCo 与网页示教面板恢复手册"
description: "手册"
author: 文档共建小组
status: draft
date: 2026-10-17
---

# 5090 意外关机 / 重启后：AGIBOT A2 MuJoCo 与网页示教面板恢复手册

**适用环境**：RTX 5090 Ubuntu 工作站 `vstc@AGI`；A2 官方 `a2-simulator:v2.0` 容器 `a2-ultra-sim`；网页面板 `a2_joint_panel_v2`。  
**版本**：2026-10-16 操作记录整理。**仅用于与 A2 真机网络隔离的 MuJoCo 仿真**，所有命令均不用于 ORIN 实机。  
**最重要的顺序**：启动容器 → MuJoCo → motion_control → 站立初始化 → 确认稳定站立 → 网页面板 → （另行谨慎）启用关节控制。

> **请先看这句话**：如果只是刚才停止了网页后台，而 MuJoCo 仍在正常站立 **Run**，不需要重启仿真。直接在 `vstc@AGI` 终端运行 `python3 /home/vstc/a2_joint_panel_v2/launch_a2_panel.py`，再使用它新输出的网址打开浏览器。不要在 `agi@...` 容器终端运行启动器。

## 1. 三种终端怎么区分

| 场所                   | 终端样子                            | 职责                                                 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------- |
| **5090 Ubuntu 宿主机** | `(base) vstc@AGI:~$`                | Docker 管理、启动/停止网页面板、打开浏览器、导出数据 |
| **A2 Docker 容器**     | `agi@1b654c472d82:~/a2_simulation$` | 启动 MuJoCo、启动 motion_control、调用 SetAction     |
| **A2 ORIN 真机**       | `agi@ubuntu-orin:~$`                | **本手册完全不在这里执行**                           |

已安装软件与固定路径：

- 官方容器：`a2-ultra-sim`，容器 ID **预期以** `1b654c472d82` 开头。已有容器要用 `docker start`，**不要重新 `docker run` 再建一台**。
- 仿真启动：`/home/agi/a2_simulation/mujoco_sim_ultra_2.0/bin/start_a2_t2d0_ultra.sh`（容器内）。
- 运控启动：`/home/agi/a2_simulation/motion_control_ultra_2.0.19/scripts/motion_control/start_motion_control.sh`（容器内）。
- Action 工具：`/home/agi/a2_simulation/tools-ultra/mc/SetAction.py`（容器内）。
- 网页面板宿主启动器：`/home/vstc/a2_joint_panel_v2/launch_a2_panel.py`。
- 网页面板重开工具：`/home/vstc/a2_joint_panel_v2/open_a2_panel.py`。
- 仿真隔离网络：`a2sim_isolated`。**严禁直接改为 host 网络**，避免和 A2 真机控制网络混用。

## 2. 情况 A：机器人已正常站立，只是网页打不开

**仅在 5090 宿主机 `(base) vstc@AGI` 执行：**

```bash
python3 /home/vstc/a2_joint_panel_v2/launch_a2_panel.py
```

看到 `ISOLATION OK` 和 `PANEL READY (no motion until Enable in browser)`，说明服务已经恢复。打开本次打印的**私有网址**（完整网址带 `#token=`），或者让程序自动打开 Chrome。之前网页若显示 `Failed to fetch`，应关闭旧标签并打开新网址；旧网址可能指向已经停止的服务或旧容器 IP。

只要后台仍在线，之后重开浏览器使用：

```bash
python3 /home/vstc/a2_joint_panel_v2/open_a2_panel.py
```

如果上面提示 `Panel is not running`、`Cannot open`，改用第一条 `launch_a2_panel.py`。若无法启动，**只读**看日志：

```bash
sudo docker exec a2-ultra-sim tail -n 60 /home/agi/a2_simulation/tools-ultra/mc/a2_joint_panel.log
```

恢复网页时 **先看反馈，暂不点击“启用仿真控制”**。按钮会请求从当前 `RL_LOCOMOTION_DEFAULT` 切换到 `RL_LOCOMOTION_ARM_EXT_JOINT_SERVO`；在这台仿真里此前出现过倒地，故要单独验证切换后站立稳定性。

## 3. 情况 B：5090 意外断电、正常关机或重新启动后，从头恢复

### 步骤 0：在 5090 图形桌面确认所在机器

使用向日葵远控登录 5090 Ubuntu，打开终端（`Ctrl+Alt+T`），**确认是 `(base) vstc@AGI`**。执行：

```bash
hostname; whoami; echo "SESSION=$XDG_SESSION_TYPE DISPLAY=$DISPLAY"
```

预期：`hostname=AGI`、用户名 `vstc`、桌面会话 `x11`，且 DISPLAY 为 `:0`、`:1` 或其他有效编号。**无需固定强行设置 `DISPLAY=:1`**。若是 Wayland，需要切换 Xorg 桌面后重新登录。

### 步骤 1：重新启动 Docker 与原来的容器（宿主机）

```bash
sudo systemctl start docker
```

```bash
sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
```

确认存在 `a2-ultra-sim`，随后执行：

```bash
sudo docker start a2-ultra-sim
```

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.ID}}'
```

确认 `a2-ultra-sim` 为 `Up`，**不要执行 `docker rm`、`docker system prune -a`**。检查共享内存保留 2 GiB：

```bash
sudo docker exec a2-ultra-sim df -h /dev/shm
```

之前 64 MiB 导致 `fatal SIGBUS`，目前经过设置应当为 `2.0G`；若不对，先停下并处理，不要反复启动 MuJoCo。

可选：检查网络隔离：

```bash
sudo docker network inspect a2sim_isolated --format '{{.Internal}}'
```

正常应为 `true`。容器重启后如果 ID 改变、容器缺失或隔离网络不符，**先停止，不要跳过面板的身份保护**。

### 步骤 2：准备图形窗口权限（宿主机）

```bash
xhost +si:localuser:vstc
```

这是针对之前容器用户 UID 与宿主 `vstc` 相同的环境；如果仍出现 `Authorization required` 或 `ERROR: could not initialize GLFW`，先对照宿主和容器 UID：

```bash
id -u; sudo docker exec a2-ultra-sim id -u agi
```

并核查容器设置的 DISPLAY 与当前桌面是否一致：

```bash
sudo docker inspect a2-ultra-sim --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DISPLAY='
```

**若 DISPLAY 不一致**，先用如下命令进入执行 MuJoCo 的终端，在本次 `docker exec` 会话中透传当前 DISPLAY：

```bash
sudo docker exec -e DISPLAY="$DISPLAY" -it a2-ultra-sim /bin/bash
```

不要直接使用 `xhost +` 全局放开显示权限，也不要自行重装 NVIDIA 驱动。若仍不显示，停止启动并检查 X11 授权，不要修改真机环境。

### 步骤 3：终端 A 启动 MuJoCo 图形仿真（宿主机新终端 → 容器）

在 **5090 宿主机新终端 A** 执行：

```bash
sudo docker exec -e DISPLAY="$DISPLAY" -it a2-ultra-sim /bin/bash
```

进入容器 `agi@...` 后执行（单行）：

```bash
cd /home/agi/a2_simulation/mujoco_sim_ultra_2.0/bin && ./start_a2_t2d0_ultra.sh
```

预期：出现 MuJoCo 图形窗口、`AimRT startup completed`。**这个终端保持打开**，关掉可能停止图形仿真。若报 `RouDi`、`SIGBUS`，先看 `/dev/shm`；若报 `GLFW`，先看 DISPLAY/X11。

### 步骤 4：终端 B 启动 motion_control（宿主机另开终端 → 容器）

在 **5090 宿主机新终端 B**：

```bash
sudo docker exec -it a2-ultra-sim /bin/bash
```

容器内执行：

```bash
cd /home/agi/a2_simulation/motion_control_ultra_2.0.19/scripts/motion_control && ./start_motion_control.sh
```

**这个终端也保持打开。** 它是仿真关节控制服务，不是 A2 真机控制服务。

**暂时不启动 `motion_player`**。官方有第三个动作播放组件，但我们当前的滑动条面板要求没有并行的 `motion_player`，否则可能争抢上肢控制权。

### 步骤 5：终端 C 按官方流程恢复站立（宿主机另开终端 → 容器）

在 **5090 宿主机新终端 C**：

```bash
sudo docker exec -it a2-ultra-sim /bin/bash
```

容器内执行：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc && ./SetAction.py
```

根据这台镜像已验证的菜单，选 **10：`RL_JOINT_DEFAULT`**（但以实际菜单文字为准）。然后在 MuJoCo 窗口中：

1. 在 **Simulation** 区域先点 **Pause**；确认 Key 为官方初始键位（此前是 `0`）。
2. 点 **Load key**，让虚拟机器人恢复官方初始姿态。**不要把 Reset 当作 Load key**。
3. 点 **Run**，观察能否站立。

当机器人在位控模式下稳定站立，回到终端 C：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc && ./SetAction.py
```

选择 **14：`RL_LOCOMOTION_DEFAULT`**（同样核对菜单文字）。只读复核：

```bash
python3 -c 'from actions import get_action; print(get_action(mc_ip="127.0.0.1"))'
```

应显示：`McAction_RL_LOCOMOTION_DEFAULT`。继续让仿真 Run 10–20 秒，确认正常站立，没有倒地，再启动网页面板。

> 如果机器人落地即倒：先 Pause。依次核对 10 → Load key → 14 的官方流程，切勿用网页“恢复 14 个手臂关节”试图让整个躯干站起来。手臂 HOME 不包括腿部、质心或躯干位姿。

### 步骤 6：终端 D / 5090 宿主机启动网页面板

**返回 5090 宿主机** `(base) vstc@AGI`：

```bash
python3 /home/vstc/a2_joint_panel_v2/launch_a2_panel.py
```

应出现 `ISOLATION OK`、`PANEL READY` 并打印网址。浏览器用本次网址打开；浏览器地址 `http://172.18.0.2:8769/` 中的容器 IP 可能在重启后变，不要猜地址，也不要省略 `#token=...`。

首次显示时**先只看状态**：14 个关节滑条和 12 个手指反馈是否刷新，MuJoCo 仍然站立。滑条左、右 J1～J7；手指左右各 6 个。随后若要点 **启用仿真控制**，它会请求切到 `RL_LOCOMOTION_ARM_EXT_JOINT_SERVO`。这在你当前仿真尚需另行验证稳定站立，不能和重启恢复一起直接自动执行。

### 步骤 7：以后再次打开浏览器

如果后台未停止，可直接打开浏览器书签，或者在 5090 宿主机执行：

```bash
python3 /home/vstc/a2_joint_panel_v2/open_a2_panel.py
```

如果后台已停止，用 `launch_a2_panel.py` 启动；如需核对现有网址，执行：

```bash
python3 /home/vstc/a2_joint_panel_v2/launch_a2_panel.py --url
```

网页重开不等于自动恢复运动。若此前心跳超时停止发布，必须检查机器人真实姿态后再人工启用。

## 4. 录制与初始姿态如何备份（重要）

这份 v2 网页面板录制的关节数据和保存的初始姿态**都在 Docker 容器内部**，目录：

`/home/agi/a2_simulation/tools-ultra/mc/panel_recordings/`

**不要只保存在容器里**。录制已经停止后，在 5090 宿主机执行（单行）：

```bash
mkdir -p /home/vstc/a2_panel_records && sudo docker cp a2-ultra-sim:/home/agi/a2_simulation/tools-ultra/mc/panel_recordings/. /home/vstc/a2_panel_records/
```

备份之后在 5090 文件管理器打开 `/home/vstc/a2_panel_records/`，检查 `saved_initial_pose.json` 和 `episode_...` 是否存在。这些只是双臂和手指的姿态/轨迹，**不是完整的站立姿态，也不能保证任意位置自动回位安全**。

如果还要完整备份网页源码：

```bash
cp -a /home/vstc/a2_joint_panel_v2 /home/vstc/a2_joint_panel_v2_backup
```

## 5. 五种常见故障速查

| 屏幕/报错                              | 先看哪里                 | 处理方向                                                     |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| 网页 `Failed to fetch`                 | 后台是否还运行           | 宿主机运行 `launch_a2_panel.py`；用新 URL                    |
| 网页 `Browser disconnected >10 s`      | 浏览器心跳超时，停止发布 | 检查站立与反馈后，人工重新启用；不能自动重放旧目标           |
| MuJoCo 机器人 Reset 后落地即倒         | 站立初始化顺序           | 10 (`RL_JOINT_DEFAULT`) → `Load key` → 14 (`RL_LOCOMOTION_DEFAULT`) |
| `ERROR: could not initialize GLFW`     | DISPLAY / X11 授权       | 核对 Xorg、DISPLAY、UID、xhost；不要重装 ROS2                |
| `fatal SIGBUS`, `/dev/shm` 64M         | 共享内存不足             | 原容器应是 2G，检查 `df -h /dev/shm`；不要删除旧容器         |
| `ISOLATION OK` 不出现 / 容器 ID 不一致 | 容器是否被重建           | 不要直接修改脚本硬编码的容器身份，先审查网络隔离和备份       |

额外说明：在关闭面板后，`/motion/control/hand_joint_state` 仍可 100 Hz 更新，但 `hand_joint_command` 没有输出属于可能正常现象（未启用控制时不会发布）。

## 6. 安全关闭与重启原则

- 只要 MuJoCo 和 motion_control 仍在运行，**关闭最初的网页启动终端通常不影响面板后台**；反过来，关闭 MuJoCo/motion_control 所在的交互终端可能终止相应进程。

- 面板按 **停止录制并保存 → 停止发布指令**，需要关闭后端时在宿主机执行：

  ```bash
  python3 /home/vstc/a2_joint_panel_v2/launch_a2_panel.py --stop
  ```

- 正常关机前先备份录制数据，仿真窗口 Pause，然后按需关闭服务。**意外断电后从第 3 章重新开始**；Docker 镜像和容器通常保留，不必重新拉取约 10.5 GB 的镜像。

- 本方案采用 `--network a2sim_isolated`、`--ipc=private`、`--shm-size=2g` 的既有容器配置，**不应按官网 `--net=host --privileged` 原样重建**，避免与连通的 A2 真机混线。

- 本教程**不包含自动开机控制、不包含真机遥操作、不包含安全急停**。网页的“停止发布”也不是急停。

**官方参考**：智元 A2 v2.1《8. 运控仿真使用指南》  
https://open.agibot.com/docs/aimdk/a2/v2_1/dev_guide/08-motion_control_simulation
