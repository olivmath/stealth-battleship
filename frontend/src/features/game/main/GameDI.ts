import { InMemoryGameRepository } from '../adapters/InMemoryGameRepository';
import { PlaceShipUseCase } from '../interactors/PlaceShipUseCase';
import { AttackUseCase } from '../interactors/AttackUseCase';
import { StartGameUseCase } from '../interactors/StartGameUseCase';
import { IGameRepository } from '../interfaces/IGameRepository';

// Single instance for memory repo
const gameRepository: IGameRepository = new InMemoryGameRepository();

export const gameContainer = {
  start: new StartGameUseCase(gameRepository),
  placeShip: new PlaceShipUseCase(gameRepository),
  attack: new AttackUseCase(gameRepository),
  repository: gameRepository,
};

// Or as a class for stricter DI if needed
export class GameModule {
  private static instance: GameModule;
  public readonly start: StartGameUseCase;
  public readonly placeShip: PlaceShipUseCase;
  public readonly attack: AttackUseCase;
  public readonly repository: IGameRepository;

  private constructor() {
    this.repository = new InMemoryGameRepository();
    this.start = new StartGameUseCase(this.repository);
    this.placeShip = new PlaceShipUseCase(this.repository);
    this.attack = new AttackUseCase(this.repository);
  }

  public static getInstance(): GameModule {
    if (!GameModule.instance) {
      GameModule.instance = new GameModule();
    }
    return GameModule.instance;
  }
}
