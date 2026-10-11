import { describe, expect, test } from 'bun:test';
import { fireEvent, render } from '@testing-library/react';
import { Pan } from './Pan';

function pan() {
  const { container } = render(
    <Pan>
      <svg aria-label="timeline" />
    </Pan>,
  );
  return container.firstElementChild as HTMLElement;
}

const offset = (area: HTMLElement) => (area.firstElementChild as HTMLElement).style.transform;

describe('Pan', () => {
  test('dragging with the right mouse button moves the content, even when it fits', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 2, clientX: 500, clientY: 400 });
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(offset(area)).toBe('translate(-50px, 30px)');
  });

  test('a second drag continues from where the first one ended', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 2, clientX: 500, clientY: 400 });
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    fireEvent.pointerUp(area);
    fireEvent.pointerDown(area, { button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(area, { clientX: 110, clientY: 100 });
    expect(offset(area)).toBe('translate(-40px, 30px)');
  });

  test('stops moving once the button is released', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 2, clientX: 500, clientY: 400 });
    fireEvent.pointerUp(area);
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(offset(area)).toBe('translate(0px, 0px)');
  });

  test('the left mouse button does not pan', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 0, clientX: 500, clientY: 400 });
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(offset(area)).toBe('translate(0px, 0px)');
  });

  test('suppresses the context menu', () => {
    const area = pan();
    expect(fireEvent.contextMenu(area)).toBe(false);
  });
});
