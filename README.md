# Domain Detector

Highlights suspicious Unicode characters in domain names and links to detect phishing attempts.

## Features

- 🔍 Detects 40+ character sets (Cyrillic, Greek, Arabic, Hebrew, etc.)
- 🎨 Highlights suspicious domains with colored boxes
- ⚡ Real-time detection for dynamically loaded content
- ⚙️ Fully customizable detection rules
- 🎯 Detects homograph attacks (look-alike characters)

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Install from [Greasyfork](https://greasyfork.org/zh-CN/scripts/573632-%E9%A1%B5%E9%9D%A2%E5%86%85%E5%AE%B9%E5%BC%82%E5%B8%B8%E5%AD%97%E7%AC%A6%E6%A3%80%E6%B5%8B)

## Usage

- Script auto-runs on page load
- Suspicious domains are highlighted with colored borders
- Hover over highlights to see what's suspicious
- Click "Show/Hide" button (bottom-right) to toggle visibility
- Open Tampermonkey menu → "Link Detection Settings" to customize

## Examples

Phishing attempts this script detects:

- `gооgle.com` (Cyrillic О instead of O)
- `раypal.com` (Cyrillic р instead of p)
- `examplе.com` (Cyrillic е instead of e)
- `αmazon.com` (Greek α instead of a)

## Settings

Access via Tampermonkey menu → "Link Detection Settings"

- Enable/disable detection
- Add/edit/delete detection rules
- Customize colors and severity levels
- Reset to default rules

## License

MIT

------

# 域名检测器

通过高亮可疑的Unicode字符来检测钓鱼链接。

## 功能特性

- 🔍 检测40+种字符集（西里尔字符、希腊字符、阿拉伯字符、希伯来字符等）
- 🎨 用彩色框突出显示可疑域名
- ⚡ 实时检测动态加载的内容
- ⚙️ 完全可自定义的检测规则
- 🎯 检测同形体攻击（看起来相似的字符）

## 安装方式

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 从 [Greasyfork](https://greasyfork.org/zh-CN/scripts/573632-%E9%A1%B5%E9%9D%A2%E5%86%85%E5%AE%B9%E5%BC%82%E5%B8%B8%E5%AD%97%E7%AC%A6%E6%A3%80%E6%B5%8B)安装

## 使用方法

- 脚本在页面加载时自动运行
- 可疑域名会被彩色框突出显示
- 将鼠标悬停在高亮处可查看可疑原因
- 点击右下角的"显示/隐藏"按钮切换可见性
- 打开 Tampermonkey 菜单 → "链接检测设置" 自定义规则

## 检测示例

此脚本可检测的钓鱼尝试：

- `gооgle.com`（西里尔字符О代替O）
- `раypal.com`（西里尔字符р代替p）
- `examplе.com`（西里尔字符е代替e）
- `αmazon.com`（希腊字符α代替a）

## 设置

通过 Tampermonkey 菜单 → "链接检测设置" 访问

- 启用/禁用检测
- 添加/编辑/删除检测规则
- 自定义颜色和风险等级
- 重置为默认规则

## 许可证

MIT