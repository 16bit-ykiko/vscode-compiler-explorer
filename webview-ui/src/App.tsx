import 'highlight.js/styles/default.css';

import { VSCodePanels, VSCodePanelTab, VSCodePanelView, VSCodeBadge } from '@vscode/webview-ui-toolkit/react';
import { useRef } from 'react';
import hljs from 'highlight.js';
import { AnsiUp } from 'ansi_up';

import testData from './test-data.json';
import ResultViewer from './components/ResultViewer';

const ansiUp = new AnsiUp();

function App() {
  const gotoLine = useRef<(line: number) => void>(null);
  const _ = useRef<(line: number) => void>(null);
  
  const asmText2html = (text: string) => hljs.highlight('x86asm', text).value;
  const consoleText2html = (text: string) => ansiUp.ansi_to_html(text);

  const asmRes = testData.asm.map(x => ({ html: asmText2html(x.text), lineNo: x.source?.line }));
  const compilerStderrRes = testData.stderr.map(x => ({ html: consoleText2html(x.text), lineNo: x.tag?.line }));
  const execStdoutRes = testData.execResult.stdout.map(x => ({ html: consoleText2html(x.text) }));
  const stderrCnt = compilerStderrRes.reduce((prevVal, x) => prevVal + (typeof x.lineNo === 'number' ? 1 : 0), 0);

  const input = useRef<HTMLInputElement>(null);
  const onLineSelect = (line: number) => gotoLine.current?.(line);
  const onSelect = (line: number) => {
    if (input.current && !isNaN(line)) {
      input.current.value = line.toString();
    }
  };

  return (<>
    <VSCodePanels aria-label='VScode Compiler Explorer'>
      <VSCodePanelTab id='asm'>ASM result</VSCodePanelTab>
      <VSCodePanelTab id='stdout'>Execution Output</VSCodePanelTab>
      <VSCodePanelTab id='stderr'>Compiler Output {stderrCnt > 0 && <VSCodeBadge>{stderrCnt}</VSCodeBadge>}</VSCodePanelTab>
      <VSCodePanelView id='asm'>
        <ResultViewer results={asmRes} onSelect={onSelect} text2html={asmText2html} ref={gotoLine} />
      </VSCodePanelView>
      <VSCodePanelView id='stdout'>
        <ResultViewer results={execStdoutRes} onSelect={onSelect} text2html={consoleText2html} ref={_} />
      </VSCodePanelView>
      <VSCodePanelView id='stderr'>
        <ResultViewer results={compilerStderrRes} onSelect={onSelect} text2html={consoleText2html} ref={_} />
      </VSCodePanelView>
    </VSCodePanels>
    <input onChange={e => onLineSelect(parseInt(e.target.value))} ref={input} />
  </>);
}

export default App
