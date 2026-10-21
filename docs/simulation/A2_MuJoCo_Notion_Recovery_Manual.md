---
title: "AGIBOT A2 MuJoCo 仿真启动与恢复操作手册"
description: "AGIBOT A2 MuJoCo 仿真启动、恢复站立、单杯场景调试与行走通路修复记录"
author: zzy1239
status: review
date: 2026-10-21
---
# AGIBOT A2 MuJoCo 仿真启动与恢复操作手册

更新：2026年10月21日。适用设备：5090工作站 `vstc@AGI`；既有隔离容器 `a2-ultra-sim`。
当前有两个任务场景：桌子场景 `a2_pick_dual_bottles_v1/candidate_table.yaml`（第一至十节），
单杯场景 `a2_pick_cup_v1/candidate_task.yaml`（第十一节）。

本页用于日常启动、机器人倒地复位、容器停止后的恢复，以及工作站关机或意外断电后的恢复。当前用户已反馈恢复成功，截图显示机器人站在桌前。今天的恢复不需要重新安装 Docker、MuJoCo 或驱动。

**每次先按故障情况选择一条路径，不要把本页所有启动、停止、重启命令从头执行一遍。** 真机、A30训练、RoboTwin和PoseVLA既有环境不属于这里的控制对象。

## 一 先判断从哪一步开始

| 当前情况                                   | 应执行的流程                   |
| ------------------------------------------ | ------------------------------ |
| MuJoCo窗口还在，运控也在，只是机器人倒地   | 第四节“服务运行时恢复站立”     |
| MuJoCo窗口还在，SetAction报56322连接被拒绝 | 第五节的“启动运控”，随后第四节 |
| 容器状态为Exited或停止                     | 第五节从“启动既有容器”开始     |
| 工作站刚关机、重启或意外断电               | 第五节从“登录工作站桌面”开始   |
| 宿主机GPU正常，容器GPU报NVML Unknown Error | 第八节GPU故障分支              |
| 窗口没有弹出、X11授权失败                  | 第五节图形授权检查及第八节     |
| 网页打不开，但仿真和运控都正常             | 第六节；不用因此重启仿真       |

## 二 区分宿主机和容器

### 2.1 看终端提示符

| 环境       | 提示符示例                            | 主要用途                                     |
| ---------- | ------------------------------------- | -------------------------------------------- |
| 5090宿主机 | `(base) vstc@AGI:~$` 或 `vstc@AGI:~$` | Docker管理、检查宿主机GPU、启动网页/视频工具 |
| A2服务容器 | `agi@1b654c472d82:~/a2_simulation$`   | 启动MuJoCo、运控、运行SetAction              |

`(base)`只是宿主机当前Conda环境标签，不要求切换或新建环境。进入容器后不要在里面运行`sudo docker`，该容器中没有Docker命令。`cd ~`只回到当前环境的用户目录，不会退出容器。

当前容器是原来的 `a2-ultra-sim`。`docker start`或`docker restart`启动/重启既有容器；本项目没有新建替代容器。

### 2.2 怎么打开终端

在5090的Ubuntu图形桌面上打开终端。如果从Windows远程控制5090，应在远控画面中的Ubuntu桌面操作，不是在Windows本机的CMD或PowerShell中输入Linux命令。

通常可按`Ctrl + Alt + T`；快捷键没有反应时，在Ubuntu应用菜单搜索“终端”或“Terminal”。再打开两个终端窗口，分别承担仿真、运控和操作命令的职责。

### 2.3 进入A2服务容器

**执行位置：5090宿主机。容器必须先处于运行状态。**

```bash
sudo docker exec -it --user agi a2-ultra-sim /bin/bash
```

看到`agi@1b654c472d82`表示进入了容器。每开一个新终端，若要运行容器内命令，都要重新执行这一条；它们进入的是同一个容器，不会创建新容器，也不会自动启动运控。

如果提示容器没有运行，先执行第五节的`docker start`。输入sudo密码时屏幕不显示字符是正常的，输入完成后回车。

### 2.4 回到宿主机

在没有前台仿真或运控占用的“操作命令终端”中输入：

```bash
exit
```

再次看到`vstc@AGI`就回到宿主机。不要在正在运行仿真或运控的窗口里用`exit`或关窗来充当暂停或急停。

### 2.5 三个终端的分工

| 窗口      | 内容                          | 使用习惯               |
| --------- | ----------------------------- | ---------------------- |
| 终端A     | MuJoCo仿真及日志              | 前台运行后保持打开     |
| 终端B     | motion_control运控及日志      | 前台运行后保持打开     |
| 终端C     | 进入容器、SetAction、状态查询 | 在这里输入日常操作命令 |
| 可选终端D | 宿主机网页和视频工具          | 按第六节处理           |

启动服务后终端持续输出日志、没有回到`$`提示符，通常表示前台程序仍在运行。不要在这个窗口继续粘贴新的shell命令，应使用终端C。关闭终端可能使前台服务退出；关闭浏览器或终端也不能保证机器人控制已停止。

## 三 先认识三个不同的状态

