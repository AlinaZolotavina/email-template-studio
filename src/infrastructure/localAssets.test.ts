import { createLocalAssetsManager } from './localAssets';

describe('local assets manager', () => {
  it('revokes URLs on replace, remove, template reset, and global teardown', () => {
    const api = {
      createObjectURL: vi.fn()
        .mockReturnValueOnce('blob:first')
        .mockReturnValueOnce('blob:second')
        .mockReturnValueOnce('blob:other')
        .mockReturnValueOnce('blob:final'),
      revokeObjectURL: vi.fn(),
    };
    const manager = createLocalAssetsManager(api);
    const file = new File(['image'], 'logo.png', { type: 'image/png' });

    manager.attach('newsletter-digest', 'logo', file);
    manager.attach('newsletter-digest', 'logo', file);
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:first');

    manager.release('newsletter-digest', 'logo');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:second');

    manager.attach('newsletter-digest', 'logo', file);
    manager.attach('welcome-simple', 'logo', file);
    manager.releaseTemplate('newsletter-digest');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:other');
    expect(api.revokeObjectURL).not.toHaveBeenCalledWith('blob:final');

    manager.releaseAll();
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:final');
  });

  it('keeps the previous URL when creating its replacement fails', () => {
    const api = {
      createObjectURL: vi
        .fn()
        .mockReturnValueOnce('blob:working')
        .mockImplementationOnce(() => {
          throw new Error('Object URL creation failed');
        }),
      revokeObjectURL: vi.fn(),
    };
    const manager = createLocalAssetsManager(api);
    const file = new File(['image'], 'logo.png', { type: 'image/png' });

    manager.attach('newsletter-digest', 'logo', file);
    expect(() => manager.attach('newsletter-digest', 'logo', file)).toThrow(
      'Object URL creation failed',
    );
    expect(api.revokeObjectURL).not.toHaveBeenCalled();

    manager.release('newsletter-digest', 'logo');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:working');
  });
});
