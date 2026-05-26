/**
 * Sleek client-side Liquid-like template parser.
 * Supports:
 * - Variable substitution: {{ user.first_name }}
 * - Default filters: {{ user.first_name | default: "friend" }}
 * - Conditionals (with nesting): {% if user.is_vip %}...{% else %}...{% endif %}
 * - Comparison operators: ==, !=, >, <, >=, <=
 */

export function parseLiquid(template, context) {
  if (!template) return '';
  
  let parsed = template;
  let loopCount = 0;
  const maxLoops = 100; // safety valve for infinite loops
  
  // 1. Process Conditionals (Support Nesting)
  while (parsed.includes('{% if') && loopCount < maxLoops) {
    loopCount++;
    const ifStartIndex = parsed.indexOf('{% if');
    if (ifStartIndex === -1) break;
    
    // Find the matching {% endif %} by counting depth
    let depth = 1;
    let currentIndex = ifStartIndex + 5;
    let endifIndex = -1;
    
    while (depth > 0 && currentIndex < parsed.length) {
      const nextIf = parsed.indexOf('{% if', currentIndex);
      const nextEndif = parsed.indexOf('{% endif %}', currentIndex);
      
      if (nextEndif === -1) break; // unclosed tag
      
      if (nextIf !== -1 && nextIf < nextEndif) {
        depth++;
        currentIndex = nextIf + 5;
      } else {
        depth--;
        if (depth === 0) {
          endifIndex = nextEndif;
        }
        currentIndex = nextEndif + 11;
      }
    }
    
    if (endifIndex === -1) break;
    
    const fullBlock = parsed.substring(ifStartIndex, endifIndex + 11);
    const tagEnd = parsed.indexOf('%}', ifStartIndex);
    const conditionStr = parsed.substring(ifStartIndex + 5, tagEnd).trim();
    const innerBlock = parsed.substring(tagEnd + 2, endifIndex);
    
    // Find matching {% else %} only at this conditional depth
    let elseIndex = -1;
    let innerDepth = 0;
    let searchIndex = 0;
    
    while (searchIndex < innerBlock.length) {
      const nextInnerIf = innerBlock.indexOf('{% if', searchIndex);
      const nextInnerEndif = innerBlock.indexOf('{% endif %}', searchIndex);
      const nextInnerElse = innerBlock.indexOf('{% else %}', searchIndex);
      
      const events = [
        { type: 'if', index: nextInnerIf },
        { type: 'endif', index: nextInnerEndif },
        { type: 'else', index: nextInnerElse }
      ].filter(e => e.index !== -1).sort((a, b) => a.index - b.index);
      
      if (events.length === 0) break;
      
      const firstEvent = events[0];
      if (firstEvent.type === 'if') {
        innerDepth++;
        searchIndex = firstEvent.index + 5;
      } else if (firstEvent.type === 'endif') {
        innerDepth--;
        searchIndex = firstEvent.index + 11;
      } else if (firstEvent.type === 'else') {
        if (innerDepth === 0) {
          elseIndex = firstEvent.index;
          break;
        }
        searchIndex = firstEvent.index + 10;
      }
    }
    
    let truePart = innerBlock;
    let falsePart = '';
    
    if (elseIndex !== -1) {
      truePart = innerBlock.substring(0, elseIndex);
      falsePart = innerBlock.substring(elseIndex + 10);
    }
    
    const conditionMet = evaluateCondition(conditionStr, context);
    const replacement = conditionMet ? truePart : falsePart;
    
    parsed = parsed.replace(fullBlock, replacement);
  }
  
  // 2. Process Variables with Optional Default Filter
  parsed = parsed.replace(/\{\{\s*([a-zA-Z0-9_\.]+)(?:\s*\|\s*default\s*:\s*['"]([^'"]*)['"])?\s*\}\}/g, (match, path, defaultValue) => {
    const value = getNestedValue(context, path);
    if (value === undefined || value === null || value === '') {
      return defaultValue !== undefined ? defaultValue : '';
    }
    return String(value);
  });
  
  return parsed;
}

function evaluateCondition(conditionStr, context) {
  let cleaned = conditionStr.trim();
  let isNegated = false;
  
  if (cleaned.startsWith('!')) {
    isNegated = true;
    cleaned = cleaned.substring(1).trim();
  }
  
  // Check for operators: ==, !=, >=, <=, >, <
  const opMatch = cleaned.match(/^([a-zA-Z0-9_\.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  
  if (opMatch) {
    const path = opMatch[1];
    const op = opMatch[2];
    let compVal = opMatch[3].trim();
    
    // Strip quotes for string comparison
    if ((compVal.startsWith('"') && compVal.endsWith('"')) || (compVal.startsWith("'") && compVal.endsWith("'"))) {
      compVal = compVal.substring(1, compVal.length - 1);
    } else if (compVal === 'true') {
      compVal = true;
    } else if (compVal === 'false') {
      compVal = false;
    } else if (!isNaN(Number(compVal))) {
      compVal = Number(compVal);
    }
    
    const varVal = getNestedValue(context, path);
    
    let isTrue = false;
    switch (op) {
      case '==': isTrue = varVal == compVal; break;
      case '!=': isTrue = varVal != compVal; break;
      case '>': isTrue = Number(varVal) > Number(compVal); break;
      case '<': isTrue = Number(varVal) < Number(compVal); break;
      case '>=': isTrue = Number(varVal) >= Number(compVal); break;
      case '<=': isTrue = Number(varVal) <= Number(compVal); break;
    }
    
    return isNegated ? !isTrue : isTrue;
  } else {
    // Basic truthiness
    const val = getNestedValue(context, cleaned);
    const isTrue = !!val && val !== 'false' && val !== 0;
    return isNegated ? !isTrue : isTrue;
  }
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}