| 项目               | 代表什么                     | 不代表什么                                  |
| ------------------ | ---------------------------- | ------------------------------------------- |
| MuJoCo的Pause和Run | 仿真物理状态是否继续演化     | 不等于控制器Action已改变                    |
| `get_action()`     | 读取运控当前Action           | 不发送模式切换，不扶起倒地模型              |
| `SetAction.py`     | 请求切换运控Action           | 一次SUCCESS响应不等于已稳定站立             |
| `Key = 0`          | 选择编号0的关键帧            | 只有点Load key才加载；数字0本身不是加载证据 |
| `Load key`         | 加载该模型保存的整机初始状态 | 不代替正确的运控模式                        |
| 手臂HOME           | 面板中的手臂目标             | 不包含base/腿部全状态，不能代替站立复位     |

恢复顺序是：**停止面板输出 → Pause → 请求RL_JOINT_DEFAULT → 确认当前Action → Load key 0 → Run → 站稳 → RL_LOCOMOTION_DEFAULT → 再确认并观察。**

本次日志曾出现`CommonState_SUCCESS`后立即读取仍为`McAction_DEFAULT`。该次读取不足以确认切换完成；下面使用短时只读轮询，不反复发送切换请求。若始终没有变为目标状态，按第八节记录响应和运控日志。

## 四 服务运行时恢复站立

**适用前提：MuJoCo窗口已打开，运控已启动，SetAction或GetAction接口可响应。** 如果56322拒绝连接，先启动运控，不能直接继续下面的动作切换。

### 4.1 保存录制并停止面板输出

如果正在录制，先在网页停止并保存。面板确实运行时，在**5090宿主机**执行：

```bash
python3 /home/vstc/a2_joint_panel_v4/launch_a2_panel.py --stop
```

该命令请求停止网页面板后台，不关闭MuJoCo或运控，也不是急停。如果刚刚重启过容器且没有再打开面板，可以跳过本步。没有连接文件或匹配面板进程，通常表示面板未运行。

### 4.2 在MuJoCo点击Pause

在窗口左侧`Simulation`区域点击`Pause`。不要只看机器人是否不动：不动也可能是倒地、控制器未工作或窗口未更新。要确认Pause已选中。

此时保留终端A和终端B。不要把`Reset`作为这个流程的替代按钮。

### 4.3 实际请求位控站立模式

在**终端C的容器环境**执行：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc
python3 SetAction.py
```

根据菜单里的名称选择：

```text
RL_JOINT_DEFAULT
```

本次动作菜单编号是`10`，在`Enter the number corresponding to the desired action:`后输入10回车。以后软件菜单变化时按名称对应，不只记编号。

应收到成功响应；随后继续查询确认，不能只看到SUCCESS就点击Run。

### 4.4 只读确认位控Action

仍在**终端C的容器环境**完整复制下面代码块。最后的`PY`必须顶格，保留英文引号，不在末尾增加括号。

```bash
cd /home/agi/a2_simulation/tools-ultra/mc &&
python3 - <<'PY'
import time
from actions import get_action

expected = "McAction_RL_JOINT_DEFAULT"
for _ in range(20):
    current = get_action(mc_ip="127.0.0.1")
    print(current, flush=True)
    if current == expected:
        print("CONFIRMED:", current)
        break
    time.sleep(0.25)
else:
    raise SystemExit("STOP: target Action was not confirmed; keep MuJoCo paused.")
PY
```

确认标志：

```text
CONFIRMED: McAction_RL_JOINT_DEFAULT
```

这段代码只查询，最多20次，不发送任何新的Action。没有确认、出现连接错误或输出STOP时，保持暂停并按第八节排查。

### 4.5 加载Key0并运行

保持MuJoCo处于Pause：

1. 左侧`Simulation`中将`Key`设为`0`。
2. 点击`Load key`。
3. 查看模型是否回到预设起始姿态。
4. 点击`Run`。
5. 观察是否能站立、有无明显倒地或异常碰撞。

若加载后姿态未变，先确认点击的是`Load key`，不是仅把Key数字改成0。不要点击`Save key`覆盖厂家站立关键帧。

### 4.6 站稳后切换正常平衡模式

站稳后，在**终端C的容器环境**再次执行：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc
python3 SetAction.py
```

选择名称：

```text
RL_LOCOMOTION_DEFAULT
```

本次编号是`14`。这个步骤使用该模式维持正常平衡，本页不发送行走速度或行走目标。

随后执行完整查询：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc &&
python3 - <<'PY'
import time
from actions import get_action

expected = "McAction_RL_LOCOMOTION_DEFAULT"
for _ in range(20):
    current = get_action(mc_ip="127.0.0.1")
    print(current, flush=True)
    if current == expected:
        print("CONFIRMED:", current)
        break
    time.sleep(0.25)
else:
    raise SystemExit("STOP: target Action was not confirmed; keep MuJoCo paused.")
