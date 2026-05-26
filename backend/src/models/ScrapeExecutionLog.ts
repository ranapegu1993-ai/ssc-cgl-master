import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ExecutionStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILED = 'failed',
}

@Entity('scrape_execution_logs')
@Index(['job_id', 'executed_at'])
@Index(['status'])
export class ScrapeExecutionLog {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  job_id: string;

  @Column({ type: 'timestamp' })
  executed_at: Date;

  @Column({ type: 'int', nullable: true })
  execution_duration_ms: number;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
  })
  status: ExecutionStatus;

  @Column({ type: 'int', default: 0 })
  questions_extracted: number;

  @Column({ type: 'int', default: 0 })
  questions_validated: number;

  @Column({ type: 'int', default: 0 })
  questions_imported: number;

  @Column({ type: 'int', default: 0 })
  duplicates_detected: number;

  @Column({ type: 'int', default: 0 })
  validation_errors: number;

  @Column({ type: 'text', nullable: true })
  error_messages: string;

  @Column({ type: 'text', nullable: true })
  warnings: string;

  @Column({ type: 'uuid', array: true, nullable: true })
  imported_question_ids: string[];

  @CreateDateColumn()
  created_at: Date;
}
