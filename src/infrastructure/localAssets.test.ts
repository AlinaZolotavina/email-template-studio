import { createLocalAssetsManager } from './localAssets';

describe('local assets manager', () => {
  it('revokes URLs on replace, remove, template reset, and global teardown', async () => {
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

    await manager.attach('newsletter-digest', 'logo', file);
    await manager.attach('newsletter-digest', 'logo', file);
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:first');

    manager.release('newsletter-digest', 'logo');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:second');

    await manager.attach('newsletter-digest', 'logo', file);
    await manager.attach('welcome-simple', 'logo', file);
    manager.releaseTemplate('newsletter-digest');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:other');
    expect(api.revokeObjectURL).not.toHaveBeenCalledWith('blob:final');

    manager.releaseAll();
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:final');
  });

  it('keeps the previous URL when creating its replacement fails', async () => {
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

    await manager.attach('newsletter-digest', 'logo', file);
    await expect(manager.attach('newsletter-digest', 'logo', file)).rejects.toThrow(
      'Object URL creation failed',
    );
    expect(api.revokeObjectURL).not.toHaveBeenCalled();

    manager.release('newsletter-digest', 'logo');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:working');
  });
});
