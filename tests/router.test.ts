import { EventRouter } from '../src/routers/EventRouter';
import { TikTokEvent } from '../src/types';

describe('EventRouter', () => {
  let router: EventRouter;

  beforeEach(() => {
    router = new EventRouter();
  });

  it('should initialize with zero stats', () => {
    const stats = router.getStats();

    expect(stats.totalComments).toBe(0);
    expect(stats.totalGifts).toBe(0);
    expect(stats.totalLikes).toBe(0);
    expect(stats.totalFollows).toBe(0);
  });

  it('should update comment stats', async () => {
    const event: TikTokEvent = {
      type: 'comment',
      user: {
        userId: '1',
        uniqueId: 'user1',
        nickname: 'User 1',
      },
      message: 'Hello',
      timestamp: Date.now(),
    };

    await router.routeEvent(event);

    const stats = router.getStats();
    expect(stats.totalComments).toBe(1);
  });

  it('should update gift stats and revenue', async () => {
    const event: TikTokEvent = {
      type: 'gift',
      user: {
        userId: '1',
        uniqueId: 'user1',
        nickname: 'User 1',
      },
      gift: {
        id: 1,
        name: 'Rose',
        count: 1,
        diamondCount: 100,
        repeatEnd: true,
      },
      timestamp: Date.now(),
    };

    await router.routeEvent(event);

    const stats = router.getStats();
    expect(stats.totalGifts).toBe(1);
    expect(stats.totalRevenue).toBe(100);
  });

  it('should track top gifter', async () => {
    const user1Event: TikTokEvent = {
      type: 'gift',
      user: {
        userId: '1',
        uniqueId: 'user1',
        nickname: 'User 1',
      },
      gift: {
        id: 1,
        name: 'Rose',
        count: 1,
        diamondCount: 100,
        repeatEnd: true,
      },
      timestamp: Date.now(),
    };

    const user2Event: TikTokEvent = {
      type: 'gift',
      user: {
        userId: '2',
        uniqueId: 'user2',
        nickname: 'User 2',
      },
      gift: {
        id: 1,
        name: 'Universe',
        count: 1,
        diamondCount: 5000,
        repeatEnd: true,
      },
      timestamp: Date.now(),
    };

    await router.routeEvent(user1Event);
    await router.routeEvent(user2Event);

    const stats = router.getStats();
    expect(stats.topGifter?.uniqueId).toBe('user2');
  });

  it('should update viewer stats', async () => {
    const event: TikTokEvent = {
      type: 'viewers',
      viewerCount: 250,
      timestamp: Date.now(),
    };

    await router.routeEvent(event);

    const stats = router.getStats();
    expect(stats.currentViewers).toBe(250);
    expect(stats.peakViewers).toBe(250);
  });

  it('should track peak viewers', async () => {
    await router.routeEvent({
      type: 'viewers',
      viewerCount: 100,
      timestamp: Date.now(),
    });

    await router.routeEvent({
      type: 'viewers',
      viewerCount: 250,
      timestamp: Date.now(),
    });

    await router.routeEvent({
      type: 'viewers',
      viewerCount: 150,
      timestamp: Date.now(),
    });

    const stats = router.getStats();
    expect(stats.currentViewers).toBe(150);
    expect(stats.peakViewers).toBe(250);
  });

  it('should reset stats', () => {
    router.resetStats();
    const stats = router.getStats();

    expect(stats.totalComments).toBe(0);
    expect(stats.totalGifts).toBe(0);
  });

  it('should emit events', (done) => {
    const event: TikTokEvent = {
      type: 'comment',
      user: {
        userId: '1',
        uniqueId: 'user1',
        nickname: 'User 1',
      },
      message: 'Hello',
      timestamp: Date.now(),
    };

    router.on('event', (emittedEvent) => {
      expect(emittedEvent).toEqual(event);
      done();
    });

    router.routeEvent(event);
  });
});
