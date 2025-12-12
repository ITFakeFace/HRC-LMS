import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenRepository } from './refresh-token.repository.service';

describe('RefreshTokenRepositoryService', () => {
  let service: RefreshTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenRepository],
    }).compile();

    service = module.get<RefreshTokenRepository>(RefreshTokenRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
