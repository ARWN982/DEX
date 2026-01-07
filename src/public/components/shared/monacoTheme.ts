/*
 * ESQL Language and Theme registration for Monaco Editor
 * Based on Kibana's implementation
 */

import type { UseEuiTheme } from '@elastic/eui';
import type { editor } from 'monaco-editor';

const ESQL_LANGUAGE_ID = 'esql';

// ESQL language configuration
const ESQL_LANGUAGE_CONFIG = {
  // Language configuration
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ]
};

// ESQL tokens configuration
const ESQL_TOKENS_CONFIG = {
  tokenizer: {
    root: [
      // Keywords
      [/\b(FROM|WHERE|STATS|EVAL|LIMIT|SORT|KEEP|DROP|RENAME|ENRICH|DISSECT|GROK|MVEXPAND)\b/i, 'keyword'],
      [/\b(BY|ASC|DESC|NULLS|FIRST|LAST)\b/i, 'keyword'],
      
      // Functions
      [/\b(COUNT|SUM|AVG|MIN|MAX|MEDIAN|PERCENTILE|DATE_TRUNC|BUCKET|CASE|COALESCE|GREATEST|LEAST|IS_NULL|IS_NOT_NULL|LENGTH|SUBSTRING|CONCAT|SPLIT|TRIM|UPPER|LOWER|ABS|CEIL|FLOOR|ROUND|LOG|EXP|POW|SQRT|SIN|COS|TAN|ASIN|ACOS|ATAN|TO_STRING|TO_INT|TO_LONG|TO_DOUBLE|TO_BOOLEAN|TO_DATETIME|DATE_EXTRACT|DATE_FORMAT|DATE_PARSE|NOW|AUTO_BUCKET|CIDR_MATCH|ENDS_WITH|STARTS_WITH|MV_COUNT|MV_DEDUPE|MV_FIRST|MV_LAST|MV_MAX|MV_MIN|MV_SLICE|MV_SORT|MV_ZIP|QSTR)\b/i, 'type'],
      
      // Operators
      [/[=!<>]=?|[+\-*/%]|\b(AND|OR|NOT|IN|LIKE|RLIKE|IS|NULL)\b/i, 'operator'],
      
      // Numbers
      [/\b\d+(\.\d+)?\b/, 'number'],
      
      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, 'string', '@string_single'],
      
      // Field names and identifiers
      [/`[^`]*`/, 'variable.name'],
      [/[a-zA-Z_][\w.@-]*/, 'variable'],
      
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      
      // Whitespace
      [/[ \t\r\n]+/, ''],
    ],
    
    string_double: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop']
    ],
    
    string_single: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop']
    ],
    
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ]
  }
};

export function buildEsqlTheme(
  { euiTheme }: UseEuiTheme,
  backgroundColor?: string
): editor.IStandaloneThemeData {
  return {
    base: 'vs',
    inherit: true,
    rules: [
      {
        token: '',
        foreground: euiTheme.colors.textParagraph,
        background: euiTheme.colors.backgroundBaseSubdued,
      },
      { token: 'invalid', foreground: euiTheme.colors.textAccent },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },

      { token: 'variable', foreground: euiTheme.colors.textPrimary },
      { token: 'variable.name', foreground: euiTheme.colors.textSuccess },
      { token: 'variable.predefined', foreground: euiTheme.colors.textSuccess },
      { token: 'constant', foreground: euiTheme.colors.textAccent },
      { token: 'comment', foreground: euiTheme.colors.textSubdued },
      { token: 'number', foreground: euiTheme.colors.textAccent },
      { token: 'number.hex', foreground: euiTheme.colors.textAccent },
      { token: 'regexp', foreground: euiTheme.colors.textDanger },
      { token: 'annotation', foreground: euiTheme.colors.textSubdued },
      { token: 'type', foreground: euiTheme.colors.textSuccess },

      { token: 'delimiter', foreground: euiTheme.colors.textSubdued },
      { token: 'delimiter.html', foreground: euiTheme.colors.textParagraph },
      { token: 'delimiter.xml', foreground: euiTheme.colors.textPrimary },

      { token: 'tag', foreground: euiTheme.colors.textDanger },
      { token: 'tag.id.jade', foreground: euiTheme.colors.textPrimary },
      { token: 'tag.class.jade', foreground: euiTheme.colors.textPrimary },
      { token: 'meta.scss', foreground: euiTheme.colors.textAccent },
      { token: 'metatag', foreground: euiTheme.colors.textSuccess },
      { token: 'metatag.content.html', foreground: euiTheme.colors.textDanger },
      { token: 'metatag.html', foreground: euiTheme.colors.textDanger },
      { token: 'metatag.xml', foreground: euiTheme.colors.textSubdued },
      { token: 'metatag.php', fontStyle: 'bold' },

      { token: 'key', foreground: euiTheme.colors.textWarning },
      { token: 'string.key.json', foreground: euiTheme.colors.textDanger },
      { token: 'string.value.json', foreground: euiTheme.colors.textPrimary },

      { token: 'attribute.name', foreground: euiTheme.colors.textDanger },
      { token: 'attribute.name.css', foreground: euiTheme.colors.textSuccess },
      { token: 'attribute.value', foreground: euiTheme.colors.textPrimary },
      { token: 'attribute.value.number', foreground: euiTheme.colors.textWarning },
      { token: 'attribute.value.unit', foreground: euiTheme.colors.textWarning },
      { token: 'attribute.value.html', foreground: euiTheme.colors.textPrimary },
      { token: 'attribute.value.xml', foreground: euiTheme.colors.textPrimary },

      { token: 'string', foreground: euiTheme.colors.textDanger },
      { token: 'string.html', foreground: euiTheme.colors.textPrimary },
      { token: 'string.sql', foreground: euiTheme.colors.textDanger },
      { token: 'string.yaml', foreground: euiTheme.colors.textPrimary },

      { token: 'keyword', foreground: euiTheme.colors.textPrimary },
      { token: 'keyword.json', foreground: euiTheme.colors.textPrimary },
      { token: 'keyword.flow', foreground: euiTheme.colors.textWarning },
      { token: 'keyword.flow.scss', foreground: euiTheme.colors.textPrimary },
      // Monaco editor supports strikethrough font style only starting from 0.32.0.
      { token: 'keyword.deprecated', foreground: euiTheme.colors.textAccent },

      { token: 'operator.scss', foreground: euiTheme.colors.textParagraph },
      { token: 'operator.sql', foreground: euiTheme.colors.textSubdued },
      { token: 'operator.swift', foreground: euiTheme.colors.textSubdued },
      { token: 'operator', foreground: euiTheme.colors.textSubdued },
      { token: 'predefined.sql', foreground: euiTheme.colors.textSubdued },

      { token: 'text', foreground: euiTheme.colors.textHeading },
      { token: 'label', foreground: euiTheme.colors.vis?.euiColorVis9 || euiTheme.colors.textPrimary },
    ],
    colors: {
      'editor.foreground': euiTheme.colors.textParagraph,
      'editor.background': backgroundColor ?? euiTheme.colors.backgroundBasePlain,
      'editorLineNumber.foreground': euiTheme.colors.textSubdued,
      'editorLineNumber.activeForeground': euiTheme.colors.textSubdued,
      'editorIndentGuide.background1': euiTheme.colors.lightShade,
      'editor.selectionBackground': euiTheme.colors.backgroundBaseInteractiveSelect,
      'editorWidget.border': euiTheme.colors.borderBasePlain,
      'editorWidget.background': euiTheme.colors.backgroundBaseSubdued,
      'editorCursor.foreground': euiTheme.colors.darkestShade,
      'editorSuggestWidget.selectedForeground': euiTheme.colors.darkestShade,
      'editorSuggestWidget.focusHighlightForeground': euiTheme.colors.primary,
      'editorSuggestWidget.selectedBackground': euiTheme.colors.lightShade,
      'list.hoverBackground': euiTheme.colors.backgroundBaseSubdued,
      'list.highlightForeground': euiTheme.colors.primary,
      'editor.lineHighlightBorder': euiTheme.colors.lightestShade,
      'editorHoverWidget.foreground': euiTheme.colors.darkestShade,
      'editorHoverWidget.background': euiTheme.colors.backgroundBaseSubdued,
      'diffEditor.insertedTextBackground': euiTheme.colors.borderBaseSuccess,
      'diffEditor.removedTextBackground': euiTheme.colors.borderBaseDanger,
      'diffEditor.insertedLineBackground': euiTheme.colors.backgroundBaseSuccess,
      'diffEditor.removedLineBackground': euiTheme.colors.backgroundBaseDanger,
    },
  };
}

// Global registry for theme resolvers
const themeResolvers = new Map<string, (euiTheme: UseEuiTheme) => editor.IStandaloneThemeData>();

export function registerLanguageThemeResolver(
  languageId: string, 
  themeResolver: (euiTheme: UseEuiTheme) => editor.IStandaloneThemeData
) {
  themeResolvers.set(languageId, themeResolver);
}

export function getThemeResolver(languageId: string) {
  return themeResolvers.get(languageId);
}

export function initializeESQLLanguage() {
  // Register the ESQL language with Monaco
  const monaco = (window as any).monaco;
  if (monaco && monaco.languages) {
    // Register language
    monaco.languages.register({ id: ESQL_LANGUAGE_ID });
    
    // Set language configuration
    monaco.languages.setLanguageConfiguration(ESQL_LANGUAGE_ID, ESQL_LANGUAGE_CONFIG);
    
    // Set tokenizer
    monaco.languages.setMonarchTokensProvider(ESQL_LANGUAGE_ID, ESQL_TOKENS_CONFIG);
    
    // Register theme resolver for this language
    registerLanguageThemeResolver(ESQL_LANGUAGE_ID, buildEsqlTheme);
  }
}

export const buildTheme = buildEsqlTheme;
export const buildTransparentTheme = (euiTheme: UseEuiTheme) => buildEsqlTheme(euiTheme, '#00000000');