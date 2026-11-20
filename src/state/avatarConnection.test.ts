import { describe, it, expect, vi } from 'vitest';
import { connectAvatar } from './avatarConnection';

function setup(payload: unknown = { sessionToken: 'test-session' }, ok = true) {
  const controller = new AbortController();
  const client = { streamToVideoElement: vi.fn().mockResolvedValue(undefined), stopStreaming: vi.fn() };
  const create = vi.fn(() => client);
  const fetcher = vi.fn().mockResolvedValue({ ok, json: async () => payload });
  const options = { signal: controller.signal, fetcher: fetcher as unknown as typeof fetch, loadClient: async () => create };
  return { controller, client, create, fetcher, options };
}

describe('avatar connection lifecycle', () => {
  it('uses the actual server response without requiring a success flag', async () => {
    const test = setup();
    const connection = await connectAvatar('video', test.options);
    expect(test.create).toHaveBeenCalledWith('test-session', { disableInputAudio: true });
    expect(test.client.streamToVideoElement).toHaveBeenCalledWith('video');
    expect(test.fetcher).toHaveBeenCalledTimes(1);
    connection.close(); connection.close();
    expect(test.client.stopStreaming).toHaveBeenCalledTimes(1);
  });
  it('surfaces server errors and never opens a client after a failed request', async () => {
    const test = setup({ error: 'Complete avatar settings first.' }, false);
    await expect(connectAvatar('video', test.options)).rejects.toThrow('Complete avatar settings first.');
    expect(test.create).not.toHaveBeenCalled();
  });
  it('rejects empty tokens even when the HTTP response succeeds', async () => {
    const test = setup({ sessionToken: '  ' });
    await expect(connectAvatar('video', test.options)).rejects.toThrow('could not start');
    expect(test.create).not.toHaveBeenCalled();
  });
  it('does not start video if the window closes while fetching a token', async () => {
    const test = setup();
    test.fetcher.mockImplementation(async () => {
      test.controller.abort();
      return { ok: true, json: async () => ({ sessionToken: 'test-session' }) };
    });
    await expect(connectAvatar('video', test.options)).rejects.toMatchObject({ name: 'AbortError' });
    expect(test.create).not.toHaveBeenCalled();
  });
  it('stops a late stream after the window has closed', async () => {
    const test = setup();
    test.client.streamToVideoElement.mockImplementation(async () => { test.controller.abort(); });
    await expect(connectAvatar('video', test.options)).rejects.toMatchObject({ name: 'AbortError' });
    expect(test.client.stopStreaming).toHaveBeenCalledTimes(2);
  });
  it('cleans up a failed stream and an established connection on abort', async () => {
    const failed = setup();
    failed.client.streamToVideoElement.mockRejectedValue(new Error('Network interrupted'));
    await expect(connectAvatar('video', failed.options)).rejects.toThrow('Network interrupted');
    expect(failed.client.stopStreaming).toHaveBeenCalledTimes(1);
    const live = setup();
    await connectAvatar('video', live.options);
    live.controller.abort();
    expect(live.client.stopStreaming).toHaveBeenCalledTimes(1);
  });
});