PY
```

看到`CONFIRMED: McAction_RL_LOCOMOTION_DEFAULT`后，再连续观察15～20秒：双脚支撑、没有持续倒地、没有明显漂移或异常接触，才记录“本次站立恢复成功”。

恢复后保持手臂、手指和行走输出关闭。打开页面、启用输出和执行抓取是另外的步骤。

## 五 容器停止或工作站断电后的完整恢复

容器或整机重启后，经`docker exec`启动的前台服务不会因为打开一个新终端就自动回来。按下面顺序恢复；服务已经存在时跳过相应启动步骤，避免重复实例。

### 5.1 先恢复5090工作站和桌面

1. 意外断电后先恢复供电并开机；没有事先配置远程唤醒时，通常需要现场按电源键。
2. 登录5090的`vstc` Ubuntu图形桌面。
3. 确认有线网络和远控连接恢复。远控仍不在线时，先现场处理开机、登录或网络；此时不能靠Docker命令修复一台无法访问的机器。
4. 在该图形桌面打开终端A、B、C。

不要求启动VMware，也不在A2真机ORIN上运行这里的命令。

### 5.2 检查宿主机GPU和Docker

**执行位置：5090宿主机终端C。**

```bash
nvidia-smi
sudo docker ps -a --filter name=a2-ultra-sim
```

GPU查询应正常返回。容器列表应能找到`a2-ultra-sim`，原ID前缀为`1b654c472d82`。

如果Docker提示无法连接daemon，先检查：

```bash
systemctl is-active docker
```

仅在整机刚开机、服务确实为`inactive`时启动已安装的Docker服务：

```bash
sudo systemctl start docker
```

随后重新运行`sudo docker ps -a --filter name=a2-ultra-sim`。若状态为failed或仍报错，保留错误；不要重装Docker或使用`systemctl restart docker`去影响其他容器。

### 5.3 仅在容器已停止时启动它

**执行位置：5090宿主机。**

容器状态是`Exited`或停止时：

```bash
sudo docker start a2-ultra-sim
```

如果已经是`Up`，不需要restart。若找不到这个容器，不要临时`docker run`新建替代品；先核对机器和原备份。

既有容器保留原网络和共享内存配置：`a2sim_isolated`内部bridge、非host网络/PID、2GiB共享内存。不要改成host网络。

### 5.4 检查容器GPU及已有服务

**执行位置：5090宿主机。**

```bash
sudo docker exec --user agi a2-ultra-sim nvidia-smi
sudo docker top a2-ultra-sim -eo pid,comm
```

容器GPU也应正常返回。若只有`ros_entrypoint`、`register-python`等基础进程，没有仿真/运控，继续下面启动流程。若已有`aimrt_main`或运控相关进程，先核对已有终端和GetAction，不启动第二份。

`docker top`的PID是宿主机视角；不要拿它直接去容器里kill。容器内GPU列表显示`No running processes found`，也不能据此判断宿主机训练已经结束。

### 5.5 确认当前DISPLAY

**执行位置：5090图形桌面的宿主机终端A。**

```bash
printf 'DISPLAY=%s\n' "$DISPLAY"
```

本次成功时为`:1`。整机重新登录后可能变化，后面的命令使用当前`$DISPLAY`，不固定猜`:0`或`:1`。若为空，或显示SSH转发的`localhost:10.0`之类地址，请回到5090本机图形桌面终端。

### 5.6 整机重启或重新登录后刷新X11授权

如果只是同一桌面会话中重启容器，并且当前窗口授权可用，可以跳过本节。整机重启、重新登录或出现授权错误时，原容器中的Xauthority文件可能已过期。

以下为补充的冷启动授权维护步骤，尚未在本工作站做整机断电实测。它只把当前桌面会话的授权复制到既有容器，旧文件保留为`.previous`，目标权限600；不会启动仿真，不更改X11访问控制列表。不要把授权文件内容或cookie复制进Notion、聊天或备份包。

**执行位置：5090图形桌面中的宿主机终端A。**

```bash
(
set -e -o pipefail
case "${DISPLAY:-}" in
    :[0-9]*|unix:[0-9]*) ;;
    *) echo "STOP: use a terminal in the 5090 local graphical desktop."; exit 1 ;;
esac
command -v xauth >/dev/null || { echo "STOP: host xauth is unavailable; no packages installed."; exit 1; }
A2_XAUTH_TMP="$(mktemp /tmp/a2sim_xauth.XXXXXX)"
trap 'rm -f "$A2_XAUTH_TMP"' EXIT
xauth nlist "$DISPLAY" | sed 's/^..../ffff/' | xauth -f "$A2_XAUTH_TMP" nmerge -
test -s "$A2_XAUTH_TMP" || { echo "STOP: no authorization entry for this DISPLAY."; exit 1; }
A2_XAUTH_STAGE="/tmp/$(basename "$A2_XAUTH_TMP")"
sudo docker cp "$A2_XAUTH_TMP" "a2-ultra-sim:$A2_XAUTH_STAGE"
sudo docker exec --user 0 a2-ultra-sim sh -c '
set -e
A2_SOURCE_AUTH="$1"
A2_TARGET_AUTH=/home/agi/.Xauthority-a2sim
if [ -e "$A2_TARGET_AUTH" ]; then
    cp -p "$A2_TARGET_AUTH" "$A2_TARGET_AUTH.previous"
    chmod 600 "$A2_TARGET_AUTH.previous"
