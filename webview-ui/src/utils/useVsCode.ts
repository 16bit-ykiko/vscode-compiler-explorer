import { useEffect, useCallback } from 'react';
import { throttle } from 'lodash';

export interface MessageBase {
  command: string;
}

export type MessageReceivedHandler<Message extends MessageBase> = (message: Message) => void;


// @ts-expect-error acquire vscode api
const vscode = window.vscode || acquireVsCodeApi();
// @ts-expect-error add api instance to global to avoid re-acquire
window.vscode = vscode;

export function useVsCode<Message extends MessageBase>(onMessageReceived: MessageReceivedHandler<Message>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendMessage = useCallback(
    throttle((message: Message) => vscode.postMessage(message), 100)
  , []);

  useEffect(() => {
    const messageHandler = throttle((event: MessageEvent) => {
      if (onMessageReceived) {
        onMessageReceived(event.data);
      }
    }, 100);

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [onMessageReceived]);

  return [sendMessage];
}
