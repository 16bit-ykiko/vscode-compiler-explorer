import { VSCodePanels, VSCodePanelTab, VSCodePanelView, VSCodeBadge } from '@vscode/webview-ui-toolkit/react';
import { useEffect, useRef, useState } from 'react';
import { AnsiUp } from 'ansi_up';

import ResultViewer from './components/ResultViewer';
import { MessageBase, useVsCode } from './utils/useVsCode';
import { CompileResult, ExecuteResult } from '../../src/request/CompileResult'
import { highlight } from './highlight/x86Intel';


const ansiUp = new AnsiUp();


type Response = { compileResult: CompileResult, executeResult?: ExecuteResult };

function App() {
  const [compileResult, setCompileResult] = useState<Response>();

  const activeId = useRef<string>('asm');
  const gotoLine = useRef<{ [tabId: string]: null | ((lineNo: number) => void) }>({});

  const [sendMessage] = useVsCode(message => {
    switch (message.command) {
      case 'setResults': {
        type SetResultsMsg = MessageBase & { results: Response };
        setCompileResult((message as SetResultsMsg).results);
      } break;
      case 'gotoLine': {
        type GotoLineMsg = MessageBase & { lineNo: number };
        const f = gotoLine.current[activeId.current];
        if (f) {
          f((message as GotoLineMsg).lineNo);
        }
      } break;
    }
  });

  useEffect(() => sendMessage({ command: 'ready' }), [sendMessage]);

  const asmText2html = (text: string) => highlight(text);
  const consoleText2html = (text: string) => ansiUp.ansi_to_html(text);

  const asmRes = compileResult?.compileResult.asm?.map(x => ({ html: asmText2html(x.text), lineNo: x.source?.line }));
  const compilerStderrRes = compileResult?.compileResult.stderr.map(x => ({ html: consoleText2html(x.text), lineNo: x.tag?.line }));
  const execStdoutRes = compileResult?.executeResult?.stdout?.map(x => ({ html: consoleText2html(x.text) }));
  const stderrCnt = compilerStderrRes?.reduce((prevVal, x) => prevVal + (typeof x.lineNo === 'number' ? 1 : 0), 0);

  const onSelect = (line: number) => {
    // @ts-expect-error TODO: better type hint
    sendMessage({ command: 'gotoLine', lineNo: line });
  };

  return (<>
    <VSCodePanels aria-label='VScode Compiler Explorer' activeidChanged={(_, newValue) => activeId.current = newValue} style={{ overflow: 'auto' }}>
      <VSCodePanelTab id='asm'>ASM result</VSCodePanelTab>
      <VSCodePanelTab id='exeout'>Execution Output</VSCodePanelTab>
      <VSCodePanelTab id='stderr'>Compiler Output {stderrCnt && (stderrCnt > 0 && <VSCodeBadge>{stderrCnt}</VSCodeBadge>)}</VSCodePanelTab>
      <VSCodePanelView id='asm'>
        <ResultViewer results={asmRes} onSelect={onSelect} text2html={asmText2html} ref={f => gotoLine.current.asm = f} />
      </VSCodePanelView>
      <VSCodePanelView id='stdout'>
        <ResultViewer results={execStdoutRes} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.exeout = f} />
      </VSCodePanelView>
      <VSCodePanelView id='stderr'>
        <ResultViewer results={compilerStderrRes} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.stderr = f} />
      </VSCodePanelView>
    </VSCodePanels>
  </>);
}

export default App
