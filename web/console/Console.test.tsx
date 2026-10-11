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

  test('renders ANSI colours as spans', () => {
    const { container } = render(
      <Console
        cue={cue}
        value=""
        onChange={() => {}}
        onRun={() => {}}
        output={'\x1b[33mabfb21f\x1b[m Rose saves Pete'}
        inputRef={createRef<HTMLInputElement>()}
      />,
    );
    expect(container.querySelector('.output')?.textContent).toBe('abfb21f Rose saves Pete');
    expect(container.querySelector('.output .ansi-33')?.textContent).toBe('abfb21f');
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

  test('dragging the top edge resizes the console', () => {
    setup('');
    const handle = document.querySelector('.console .resize') as HTMLElement;
    const height = () => document.documentElement.style.getPropertyValue('--console-height');
    fireEvent.pointerDown(handle, { button: 0, clientY: 500 });
    fireEvent.pointerMove(handle, { clientY: 400 });
    expect(height()).toBe(`${innerHeight - 400}px`);
    fireEvent.pointerMove(handle, { clientY: innerHeight - 10 });
    expect(height()).toBe('160px');
    fireEvent.pointerMove(handle, { clientY: 10 });
    expect(height()).toBe(`${innerHeight - 160}px`);
    fireEvent.pointerUp(handle);
    fireEvent.pointerMove(handle, { clientY: 400 });
    expect(height()).toBe(`${innerHeight - 160}px`);
  });
});