fi
install -o agi -g "$(id -gn agi)" -m 600 "$A2_SOURCE_AUTH" "$A2_TARGET_AUTH"
rm -f "$A2_SOURCE_AUTH"
' sh "$A2_XAUTH_STAGE"
printf "XAUTH_READY: DISPLAY=%s\n" "$DISPLAY"
)
```

应输出`XAUTH_READY: DISPLAY=...`。若输出STOP，先处理对应原因，不继续启动GUI。不执行`xhost +`来放开整个X服务器。

### 5.7 终端A启动桌子场景

**执行位置：5090宿主机终端A。** 这是一整条`docker exec`命令，最后的单引号也要一起复制。

```bash
sudo docker exec -it --user agi \
  -e DISPLAY="$DISPLAY" \
  -e XAUTHORITY=/home/agi/.Xauthority-a2sim \
  -e ROS_DOMAIN_ID=20 -e ROS_LOCALHOST_ONLY=0 \
  -w /home/agi/a2_simulation/mujoco_sim_ultra_2.0/bin \
  a2-ultra-sim bash -c '
set -e
test -r "$XAUTHORITY" || { echo "STOP: XAUTHORITY missing or unreadable"; exit 1; }
test -r /home/agi/a2_simulation/tasks/a2_pick_dual_bottles_v1/candidate_table.yaml || { echo "STOP: candidate_table.yaml missing or unreadable"; exit 1; }
if pgrep -x aimrt_main >/dev/null; then
    echo "STOP: aimrt_main already running; no second instance started."
    exit 1
fi
source /opt/ros/humble/setup.bash
source ../share/ros2_plugin_proto/local_setup.bash
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+${LD_LIBRARY_PATH}:}${PWD}:${PWD}/../lib"
if ! pgrep -x iox-roudi >/dev/null; then
    ./iox-roudi &
fi
exec ./aimrt_main --cfg_file_path=/home/agi/a2_simulation/tasks/a2_pick_dual_bottles_v1/candidate_table.yaml
'
```

该命令在容器内使用官方`aimrt_main`、原bin工作目录、ROS Humble及厂家overlay，先启动或复用RouDi，再加载已验证的桌子版配置。它不会自动设置Action，也不会自动恢复站立。

窗口打开后，立即确认并点击`Pause`；模型在控制器恢复前可能已经倒地，随后用第四节Key0流程复位。终端A保持运行。如果出现`aimrt_main already running`，检查已有实例，不再重复启动。

若仍`could not create window`，保留本次终端和末尾日志，不按Enter退出丢失现场、不重复启动第二份；回到第八节检查GPU和X11。

### 5.8 终端B进入同一容器并启动运控

先在**5090宿主机终端B**执行：

```bash
sudo docker exec -it --user agi a2-ultra-sim /bin/bash
```

看到`agi@1b654c472d82`后，在**同一终端的容器环境**执行：

```bash
source /opt/ros/humble/setup.bash
export ROS_DOMAIN_ID=20 ROS_LOCALHOST_ONLY=0
cd /home/agi/a2_simulation/motion_control_ultra_2.0.19/scripts/motion_control
bash ./start_motion_control.sh
```

若出现：

```text
ERROR: AGIBOT_ROBOT_MODEL or AGIBOT_ROBOT_FORM environment variable is not set
Please select a robot:
0: raise_a2_lite
1: raise_a2_p1d2_flagship
2: raise_a2_t2d0_flagship
Please enter your choice:
```

在此提示处**只输入2并回车**，选择`raise_a2_t2d0_flagship`。这是型号选择，不是动作选择；以后按实际菜单名称对应。

这条ERROR在此脚本中会转入交互选择，并不表示脚本已经退出。选好后保持终端B运行。如果出现新的启动错误，保留末尾日志，不不断重启运控。

### 5.9 终端C进入容器并恢复站立

在**5090宿主机终端C**执行：

```bash
sudo docker exec -it --user agi a2-ultra-sim /bin/bash
```

先只读查看接口是否恢复：

```bash
cd /home/agi/a2_simulation/tools-ultra/mc &&
python3 - <<'PY'
from actions import get_action
print(get_action(mc_ip="127.0.0.1"))
PY
```

能够返回`McAction_DEFAULT`等状态，表示接口已响应；DEFAULT本身不是完成站立。现在从第四节4.2开始，按Pause、位控、确认、Key0、Run和平衡模式的顺序恢复。

## 六 网页面板和视频怎么处理

网页后台、窗口视频、MuJoCo和motion_control是不同服务。原网页已验证显示和手臂/手指控制，但桌子版的旧后台有一个已知兼容问题：`process_guard`写死官方配置名`a2_t2d0_ultra_cfg.yaml`，当前桌子使用`candidate_table.yaml`，可能被误判为仿真未运行。

因此，**桌子版当前先完成站立，面板配置名兼容修复验收后再恢复输出**。不要删除guard，也不要为了让面板通过而更改官方文件名。宿主机启动器在后台不健康时会复制三个面板文件，不应反复运行来“碰碰运气”。

已有健康后台时，以下命令仅重新打开入口，不会重新复制安装：

**执行位置：5090宿主机。**

```bash
python3 /home/vstc/a2_joint_panel_v4/launch_a2_panel.py --url
```

若提示后台未运行，先处理上述兼容问题。下面是原常规启动入口，仅在该场景兼容问题已修复，或运行已验证的官方空场景时使用：

```bash
python3 /home/vstc/a2_joint_panel_v4/launch_a2_panel.py
```

停止面板输出仍使用第四节的`--stop`。关闭网页不等于控制器停止；2秒保持、10秒停发保护需要保留，也不等于全身平衡控制已停止。窗口视频只是桌面捕获，并不是PoseVLA输入相机。

网页和视频URL可能含令牌，使用本机私有入口或书签，不把完整URL贴到Notion共享页面。

## 七 正常结束和保存数据

只做A2仿真收尾，不需要关闭其他训练任务或重启工作站。

1. 停止并保存网页录制，确认文件已经产生。
2. 停止面板输出。
3. 在MuJoCo点击Pause。
4. 要结束本次服务时，分别在运控终端B和仿真终端A用`Ctrl+C`请求结束，并确认终端返回提示符。
5. 需要把整个A2容器停止时，在**5090宿主机**执行下列命令；它会结束容器内剩余A2服务：

```bash
sudo docker stop --timeout 30 a2-ultra-sim
```

下次启动这个已停止的容器使用`docker start`，不是新建容器。若还要关闭整台5090，先安排好宿主机其他训练和任务，再通过桌面正常关机。

### 7.1 备份到宿主机

本次已有恢复前备份：

```text
/home/vstc/a2_gpu_recovery.tHCZki
```

这个目录不是未来所有新增录制的自动备份。新产生的数据要另存。可以在**5090宿主机**按下面方式新建一个备份目录，并复制任务场景：

```bash
A2_SAVE_DIR="/home/vstc/a2_manual_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -m 700 "$A2_SAVE_DIR"
sudo docker cp a2-ultra-sim:/home/agi/a2_simulation/tasks/a2_pick_dual_bottles_v1 "$A2_SAVE_DIR/task"
printf 'BACKUP_DIR=%s\n' "$A2_SAVE_DIR"
```

在同一个宿主机终端，**确认存在录制目录后**再复制录制：

```bash
if [ -n "${A2_SAVE_DIR:-}" ] && [ -d "$A2_SAVE_DIR" ]; then
    sudo docker cp a2-ultra-sim:/home/agi/a2_simulation/tools-ultra/mc/panel_recordings "$A2_SAVE_DIR/panel_recordings"
