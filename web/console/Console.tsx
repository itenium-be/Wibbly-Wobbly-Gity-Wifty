import type { KeyboardEvent, RefObject } from 'react';
import type { CmdStep } from '../../shared/types';
import { ghost } from '../cue';

type Props = {
  cue: CmdStep | undefined;
  value: string;
  onChange: (value: string) => void;
  onRun: (cmd: string) => void;
  output: string;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Console({ cue, value, onChange, onRun, output, inputRef }: Props) {
  const rest = ghost(value, cue?.cmd);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) onRun(value);
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (rest) onChange(value + rest);
    } else if (e.key === 'Escape') e.currentTarget.blur();
  };

  return (
    <div className="console">
      <div className="prompt">
        <div className="line">
          <span className="sigil">$</span>
          <div className="field">
            <div className="ghost" aria-hidden="true">
              <span className="typed">{value}</span>
              {rest}
            </div>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              aria-label="git command"
            />
          </div>
        </div>
        {cue && <div className="caption">{cue.caption}</div>}
      </div>
      <pre className="output">{output}</pre>
    </div>
  );
}
