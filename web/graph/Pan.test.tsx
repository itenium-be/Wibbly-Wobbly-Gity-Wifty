import { describe, expect, test } from 'bun:test';
import { fireEvent, render } from '@testing-library/react';
import { Pan } from './Pan';

function pan() {
  const { container } = render(
    <Pan>
      <svg aria-label="timeline" />
    </Pan>,
  );
  const area = container.firstElementChild as HTMLElement;
  area.scrollLeft = 300;
  area.scrollTop = 200;
  return area;
}

describe('Pan', () => {
  test('dragging with the right mouse button moves the view', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 2, clientX: 500, clientY: 400 });
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(area.scrollLeft).toBe(350);
    expect(area.scrollTop).toBe(170);
  });

  test('stops moving once the button is released', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 2, clientX: 500, clientY: 400 });
    fireEvent.pointerUp(area);
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(area.scrollLeft).toBe(300);
  });

  test('the left mouse button does not pan', () => {
    const area = pan();
    fireEvent.pointerDown(area, { button: 0, clientX: 500, clientY: 400 });
    fireEvent.pointerMove(area, { clientX: 450, clientY: 430 });
    expect(area.scrollLeft).toBe(300);
  });

  test('suppresses the context menu', () => {
    const area = pan();
    expect(fireEvent.contextMenu(area)).toBe(false);
  });
});
