import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { soundEngine } from './audio';

describe('SoundEngine', () => {
  let mockContext;
  let mockOscillator;
  let mockGain;
  let mockBufferSource;
  let mockFilter;
  let mockBuffer;
  let AudioContextMock;

  beforeEach(() => {
    mockOscillator = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockFilter = {
      type: '',
      frequency: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockBuffer = {
      getChannelData: vi.fn(() => new Float32Array(100)),
    };

    mockContext = {
      state: 'running',
      currentTime: 100,
      sampleRate: 44100,
      resume: vi.fn(),
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      createBufferSource: vi.fn(() => mockBufferSource),
      createBiquadFilter: vi.fn(() => mockFilter),
      createBuffer: vi.fn(() => mockBuffer),
      destination: {},
    };

    AudioContextMock = vi.fn(function() { return mockContext; });
    window.AudioContext = AudioContextMock;
    window.webkitAudioContext = undefined;

    // Reset singleton state
    soundEngine.ctx = null;
    soundEngine.muted = false;
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize AudioContext correctly', () => {
    soundEngine.init();
    expect(window.AudioContext).toHaveBeenCalled();
    expect(soundEngine.ctx).toBe(mockContext);
  });

  it('should resume context if suspended', () => {
    mockContext.state = 'suspended';
    soundEngine.init(); // First init to create
    mockContext.state = 'suspended'; // Manually set it to test resume logic on next init call
    soundEngine.init();
    expect(mockContext.resume).toHaveBeenCalled();
  });

  it('should use webkitAudioContext if AudioContext is not available', () => {
    window.AudioContext = undefined;
    window.webkitAudioContext = AudioContextMock;
    soundEngine.init();
    expect(window.webkitAudioContext).toHaveBeenCalled();
    expect(soundEngine.ctx).toBe(mockContext);
  });

  it('should toggle mute state', () => {
    expect(soundEngine.muted).toBe(false);
    expect(soundEngine.toggleMute()).toBe(true);
    expect(soundEngine.muted).toBe(true);
    expect(soundEngine.toggleMute()).toBe(false);
  });

  it('should not play anything if muted', () => {
    soundEngine.muted = true;
    soundEngine.playUiClick();
    expect(mockContext.createOscillator).not.toHaveBeenCalled();
    
    soundEngine.playNumberSound(1);
    expect(mockContext.createOscillator).not.toHaveBeenCalled();

    soundEngine.playWicketSound();
    soundEngine.playMatchVictorySound();
    soundEngine.playMatchDefeatSound();
    soundEngine.playCrowdCheer();
    soundEngine.playCoinFlip();
    
    expect(mockContext.createGain).not.toHaveBeenCalled();
  });

  it('should play UI click', () => {
    soundEngine.playUiClick();
    expect(mockContext.createOscillator).toHaveBeenCalled();
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.type).toBe('sine');
    expect(mockOscillator.start).toHaveBeenCalled();
    expect(mockOscillator.stop).toHaveBeenCalled();
  });
  
  it('should safely catch errors during play', () => {
    mockContext.createOscillator.mockImplementation(() => { throw new Error('Audio Error'); });
    expect(() => soundEngine.playUiClick()).not.toThrow();
    expect(() => soundEngine.playNumberSound(1)).not.toThrow();
    expect(() => soundEngine.playWicketSound()).not.toThrow();
    expect(() => soundEngine.playMatchVictorySound()).not.toThrow();
    expect(() => soundEngine.playMatchDefeatSound()).not.toThrow();
    expect(() => soundEngine.playCrowdCheer()).not.toThrow();
    expect(() => soundEngine.playCoinFlip()).not.toThrow();
  });

  describe('playNumberSound', () => {
    const testCases = [
      { num: 0, calls: 1, type: 'sine' },
      { num: 1, calls: 1, type: 'triangle' },
      { num: 2, calls: 2, type: 'triangle' },
      { num: 3, calls: 3, type: 'sine' },
      { num: 4, calls: 1, type: 'square', hasTimeout: true },
      { num: 5, calls: 3, type: 'sine' },
      { num: 6, calls: 4, type: 'triangle', hasTimeout: true },
      { num: 7, calls: 1, type: 'sine' }, // default falls back to playUiClick
    ];

    testCases.forEach(({ num, calls, type, hasTimeout }) => {
      it(`should play correct sound for number ${num}`, () => {
        const cheerSpy = vi.spyOn(soundEngine, 'playCrowdCheer');
        
        soundEngine.playNumberSound(num);
        expect(mockContext.createOscillator).toHaveBeenCalledTimes(calls);
        expect(mockOscillator.type).toBe(type);
        
        if (hasTimeout) {
          vi.runAllTimers();
          expect(cheerSpy).toHaveBeenCalled();
        } else {
          expect(cheerSpy).not.toHaveBeenCalled();
        }
        
        cheerSpy.mockRestore();
      });
    });
  });

  it('should play wicket sound', () => {
    soundEngine.playWicketSound();
    expect(mockContext.createBufferSource).toHaveBeenCalledTimes(1);
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sawtooth');
    expect(mockFilter.type).toBe('bandpass');
  });

  it('should play match victory sound', () => {
    const cheerSpy = vi.spyOn(soundEngine, 'playCrowdCheer');
    soundEngine.playMatchVictorySound();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(4); // 4 notes in fanfare
    expect(mockOscillator.type).toBe('triangle');
    
    vi.runAllTimers();
    expect(cheerSpy).toHaveBeenCalledWith(true);
    cheerSpy.mockRestore();
  });

  it('should play match defeat sound', () => {
    soundEngine.playMatchDefeatSound();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(4); // 4 sad notes
    expect(mockOscillator.type).toBe('sawtooth');
  });

  it('should play crowd cheer (small)', () => {
    soundEngine.playCrowdCheer(false);
    expect(mockContext.createBufferSource).toHaveBeenCalledTimes(1);
    expect(mockContext.createBiquadFilter).toHaveBeenCalledTimes(1);
    expect(mockFilter.type).toBe('lowpass');
  });

  it('should play crowd cheer (big)', () => {
    soundEngine.playCrowdCheer(true);
    expect(mockContext.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('should play coin flip sound', () => {
    soundEngine.playCoinFlip();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sine');
  });
  
  it('should handle undefined AudioCtx environment gracefully', () => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    soundEngine.init();
    expect(soundEngine.ctx).toBeNull();
    // These should not crash and should hit the !this.ctx return path
    soundEngine.playUiClick();
    soundEngine.playNumberSound(1);
    soundEngine.playWicketSound();
    soundEngine.playMatchVictorySound();
    soundEngine.playMatchDefeatSound();
    soundEngine.playCrowdCheer();
    soundEngine.playCoinFlip();
  });
});
