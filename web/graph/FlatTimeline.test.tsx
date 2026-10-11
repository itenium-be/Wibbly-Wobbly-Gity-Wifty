import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { FlatTimeline } from './FlatTimeline';
import { layout } from './layout';

const pompeii = layout({
  initialized: true,
  commits: [
    { hash: 'a1', short: 'a1', message: 'The Fires of Pompeii', parents: [] },
    { hash: 'b2', short: 'b2', message: 'Planet of the Ood', parents: ['a1'] },
  ],
  branches: [{ name: 'prime-timeline', hash: 'b2' }],
  tags: [{ name: 'fixed-point/pompeii', hash: 'a1' }],
  head: { hash: 'a1', branch: null },
});

describe('FlatTimeline', () => {
  test('draws episodes, lane, tag, branch and HEAD', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByText('The Fires of Pompeii')).toBeTruthy();
    expect(screen.getByText('Planet of the Ood')).toBeTruthy();
    expect(screen.getByText('⚑ fixed-point/pompeii')).toBeTruthy();
    expect(screen.getAllByText('prime-timeline')).toHaveLength(2); // lane label + branch pill
    expect(screen.getByText('HEAD (detached)')).toBeTruthy();
  });

  test('only fixed-point tags get the gold star; any other tag is a dark star', () => {
    const beetle = layout({
      initialized: true,
      commits: [
        { hash: 'a1', short: 'a1', message: 'The Fires of Pompeii', parents: [] },
        { hash: 'b2', short: 'b2', message: 'The Runaway Bride', parents: ['a1'] },
      ],
      branches: [{ name: 'prime-timeline', hash: 'b2' }],
      tags: [
        { name: 'fixed-point/pompeii', hash: 'a1' },
        { name: 'time-beetle', hash: 'b2' },
      ],
      head: { hash: 'b2', branch: 'prime-timeline' },
    });
    const { container } = render(<FlatTimeline layout={beetle} />);
    expect(container.querySelectorAll('polygon.fixed-point')).toHaveLength(1);
    expect(container.querySelectorAll('polygon.dark-star')).toHaveLength(1);
    expect(screen.getByText('⚑ time-beetle').getAttribute('class')).toBe('tag dark');
  });

  test('labels a commit with its episode code, title and hash, in that order', () => {
    render(<FlatTimeline layout={pompeii} codes={{ 'The Fires of Pompeii': 'S04E02' }} />);
    const y = (text: string) => Number(screen.getByText(text).getAttribute('y'));
    expect(y('S04E02')).toBeLessThan(y('The Fires of Pompeii'));
    expect(y('The Fires of Pompeii')).toBeLessThan(y('a1'));
  });

  test('a dark-world commit on prime is drawn red, edge included; elsewhere it keeps its lane colour', () => {
    const { container } = render(
      <FlatTimeline
        dark={new Set(['Turn Right'])}
        layout={layout({
          initialized: true,
          commits: [
            { hash: 'a1', short: 'a1', message: 'The Runaway Bride', parents: [] },
            { hash: 'b2', short: 'b2', message: 'Turn Right', parents: ['a1'] },
            { hash: 'c3', short: 'c3', message: 'Turn Right', parents: ['a1'] },
          ],
          branches: [
            { name: 'prime-timeline', hash: 'b2' },
            { name: 'petes-world', hash: 'c3' },
          ],
          tags: [],
          head: { hash: 'b2', branch: 'prime-timeline' },
        })}
      />,
    );
    const nodes = [...container.querySelectorAll('circle.node')].map((n) => n.getAttribute('class'));
    expect(nodes).toEqual(['node lane-prime', 'node lane-dark', 'node lane-parallel']);
    const edges = [...container.querySelectorAll('path.edge')].map((e) => e.getAttribute('class'));
    expect(edges).toEqual(['edge lane-dark', 'edge lane-parallel']);
  });

  test('a lost dark-world commit stays red, dashed; other lost commits are grey', () => {
    const { container } = render(
      <FlatTimeline
        dark={new Set(['Turn Right'])}
        layout={layout({
          initialized: true,
          commits: [
            { hash: 'a1', short: 'a1', message: 'The Runaway Bride', parents: [] },
            { hash: 'b2', short: 'b2', message: 'Turn Right', parents: ['a1'], lost: true },
            { hash: 'c3', short: 'c3', message: 'Turn Left', parents: ['b2'], lost: true },
          ],
          branches: [{ name: 'prime-timeline', hash: 'a1' }],
          tags: [],
          head: { hash: 'a1', branch: 'prime-timeline' },
        })}
      />,
    );
    const nodes = [...container.querySelectorAll('circle.node')].map((n) => n.getAttribute('class'));
    expect(nodes).toEqual(['node lane-prime', 'node lane-dark lost', 'node lane-detached lost']);
    const edges = [...container.querySelectorAll('path.edge')].map((e) => e.getAttribute('class'));
    expect(edges).toEqual(['edge lane-dark lost', 'edge lane-detached lost']);
  });

  test('an ordinary branch lane has a name but no universe kicker', () => {
    render(
      <FlatTimeline
        layout={layout({
          initialized: true,
          commits: [
            { hash: 'a1', short: 'a1', message: 'Rose', parents: [] },
            { hash: 'b2', short: 'b2', message: 'Rose saves Pete', parents: ['a1'] },
          ],
          branches: [
            { name: 'prime-timeline', hash: 'a1' },
            { name: 'pete-lives', hash: 'b2' },
          ],
          tags: [],
          head: { hash: 'b2', branch: 'pete-lives' },
        })}
      />,
    );
    expect(screen.getAllByText('pete-lives').length).toBeGreaterThan(0);
    expect(screen.queryByText('UNIVERSE · PARALLEL')).toBeNull();
  });

  test('draws tag labels below the commit so the TARDIS cannot hide them', () => {
    render(<FlatTimeline layout={pompeii} />);
    const y = Number(screen.getByText('⚑ fixed-point/pompeii').getAttribute('y'));
    expect(y).toBeGreaterThan(200);
  });

  test('parks the TARDIS on the HEAD commit', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByTestId('tardis').style.transform).toBe('translate(260px, 160px)');
  });

  test('an empty timeline says so', () => {
    render(
      <FlatTimeline
        layout={layout({ initialized: true, commits: [], branches: [], tags: [], head: { hash: null, branch: null } })}
      />,
    );
    expect(screen.getByText('An empty timeline')).toBeTruthy();
  });

  test('before git init the timeline is blank', () => {
    const { container } = render(
      <FlatTimeline
        layout={layout({ initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } })}
      />,
    );
    expect(container.querySelector('.empty')).toBeNull();
  });

  test('fills its container at zoom 1 and scales with the zoom factor', () => {
    const { rerender } = render(<FlatTimeline layout={pompeii} />);
    const svg = screen.getByRole('img', { name: 'timeline' });
    expect(svg.style.width).toBe('100%');
    rerender(<FlatTimeline layout={pompeii} zoom={2} />);
    expect(svg.style.width).toBe('200%');
    expect(svg.style.height).toBe('200%');
  });

  const titled = (message: string) =>
    layout({
      initialized: true,
      commits: [
        { hash: 'a1', short: 'a1', message, parents: [] },
        { hash: 'b2', short: 'b2', message, parents: ['a1'] },
      ],
      branches: [],
      tags: [],
      head: { hash: null, branch: null },
    });
  const gap = (message: string) => {
    render(<FlatTimeline layout={titled(message)} />);
    const [a, b] = screen.getAllByText(message).map((t) => Number(t.getAttribute('x')));
    return b - a;
  };

  test('spreads commits apart so long titles do not overlap', () => {
    const long = 'The Stolen Earth and the Medusa Cascade';
    expect(gap(long)).toBeGreaterThan(long.length * 14 * 0.6);
  });

  test('keeps the default spacing between short titles', () => {
    expect(gap('Rose')).toBe(150);
  });

  test('draws the pending node as uncommitted', () => {
    render(<FlatTimeline layout={{ ...pompeii, pending: { col: 2, lane: 0, from: { col: 1, lane: 0 } } }} />);
    expect(screen.getByText('uncommitted')).toBeTruthy();
  });

  test('the pending node sits clear of the branch pill on the commit before it', () => {
    const { container } = render(
      <FlatTimeline layout={{ ...pompeii, pending: { col: 2, lane: 0, from: { col: 1, lane: 0 } } }} />,
    );
    const rect = container.querySelector('.pill rect') as SVGRectElement;
    const pillRight = Number(rect.getAttribute('x')) + Number(rect.getAttribute('width'));
    const dot = container.querySelector('circle.pending') as SVGCircleElement;
    expect(Number(dot.getAttribute('cx')) - 13).toBeGreaterThan(pillRight);
  });

  test('during a merge a dotted edge runs from the merged commit to the pending node', () => {
    const { container } = render(
      <FlatTimeline
        layout={{ ...pompeii, pending: { col: 2, lane: 0, from: { col: 1, lane: 0 }, merge: { col: 0, lane: 0 } } }}
      />,
    );
    expect(container.querySelectorAll('path.edge.pending')).toHaveLength(2);
  });

  describe('an edge between lanes bends in the column gap next to its lone end', () => {
    const commit = (hash: string, parents: string[]) => ({ hash, short: hash, message: hash, parents });
    const pointsOf = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => `${x} ${y}`);
    const drawn = (graph: Parameters<typeof layout>[0], dirty = false) => {
      const { container } = render(<FlatTimeline layout={layout(graph, dirty)} />);
      const node = (hash: string) => {
        const g = screen.getAllByText(hash)[0].parentElement as Element;
        const c = g.querySelector('circle') as SVGCircleElement;
        return `${c.getAttribute('cx')} ${c.getAttribute('cy')}`;
      };
      const paths = (selector: string) =>
        [...container.querySelectorAll(selector)].map((p) => pointsOf(p.getAttribute('d') ?? ''));
      return { node, paths, container };
    };
    const yOf = (point: string) => point.split(' ')[1];
    const xOf = (point: string) => point.split(' ')[0];

    test('a branch leaves its fork and runs flat along its own lane', () => {
      const { node, paths } = drawn({
        initialized: true,
        commits: [commit('a1', []), commit('b2', ['a1']), commit('c3', ['b2']), commit('d4', ['a1'])],
        branches: [
          { name: 'prime-timeline', hash: 'c3' },
          { name: 'side', hash: 'd4' },
        ],
        tags: [],
        head: { hash: 'c3', branch: 'prime-timeline' },
      });
      const fork = paths('path.edge').find((p) => p[0] === node('a1') && p.at(-1) === node('d4')) ?? [];
      const bend = fork.at(-2) ?? '';
      expect(xOf(bend)).toBe(xOf(node('b2')));
      expect(yOf(bend)).toBe(yOf(node('d4')));
    });

    test('a merge runs flat along the merged lane and bends just before the merge commit', () => {
      const { node, paths } = drawn({
        initialized: true,
        commits: [
          commit('a1', []),
          commit('b2', ['a1']),
          commit('c3', ['a1']),
          commit('d4', ['c3']),
          commit('m5', ['d4', 'b2']),
        ],
        branches: [
          { name: 'prime-timeline', hash: 'm5' },
          { name: 'side', hash: 'b2' },
        ],
        tags: [],
        head: { hash: 'm5', branch: 'prime-timeline' },
      });
      const merge = paths('path.edge').find((p) => p[0] === node('b2') && p.at(-1) === node('m5')) ?? [];
      expect(merge[1]).toBe(`${xOf(node('d4'))} ${yOf(node('b2'))}`);
    });

    test('a pending merge takes the same route as the merge commit it becomes', () => {
      const { node, paths, container } = drawn(
        {
          initialized: true,
          commits: [commit('a1', []), commit('b2', ['a1']), commit('c3', ['a1']), commit('d4', ['c3'])],
          branches: [
            { name: 'prime-timeline', hash: 'd4' },
            { name: 'side', hash: 'b2' },
          ],
          tags: [],
          head: { hash: 'd4', branch: 'prime-timeline' },
          mergeHead: 'b2',
        },
        true,
      );
      const merge = paths('path.edge.pending').find((p) => p[0] === node('b2')) ?? [];
      const dot = container.querySelector('circle.pending') as SVGCircleElement;
      expect(merge[1]).toBe(`${xOf(node('d4'))} ${yOf(node('b2'))}`);
      expect(merge.at(-1)).toBe(`${dot.getAttribute('cx')} ${dot.getAttribute('cy')}`);
    });
  });

  test('paints branch pills over the pending edge', () => {
    const { container } = render(
      <FlatTimeline layout={{ ...pompeii, pending: { col: 2, lane: 0, from: { col: 1, lane: 0 } } }} />,
    );
    const edge = container.querySelector('path.pending');
    const pill = container.querySelector('.pill');
    expect((edge as Element).compareDocumentPosition(pill as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('clicking a commit dot or fixed point selects that commit at the click', () => {
    const onSelect = mock((_hash: string, _at: { x: number; y: number }) => {});
    const { container } = render(<FlatTimeline layout={pompeii} onSelect={onSelect} />);
    fireEvent.click(container.querySelector('circle.node') as Element, { clientX: 30, clientY: 40 });
    fireEvent.click(container.querySelector('.fixed-point') as Element, { clientX: 50, clientY: 60 });
    expect(onSelect.mock.calls).toEqual([
      ['b2', { x: 30, y: 40 }],
      ['a1', { x: 50, y: 60 }],
    ]);
  });
});
