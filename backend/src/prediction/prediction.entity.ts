import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('real')
  square_footage: number;

  @Column('int')
  bedrooms: number;

  @Column('real')
  predicted_price: number;

  @CreateDateColumn()
  created_at: Date;
}
