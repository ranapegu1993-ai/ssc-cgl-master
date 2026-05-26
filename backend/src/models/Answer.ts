import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Question } from './Question';
import { User } from './User';

@Entity('answers')
@Index(['question_id'])
export class Answer {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  question_id: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'varchar', length: 255 })
  correct_answer: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  explanation_source: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  explanation_source_url: string;

  @Column({ type: 'uuid', nullable: true })
  explanation_edited_by: string;

  @Column({ type: 'jsonb', nullable: true })
  shortcut_methods: object[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortcut_source: string;

  @Column({ type: 'text', nullable: true })
  concept_explanation: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  concept_source: string;

  @Column({ type: 'text', nullable: true })
  common_mistakes: string;

  @Column({ type: 'jsonb', nullable: true })
  related_concepts: string[];

  @Column({ type: 'uuid', array: true, nullable: true })
  related_question_ids: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => User, (user) => user.edited_answers, { nullable: true })
  @JoinColumn({ name: 'explanation_edited_by' })
  explanation_edited_by_user: User;
}
