import { ZKProvider, BoardValidityInput, BoardValidityResult, ShotProofInput, ShotProofResult, TurnsProofInput, TurnsProofResult } from '../entities';
import { initZK, boardValidity, shotProof, turnsProof } from '../interactor';

describe('ZKService', () => {
  let mockProvider: jest.Mocked<ZKProvider>;

  beforeEach(() => {
    mockProvider = {
      init: jest.fn().mockResolvedValue(undefined),
      boardValidity: jest.fn(),
      shotProof: jest.fn(),
      turnsProof: jest.fn(),
      destroy: jest.fn(),
    };
    // Initialize ZKService with our mock provider
    initZK(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the provider', async () => {
    expect(mockProvider.init).toHaveBeenCalledTimes(1);
  });

  describe('boardValidity', () => {
    const mockInput: BoardValidityInput = {
      ships: [[1, 1, 2, true], [3, 3, 3, false], [5, 5, 4, true]],
      nonce: '123',
    };
    const mockResult: BoardValidityResult = {
      proof: new Uint8Array([1, 2, 3]),
      boardHash: '0xabc',
    };

    it('should call provider.boardValidity and return the result on success', async () => {
      mockProvider.boardValidity.mockResolvedValue(mockResult);

      const result = await boardValidity(mockInput);

      expect(mockProvider.boardValidity).toHaveBeenCalledWith(mockInput, undefined);
      expect(result).toEqual(mockResult);
    });

    it('should re-throw error if provider.boardValidity fails', async () => {
      const error = new Error('Board validity proof failed');
      mockProvider.boardValidity.mockRejectedValue(error);

      await expect(boardValidity(mockInput)).rejects.toThrow(error);
      expect(mockProvider.boardValidity).toHaveBeenCalledWith(mockInput, undefined);
    });
  });

  describe('shotProof', () => {
    const mockInput: ShotProofInput = {
      ships: [[1, 1, 2, true], [3, 3, 3, false], [5, 5, 4, true]],
      nonce: '123',
      boardHash: '0xabc',
      row: 0,
      col: 0,
      isHit: true,
    };
    const mockResult: ShotProofResult = {
      proof: new Uint8Array([4, 5, 6]),
      isHit: true,
    };

    it('should call provider.shotProof and return the result on success', async () => {
      mockProvider.shotProof.mockResolvedValue(mockResult);

      const result = await shotProof(mockInput);

      expect(mockProvider.shotProof).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockResult);
    });

    it('should re-throw error if provider.shotProof fails', async () => {
      const error = new Error('Shot proof failed');
      mockProvider.shotProof.mockRejectedValue(error);

      await expect(shotProof(mockInput)).rejects.toThrow(error);
      expect(mockProvider.shotProof).toHaveBeenCalledWith(mockInput);
    });
  });

  describe('turnsProof', () => {
    const mockInput: TurnsProofInput = {
      shipsPlayer: [[1, 1, 2, true], [3, 3, 3, false], [5, 5, 4, true]],
      shipsAI: [[0, 0, 2, true], [2, 2, 3, false], [4, 4, 4, true]],
      noncePlayer: '123',
      nonceAI: '456',
      boardHashPlayer: '0xabc',
      boardHashAI: '0xdef',
      attacksPlayer: [[0,0]],
      attacksAI: [[1,1]],
      shipSizes: [2, 3, 4],
      winner: 0,
    };
    const mockResult: TurnsProofResult = {
      proof: new Uint8Array([7, 8, 9]),
      winner: 0,
    };

    it('should call provider.turnsProof and return the result on success', async () => {
      mockProvider.turnsProof.mockResolvedValue(mockResult);

      const result = await turnsProof(mockInput);

      expect(mockProvider.turnsProof).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockResult);
    });

    it('should re-throw error if provider.turnsProof fails', async () => {
      const error = new Error('Turns proof failed');
      mockProvider.turnsProof.mockRejectedValue(error);

      await expect(turnsProof(mockInput)).rejects.toThrow(error);
      expect(mockProvider.turnsProof).toHaveBeenCalledWith(mockInput);
    });
  });
});
