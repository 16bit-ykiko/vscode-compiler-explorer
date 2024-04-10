import { forwardRef, useImperativeHandle, useRef, ForwardRefRenderFunction, useState, FunctionComponent } from "react";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

import './ResultBlock.scss';


interface ToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onToggle();
  };

  return (<div onClick={onToggle} className="toggle-button">
    {props.isCollapsed ? <UpOutlined /> : <DownOutlined />}
  </div>);
};

export interface ResultBlockProps {
  html: string[];
  lineNo?: number;
  onSelect?: (lineNo: number) => void;
}

export interface ResultBlockRef {
  setIsSelected: (isSelected: boolean) => void;
  scrollIntoView: () => void;
}

const ResultBlockImpl: ForwardRefRenderFunction<ResultBlockRef, ResultBlockProps> = (props, ref) => {
  console.assert(
    (props.lineNo === undefined) === (props.onSelect === undefined),
    'props.lineNo and props.onSelect exist and not exist at the same time'
  );

  const [isSelected, setIsSelected] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const selfElement = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => {
    return {
      setIsSelected,
      scrollIntoView: () => selfElement.current?.scrollIntoView(),
    };
  }, [selfElement]);

  const onToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (<>
    <div
      ref={selfElement}
      onClick={props.onSelect && (() => props.onSelect!(props.lineNo!))}
      className={`result-block ${isSelected ? 'selected' : ''} ${isCollapsed ? 'collapsed' : ''}`}
    >
      {props.html.length > 1 && <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />}
      {props.html.map((line, idx) =>
        <pre
          key={idx}
          className={`${idx === 0 ? '' : 'inner-line'}`}
          dangerouslySetInnerHTML={{__html: line}}
        />
      )}
    </div>
  </>);}

const ResultBlock = forwardRef(ResultBlockImpl);

export default ResultBlock;
