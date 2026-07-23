import { formatHtml } from './formatHtml';

describe('formatHtml', () => {
  it('puts nested tags on indented lines without changing text', () => {
    expect(
      formatHtml('<!doctype html><html><body><table><tr><td>Hello world</td></tr></table></body></html>'),
    ).toBe([
      '<!doctype html>',
      '<html>',
      '  <body>',
      '    <table>',
      '      <tr>',
      '        <td>Hello world</td>',
      '      </tr>',
      '    </table>',
      '  </body>',
      '</html>',
    ].join('\n'));
  });
});