else
    echo "STOP: first create A2_SAVE_DIR in this same host terminal."
fi
```

复制后检查目的目录和文件。不要复制整个mc目录、panel_connection.json、private_link.txt、令牌或Xauthority文件到共享记录。已有脚本完整备份中的源代码、场景、归档成员和SHA256清单也应保留。

### 7.2 意外断电后哪些状态需要重建

仿真姿态、当前Action、前台进程和未保存录制不能依靠重新开机自动恢复。若磁盘和既有容器完整，容器文件通常仍保留；这不保证断电前尚未写盘的数据完整。未完成episode需要单独标记，不当成成功示教。

本次任务目录没有独立宿主机数据bind挂载，备份到宿主机很有必要。不要删除容器、运行prune或重装来“清理”故障；重启也不等于恢复旧的物理状态和进程。

## 八 常见错误与对应处理

| 输出或现象                                         | 含义与处理                                                   |
| -------------------------------------------------- | ------------------------------------------------------------ |
| 容器里提示docker不存在                             | 环境用错了；在空闲操作终端exit回宿主机运行Docker命令         |
| container is not running                           | 先在宿主机docker start既有容器，再docker exec                |
| 找不到a2-ultra-sim                                 | 核对是否在5090及原Docker环境；保留错误，不新建替代容器       |
| 56322 Connection refused                           | 运控接口未监听/就绪；启动或检查终端B，不能仅重发SetAction    |
| 查询返回McAction_DEFAULT                           | 接口已通，但尚未确认站立位控Action；查询本身不会设置Action   |
| SUCCESS后立即查询仍DEFAULT                         | 先短时只读轮询确认；未确认则保留响应和MC日志，不反复切换     |
| invalid work mode                                  | 记录原响应和MC日志，核对仿真/运控是否正常；不强造未知work mode请求 |
| unmatched ')'                                      | 复制了旧的错误查询；改用本页多行代码块，不再附加右括号       |
| 显示Key0但仍倒地                                   | 确认Pause、正确Action以及实际点击Load key，不只改数字        |
| 起始姿态正常但Run后再倒                            | Pause，保存Action查询和MC/仿真日志；不能仅凭该现象断言桌子或GPU故障 |
| could not create window                            | 先GPU查询，再DISPLAY、Xauthority和X11；不是重新编译模型的理由 |
| XAUTHORITY missing或no authorization entry         | 回5090当前图形会话检查DISPLAY和授权；不使用xhost +           |
| GLFW_LIBRARY_UNRESOLVED                            | 旧恢复脚本不适用于厂家内置GLFW；使用本页原生程序入口         |
| --time deprecated                                  | 旧参数名警告；当前命令使用--timeout，不需要因此重装Docker    |
| Both A2 MuJoCo… and motion_control must be running | 也可能是面板旧配置名guard不认识candidate_table；先核对真实进程，不据此重启运控 |

### 8.1 宿主机正常但容器GPU再次失败

本次曾实际遇到：宿主机`nvidia-smi`正常，容器普通用户和root均NVML Unknown Error；一次既有容器重启后GPU查询恢复。具体触发事件没有确认，不能把所有图形错误都当成相同原因。

仅在再次出现同类对照时，先保存录制、停止面板、Pause并备份当前新增数据。然后在**5090宿主机**执行一次：

```bash
sudo docker restart --timeout 30 a2-ultra-sim &&
sudo docker exec --user agi a2-ultra-sim nvidia-smi &&
sudo docker top a2-ultra-sim -eo pid,comm
```

这会结束容器内所有服务及exec会话。恢复GPU后从第五节启动仿真和运控，再恢复站立；GPU仍失败则保留输出停止扩大操作，不连续重启、重建容器、改驱动、改Docker全局配置或停止其他GPU任务。

宿主机GPU查询也失败时，保留宿主机错误；上述“宿主正常/容器失败”的恢复依据不再成立。

## 九 当前入口和重要路径

| 用途               | 路径或名称                                                   |
| ------------------ | ------------------------------------------------------------ |
| 既有容器           | a2-ultra-sim；ID前缀1b654c472d82                             |
| 隔离网络           | a2sim_isolated；内部bridge                                   |
| 共享内存           | 2147483648字节，即2GiB                                       |
| 官方仿真根目录     | /home/agi/a2_simulation/mujoco_sim_ultra_2.0                 |
| 官方空场景启动脚本 | /home/agi/a2_simulation/mujoco_sim_ultra_2.0/bin/start_a2_t2d0_ultra.sh |
| 当前桌子配置       | /home/agi/a2_simulation/tasks/a2_pick_dual_bottles_v1/candidate_table.yaml |
| 双瓶候选配置       | /home/agi/a2_simulation/tasks/a2_pick_dual_bottles_v1/candidate_task.yaml |
| 官方运控启动脚本   | /home/agi/a2_simulation/motion_control_ultra_2.0.19/scripts/motion_control/start_motion_control.sh |
| Action工具目录     | /home/agi/a2_simulation/tools-ultra/mc                       |
| 运控RPC            | 容器内127.0.0.1:56322                                        |
| 宿主机面板目录     | /home/vstc/a2_joint_panel_v4                                 |
| 容器录制目录       | /home/agi/a2_simulation/tools-ultra/mc/panel_recordings      |
| 当前图形授权文件   | /home/agi/.Xauthority-a2sim，属于会话凭据，不共享            |

桌子配置是当前已显示的场景。双瓶配置已通过同版本离线编译/forward，但本轮没有完成双瓶落桌、抓取或相机数据采集验收；不要把它当作已经完成的PoseVLA任务。官方空场景和站立Key0均保留。

需要回官方空场景时，在没有另一个仿真实例运行的前提下，从原bin目录使用原脚本，并重新按完整站立流程初始化；不要改写官方XML/YAML或通过覆盖Key0做回退。官方入口与桌子入口二选一，空场景没有桌子是正确现象。

## 十 每次恢复后的记录模板

```text
日期和时间：
使用场景：官方空场景 / candidate_table / 其他已验证版本
宿主机GPU查询：正常 / 异常
容器GPU查询：正常 / 异常
MuJoCo窗口和桌子：可见 / 不可见
运控型号：raise_a2_t2d0_flagship
位控Action查询：
是否实际点击Load key0：
Run后是否站稳：
最终Action查询：
观察时长：
面板输出：关闭 / 其他
本次录制或备份路径：
异常及末尾日志：
```

不要把网页令牌或图形授权内容填入记录。单张站立截图不记录成已持续站稳20秒；一次SUCCESS不记录成抓取成功。

## 十一 单杯场景推进与调试记录（2026-10-19 至 2026-10-20）

前面第一到第十节针对**桌子场景**（`a2_pick_dual_bottles_v1`）。本节记录之后从桌子推进到**独立单杯场景**的过程、桌高调整、行走通路修复和已知问题。

**先读这一句**：本节大部分结论来自**文件回读和本地检查**，不等于运行中的 MuJoCo 已经加载同一版本。每条都标注了证据等级，验收前请按对应条目重新取证。

### 11.1 仿真环境基线（与真机隔离）

| 项目 | 已有记录 |
| --- | --- |
| 宿主机 | `vstc@AGI` |
| GPU | NVIDIA RTX 5090 |
| 容器 | `a2-ultra-sim` |
| 已记录容器 ID 前缀 | `1b654c472d82` |
| 容器网络 | `a2sim_isolated` |
| 仿真程序 | MuJoCoSim Ultra 2.0 |
| 运控目录版本 | `motion_control_ultra_2.0.19` |
| 仿真 ROS 域 | `ROS_DOMAIN_ID=20` |
| 本地通信设置 | `ROS_LOCALHOST_ONLY=0` |

::: danger 仿真与真机必须分开
仿真环境与真机 Orin 环境是两套独立配置。真机使用的 **ROS 域 232**、RPC 目标地址和在线规划模式，
**不能直接套用到仿真恢复流程**。混用会导致命令发到错误目标。

恢复过程中保留官方机器人模型、原始配置和站立关键帧；桌子和杯子只在任务副本中调整，
不改官方 XML/YAML，也不覆盖 Key0。
:::

### 11.2 已恢复的状态与遗留问题

已恢复：MuJoCo 图形界面、桌前场景、机器人直立状态。现场曾确认恢复成功，
截图显示机器人在桌前直立、MuJoCo 处于 Run。

**这一结果证明基础环境曾恢复到可见、可运行状态。** 但全工作站断电后的完整冷启动流程
虽然已经整理成文，**没有完整现场验收记录**，所以不能写成「任意断电后已验证自动恢复」。

此前遇到过的问题，遇到时按下表定位：

| 现象 | 排查方向 |
| --- | --- |
| 无法创建图形窗口 | X11 授权，见 5.6 节 |
| 宿主机 GPU 正常，容器内 NVML 异常 | 容器 GPU 分支，见 8.1 节 |
| 已有仿真进程，却看不到窗口 | 进程存在但窗口在另一 DISPLAY，见 5.5 节 |
| 运控服务未启动，或重复启动导致端口占用 | 先查 56322 端口占用，再启动运控 |
| Action 仍为 DEFAULT，加载后直接 Run 导致倒地 | 必须先请求位控模式再 Load Key0，见第四节 |

### 11.3 网页面板与视频显示

**桌子版入口**（宿主机执行）：

```bash
python3 /home/vstc/A2_Open_Table_Web_20261019.py
```

首次运行曾被源码指纹检查拦截。原因是 Python 版本之间 AST 字段差异可能造成误判；
修复后增加了逐项检查输出。现场日志出现以下序列时，表示该次检查与启动通过：

```text
SOURCE_CHECK ... MATCH
TABLE_RUNTIME_OK
PANEL_READY
PANEL_OPENED
VIDEO_READY
```

::: warning 网页里的视频不是训练数据通路
网页嵌入的视频来自 **MuJoCo 窗口捕获**，只用于人工观察。

它与机器人相机训练数据的采集是**不同通路**。浏览器显示了画面，
**不代表同步训练图像已经保存**。要训练数据请走相机采集流程，不要用这个视频。
:::

::: danger 私有地址不要写进文档
面板的私人地址和视频访问令牌属于会话凭据。**不要写入操作手册、公开报告或共享页面**。
:::

### 11.4 单杯场景（当前调试目标）

早期运行的是**双瓶任务目录下的桌子副本**，所以只看到桌子。
不能因为看到桌子就认定单杯场景已经加载。

单杯场景单独建立并调试，路径：

| 项目 | 路径 |
| --- | --- |
| 单杯任务目录 | `/home/agi/a2_simulation/tasks/a2_pick_cup_v1` |
| 单杯配置 | `/home/agi/a2_simulation/tasks/a2_pick_cup_v1/candidate_task.yaml` |
| 单杯面板入口（宿主机） | `python3 /home/vstc/a2_joint_panel_cup_v1_20261019/launch_a2_panel.py` |

后续截图已经出现桌面上的蓝色杯子，并进入手动接近和抓取调试。

::: tip 面板入口只负责打开面板
这条入口用于打开或复用单杯面板。它**不会因为网页打开就自动恢复站立或开始运动**，
站立仍需按第四节流程操作。
:::

**旧桌子面板与单杯面板是不同副本。** 单杯调试时必须使用对应入口，
避免读取到旧场景的连接文件或状态。

### 11.5 桌高调整：已证实 0.86 m，1.05 m 待验证

最近一次明确回读的桌高为 **0.86 米**。回读结果：

```text
TABLE_CONFIG_M: 0.86
HEIGHT_ADJUSTMENT:
old_top_z: 0.78
new_top_z: 0.86
cup_initial_z: 0.915

