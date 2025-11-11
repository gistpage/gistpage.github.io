// 通用工具函数（拆分自 app.js）

// 保守的JSON注释清理（仅处理注释，不动其他字符）
function removeJsonComments(jsonString) {
  console.log('清理前JSON:', jsonString);
  let cleanJson = jsonString;
  cleanJson = cleanJson.replace(/^\uFEFF/, '');
  const lines = cleanJson.split('\n');
  const cleanedLines = lines.map(line => {
    let inString = false;
    let escapeNext = false;
    let result = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      if (char === '\\' && inString) {
        result += char;
        escapeNext = true;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
        result += char;
        continue;
      }
      if (!inString && char === '/' && i + 1 < line.length && line[i + 1] === '/') {
        break;
      }
      result += char;
    }
    return result.trimEnd();
  });
  cleanJson = cleanedLines.join('\n');
  cleanJson = cleanJson.replace(/\/\*[\s\S]*?\*\//g, '');
  cleanJson = cleanJson.replace(/^\s*[\r\n]/gm, '');
  const result = cleanJson.trim();
  console.log('清理后JSON:', result);
  return result;
}

// 解析 gistId 或 url
function parseGistId(input) {
  if (!input) return '';
  if (/^[a-f0-9]{8,}$/i.test(input)) return input;
  const m = input.match(/gist\.github\.com\/(?:[^\/]+\/)?([a-f0-9]{8,})/i);
  return m ? m[1] : '';
}