import type { KeyboardEvent, RefObject } from 'react';
import type { CmdStep } from '../../shared/types';
import { ghost } from '../cue';
import { ResizeHandle } from '../ResizeHandle';
import { parseAnsi } from './ansi';

type Props = {
  cue: CmdStep | undefined;
  hint: boolean;
  value: string;
  onChange: (value: string) => void;
  onRun: (cmd: string) => void;
  output: string;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Console({ cue, hint, value, onChange, onRun, output, inputRef }: Props) {
  const rest = hint ? ghost(value, cue?.cmd) : '';

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) onRun(value);
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (rest) onChange(value + rest);
    } else if (e.key === 'Escape') {
      if (value) onChange('');
      else e.currentTarget.blur();
    }
  };

  return (
    <div className="console">
      <ResizeHandle edge="top" variable="--console-height" min={160} />
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
      <pre className="output">
        {parseAnsi(output).map((s, i) =>
          s.classes.length ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder.
            <span key={i} className={s.classes.join(' ')}>
              {s.text}
            </span>
          ) : (
            s.text
          ),
        )}
      </pre>
    </div>
  );
}
