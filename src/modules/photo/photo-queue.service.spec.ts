import { Test, TestingModule } from '@nestjs/testing';
import { PhotoQueueService } from './photo-queue.service';
import { WorkerPoolManager } from './worker-pool.manager';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('PhotoQueueService', () => {
  let service: PhotoQueueService;
  let queueMock: Partial<Queue>;
  let workerPoolManagerMock: Partial<WorkerPoolManager>;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn(),
      getWaitingCount: jest.fn(),
    };

    workerPoolManagerMock = {
      scaleWorkers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoQueueService,
        {
          provide: WorkerPoolManager,
          useValue: workerPoolManagerMock,
        },
        {
          provide: getQueueToken('photo-processing'),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<PhotoQueueService>(PhotoQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTask', () => {
    it('should add a task to the queue', async () => {
      const filename = 'test.jpg';
      const task = 'resize';

      await service.addTask(filename, task);

      expect(queueMock.add).toHaveBeenCalledWith('process-photo', {
        filename,
        task,
      });
    });
  });

  describe('monitorQueue', () => {
    beforeEach(() => {
      jest.useFakeTimers(); // Для управления таймерами
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should scale workers to 5 when waiting count is greater than 50', async () => {
      jest.spyOn(queueMock, 'getWaitingCount').mockResolvedValue(51);

      // Запуск мониторинга
      (service as any).monitorQueue();

      // Пропускаем 5 секунд
      jest.advanceTimersByTime(5000);

      // Ждем выполнения всех асинхронных операций
      await Promise.resolve();

      expect(queueMock.getWaitingCount).toHaveBeenCalled();
      expect(workerPoolManagerMock.scaleWorkers).toHaveBeenCalledWith(5);
    });

    it('should scale workers to 3 when waiting count is between 21 and 50', async () => {
      jest.spyOn(queueMock, 'getWaitingCount').mockResolvedValue(30);

      // Запуск мониторинга
      (service as any).monitorQueue();

      // Пропускаем 5 секунд
      jest.advanceTimersByTime(5000);

      // Ждем выполнения всех асинхронных операций
      await Promise.resolve();

      expect(queueMock.getWaitingCount).toHaveBeenCalled();
      expect(workerPoolManagerMock.scaleWorkers).toHaveBeenCalledWith(3);
    });

    it('should scale workers to 1 when waiting count is 20 or less', async () => {
      jest.spyOn(queueMock, 'getWaitingCount').mockResolvedValue(10);

      // Запуск мониторинга
      (service as any).monitorQueue();

      // Пропускаем 5 секунд
      jest.advanceTimersByTime(5000);

      // Ждем выполнения всех асинхронных операций
      await Promise.resolve();

      expect(queueMock.getWaitingCount).toHaveBeenCalled();
      expect(workerPoolManagerMock.scaleWorkers).toHaveBeenCalledWith(1);
    });
  });
});
