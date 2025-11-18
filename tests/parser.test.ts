import { EventParser } from '../src/parsers/EventParser';
import { CommentEvent, GiftEvent, FilterConfig } from '../src/types';

describe('EventParser', () => {
  let parser: EventParser;
  let filters: FilterConfig;

  beforeEach(() => {
    filters = {
      min_gift_value: 10,
      banned_words: ['spam', 'badword'],
      vip_users: ['vipuser1', 'vipuser2'],
      min_comment_length: 1,
    };
    parser = new EventParser(filters, '!');
  });

  describe('Comment filtering', () => {
    it('should allow valid comments', () => {
      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: 'Hello world',
        timestamp: Date.now(),
      };

      expect(parser.shouldProcessEvent(event)).toBe(true);
    });

    it('should filter comments with banned words', () => {
      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: 'This is spam',
        timestamp: Date.now(),
      };

      expect(parser.shouldProcessEvent(event)).toBe(false);
    });

    it('should filter very short comments', () => {
      const filtersWithMinLength: FilterConfig = {
        ...filters,
        min_comment_length: 5,
      };
      const parserWithMinLength = new EventParser(filtersWithMinLength, '!');

      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: 'Hi',
        timestamp: Date.now(),
      };

      expect(parserWithMinLength.shouldProcessEvent(event)).toBe(false);
    });
  });

  describe('Gift filtering', () => {
    it('should allow gifts above minimum value', () => {
      const event: GiftEvent = {
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
          diamondCount: 50,
          repeatEnd: true,
        },
        timestamp: Date.now(),
      };

      expect(parser.shouldProcessEvent(event)).toBe(true);
    });

    it('should filter gifts below minimum value', () => {
      const event: GiftEvent = {
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
          diamondCount: 5,
          repeatEnd: true,
        },
        timestamp: Date.now(),
      };

      expect(parser.shouldProcessEvent(event)).toBe(false);
    });
  });

  describe('Command parsing', () => {
    it('should detect commands', () => {
      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: '!help',
        timestamp: Date.now(),
      };

      const parsed = parser.parseCommand(event);

      expect(parsed.isCommand).toBe(true);
      expect(parsed.command).toBe('help');
    });

    it('should parse command with arguments', () => {
      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: '!dance happy 5',
        timestamp: Date.now(),
      };

      const parsed = parser.parseCommand(event);

      expect(parsed.isCommand).toBe(true);
      expect(parsed.command).toBe('dance');
      expect(parsed.args).toEqual(['happy', '5']);
    });

    it('should not detect regular messages as commands', () => {
      const event: CommentEvent = {
        type: 'comment',
        user: {
          userId: '1',
          uniqueId: 'user1',
          nickname: 'User 1',
        },
        message: 'Hello world',
        timestamp: Date.now(),
      };

      const parsed = parser.parseCommand(event);

      expect(parsed.isCommand).toBeUndefined();
    });
  });

  describe('VIP users', () => {
    it('should identify VIP users', () => {
      expect(parser.isVIP('vipuser1')).toBe(true);
      expect(parser.isVIP('vipuser2')).toBe(true);
      expect(parser.isVIP('regularuser')).toBe(false);
    });
  });
});
