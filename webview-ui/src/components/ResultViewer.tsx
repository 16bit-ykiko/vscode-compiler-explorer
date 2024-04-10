import { forwardRef, useImperativeHandle, useRef, ReactElement, ForwardRefRenderFunction, useCallback } from "react";

import ResultBlock, { ResultBlockRef } from "./ResultBlock";


export interface ResultViewerLine {
  html: string,
  lineNo?: number | null | undefined,
}

export interface ResultViewerProps {
  results: ResultViewerLine[];
  onSelect: (lineNo: number) => void;
  text2html?: (text: string) => string;
}

const ResultViewerImpl: ForwardRefRenderFunction<(line: number) => void, ResultViewerProps> = (props, ref) => {
  const currentLineNo = useRef<number>(-1);
  const lineNo2blocks = useRef<{ [lineNo: number]: ResultBlockRef }>({});

  const onSelect = useCallback((lineNo: number) => {
    // Unselect the previous selected line
    lineNo2blocks.current[currentLineNo.current]?.setIsSelected(false);
    // Select the current line
    lineNo2blocks.current[lineNo]?.setIsSelected(true);
    // Update the current selected line
    currentLineNo.current = lineNo;
    // Callback
    props.onSelect(lineNo);
  }, [lineNo2blocks, props]);

  useImperativeHandle(ref, () => {
    return (line: number) => {
      onSelect(line);
      lineNo2blocks.current[line]?.scrollIntoView()
    };
  }, [lineNo2blocks, onSelect]);

  const renderResult = (props: ResultViewerProps) => {
    // Preprocess the lineNo of results to 0-based, to be consistent with vscode editor
    const results = props.results.map(x => {
      if (x.lineNo) {
        x.lineNo--;
      }
      return x;
    });

    const resultsBlocks: ReactElement[] = [];
    let l = 0;
    let lastLineNo = -1;

    const addResultBlockWithLineNo = (key: number, lineNo: number, html: string[]) => {
      const updateLineNo2blocks = (el: ResultBlockRef) => {
        // Make sure add the first results block of target lineNo
        if (!lineNo2blocks.current[lineNo]) {
          lineNo2blocks.current[lineNo] = el;
        }
      };

      resultsBlocks.push(<ResultBlock 
                      key={key}
                      lineNo={lineNo}
                      onSelect={onSelect}
                      html={html}
                      ref={updateLineNo2blocks}
                    />);
    };

    // Group results by lineNo
    for (const [i, line] of results.entries()) {
      if (typeof line.lineNo !== 'number') {
        if (lastLineNo !== -1) {
          // If last code block map to a lineNo, create a CodeBlock and a ref
          addResultBlockWithLineNo(resultsBlocks.length, lastLineNo, results.slice(l, i).map(x => x.html));
        }
        resultsBlocks.push(<ResultBlock
                            key={resultsBlocks.length}
                            html={results.slice(i, i + 1).map(x => x.html)}
                          />);
        lastLineNo = -1;
        l = i + 1;
      } else if (line.lineNo !== lastLineNo) {
        if (lastLineNo !== -1) {
          // If last code block map to a lineNo, create a CodeBlock and a ref
          addResultBlockWithLineNo(resultsBlocks.length, lastLineNo, results.slice(l, i).map(x => x.html));
          l = i;
        }
        lastLineNo = line.lineNo;
      } else {
        // Relate to the same lineNo, do nothing
      }
    }
    if (lastLineNo !== -1) {
      addResultBlockWithLineNo(resultsBlocks.length, lastLineNo, results.slice(l).map(x => x.html));
    }

    return resultsBlocks;
  };

  return (<div style={{ width: '100%' }}>{renderResult(props)}</div>);
};

const ResultViewer = forwardRef(ResultViewerImpl);

export default ResultViewer;
