export type Finding = {
  severity: 'error' | 'warning' | 'info';
  line?: number;
  message: string;
};

type Ctx = { tr: boolean };

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function checkBrackets(source: string, ctx: Ctx): Finding[] {
  const findings: Finding[] = [];
  const stack: { char: string; index: number }[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (char === '\\') i++;
      else if (char === inString) inString = null;
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }
    if ('([{'.includes(char)) stack.push({ char, index: i });
    if (')]}'.includes(char)) {
      const top = stack.pop();
      if (!top || top.char !== pairs[char]) {
        findings.push({
          severity: 'error',
          line: lineOf(source, i),
          message: ctx.tr
            ? `Kapanış parantezi eşleşmiyor: “${char}”`
            : `Unmatched closing bracket: “${char}”`,
        });
      }
    }
  }

  if (stack.length) {
    const top = stack[stack.length - 1];
    findings.push({
      severity: 'error',
      line: lineOf(source, top.index),
      message: ctx.tr
        ? `“${top.char}” kapatılmamış.`
        : `“${top.char}” is never closed.`,
    });
  }
  return findings;
}

export function reviewCode(source: string, lang: string, language: string): Finding[] {
  const ctx: Ctx = { tr: language === 'tr' };
  const findings: Finding[] = [];
  const open = source.trim();

  if (!open) {
    return [
      {
        severity: 'info',
        message: ctx.tr ? 'Kod boş. İncelemek için bir şeyler yaz.' : 'The code is empty. Add something to review.',
      },
    ];
  }

  findings.push(...checkBrackets(source, ctx));

  const checks: {
    pattern: RegExp;
    severity: Finding['severity'];
    tr: string;
    en: string;
  }[] = [
    {
      pattern: /\bvar\s+\w+/,
      severity: 'warning',
      tr: '“var” yerine “let” veya “const” kullan; kapsamı daha nettir.',
      en: 'Prefer “let” or “const” over “var” for clearer scope.',
    },
    {
      pattern: /[^=!<>]==[^=]|[^!]!=[^=]/,
      severity: 'warning',
      tr: '“==” / “!=” yerine “===” / “!==” kullan; tür dönüşümü sürpriz yapabilir.',
      en: 'Use “===” / “!==” instead of “==” / “!=” to avoid coercion surprises.',
    },
    {
      pattern: /\beval\s*\(/,
      severity: 'error',
      tr: 'eval() güvenlik riski taşır; mümkünse kullanma.',
      en: 'eval() is a security risk; avoid it when possible.',
    },
    {
      pattern: /innerHTML\s*=/,
      severity: 'warning',
      tr: 'innerHTML ile kullanıcı verisi yazmak XSS’e açık kapı bırakır. textContent dene.',
      en: 'Writing user input with innerHTML opens XSS. Try textContent.',
    },
    {
      pattern: /document\.write\s*\(/,
      severity: 'warning',
      tr: 'document.write sayfayı bozabilir; DOM API’lerini tercih et.',
      en: 'document.write can break the page; prefer DOM APIs.',
    },
    {
      pattern: /\bdebugger\b/,
      severity: 'warning',
      tr: 'Yayına çıkmadan “debugger” satırını kaldır.',
      en: 'Remove the “debugger” statement before shipping.',
    },
    {
      pattern: /\bconsole\.(log|debug)\s*\(/,
      severity: 'info',
      tr: 'console.log hata ayıklama içindir; yayın öncesi temizle.',
      en: 'console.log is for debugging; clean it before release.',
    },
    {
      pattern: /\bTODO\b|\bFIXME\b/,
      severity: 'info',
      tr: 'TODO/FIXME notu var; tamamlanmayı bekleyen bir iş olabilir.',
      en: 'There is a TODO/FIXME; something may still be unfinished.',
    },
    {
      pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      severity: 'error',
      tr: 'Kod içinde anahtar/parola gibi görünen bir değer var. Bunları koda gömmeyin.',
      en: 'A value that looks like a key or password is hardcoded. Keep secrets out of code.',
    },
    {
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
      severity: 'warning',
      tr: 'Boş catch bloğu hatayı yutar; en azından bir log bırak.',
      en: 'An empty catch swallows the error; at least log it.',
    },
    {
      pattern: /:\s*any\b/,
      severity: 'info',
      tr: '“any” tipi denetimi kapatır; gerçek bir tip vermeyi dene.',
      en: '“any” disables type checking; try a real type.',
    },
  ];

  for (const check of checks) {
    const match = check.pattern.exec(source);
    if (!match) continue;
    if (check.pattern.source.includes('console') && !/javascript|typescript|tsx|jsx/.test(lang)) continue;
    findings.push({
      severity: check.severity,
      line: lineOf(source, match.index),
      message: ctx.tr ? check.tr : check.en,
    });
  }

  if (lang === 'python') {
    const mixed = /^( +)\S/m.test(source) && /^\t+\S/m.test(source);
    if (mixed) {
      findings.push({
        severity: 'error',
        message: ctx.tr
          ? 'Girintide hem boşluk hem sekme kullanılmış. Tek birini seç.'
          : 'Both spaces and tabs are used for indentation. Pick one.',
      });
    }
    if (/except\s*:/.test(source)) {
      findings.push({
        severity: 'warning',
        line: lineOf(source, source.indexOf('except')),
        message: ctx.tr
          ? 'Çıplak “except” tüm hataları yakalar; tür belirtmek daha güvenli.'
          : 'A bare “except” catches everything; name the exception type.',
      });
    }
  }

  const longLine = source.split('\n').findIndex((line) => line.length > 140);
  if (longLine >= 0) {
    findings.push({
      severity: 'info',
      line: longLine + 1,
      message: ctx.tr
        ? 'Satır çok uzun (140+ karakter). Okunabilirlik için böl.'
        : 'Very long line (140+ chars). Break it for readability.',
    });
  }

  const order = { error: 0, warning: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function summarizeFindings(findings: Finding[], language: string): string {
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const notes = findings.filter((f) => f.severity === 'info').length;
  if (language === 'tr') {
    if (!findings.length) return 'Kod temiz görünüyor: belirgin bir hata bulamadım.';
    return `${errors} hata, ${warnings} uyarı, ${notes} not buldum.`;
  }
  if (!findings.length) return 'The code looks clean: no obvious problems.';
  return `Found ${errors} errors, ${warnings} warnings, ${notes} notes.`;
}
