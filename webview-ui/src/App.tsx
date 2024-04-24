
import ResultViewer from './components/ResultViewer';
import { AnsiUp } from 'ansi_up';
import { useEffect, useRef, useState } from 'react';

import { highlight } from '../../src/highlight/x86Intel';
import { MessageBase, useVsCode } from './utils/useVsCode';
import { CompileResult, ExecuteResult } from '../../src/request/CompileResult'
import { VSCodePanels, VSCodePanelTab, VSCodePanelView, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';

const ansiUp = new AnsiUp();

type Response = { compileResult: CompileResult, executeResult?: ExecuteResult };

const changeFontSize = (node: HTMLElement, newSize: number) => {
  if (node.style.fontSize !== `${newSize}px`) {
    node.style.fontSize = `${newSize}px`;
  }
  for (const child of Array.from(node.children) as HTMLElement[]) {
    changeFontSize(child, newSize);
  }
};

function App() {
  const [isLoaded, setIsLoaded] = useState(true);
  const [response, setResponse] = useState<Response>();

  const activeId = useRef<string>('asm');
  const gotoLine = useRef<{ [tabId: string]: null | ((lineNo: number) => void) }>({});

  const [sendMessage] = useVsCode(message => {
    switch (message.command) {
      case 'setResults': {
        setIsLoaded(false);
        type SetResultsMsg = MessageBase & { results: Response };
        setResponse((message as SetResultsMsg).results);
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
  const consoleText2html = (text: string) => `<span class="compiler-explorer-output">${ansiUp.ansi_to_html(text)}</span>`;

  //const compilerStderrRes = compileResult?.compileResult.stderr.map(x => ({ html: consoleText2html(x.text), lineNo: x.tag?.line }));
  const consoleOutput = (() => {
    const result: { html: string, lineNo: number | null }[] = [];
    for (const step of response?.compileResult?.buildsteps || []) {
      for (const line of step.stdout) {
        result.push({ html: consoleText2html(line.text), lineNo: null });
      }
    }
    for (const step of response?.compileResult?.buildsteps || []) {
      for (const line of step.stderr) {
        result.push({ html: consoleText2html(line.text), lineNo: null });
      }
    }

    // for cmake
    response?.compileResult?.result?.stderr?.forEach(x => result.push({ html: consoleText2html(x.text), lineNo: null }));
    response?.compileResult?.result?.stdout?.forEach(x => result.push({ html: consoleText2html(x.text), lineNo: null }));

    // for single file
    response?.compileResult?.stderr?.forEach(x => result.push({ html: consoleText2html(x.text), lineNo: null }));
    response?.compileResult?.stdout?.forEach(x => result.push({ html: consoleText2html(x.text), lineNo: null }));

    return result;
  })();

  const asmRes = (response?.compileResult.result?.asm || response?.compileResult.asm)?.map(x => ({ html: asmText2html(x.text), lineNo: x.source?.line }));
  const execStdoutRes = (response?.executeResult?.execResult || response?.executeResult)?.stdout?.map(x => ({ html: consoleText2html(x.text) }));


  const onSelect = (line: number) => {
    // @ts-expect-error TODO: better type hint
    sendMessage({ command: 'gotoLine', lineNo: line });
  };

  // Zoom in/out with Ctrl + Mouse Wheel
  const [fontSize, setFontSize] = useState(14.0);

  useEffect(() => {
    const handleWheelEvent = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const zoomDelta = event.deltaY > 0 ? -0.5 : 0.5;
        setFontSize((prevFontSize) => prevFontSize + zoomDelta);

        const element = document.getElementById('view')!;
        changeFontSize(element, fontSize + zoomDelta);
      }
    };

    document.addEventListener('wheel', handleWheelEvent);

    return () => {
      document.removeEventListener('wheel', handleWheelEvent);
    };
  }, [fontSize]);

  return (<>
    {isLoaded
      ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <VSCodeProgressRing />
        </div>)
      : (
        <VSCodePanels id="view" aria-label='Compiler Explorer' activeidChanged={(_, newValue) => activeId.current = newValue} style={{ overflow: 'auto' }}>
          <VSCodePanelTab id='stderr' className='compiler-explorer-output'>Console</VSCodePanelTab>
          <VSCodePanelTab id='asm' className='compiler-explorer-output'>ASM</VSCodePanelTab>
          <VSCodePanelTab id='exeout' className='compiler-explorer-output'>Stdout</VSCodePanelTab>
          <VSCodePanelView id='stderr'>
            <ResultViewer results={consoleOutput} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.stderr = f} />
          </VSCodePanelView>
          <VSCodePanelView id='asm'>
            <ResultViewer results={asmRes} onSelect={onSelect} text2html={asmText2html} ref={f => gotoLine.current.asm = f} />
          </VSCodePanelView>
          <VSCodePanelView id='stdout'>
            <ResultViewer results={execStdoutRes} onSelect={onSelect} text2html={consoleText2html} ref={f => gotoLine.current.exeout = f} />
          </VSCodePanelView>

        </VSCodePanels>
      )}
  </>);
}

export default App
