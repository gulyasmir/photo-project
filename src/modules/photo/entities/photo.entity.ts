import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('photos')
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalUrl: string;

  @Column({ nullable: true })
  previewUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  exifData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