TABLE_XML_M: 0.86
MODE: ARMED
```

据此可以确认：

- 任务配置中的桌面高度为 **0.86 m**；
- XML 中的桌面高度与配置一致；
- 杯子配置初始高度为 **0.915 m**；
- 该次面板状态为 `ARMED`，并能读取左臂实际关节值。

::: warning 文件回读 ≠ 运行中已加载
上面的数字来自**文件回读**，本身不证明运行中的 MuJoCo 已经重新加载同一版本。
所以报告里的表述保留为「最近明确文件回读值」。
:::

之后针对**夹持区域仍明显高于杯子**的情况，准备了新版升桌程序：

```text
A2_Raise_Cup_Table_20261020.py
```

其默认调试目标是桌面绝对高度 **1.05 m**。本地几何检查、备份事务和失败回退检查已通过。

::: danger 1.05 m 尚未现场验证
目前**没有完整现场日志**证明 1.05 m 版本已成功加载并完成动态抓取验收。

因此：**最新已证实的文件高度仍是 0.86 m**，1.05 m 只能记录为「待现场验证的调试方案」。
:::

### 11.6 手臂滑条控制：能运动，但存在状态与路径问题

手臂滑条已经发生过**实际运动**：用户确认手臂会随操作运动，
出现过 `ARMED` 及约 **100 Hz** 输出的面板记录。

后来再次无法操作时，遇到过**不同类型**的问题：

| 可能原因 | 判断依据 |
| --- | --- |
| 面板连接文件不存在 | 面板提示找不到连接文件 |
| 控制器处于 `IDLE` 或 `FAULT` | 查询控制器状态 |
| 当前 Action 与手臂控制入口要求不一致 | 查询 Action 是否为位控模式 |
| 持续跟踪误差触发停发 | 日志出现 `Sustained tracking error` |
| 手或腕部接近桌沿，运动路径受阻 | 截图观察末端位置 |

::: warning 「滑条不动」不能统一归因
不能一律归因为「滑条幅度太小」或「关节限位」。上面每一类都需要单独排查。
:::

一次明确的故障记录：

```text
Sustained tracking error > 0.21 rad
```

同时面板输出频率为 **0**，表示跟踪保护已经停发。截图显示手腕及手部位于**桌面以下、
靠近桌沿**，但尚未取得精确的接触体与接触力数据。

**这次调试得出一个关键结论**：提高桌子只能改变最终抓取高度，
**不能解决手从桌面以下穿越桌沿的接近路径**。接近路径需要单独调整起始位姿或轨迹。

### 11.7 行走功能：两类源码修复完成，步态待验证

用户曾成功切到仿真行走模式，并查询得到：

```text
McAction_RL_LOCOMOTION_DEFAULT
```

但网页行走仍不动。检查发现**两个具体问题**：

**问题一：消息封装**

原实现依赖缺失的 `google.protobuf`，与上传的厂家示例实际采用的 **JSON 封装**不一致。
已按厂家示例准备 JSON 编码修复，避免为此安装新的系统依赖。

**问题二：发布话题缺少完整后缀**

修复后的目标话题为：

```text
/motion/control/locomotion_velocity/pb_3Aaimdk_2Eprotocol_2EMcLocomotionVelocityChannel
```

最新修复入口：

```text
A2_Fix_Cup_Walk_Topic_20261020.py
```

本地检查确认发布话题与已审厂家协议一致，并验证了安装、幂等处理、失败回退等逻辑。

::: danger 行走尚未完成现场验收
上述结果属于**本地检查**。此前现场画面仍出现过**行走订阅者 0、发布计数 0**，
尚未取得修复后机器人实际后退、前进和转向的完整记录。

**行走验收需要同时观察五项**：接收端连接、非零速度命令、发布计数、
机器人实际位移、松开后停止。

**单独切到模式 14 不能证明行走通路已经打通。**
:::

### 11.8 日常恢复的状态顺序

在 MuJoCo 和运控服务**已经运行**的情况下，恢复顺序为：

1. 保存录制，停止面板输出。
2. 将 MuJoCo 切到 **Pause**。
3. 请求 `RL_JOINT_DEFAULT`，通过查询确认。
4. 加载 **Key0**。
5. 切到 **Run**，观察机器人站立情况。
6. 站稳后请求 `RL_LOCOMOTION_DEFAULT`，再次确认。
7. 最后重新启用对应面板控制。

::: warning 按动作名称确认，不要记编号
本次仿真菜单中，位控模式曾对应 **10**，行走模式曾对应 **14**。

**这些编号可能随版本变化**，以后仍应按**动作名称**确认，不要背编号。
:::

### 11.9 本节证据等级汇总

| 结论 | 证据等级 | 还需要什么 |
| --- | --- | --- |
| 基础环境可恢复到可见、可运行 | 现场截图确认 | — |
| 桌子网页面板启动与视频显示 | 现场日志 `PANEL_READY` / `VIDEO_READY` | — |
| 单杯场景已加载蓝色杯子 | 现场截图 | 完整任务验收 |
| 桌高 0.86 m | 文件回读 | 运行中确认已加载该版本 |
| 桌高 1.05 m | 仅本地几何检查 | **现场加载 + 动态抓取验收** |
| 手臂滑条可驱动 | 现场运动确认 | 稳定接近路径 |
| 行走通路修复 | 仅本地检查 | **现场五项指标全部通过** |
| 全断电冷启动 | 流程已整理 | **完整现场验收** |

---

## 十二 如何保存到Notion

下载本页Markdown文件，在Notion桌面版或网页版选择`Settings / 设置 → Import / 导入 → Text & Markdown / 文本和Markdown`，选择`.md`文件。导入后保留代码块格式，按代码块整体复制命令；不要从渲染后的聊天转义文本拼接。

也可以将需要的章节复制到现有页面。将旧查询中多出的括号错误删除，保留本页多行查询作为统一版本。标题和章节导入后可以在Notion中插入目录；Markdown锚点不一定随导入保留。

## 十三 依据与验证范围

现场已验证：同一容器重启后NVML恢复；原生MuJoCo桌子场景可见；官方运控目录菜单；官方Action请求接口；用户反馈恢复成功且截图显示站立。当前最终平衡Action的有效查询和15～20秒持续观察日志未在本次消息中提供，应按记录模板补充。

本页命令已做离线shell/Python语法核对，状态轮询和Xauthority分支可做替身检查；不会为编写手册而执行真实Action、重启或关闭工作站。整机意外断电恢复与本页新增Xauthority刷新流程未做5090断电实测，遇到STOP保留对应输出。

主要原始文件：厂家start_a2_t2d0_ultra.sh、start_motion_control.sh、mc/SetAction.py及actions.py；最新现场源码快照为20261018_112712_439301。官方空场景及站立Key0未修改。

官方参考：

- Docker start：https://docs.docker.com/reference/cli/docker/container/start/
- Docker exec：https://docs.docker.com/reference/cli/docker/container/exec/
- Docker restart：https://docs.docker.com/reference/cli/docker/container/restart/
- Docker stop：https://docs.docker.com/reference/cli/docker/container/stop/
- Docker文件存储：https://docs.docker.com/engine/storage/
- NVIDIA容器故障：https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/troubleshooting.html
- X11授权：https://www.x.org/releases/X11R7.0/doc/html/Xsecurity.7.html
- X11会话通信：https://www.x.org/guide/communication/
- Notion导入：https://www.notion.com/help/import-data-into-notion
