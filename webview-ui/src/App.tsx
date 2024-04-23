
import ResultViewer from './components/ResultViewer';
import { AnsiUp } from 'ansi_up';
import { useEffect, useRef, useState } from 'react';

import { highlight } from '../../src/highlight/x86Intel';
import { MessageBase, useVsCode } from './utils/useVsCode';
import { CompileResult, ExecuteResult } from '../../src/request/CompileResult'
import { VSCodePanels, VSCodePanelTab, VSCodePanelView, VSCodeBadge, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';

const ansiUp = new AnsiUp();

type Response = { compileResult: CompileResult, executeResult?: ExecuteResult };

function App() {
  const [isLoaded, setIsLoaded] = useState(true);
  const [compileResult, setCompileResult] = useState<Response>();

  const activeId = useRef<string>('asm');
  const gotoLine = useRef<{ [tabId: string]: null | ((lineNo: number) => void) }>({});

  const [sendMessage] = useVsCode(message => {
    switch (message.command) {
      case 'setResults': {
        setIsLoaded(false);
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
    {isLoaded
      ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <VSCodeProgressRing />
        </div>)
      : (
        <VSCodePanels aria-label='Compiler Explorer' activeidChanged={(_, newValue) => activeId.current = newValue} style={{ overflow: 'auto' }}>
          <VSCodePanelTab id='asm' className='compiler-explorer-output'>ASM result</VSCodePanelTab>
          <VSCodePanelTab id='exeout' className='compiler-explorer-output'>Execution Output</VSCodePanelTab>
          <VSCodePanelTab id='stderr' className='compiler-explorer-output'>Compiler Output {stderrCnt && (stderrCnt > 0 && <VSCodeBadge>{stderrCnt}</VSCodeBadge>)}</VSCodePanelTab>
          <VSCodePanelView id='asm' className='compiler-explorer-output'>
            <ResultViewer results={asmRes} onSelect={onSelect} text2html={asmText2html} ref={f => gotoLine.current.asm = f} />
          </VSCodePanelView>
          <VSCodePanelView id='stdout' className='compiler-explorer-output'>
            <ResultViewer results={execStdoutRes} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.exeout = f} />
          </VSCodePanelView>
          <VSCodePanelView id='stderr' className='compiler-explorer-output'>
            <ResultViewer results={compilerStderrRes} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.stderr = f} />
          </VSCodePanelView>
        </VSCodePanels>
      )}
  </>);
}

export default App
