// ==UserScript==
// @name         页面内容异常字符检测
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  实时检测页面中超链接和网址中的西里尔字符等异常字符，用框框标记，支持隐藏标记
// @author       myncdw
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    /* ===================== 配置常量 ===================== */

    const RULES_KEY = 'char_detection_rules';
    const ENABLED_KEY = 'char_detection_enabled';
    const MARKS_VISIBLE_KEY = 'char_marks_visible';
    const MARK_CLASS = 'char-detection-mark';

    // 常见顶级域名列表
    const COMMON_TLDS = [
        // 通用顶级域名
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'int',
        // 商业相关
        'biz', 'info', 'mobi', 'name', 'pro', 'aero', 'asia', 'cat', 'coop', 'jobs', 'museum', 'tel', 'travel', 'xxx',
        // 新通用顶级域名（部分热门）
        'app', 'blog', 'cloud', 'dev', 'io', 'ai', 'top', 'online', 'site', 'website', 'space', 'tech', 'store', 'shop', 'services', 'solutions', 'support', 'systems', 'team', 'today', 'tools', 'trade', 'tv', 'vip', 'watch', 'web', 'wiki', 'win', 'work', 'world', 'xyz',
        // 国家代码顶级域名（热门）
        'uk', 'us', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'gr', 'pt', 'ie', 'lt', 'lv', 'ee', 'ru', 'ua', 'by', 'kz', 'uz', 'tk', 'cn', 'jp', 'kr', 'tw', 'hk', 'sg', 'my', 'th', 'vn', 'ph', 'id', 'in', 'pk', 'bd', 'au', 'nz', 'br', 'mx', 'ar', 'cl', 'co', 'pe', 'za', 'eg', 'ng', 'ke', 'il', 'ae', 'sa', 'tr', 'ir', 'pk', 'gr', 'cz', 'sk', 'si', 'hr', 'ba', 'rs', 'mk', 'al', 'is', 'faroe', 'ge', 'am'
    ];

    // 构建网址正则表达式：包含 http(s):// 或 **.tld 等域名格式
    const TLD_PATTERN = COMMON_TLDS.join('|');
    const URL_REGEX = new RegExp(
        `(?:https?:\\/\\/)?(?:[a-zA-Z0-9\\u0100-\\uffff][\\w\\u0100-\\uffff-]*\\.)*[a-zA-Z\\u0100-\\uffff0-9][\\w\\u0100-\\uffff-]*\\.(?:${TLD_PATTERN})(?:\\/[^\\s<>"\\)]*)?`,
        'gi'
    );

    // 默认的异常字符规则（扩展版）
    const DEFAULT_CHAR_RULES = [
        // ===== 西里尔字符系列 =====
        {
            pattern: '[а-яА-ЯёЁ]',
            desc: '西里尔字符（俄语）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[ѐ-ӿ]',
            desc: '西里尔字符扩展（乌克兰、塞尔维亚等）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[Ѐ-ӿ]',
            desc: '西里尔大写扩展',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[ҀҁғҢңҤҥҦҧҨҩҪҫҬҭҮүҰұҲҳҴҵҶҷҸҹҺһҼҽҾҿ]',
            desc: '马其顿/巴什基尔字符',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[Ҁҁғғғғҝҝҟҟҡҡңңҥҥҧҧҩҩҫҫҭҭүүұұҳҳҵҵҷҷҹҹһһҽҽҿҿ]',
            desc: '西里尔字母小写扩展',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },

        // ===== 希腊字符系列 =====
        {
            pattern: '[α-ωΑ-Ω]',
            desc: '希腊字符（基础）',
            enabled: true,
            severity: 'high',
            color: '#ffaa44'
        },
        {
            pattern: '[ά-ώΆ-Ώ]',
            desc: '希腊字符（重音符号）',
            enabled: true,
            severity: 'high',
            color: '#ffaa44'
        },
        {
            pattern: '[ϐ-ϑϒ-ϓϔϕ-ϖϗ-ϛϜ-ϝϞ-ϟϠ-ϡϢ-ϣϤ-ϥϦ-ϧϨ-ϩϪ-ϫϬ-ϭϮϯ]',
            desc: '希腊字符扩展变体',
            enabled: true,
            severity: 'high',
            color: '#ffaa44'
        },

        // ===== 亚美尼亚、格鲁吉亚等 =====
        {
            pattern: '[Ա-ևᴀ-ჿ]',
            desc: '亚美尼亚字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ა-ჺჽ-ჾჿ]',
            desc: '格鲁吉亚字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },

        // ===== 希伯来、阿拉伯字符 =====
        {
            pattern: '[א-ת]',
            desc: '希伯来字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ء-ي]',
            desc: '阿拉伯字符（基础）',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ٰ-ٿ]',
            desc: '阿拉伯字符（扩展）',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ۀ-ے]',
            desc: '阿拉伯字符（波斯体）',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },

        // ===== 梵文、印地文及南亚字符 =====
        {
            pattern: '[ऀ-ः]',
            desc: '梵文字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[अ-ह]',
            desc: '印地文字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[०-९]',
            desc: '梵文数字',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ଅ-ୋ]',
            desc: '奥里亚字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ஃ-ஊ]',
            desc: '泰米尔字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[ಅ-ಋ]',
            desc: '卡纳达字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },

        // ===== 泰文、老挝、柬埔寨 =====
        {
            pattern: '[\u0E00-\u0E7F]',
            desc: '泰文字符',
            enabled: true,
            severity: 'medium',
            color: '#ffaa44'
        },
        {
            pattern: '[\u0E80-\u0EDF]',
            desc: '老挝字符',
            enabled: true,
            severity: 'medium',
            color: '#ffaa44'
        },
        {
            pattern: '[\u1780-\u17FF]',
            desc: '高棉字符',
            enabled: true,
            severity: 'medium',
            color: '#ffaa44'
        },

        // ===== 格鲁吉亚、格拉哥里字符 =====
        {
            pattern: '[\u0487-\u052F]',
            desc: '格拉哥里和西里尔字符',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },

        // ===== 其他欧洲和东欧字符 =====
        {
            pattern: '[ăąćĉċčďđĕėęěĝğġģĥħĩīĭįıĵķĸĹĻľŀłńņňŉŋŔŕŖŗŘřŚŜŞŠţŤŦũūŭůűųŵŷźżž]',
            desc: '扩展拉丁字符（中欧语言）',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },

        // ===== 越南、缅甸、孟加拉字符 =====
        {
            pattern: '[\u0980-\u09FF]',
            desc: '孟加拉字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[\u0A00-\u0A7F]',
            desc: '古吉拉特字符',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[\u0B00-\u0B7F]',
            desc: '奥里亚字符扩展',
            enabled: true,
            severity: 'medium',
            color: '#ff8844'
        },
        {
            pattern: '[\u1000-\u109F]',
            desc: '缅甸字符',
            enabled: true,
            severity: 'medium',
            color: '#ffaa44'
        },

        // ===== 东亚字符（默认禁用）=====
        {
            pattern: '[一-龥]',
            desc: '汉字',
            enabled: false,
            severity: 'low',
            color: '#88ccff'
        },
        {
            pattern: '[ぁ-ん]',
            desc: '日文平假名',
            enabled: false,
            severity: 'low',
            color: '#88ccff'
        },
        {
            pattern: '[ァ-ヴー]',
            desc: '日文片假名',
            enabled: false,
            severity: 'low',
            color: '#88ccff'
        },
        {
            pattern: '[가-힣]',
            desc: '韩文',
            enabled: false,
            severity: 'low',
            color: '#88ccff'
        },

        // ===== 看起来相似的字符组合 =====
        {
            pattern: '[ıӏӀl]',
            desc: '看起来像"l"的字符（钓鱼风险）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[οοО0Ｏ]',
            desc: '看起来像"o"和"0"的字符',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[рр]',
            desc: '西里尔字符"р"（看起来像拉丁"p"）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[ехх]',
            desc: '西里尔字符"х"（看起来像拉丁"x"）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        },
        {
            pattern: '[ссс]',
            desc: '西里尔字符"с"（看起来像拉丁"c"）',
            enabled: true,
            severity: 'high',
            color: '#ff5555'
        }
    ];

    /* ===================== 规则管理 ===================== */

    function getCharRules() {
        const saved = GM_getValue(RULES_KEY, null);
        return saved || DEFAULT_CHAR_RULES;
    }

    function saveCharRules(rules) {
        GM_setValue(RULES_KEY, rules);
    }

    function getDetectionEnabled() {
        return GM_getValue(ENABLED_KEY, true);
    }

    function setDetectionEnabled(value) {
        GM_setValue(ENABLED_KEY, value);
    }

    function getMarksVisible() {
        return GM_getValue(MARKS_VISIBLE_KEY, true);
    }

    function setMarksVisible(value) {
        GM_setValue(MARKS_VISIBLE_KEY, value);
        updateMarksVisibility(value);
    }

    /* ===================== 样式注入 ===================== */

    GM_addStyle(`
        .${MARK_CLASS} {
            padding: 2px 4px;
            border-radius: 4px;
            cursor: help;
            position: relative;
            transition: all 0.2s ease;
            display: inline-block;
            border: 2px solid;
        }

        .${MARK_CLASS}:hover {
            filter: brightness(1.2);
            box-shadow: 0 0 8px currentColor;
        }

        .char-detection-tooltip {
            position: absolute;
            background: #1a1a1a;
            color: #eee;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            white-space: nowrap;
            z-index: 2147483646;
            border: 1px solid #555;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            pointer-events: none;
            font-family: system-ui;
        }

        .${MARK_CLASS}:hover .char-detection-tooltip {
            display: block;
        }

        .char-detection-tooltip {
            display: none;
        }

        .${MARK_CLASS}.hidden {
            border-color: transparent !important;
            background-color: inherit !important;
            box-shadow: none !important;
        }

        .${MARK_CLASS}.hidden:hover {
            filter: none;
            box-shadow: none !important;
        }
    `);

    /* ===================== 检测异常字符 ===================== */

    function detectSuspiciousChars(text) {
        const rules = getCharRules().filter(r => r.enabled);
        const results = [];

        rules.forEach(rule => {
            try {
                const regex = new RegExp(rule.pattern, 'g');
                const matches = text.match(regex);

                if (matches) {
                    const uniqueChars = [...new Set(matches)];
                    results.push({
                        rule: rule,
                        characters: uniqueChars,
                        count: matches.length
                    });
                }
            } catch (e) {
                console.error(`正则表达式错误: ${rule.pattern}`, e);
            }
        });

        return results;
    }

    /* ===================== 标记包含异常字符的链接和域名 ===================== */

    let markedElements = new Set();

    function markLinksWithSuspiciousChars() {
        if (!getDetectionEnabled()) return;

        // 1. 处理 <a> 标签
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            if (markedElements.has(link)) return;

            const href = link.getAttribute('href');
            const text = link.textContent;

            const hrefResults = detectSuspiciousChars(href);
            const textResults = detectSuspiciousChars(text);
            const allResults = [...hrefResults, ...textResults];

            if (allResults.length > 0) {
                markedElements.add(link);

                // 标记整个链接元素
                const rule = allResults[0].rule;
                link.classList.add(MARK_CLASS);
                link.style.borderColor = rule.color;
                link.style.backgroundColor = `${rule.color}15`;

                // 添加工具提示
                const tooltip = document.createElement('div');
                tooltip.className = 'char-detection-tooltip';
                tooltip.style.borderColor = rule.color;
                tooltip.textContent = `异常字符: ${allResults.map(r => r.rule.desc).join(', ')}`;
                link.appendChild(tooltip);
            }
        });

        // 2. 处理文本节点中的域名
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodesToProcess = [];
        let node;
        while (node = walker.nextNode()) {
            if (markedElements.has(node)) continue;

            const parent = node.parentElement;
            if (parent && parent.tagName === 'A') continue;
            if (parent && parent.classList.contains(MARK_CLASS)) continue;

            // 检查是否包含可能的域名
            if (URL_REGEX.test(node.textContent)) {
                URL_REGEX.lastIndex = 0; // 重置正则表达式
                textNodesToProcess.push(node);
            }
        }

        textNodesToProcess.forEach(textNode => {
            const text = textNode.textContent;
            const urlMatches = [];

            // 找出所有域名
            URL_REGEX.lastIndex = 0;
            let matches;
            while ((matches = URL_REGEX.exec(text)) !== null) {
                urlMatches.push({
                    url: matches[0],
                    start: matches.index,
                    end: matches.index + matches[0].length
                });
            }

            if (urlMatches.length === 0) return;

            // 检测这些域名是否包含异常字符
            let hasAbnormal = false;
            urlMatches.forEach(match => {
                const results = detectSuspiciousChars(match.url);
                if (results.length > 0) {
                    hasAbnormal = true;
                }
            });

            if (!hasAbnormal) return;

            markedElements.add(textNode);

            // 拆分和替换文本节点
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            urlMatches.forEach((m) => {
                const r = detectSuspiciousChars(m.url);

                // 添加匹配前的文本
                if (m.start > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.slice(lastIndex, m.start))
                    );
                }

                if (r.length > 0) {
                    // 创建标记的span
                    const span = document.createElement('span');
                    span.className = MARK_CLASS;
                    span.style.borderColor = r[0].rule.color;
                    span.style.backgroundColor = `${r[0].rule.color}15`;
                    span.textContent = m.url;

                    const tooltip = document.createElement('div');
                    tooltip.className = 'char-detection-tooltip';
                    tooltip.style.borderColor = r[0].rule.color;
                    tooltip.textContent = `异常字符: ${r.map(x => x.rule.desc).join(', ')}`;
                    span.appendChild(tooltip);

                    fragment.appendChild(span);
                } else {
                    // 正常域名
                    fragment.appendChild(document.createTextNode(m.url));
                }

                lastIndex = m.end;
            });

            // 添加剩余文本
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            textNode.parentNode.replaceChild(fragment, textNode);
        });
    }

    /* ===================== 更新标记可见性 ===================== */

    function updateMarksVisibility(visible) {
        const marks = document.querySelectorAll(`.${MARK_CLASS}`);
        marks.forEach(mark => {
            if (visible) {
                mark.classList.remove('hidden');
            } else {
                mark.classList.add('hidden');
            }
        });
    }

    /* ===================== 显示找到的异常字符统计 ===================== */

    function showDetectionAlert(statistics) {
        const alertId = 'char-detection-alert-' + Date.now();

        const container = document.createElement('div');
        container.id = alertId;
        container.style.cssText = `
            position: fixed;
            top: 12px;
            right: 12px;
            width: 420px;
            max-width: 95vw;
            background: #1a1a1a;
            color: #eee;
            border: 2px solid #ff5555;
            border-radius: 12px;
            padding: 16px;
            z-index: 2147483647;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI";
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            max-height: 60vh;
            overflow-y: auto;
        `;

        let html = `
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                <div style="font-size: 24px;">⚠️</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; color: #ff5555; font-size: 16px;">
                        检测到异常字符已标记
                    </h3>
                    <p style="margin: 0; font-size: 13px; color: #aaa;">
                        链接和网址中包含以下非正常字符，已用框框标记：
                    </p>
                </div>
            </div>

            <div style="background: #0d0d0d; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        `;

        statistics.forEach((stat, idx) => {
            html += `
                <div style="margin-bottom: ${idx < statistics.length - 1 ? '10px' : '0'}; padding-bottom: ${idx < statistics.length - 1 ? '10px' : '0'}; border-bottom: ${idx < statistics.length - 1 ? '1px solid #333' : 'none'};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${stat.color};"></span>
                        <strong style="color: ${stat.color}; font-size: 13px;">${stat.desc}</strong>
                    </div>
                    <div style="font-size: 12px; color: #aaa; margin-left: 16px;">
                        <p style="margin: 4px 0;">发现 ${stat.count} 个链接/网址</p>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="${alertId}-close" style="
                    flex: 1;
                    background: #333;
                    color: #eee;
                    border: 1px solid #555;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                ">
                    关闭
                </button>
            </div>
        `;

        container.innerHTML = html;
        document.body.appendChild(container);

        document.getElementById(`${alertId}-close`).onclick = () => {
            container.remove();
        };

        // 10秒后自动淡出
        setTimeout(() => {
            if (document.body.contains(container)) {
                container.style.transition = 'opacity 0.5s ease-out';
                container.style.opacity = '0';
                setTimeout(() => container.remove(), 500);
            }
        }, 10000);
    }

    /* ===================== 获取标记统计 ===================== */

    function getMarkStatistics() {
        const rules = getCharRules().filter(r => r.enabled);
        const stats = {};

        rules.forEach(rule => {
            stats[rule.desc] = {
                desc: rule.desc,
                color: rule.color,
                count: 0
            };
        });

        const marks = document.querySelectorAll(`.${MARK_CLASS}`);
        marks.forEach(mark => {
            const tooltip = mark.querySelector('.char-detection-tooltip');
            if (tooltip) {
                const text = tooltip.textContent;
                // 从提示文本中提取规则描述
                const ruleDescs = text.replace('异常字符: ', '').split(', ');
                ruleDescs.forEach(desc => {
                    if (stats[desc]) {
                        stats[desc].count++;
                    }
                });
            }
        });

        return Object.values(stats).filter(s => s.count > 0);
    }

    /* ===================== 控制栏 ===================== */

    function createControlBar() {
        const barId = 'char-detection-control-bar';
        if (document.getElementById(barId)) return;

        const bar = document.createElement('div');
        bar.id = barId;
        bar.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1a1a;
            border: 1px solid #444;
            border-radius: 10px;
            padding: 10px;
            z-index: 2147483646;
            display: flex;
            gap: 8px;
            align-items: center;
            font-family: system-ui;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        `;

        const visible = getMarksVisible();

        bar.innerHTML = `
            <span style="color: #aaa; font-size: 12px; padding: 0 8px;">链接标记</span>
            <button id="${barId}-toggle" style="
                background: ${visible ? '#4caf50' : '#ff9800'};
                color: #fff;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
            ">
                ${visible ? '✓ 显示' : '✕ 隐藏'}
            </button>
            <button id="${barId}-close" style="
                background: #555;
                color: #fff;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            ">
                ✕
            </button>
        `;

        document.body.appendChild(bar);

        document.getElementById(`${barId}-toggle`).onclick = () => {
            const newVisible = !getMarksVisible();
            setMarksVisible(newVisible);
            const btn = document.getElementById(`${barId}-toggle`);
            btn.textContent = newVisible ? '✓ 显示' : '✕ 隐藏';
            btn.style.background = newVisible ? '#4caf50' : '#ff9800';
        };

        document.getElementById(`${barId}-close`).onclick = () => {
            bar.remove();
        };
    }

    /* ===================== 实时检测（MutationObserver） ===================== */

    function setupRealtimeDetection() {
        const observer = new MutationObserver(mutations => {
            if (!getDetectionEnabled()) return;

            let shouldMark = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    shouldMark = true;
                }
            });

            if (shouldMark) {
                // 防抖：延迟执行
                clearTimeout(setupRealtimeDetection.timeout);
                setupRealtimeDetection.timeout = setTimeout(() => {
                    markLinksWithSuspiciousChars();
                }, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /* ===================== 设置UI ===================== */

    function openSettingsUI() {
        if (document.getElementById('char-detection-settings-root')) return;

        const root = document.createElement('div');
        root.id = 'char-detection-settings-root';
        root.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            background: rgba(0, 0, 0, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI";
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 800px;
            max-width: 95vw;
            max-height: 85vh;
            background: #121212;
            color: #eee;
            border-radius: 14px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        `;

        panel.innerHTML = `
            <div style="padding: 18px 22px; border-bottom: 1px solid #333; font-size: 18px; font-weight: 600;">
                ⚙ 链接异常字符检测设置
            </div>

            <div style="padding: 20px; overflow: auto; flex: 1;">
                <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="detectionToggle" style="width: 18px; height: 18px; cursor: pointer;">
                        <span>启用链接检测</span>
                    </label>
                    <p style="font-size: 12px; color: #aaa; margin: 10px 0 0 28px;">
                        禁用后页面加载时不会检测链接和网址中的异常字符。
                    </p>
                </div>

                <h3>🔍 检测规则</h3>
                <div id="rulesContainer"></div>
                <button id="addRule" style="margin-top: 10px; padding: 8px 16px; background: #2196f3; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    + 添加新规则
                </button>
                <button id="resetRules" style="margin-top: 10px; margin-left: 10px; padding: 8px 16px; background: #ff9800; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    重置为默认
                </button>

                <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

                <h3>🧪 测试检测</h3>
                <button id="testDetection" style="padding: 8px 16px; background: #4caf50; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    运行检测（当前页面）
                </button>
            </div>

            <div style="padding: 14px; border-top: 1px solid #333; text-align: right;">
                <button id="closeUI" style="padding: 8px 16px; background: #555; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    关闭
                </button>
            </div>
        `;

        root.appendChild(panel);
        document.body.appendChild(root);

        // 启用/禁用切换
        const toggle = panel.querySelector('#detectionToggle');
        toggle.checked = getDetectionEnabled();
        toggle.onchange = (e) => {
            setDetectionEnabled(e.target.checked);
        };

        // 渲染规则列表
        function renderRules() {
            const container = panel.querySelector('#rulesContainer');
            container.innerHTML = '';
            const rules = getCharRules();

            rules.forEach((rule, idx) => {
                const ruleDiv = document.createElement('div');
                ruleDiv.style.cssText = `
                    background: #1a1a1a;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                `;
                ruleDiv.innerHTML = `
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" data-index="${idx}">
                    <input type="text" value="${rule.pattern}" placeholder="正则表达式" style="flex: 1; min-width: 120px; padding: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;" data-index="${idx}" data-field="pattern">
                    <input type="text" value="${rule.desc}" placeholder="规则描述" style="flex: 1.5; min-width: 140px; padding: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;" data-index="${idx}" data-field="desc">
                    <input type="color" value="${rule.color}" style="width: 40px; height: 32px; padding: 2px; border: 1px solid #444; background: #2a2a2a; border-radius: 4px; cursor: pointer;" data-index="${idx}" data-field="color">
                    <select style="padding: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;" data-index="${idx}" data-field="severity">
                        <option value="low" ${rule.severity === 'low' ? 'selected' : ''}>低</option>
                        <option value="medium" ${rule.severity === 'medium' ? 'selected' : ''}>中</option>
                        <option value="high" ${rule.severity === 'high' ? 'selected' : ''}>高</option>
                    </select>
                    <button data-index="${idx}" style="padding: 6px 12px; background: #f44336; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
                `;

                // 启用/禁用
                ruleDiv.querySelector('input[type="checkbox"]').onchange = (e) => {
                    const rules = getCharRules();
                    rules[idx].enabled = e.target.checked;
                    saveCharRules(rules);
                    markedElements.clear();
                    const marks = document.querySelectorAll(`.${MARK_CLASS}`);
                    marks.forEach(m => {
                        m.classList.remove(MARK_CLASS);
                        m.style.borderColor = '';
                        m.style.backgroundColor = '';
                        const tooltip = m.querySelector('.char-detection-tooltip');
                        if (tooltip) tooltip.remove();
                    });
                    markLinksWithSuspiciousChars();
                };

                // 修改字段
                ruleDiv.querySelectorAll('input[type="text"], input[type="color"], select').forEach(input => {
                    input.onchange = (e) => {
                        const rules = getCharRules();
                        const field = e.target.dataset.field;
                        rules[idx][field] = e.target.value;
                        saveCharRules(rules);
                    };
                });

                // 删除规则
                ruleDiv.querySelector('button').onclick = () => {
                    if (!confirm('确认删除此规则？')) return;
                    const rules = getCharRules();
                    rules.splice(idx, 1);
                    saveCharRules(rules);
                    renderRules();
                };

                container.appendChild(ruleDiv);
            });
        }

        renderRules();

        // 添加新规则
        panel.querySelector('#addRule').onclick = () => {
            const pattern = prompt('输入正则表达式（不含斜杠）：', '');
            if (!pattern) return;
            const desc = prompt('输入规则描述：', '');
            if (!desc) return;

            const rules = getCharRules();
            rules.push({ pattern, desc, enabled: true, severity: 'medium', color: '#ffaa44' });
            saveCharRules(rules);
            renderRules();
        };

        // 重置规则
        panel.querySelector('#resetRules').onclick = () => {
            if (!confirm('确认重置为默认规则？')) return;
            saveCharRules(DEFAULT_CHAR_RULES);
            renderRules();
        };

        // 测试检测
        panel.querySelector('#testDetection').onclick = () => {
            const stats = getMarkStatistics();
            if (stats.length > 0) {
                showDetectionAlert(stats);
            } else {
                alert('✅ 未检测到任何异常字符');
            }
        };

        // 关闭按钮
        panel.querySelector('#closeUI').onclick = () => root.remove();

        // 点击背景关闭
        root.onclick = (e) => {
            if (e.target === root) root.remove();
        };
    }

    /* ===================== 菜单 & 启动 ===================== */

    GM_registerMenuCommand('⚙ 链接检测设置', openSettingsUI);

    window.addEventListener('load', () => {
        if (getDetectionEnabled()) {
            markLinksWithSuspiciousChars();
            const stats = getMarkStatistics();
            if (stats.length > 0) {
                createControlBar();
                showDetectionAlert(stats);
            }
        }
    });

    // 实时检测：页面加载完成后启动
    window.addEventListener('load', () => {
        setupRealtimeDetection();
    });

})();