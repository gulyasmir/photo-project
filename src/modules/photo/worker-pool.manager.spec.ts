import { Test, TestingModule } from '@nestjs/testing';
import { WorkerPoolManager } from './worker-pool.manager';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('WorkerPoolManager', () => {
  let service: WorkerPoolManager;
  let configServiceMock: Partial<ConfigService>;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'redis.host') return 'localhost';
        if (key === 'redis.port') return 6379;
        if (key === 'redis.db') return 0;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerPoolManager,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<WorkerPoolManager>(WorkerPoolManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize with 2 workers', () => {
      const spyScaleWorkers = jest.spyOn(service, 'scaleWorkers');

      service.onModuleInit();

      expect(spyScaleWorkers).toHaveBeenCalledWith(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('should stop all workers', () => {
      const spyStopAllWorkers = jest.spyOn(service as any, 'stopAllWorkers');

      service.onModuleDestroy();

      expect(spyStopAllWorkers).toHaveBeenCalled();
    });
  });

  describe('scaleWorkers', () => {
    it('should add workers if the target count is higher than current', () => {
      const spyAddWorkers = jest.spyOn(service as any, 'addWorkers');
      service['workers'] = []; // Ensure no workers initially

      service.scaleWorkers(3);

      expect(spyAddWorkers).toHaveBeenCalledWith(3);
      expect(service['workers'].length).toBe(3);
    });

    it('should remove workers if the target count is lower than current', () => {
      const spyRemoveWorkers = jest.spyOn(service as any, 'removeWorkers');
      service['workers'] = [new Worker(''), new Worker(''), new Worker('')]; // Mock 3 workers

      service.scaleWorkers(1);

      expect(spyRemoveWorkers).toHaveBeenCalledWith(2);
      expect(service['workers'].length).toBe(1);
    });

    it('should do nothing if the target count equals current', () => {
      const spyAddWorkers = jest.spyOn(service as any, 'addWorkers');
      const spyRemoveWorkers = jest.spyOn(service as any, 'removeWorkers');
      service['workers'] = [new Worker(''), new Worker('')]; // Mock 2 workers

      service.scaleWorkers(2);

      expect(spyAddWorkers).not.toHaveBeenCalled();
      expect(spyRemoveWorkers).not.toHaveBeenCalled();
    });
  });

  describe('addWorkers', () => {
    it('should add the specified number of workers', () => {
      service['workers'] = []; // Ensure no workers initially

      (service as any).addWorkers(2);

      expect(service['workers'].length).toBe(2);
      expect(Worker).toHaveBeenCalledTimes(2);
      expect(Worker).toHaveBeenCalledWith(
        'photo-processing',
        expect.any(Function),
        {
          connection: {
            host: 'localhost',
            port: 6379,
            db: 0,
          },
        },
      );
    });
  });

  describe('removeWorkers', () => {
    it('should remove and close the specified number of workers', () => {
      const mockClose = jest.fn();
      service['workers'] = [
        { close: mockClose } as unknown as Worker,
        { close: mockClose } as unknown as Worker,
        { close: mockClose } as unknown as Worker,
      ];

      (service as any).removeWorkers(2);

      expect(service['workers'].length).toBe(1);
      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopAllWorkers', () => {
    it('should close all workers and clear the workers array', () => {
      const mockClose = jest.fn();
      service['workers'] = [
        { close: mockClose } as unknown as Worker,
        { close: mockClose } as unknown as Worker,
      ];

      (service as any).stopAllWorkers();

      expect(mockClose).toHaveBeenCalledTimes(2);
      expect(service['workers'].length).toBe(0);
    });
  });
});
