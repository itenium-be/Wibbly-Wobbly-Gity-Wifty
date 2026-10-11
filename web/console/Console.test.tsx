import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Console } from './Console';

const cue = { cmd: 'git rebase prime-timeline', caption: 'Rose drags her universe onto the prime timeline' };

function setup(value: string) {
  const onChange = mock((_: string) => {});
  const onRun = mock((_: string) => {});
  render(
    <Console
      cue={cue}
      value={value}
      onChange={onChange}
      onRun={onRun}
      output="$ git log"
      inputRef={createRef<HTMLInputElement>()}
    />,
  );
  return { onChange, onRun, input: screen.getByLabelText('git command') };
}

describe('Console', () => {
  test('shows the rest of the cue as ghost text, plus the caption and output', () => {
    const { container } = render(
      <Console
        cue={cue}
        value="git rebase prime-t"
        onChange={() => {}}
        onRun={() => {}}
        output="$ git log"
        inputRef={createRef<HTMLInputElement>()}
      />,
    );
    expect(container.querySelector('.ghost')?.textContent).toBe('git rebase prime-timeline');
    expect(container.querySelector('.ghost .typed')?.textContent).toBe('git rebase prime-t');
    expect(screen.getByText(cue.caption)).toBeTruthy();
    expect(screen.getByText('$ git log')).toBeTruthy();
  });

  test('Tab accepts the cue', () => {
    const { onChange, input } = setup('git reb');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).toHaveBeenCalledWith('git rebase prime-timeline');
  });

  test('Tab with no ghost text left does nothing', () => {
    const { onChange, input } = setup('git lag');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('Tab prevents the browser default focus move', () => {
    const { input } = setup('git reb');
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false);
  });

  test('Escape blurs the input', () => {
    const { input } = setup('');
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement).not.toBe(input);
  });

  test('Enter runs what was typed', () => {
    const { onRun, input } = setup('git status');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).toHaveBeenCalledWith('git status');
  });

  test('Enter on an empty input does nothing', () => {
    const { onRun, input } = setup('');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).not.toHaveBeenCalled();
  });
});
